import { X, Trash2, Eye, MessageCircle, Heart } from 'lucide-react';

export default function WishlistModal({ onClose, wishlist, products, onRemove, onProductClick }) {
  const wishlistedProducts = products.filter(p => wishlist.includes(p.id));

  const handleInquireAll = () => {
    if (wishlistedProducts.length === 0) return;
    const names = wishlistedProducts.map(p => `*${p.name}* (₹${p.price})`).join(', ');
    const text = encodeURIComponent(
      `Hello Vishwakarma Bat House,\n\nI have saved these bats to my wishlist and wanted to check their custom weights and availability:\n\n${names}\n\nPlease get back to me!`
    );
    window.open(`https://wa.me/919274543199?text=${text}`, '_blank');
  };

  return (
    <div>
      <div className="drawer-backdrop" onClick={onClose}></div>
      <div className="wishlist-drawer animate-slide-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--white)', fontSize: '1.2rem', margin: 0 }}>
            <Heart size={20} fill="var(--color-red)" color="var(--color-red)" /> Your Wishlist
          </h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--white)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ flexGrow: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {wishlistedProducts.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '50px 0' }}>
              <Heart size={48} style={{ color: 'var(--border)', marginBottom: '16px' }} />
              <p style={{ fontSize: '0.9rem', lineHeight: '1.5' }}>Your wishlist is empty.<br />Click the heart icon on any bat card to save it here!</p>
            </div>
          ) : (
            wishlistedProducts.map(product => (
              <div
                key={product.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  background: 'var(--dark)',
                  border: '1px solid var(--border)',
                  padding: '12px',
                  position: 'relative'
                }}
              >
                <img
                  src={product.images[0] || "/assets/bat_single.png"}
                  alt={product.name}
                  style={{ width: '50px', height: '50px', objectFit: 'contain', background: 'var(--card)', border: '1px solid var(--border)' }}
                  onError={(e) => { e.target.src = "/assets/bat_single.png"; }}
                />
                <div style={{ flexGrow: 1, textAlign: 'left' }}>
                  <h4 style={{ fontSize: '0.85rem', color: 'var(--white)', marginBottom: '4px', textTransform: 'none', fontWeight: 600 }}>{product.name}</h4>
                  <span style={{ fontSize: '0.9rem', color: 'var(--gold)', fontWeight: 700 }}>₹{product.price}</span>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => onProductClick(product)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                    title="Quick View"
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    onClick={() => onRemove(product.id)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--color-red)', cursor: 'pointer' }}
                    title="Remove from wishlist"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {wishlistedProducts.length > 0 && (
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px', marginTop: '20px' }}>
            <button
              onClick={handleInquireAll}
              className="btn btn-primary"
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <MessageCircle size={18} /> Inquire Wishlist on WhatsApp
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
