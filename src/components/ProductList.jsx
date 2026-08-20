import { useState, useMemo } from 'react';
import { Heart, Search, ArrowUpDown, Send } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ProductList({
  products = [],
  categories = [],
  onProductClick,
  wishlist = [],
  onToggleWishlist,
  isShopPage = false,
  forceCategory = null,
  externalSearchQuery = ''
}) {
  const [searchTerm, setSearchTerm] = useState(externalSearchQuery || '');
  const [prevSearchQuery, setPrevSearchQuery] = useState(externalSearchQuery);
  if (externalSearchQuery !== prevSearchQuery) {
    setPrevSearchQuery(externalSearchQuery);
    setSearchTerm(externalSearchQuery || '');
  }

  const [selectedCategory, setSelectedCategory] = useState(forceCategory || 'all');
  const [prevForceCategory, setPrevForceCategory] = useState(forceCategory);
  if (forceCategory !== prevForceCategory) {
    setPrevForceCategory(forceCategory);
    setSelectedCategory(forceCategory || 'all');
  }

  const [sortBy, setSortBy] = useState('popularity'); // popularity, price-asc, price-desc, newness

  const handleWishlistClick = (e, productId) => {
    e.stopPropagation();
    onToggleWishlist(productId);
  };

  // Filter and Sort logic
  const processedProducts = useMemo(() => {
    let list = [...products];

    // Filter by Category
    if (selectedCategory !== 'all') {
      list = list.filter(p => p.category === selectedCategory || p.category_slug === selectedCategory || p.category_id == selectedCategory);
    }

    // Filter by Search Term
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(term) ||
        (p.seoDescription && p.seoDescription.toLowerCase().includes(term)) ||
        (p.grade && p.grade.toLowerCase().includes(term)) ||
        p.tags?.some(tag => tag.toLowerCase().includes(term))
      );
    }

    // Sort
    if (sortBy === 'price-asc') {
      list.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      list.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'newness') {
      list.sort((a, b) => String(b.id).localeCompare(String(a.id)));
    } else if (sortBy === 'popularity') {
      list.sort((a, b) => (b.bestSeller ? 1 : 0) - (a.bestSeller ? 1 : 0));
    }

    return list;
  }, [products, selectedCategory, searchTerm, sortBy]);

  return (
    <section id="categories" className="section-padding" style={{ background: 'var(--black)', borderTop: '1px solid var(--border)' }}>
      <div className="container">
        
        {/* Header */}
        {!isShopPage ? (
          <div style={{ textAlign: 'center', marginBottom: '50px' }}>
            <span className="section-tag">Our Collection</span>
            <h2 className="section-title" style={{ fontFamily: 'Barlow Condensed', fontSize: '2.5rem', fontWeight: 700, textTransform: 'uppercase' }}>
              Choose Your Weapon
            </h2>
            <p style={{ color: 'var(--muted)', fontSize: '14px', marginTop: '12px', maxWidth: '600px', margin: '12px auto 0' }}>
              Custom weights, profiles, and handles are shaped manually.
            </p>
          </div>
        ) : (
          <div style={{ marginBottom: '40px', textAlign: 'left' }}>
            <span className="section-tag">VK Online Store</span>
            <h1 className="section-title" style={{ fontFamily: 'Playfair Display', fontSize: '2.5rem', marginBottom: '8px' }}>
              Handcrafted Bat Shop
            </h1>
            <p style={{ color: 'var(--muted)', fontSize: '14px' }}>
              Filter by model series, sort by pricing ranges, or search for Kashmir/English willow configurations.
            </p>
          </div>
        )}

        {/* Toolbar for Search, Filter & Sort */}
        <div style={{ marginBottom: '40px' }}>
          <div className="shop-toolbar" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            
            {/* Search Bar */}
            <div className="search-input-wrapper" style={{ flex: 1, maxWidth: '400px', minWidth: '250px' }}>
              <Search size={18} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--muted)' }} />
              <input
                type="text"
                placeholder="Search bats by name, grade, tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: '100%', padding: '12px 16px 12px 42px', background: 'var(--black)', border: '1px solid var(--border)', color: 'var(--white)', fontSize: '14px' }}
              />
            </div>

            {/* Sort Select */}
            <div className="sort-select-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ArrowUpDown size={16} style={{ color: 'var(--muted)' }} />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{ background: 'var(--black)', border: '1px solid var(--border)', color: 'var(--white)', padding: '12px 20px', fontSize: '14px' }}
              >
                <option value="popularity">Sort by: Popularity</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="newness">Sort by: Newest</option>
              </select>
            </div>
          </div>

          {/* Category Filter Buttons */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: isShopPage ? 'flex-start' : 'center', marginTop: '20px' }}>
            <button
              onClick={() => setSelectedCategory('all')}
              className={`btn btn-secondary ${selectedCategory === 'all' ? 'active' : ''}`}
              style={{
                background: selectedCategory === 'all' ? 'var(--gold)' : 'transparent',
                color: selectedCategory === 'all' ? '#fff' : 'var(--white)',
                borderColor: selectedCategory === 'all' ? 'var(--gold)' : 'var(--border)',
                fontSize: '11px',
                padding: '8px 16px',
                borderRadius: '0px'
              }}
            >
              All Models
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`btn btn-secondary ${selectedCategory === cat.id ? 'active' : ''}`}
                style={{
                  background: selectedCategory === cat.id ? 'var(--gold)' : 'transparent',
                  color: selectedCategory === cat.id ? '#fff' : 'var(--white)',
                  borderColor: selectedCategory === cat.id ? 'var(--gold)' : 'var(--border)',
                  fontSize: '11px',
                  padding: '8px 16px',
                  borderRadius: '0px'
                }}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid - Hitter Sports style */}
        <div className="products-grid" style={{ gap: '30px' }}>
          {processedProducts.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', padding: '80px 20px', color: 'var(--muted)', textAlign: 'center', fontFamily: 'Barlow' }}>
              No cricket bats match your search filters. Try selecting a different category or contact our workshop!
            </div>
          ) : (
            processedProducts.map(product => {
              const isWishlisted = wishlist.includes(product.id);
              const coverImage = product.images?.[0] || "/assets/bat_single.png";
              const hoverImage = product.images?.[1] || coverImage;

              // Mock discount rate for Hitter Sports style layout
              const discount = product.bestSeller ? 25 : (product.featured ? 20 : 19);
              const originalPrice = product.originalPrice || Math.round(product.price / (1 - discount / 100));

              return (
                <motion.div
                  key={product.id}
                  className="product-card"
                  whileInView={{ opacity: 1, y: 0 }}
                  initial={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.5 }}
                  onClick={() => onProductClick(product)}
                  style={{
                    background: 'var(--black)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    padding: '24px',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    boxShadow: 'none',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.boxShadow = '0 6px 18px rgba(0,0,0,0.06)'; e.currentTarget.style.borderColor = 'rgba(0,0,0,0.15)'; }}
                  onMouseOut={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                >
                  
                  {/* Card Media Area */}
                  <div className="card-image-wrapper" style={{ width: '100%', aspectRatio: '3/4', background: 'var(--card-image-bg, transparent)', borderRadius: '6px', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px' }}>
                    
                    {/* Out of Stock Overlay */}
                    {product.stock !== undefined && Number(product.stock) <= 0 && (
                      <div style={{
                        position: 'absolute',
                        inset: 0,
                        zIndex: 9,
                        background: 'rgba(0,0,0,0.7)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontWeight: '800',
                        fontSize: '14px',
                        letterSpacing: '2px',
                        textTransform: 'uppercase'
                      }}>
                        SOLD OUT
                      </div>
                    )}

                    {/* Sale Badge (Top Left) */}
                    <span style={{
                      position: 'absolute',
                      top: '12px',
                      left: '12px',
                      zIndex: 10,
                      background: '#000000',
                      color: '#fff',
                      fontSize: '11px',
                      fontWeight: '700',
                      padding: '3px 8px',
                      borderRadius: '4px'
                    }}>
                      -{discount}%
                    </span>

                    {/* Wishlist Toggle (Top Right) */}
                    <motion.button
                      className="wishlist-btn-mobile"
                      whileTap={{ scale: 1.2 }}
                      transition={{ type: "spring", stiffness: 400 }}
                      onClick={(e) => handleWishlistClick(e, product.id)}
                      style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        zIndex: 10,
                        background: 'rgba(255, 255, 255, 0.08)',
                        backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: 'var(--white)',
                        transform: 'translateZ(0)',
                        WebkitTransform: 'translateZ(0)'
                      }}
                      title="Save to Wishlist"
                    >
                      <Heart 
                        size={16} 
                        className={isWishlisted ? "wishlist-pulse" : ""}
                        color={isWishlisted ? "var(--red)" : "var(--white)"}
                        fill={isWishlisted ? "var(--red)" : "none"} 
                        strokeWidth={2.5}
                        style={{ display: 'block', flexShrink: 0, minWidth: '16px', minHeight: '16px' }}
                      />
                    </motion.button>

                    {/* Share Button (Below Wishlist) */}
                    <motion.button
                      className="share-btn-mobile"
                      whileTap={{ scale: 1.2 }}
                      transition={{ type: "spring", stiffness: 400 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (navigator.share) {
                          navigator.share({
                            title: product.name,
                            text: 'Check out this bat from VK Bat House!',
                            url: window.location.href + '?product=' + product.id,
                          }).catch(console.error);
                        } else {
                          alert('Sharing is not supported on this device.');
                        }
                      }}
                      style={{
                        position: 'absolute',
                        top: '52px',
                        right: '12px',
                        zIndex: 10,
                        background: 'rgba(255, 255, 255, 0.08)',
                        backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: 'var(--white)'
                      }}
                      title="Share Product"
                    >
                      <Send size={14} color="#ffffff" strokeWidth={2.5} style={{ display: 'block', flexShrink: 0, minWidth: '14px', minHeight: '14px' }} />
                    </motion.button>
                    
                    {/* Image Swap Hover */}
                    <img
                      src={coverImage}
                      alt={product.name}
                      onError={(e) => { e.target.src = "/assets/bat_single.png"; }}
                      onMouseOver={(e) => { if(hoverImage) e.currentTarget.src = hoverImage; }}
                      onMouseOut={(e) => { e.currentTarget.src = coverImage; }}
                      style={{ width: '100%', height: '100%', objectFit: 'contain', transition: 'all 0.4s' }}
                    />
                  </div>

                  {/* Centered Product Information */}
                  <div style={{ width: '100%', marginTop: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <h3 style={{
                      fontSize: '13px',
                      fontWeight: '700',
                      letterSpacing: '0.5px',
                      textTransform: 'uppercase',
                      color: 'var(--white)',
                      marginBottom: '8px',
                      fontFamily: 'Barlow',
                      lineHeight: '1.4',
                      minHeight: '38px',
                      textAlign: 'center'
                    }}>
                      {product.name}
                    </h3>
                    
                    {/* Centered Prices */}
                    <div style={{ display: 'flex', alignItems: 'baseline', justify: 'center', gap: '8px', marginBottom: '16px' }}>
                      <span style={{ fontSize: '15px', fontWeight: '800', color: 'var(--gold)' }}>
                        ₹{product.price.toLocaleString('en-IN')}.00
                      </span>
                      <span style={{ fontSize: '13px', color: 'var(--muted)', textDecoration: 'line-through' }}>
                        ₹{originalPrice.toLocaleString('en-IN')}.00
                      </span>
                    </div>

                    {/* Hitter Sports styled Add to Cart button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onProductClick(product);
                      }}
                      disabled={product.stock !== undefined && Number(product.stock) <= 0}
                      style={{
                        width: '85%',
                        background: 'transparent',
                        border: '1px solid var(--border)',
                        color: (product.stock !== undefined && Number(product.stock) <= 0) ? 'var(--muted)' : 'var(--white)',
                        padding: '10px 20px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        cursor: (product.stock !== undefined && Number(product.stock) <= 0) ? 'not-allowed' : 'pointer',
                        transition: 'all 0.25s',
                        opacity: (product.stock !== undefined && Number(product.stock) <= 0) ? 0.5 : 1
                      }}
                      onMouseOver={(e) => {
                        if (product.stock === undefined || Number(product.stock) > 0) {
                          e.currentTarget.style.background = 'var(--gold)'; 
                          e.currentTarget.style.color = '#fff'; 
                          e.currentTarget.style.borderColor = 'var(--gold)';
                        }
                      }}
                      onMouseOut={(e) => {
                        if (product.stock === undefined || Number(product.stock) > 0) {
                          e.currentTarget.style.background = 'transparent'; 
                          e.currentTarget.style.color = 'var(--white)'; 
                          e.currentTarget.style.borderColor = 'var(--border)';
                        }
                      }}
                    >
                      {product.stock !== undefined && Number(product.stock) <= 0 ? 'Out of Stock' : 'Add to Cart'}
                    </button>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
