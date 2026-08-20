import React, { useState, useEffect, useRef } from 'react';
import { X, Send, MessageCircle, Info, CheckCircle2, Heart, Play, ThumbsUp, ThumbsDown, ShoppingBag } from 'lucide-react';
import { db } from '../data/db';
import { toast } from 'react-toastify';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';

export default function ProductDetailModal({
  product,
  onClose,
  categories,
  onNewLead,
  wishlist = [],
  onToggleWishlist,
  allProducts = [],
  onProductClick,
  onAddToCart,
  onRequestLogin,
  currentUser
}) {
  const [activeMediaIdx, setActiveMediaIdx] = useState(0);
  const [zoomStyle, setZoomStyle] = useState({ transformOrigin: 'center center', transform: 'scale(1)' });
  
  // Variant states
  const [selectedWeight, setSelectedWeight] = useState('');
  const [selectedHandle, setSelectedHandle] = useState('');

  // Spec callback form states
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', note: '' });
  const [newQuestion, setNewQuestion] = useState("");
  const [qaSubmitted, setQaSubmitted] = useState(false);
  const [isFullscreenImage, setIsFullscreenImage] = useState(false);
  const [fullscreenImageUrl, setFullscreenImageUrl] = useState("");

  const contentRef = useRef(null);
  const [submitted, setSubmitted] = useState(false);
  const [showOverview, setShowOverview] = useState(false);

  // Review states
  const [productReviews, setProductReviews] = useState([]);
  const [reviewForm, setReviewForm] = useState({ userName: '', rating: 5, comment: '' });
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  
  const handleInputChange = (e) => {
    let { name, value } = e.target;
    if (name === 'phone' || name === 'pincode' || name === 'pin') {
      value = value.replace(/[^0-9]/g, '');
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Load product reviews and set default variant values
  useEffect(() => {
    if (product) {
      setActiveMediaIdx(0);
      setSubmitted(false);
      setShowOverview(false);
      setReviewSubmitted(false);
      setFormData({ name: '', phone: '', email: '', note: '' });
      setReviewForm({ userName: '', rating: 5, comment: '' });
      
      const w = product.variants?.weights?.[0] || product.weight || '';
      const h = product.variants?.handles?.[0] || (product.specs?.handle) || '';
      setSelectedWeight(w);
      setSelectedHandle(h);

      // Load reviews
      loadReviews();
    }
  }, [product]);

  const loadReviews = () => {
    if (product) {
      setProductReviews(db.getProductReviews(product.id));
    }
  };

  if (!product) return null;

  const getCategoryName = (catId) => {
    const cat = categories.find(c => c.id === catId);
    return cat ? cat.name : 'Cricket Bat';
  };

  // Magnifying Glass Zoom logic
  const handleMouseMove = (e) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomStyle({
      transformOrigin: `${x}% ${y}%`,
      transform: 'scale(1.8)'
    });
  };

  const handleMouseLeave = () => {
    setZoomStyle({ transformOrigin: 'center center', transform: 'scale(1)' });
  };

  const handleFormProceed = (e) => {
    e.preventDefault();
    if (!currentUser) {
      toast.info("Please login to submit custom specifications and place an order.");
      if (onRequestLogin) onRequestLogin();
      return;
    }
    if (!formData.name || !formData.phone) {
      toast.error("Please provide Name and Contact Number!");
      return;
    }
    setShowOverview(true);
  };

  // Callback Spec Logger Submit
  const handleFormSubmit = () => {
    const specNote = `Weight: ${selectedWeight}, Handle: ${selectedHandle}. Notes: ${formData.note || 'None'}`;
    const lead = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      message: `Inquiry for bat: ${product.name}. Specs Selected - ${specNote}`,
      type: "Product Page Detail Request",
      status: "New"
    };
    db.addLead(lead);

    const priceWithGst = Math.round((product.price || 0) * (1 + (product.gst || 0) / 100));
    const gstAmt = Math.round((product.price || 0) * ((product.gst || 0) / 100));
    const order = {
      customerName: formData.name,
      email: formData.email || `${formData.name.toLowerCase().replace(/\s+/g, '')}@gmail.com`,
      phone: formData.phone,
      batName: product.name,
      price: product.price || 0,
      gst: gstAmt,
      total: priceWithGst,
      status: "pending",
      specs: specNote
    };
    db.createOrder(order);

    // Directly open WhatsApp on submit
    const whatsappNum = "919274543199";
    const text = `Hello Vishwakarma Bat House,\n\nI want to place an order with custom specifications:\n\n*Customer Name*: ${formData.name}\n*Phone*: ${formData.phone}\n*Email*: ${formData.email || 'N/A'}\n\n*Product Name*: ${product.name}\n*Weight*: ${selectedWeight}\n*Handle*: ${selectedHandle}\n*Additional Notes*: ${formData.note || 'None'}\n\n*Price*: ₹${product.price || 0}\n*GST (${product.gst || 0}%)*: ₹${gstAmt}\n*Total*: ₹${priceWithGst}\n\nPlease confirm availability and details. Thank you!`;
    const encodedText = encodeURIComponent(text);
    const whatsappUrl = `https://wa.me/${whatsappNum}?text=${encodedText}`;
    window.open(whatsappUrl, '_blank');

    setSubmitted(true);
    setShowOverview(false);
    if (onNewLead) onNewLead();
  };

  // Review Submit
  const handleReviewSubmit = (e) => {
    e.preventDefault();
    if (!currentUser) {
      toast.info("Please login to submit a review.");
      if (onRequestLogin) onRequestLogin();
      return;
    }
    if (!reviewForm.userName || !reviewForm.comment) {
      toast.error("Name and comment are required to submit a review!");
      return;
    }

    db.addReview(product.id, reviewForm);
    setReviewSubmitted(true);
    setReviewForm({ userName: '', rating: 5, comment: '' });
    toast.success("Review submitted! It will appear on the site once moderated.");
  };

  // Review Voting
  const handleVoteReview = (reviewId, type) => {
    if (!currentUser) {
      toast.info("Please login to vote on reviews.");
      if (onRequestLogin) onRequestLogin();
      return;
    }
    db.voteReview(reviewId, type, currentUser.id);
    loadReviews();
  };

  const mediaList = [...(product.images || [])];
  const hasVideo = product.videoUrl && product.videoUrl.trim() !== "";
  if (hasVideo) {
    mediaList.push({ type: 'video', url: product.videoUrl });
  }

  const isCurrentMediaVideo = typeof mediaList[activeMediaIdx] === 'object' && mediaList[activeMediaIdx]?.type === 'video';
  const isWishlisted = wishlist.includes(product.id);
  
  const whatsappNumber = "919274543199";
  const specText = `*Selected Specifications*:\n- Weight Range: ${selectedWeight}\n- Handle Shape: ${selectedHandle}`;
  const whatsappText = encodeURIComponent(
    `Hello Vishwakarma Bat House,\n\nI want to order: *${product.name}*\nCategory: ${getCategoryName(product.category)}\nPrice: ₹${product.price || 0}\n\n${specText}\n\nPlease confirm availability and let me know payment/delivery details!`
  );
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappText}`;

  // Related Products
  const relatedProducts = (allProducts || [])
    .filter(p => p.category === product.category && p.id !== product.id)
    .slice(0, 3);

  // Fullscreen Image Overlay Component
  if (isFullscreenImage) {
    return (
      <div 
        style={{
          position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.95)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}
        onClick={() => setIsFullscreenImage(false)}
      >
        <button 
          onClick={() => setIsFullscreenImage(false)}
          style={{ position: 'absolute', top: '20px', right: '20px', background: 'var(--card)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10000 }}
        >
          <X size={24} color="var(--white)" />
        </button>
        <img 
          src={fullscreenImageUrl} 
          alt="Fullscreen" 
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    );
  }

  return (
    <div className="product-fullscreen-overlay" style={{ margin: 0, padding: 0 }}>
      {/* Close Overlay Button */}
      <button className="product-fullscreen-close" onClick={onClose} aria-label="Close Product Details Page">
        <X size={20} />
      </button>

      <div className="product-fullscreen-container" style={{ margin: 0, padding: window.innerWidth <= 768 ? '10px' : '20px', maxWidth: '100vw', boxSizing: 'border-box' }}>
        {/* Main Product Panel with balanced ratio on Desktop */}
        <div className="product-detail-grid" style={{ 
          display: 'grid', 
          gridTemplateColumns: window.innerWidth > 768 ? '1.2fr 1fr' : '1fr', 
          gap: '32px' 
        }}>
          
          {/* Left Column: Gallery & Zoom */}
          <div className="gallery-container" style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflow: 'hidden' }}>
            
            {/* Mobile Swiper Layout */}
            {window.innerWidth <= 768 ? (
              <Swiper
                modules={[Pagination]}
                pagination={{ clickable: true }}
                spaceBetween={10}
                slidesPerView={1}
                style={{ width: '100%', height: '500px', background: 'var(--dark)', borderRadius: '8px' }}
              >
                {mediaList.map((item, idx) => {
                  const isVideoType = typeof item === 'object' && item?.type === 'video';
                  return (
                    <SwiperSlide key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {isVideoType ? (
                        (item.url.includes('youtube.com') || item.url.includes('youtu.be')) ? (
                          <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                            <iframe 
                              src={item.url.includes('watch?v=') ? item.url.replace('watch?v=', 'embed/') : item.url.includes('youtu.be/') ? item.url.replace('youtu.be/', 'youtube.com/embed/') : item.url.includes('shorts/') ? item.url.replace('shorts/', 'embed/') : item.url}
                              style={{ width: '100%', height: '100%', border: 'none', pointerEvents: 'none' }}
                              tabIndex="-1"
                            />
                            <div style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10}}></div>
                          </div>
                        ) : (
                          <video src={item.url} controls style={{ width: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                        )
                      ) : (
                        <img 
                          src={item || "/assets/bat_single.png"} 
                          alt={product.name}
                          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                          onClick={() => {
                            setFullscreenImageUrl(item);
                            setIsFullscreenImage(true);
                          }}
                        />
                      )}
                    </SwiperSlide>
                  );
                })}
              </Swiper>
            ) : (
              // Desktop Gallery Zoom Layout
              <div
                className="main-image-view zoom-wrapper"
                onMouseMove={!isCurrentMediaVideo ? handleMouseMove : undefined}
                onMouseLeave={!isCurrentMediaVideo ? handleMouseLeave : undefined}
                style={{
                  borderRadius: '8px',
                  background: 'var(--dark)',
                  height: '600px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  position: 'relative',
                  border: '1px solid var(--border)'
                }}
              >
                {isCurrentMediaVideo ? (
                  (mediaList[activeMediaIdx].url.includes('youtube.com') || mediaList[activeMediaIdx].url.includes('youtu.be')) ? (
                    <iframe 
                      src={mediaList[activeMediaIdx].url.includes('watch?v=') ? mediaList[activeMediaIdx].url.replace('watch?v=', 'embed/') : mediaList[activeMediaIdx].url.includes('youtu.be/') ? mediaList[activeMediaIdx].url.replace('youtu.be/', 'youtube.com/embed/') : mediaList[activeMediaIdx].url.includes('shorts/') ? mediaList[activeMediaIdx].url.replace('shorts/', 'embed/') : mediaList[activeMediaIdx].url}
                      style={{ width: '100%', height: '100%', border: 'none' }}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <video
                      src={mediaList[activeMediaIdx].url}
                      controls
                      autoPlay
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  )
                ) : (
                  <img
                    src={mediaList[activeMediaIdx] || "/assets/bat_single.png"}
                    alt={product.name}
                    className="zoom-image"
                    style={{
                      maxWidth: '90%',
                      maxHeight: '90%',
                      objectFit: 'contain',
                      transition: 'transform 0.1s ease-out',
                      ...zoomStyle
                    }}
                    onError={(e) => { e.target.src = "/assets/bat_single.png"; }}
                  />
                )}
              </div>
            )}
            
            {/* Desktop Thumbnails (Hidden on mobile) */}
            {window.innerWidth > 768 && (
              <div className="gallery-thumbs" style={{ display: 'flex', gap: '12px', overflowX: 'auto', padding: '4px 0' }}>
                {mediaList.map((item, idx) => {
                  const isVideoType = typeof item === 'object' && item?.type === 'video';
                  return (
                    <button
                      key={idx}
                      onClick={() => setActiveMediaIdx(idx)}
                      className={`thumb-btn ${activeMediaIdx === idx ? 'active' : ''}`}
                      style={{
                        borderRadius: '4px',
                        width: '72px',
                        height: '72px',
                        flexShrink: 0,
                        border: activeMediaIdx === idx ? '2px solid var(--gold)' : '1px solid var(--border)',
                        background: 'var(--dark)',
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 0,
                        cursor: 'pointer'
                      }}
                    >
                      {isVideoType ? (
                        <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Play size={18} color="var(--gold)" style={{ zIndex: 2 }} />
                          <span style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }}></span>
                        </div>
                      ) : (
                        <img
                          src={item || "/assets/bat_single.png"}
                          alt="thumbnail"
                          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                          onError={(e) => { e.target.src = "/assets/bat_single.png"; }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Spec sheet & checkout options */}
          <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span className="badge badge-gold" style={{ background: 'var(--gold)', color: '#fff' }}>
                {getCategoryName(product.category)}
              </span>
              
              {onToggleWishlist && (
                <button
                  onClick={() => onToggleWishlist(product.id)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: isWishlisted ? 'var(--gold)' : 'var(--muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.85rem',
                    fontWeight: 600
                  }}
                >
                  <svg 
                    width="18" 
                    height="18" 
                    viewBox="0 0 24 24" 
                    fill={isWishlisted ? "var(--red)" : "none"} 
                    stroke="var(--red)" 
                    strokeWidth="2.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    className={isWishlisted ? "wishlist-pulse" : ""}
                    style={{ display: 'block' }}
                  >
                    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
                  </svg>
                  {isWishlisted ? 'Saved' : 'Add to Wishlist'}
                </button>
              )}
            </div>

            <h1 style={{ fontSize: '2.5rem', color: 'var(--white)', fontFamily: 'Playfair Display', marginBottom: '8px', textTransform: 'none', fontWeight: 900, lineHeight: 1.15 }}>
              {product.name}
            </h1>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <div className="stars" style={{ margin: 0, color: 'var(--gold)', fontSize: '15px' }}>★★★★★</div>
              <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>(5.0 rating based on player comments)</span>
            </div>

            <div style={{ fontSize: '2.2rem', fontWeight: '800', color: 'var(--gold)', marginBottom: '24px', letterSpacing: '-0.5px' }}>
              ₹{(product.price || 0).toLocaleString('en-IN')}
              {product.originalPrice && product.originalPrice > product.price && (
                <span style={{ fontSize: '1.2rem', color: 'var(--muted)', fontWeight: '400', marginLeft: '12px', textDecoration: 'line-through' }}>
                  ₹{product.originalPrice.toLocaleString('en-IN')}
                </span>
              )}
            </div>

            {/* VARIANTS SELECTORS */}
            <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
              {product.variants?.weights && product.variants.weights.length > 0 && (
                <div style={{ flex: 1, minWidth: '150px' }}>
                  <label className="form-label" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', color: 'var(--muted)' }}>Select Weight</label>
                  <select
                    className="form-control"
                    value={selectedWeight}
                    onChange={(e) => setSelectedWeight(e.target.value)}
                    style={{ padding: '12px', fontSize: '14px', background: 'var(--dark)', border: '1px solid var(--border)', color: 'var(--white)', width: '100%', outline: 'none' }}
                  >
                    {product.variants.weights.map(w => (
                      <option key={w} value={w}>{w}</option>
                    ))}
                  </select>
                </div>
              )}

              {product.variants?.handles && product.variants.handles.length > 0 && (
                <div style={{ flex: 1, minWidth: '150px' }}>
                  <label className="form-label" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', color: 'var(--muted)' }}>Handle Type</label>
                  <select
                    className="form-control"
                    value={selectedHandle}
                    onChange={(e) => setSelectedHandle(e.target.value)}
                    style={{ padding: '12px', fontSize: '14px', background: 'var(--dark)', border: '1px solid var(--border)', color: 'var(--white)', width: '100%', outline: 'none' }}
                  >
                    {product.variants.handles.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Specifications Sheet */}
            <h3 style={{ fontSize: '12px', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--white)', borderBottom: '1px solid var(--border)', paddingBottom: '10px', marginBottom: '14px', fontWeight: 700 }}>
              Specifications Sheet
            </h3>
            <table className="specs-table" style={{ margin: '0 0 30px', width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                  <th style={{ padding: '10px 0', fontSize: '14px', color: 'var(--muted)', width: '35%', textAlign: 'left', fontWeight: 500 }}>Willow Grade</th>
                  <td style={{ padding: '10px 0', fontSize: '14px', color: 'var(--white)' }}>{product.grade}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                  <th style={{ padding: '10px 0', fontSize: '14px', color: 'var(--muted)', textAlign: 'left', fontWeight: 500 }}>Edges & Spine</th>
                  <td style={{ padding: '10px 0', fontSize: '14px', color: 'var(--white)' }}>{product.specs?.edges || "40mm"} edges / {product.specs?.spine || "62mm"} spine</td>
                </tr>
                <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                  <th style={{ padding: '10px 0', fontSize: '14px', color: 'var(--muted)', textAlign: 'left', fontWeight: 500 }}>Handle Cane</th>
                  <td style={{ padding: '10px 0', fontSize: '14px', color: 'var(--white)' }}>{product.specs?.handle || "Singapore Cane"}</td>
                </tr>
                <tr>
                  <th style={{ padding: '10px 0', fontSize: '14px', color: 'var(--muted)', textAlign: 'left', fontWeight: 500 }}>Sweetspot</th>
                  <td style={{ padding: '10px 0', fontSize: '14px', color: 'var(--white)' }}>{product.specs?.sweetspot || "Mid Sweetspot"}</td>
                </tr>
              </tbody>
            </table>

             {/* Stock Warning Badge */}
             {product.stock !== undefined && (
               <div style={{ marginBottom: '20px' }}>
                 {Number(product.stock) <= 0 ? (
                   <span className="badge badge-red" style={{ background: '#e74c3c', color: '#fff', fontSize: '13px', padding: '6px 12px', fontWeight: 'bold' }}>
                     ❌ OUT OF STOCK (Sold Out)
                   </span>
                 ) : Number(product.stock) <= 5 ? (
                   <span className="badge badge-gold" style={{ background: '#e67e22', color: '#fff', fontSize: '12px', padding: '6px 12px', fontWeight: 'bold' }}>
                     ⚠️ ONLY {product.stock} LEFT IN STOCK - HURRY!
                   </span>
                 ) : (
                   <span className="badge badge-green" style={{ background: '#2ecc71', color: '#fff', fontSize: '12px', padding: '6px 12px', fontWeight: 'bold' }}>
                     ✅ In Stock ({product.stock} available)
                   </span>
                 )}
               </div>
             )}

             {/* Actions */}
             <div style={window.innerWidth <= 768 ? {
               position: 'fixed',
               bottom: 0, left: 0, right: 0,
               background: 'var(--black)',
               padding: '12px 16px',
               zIndex: 2000,
               borderTop: '1px solid var(--border)',
               display: 'flex', flexDirection: 'column', gap: '10px',
               boxShadow: '0 -4px 15px rgba(0,0,0,0.5)'
             } : { display: 'flex', flexDirection: 'column', gap: '14px' }}>
               <div style={{ display: 'flex', gap: '10px' }}>
                 <button
                   onClick={() => {
                     if (onAddToCart) onAddToCart(product, selectedWeight, selectedHandle, 1);
                   }}
                   disabled={product.stock !== undefined && Number(product.stock) <= 0}
                   className="btn-outline"
                   style={{
                     flex: 1,
                     padding: '16px',
                     fontSize: '13px',
                     textTransform: 'uppercase',
                     letterSpacing: '2px',
                     fontWeight: 'bold',
                     display: 'flex',
                     alignItems: 'center',
                     justifyContent: 'center',
                     gap: '8px',
                     width: '100%',
                     opacity: (product.stock !== undefined && Number(product.stock) <= 0) ? 0.4 : 1,
                     cursor: (product.stock !== undefined && Number(product.stock) <= 0) ? 'not-allowed' : 'pointer'
                   }}
                 >
                   <ShoppingBag size={18} /> { (product.stock !== undefined && Number(product.stock) <= 0) ? 'Out of Stock' : 'Add to Cart' }
                 </button>
                 <button
                   onClick={() => {
                     if (onAddToCart) {
                       onAddToCart(product, selectedWeight, selectedHandle, 1, true);
                       onClose();
                     }
                   }}
                   disabled={product.stock !== undefined && Number(product.stock) <= 0}
                   className="btn-primary"
                   style={{
                     flex: 1,
                     padding: '16px',
                     fontSize: '13px',
                     textTransform: 'uppercase',
                     letterSpacing: '2px',
                     fontWeight: 'bold',
                     display: 'flex',
                     alignItems: 'center',
                     justifyContent: 'center',
                     gap: '8px',
                     width: '100%',
                     opacity: (product.stock !== undefined && Number(product.stock) <= 0) ? 0.4 : 1,
                     cursor: (product.stock !== undefined && Number(product.stock) <= 0) ? 'not-allowed' : 'pointer',
                     background: (product.stock !== undefined && Number(product.stock) <= 0) ? '#555' : undefined
                   }}
                 >
                   Buy Now
                 </button>
                 <button
                   onClick={() => {
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
                   className="btn-outline"
                   style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '56px', background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
                   title="Share Product"
                 >
                  <Send size={18} />
                </button>
              </div>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary"
                style={{ textTransform: 'uppercase', letterSpacing: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px', fontWeight: 'bold', width: '100%', border: '1px solid var(--border)', color: 'var(--muted)' }}
                onMouseOver={(e) => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'var(--gold)'; }}
                onMouseOut={(e) => { e.currentTarget.style.color = 'var(--muted)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
              >
                <MessageCircle size={16} /> Order via WhatsApp (Alternative)
              </a>
            </div>
          </div>
        </div>

        {/* Product Specific Reviews Section */}
        <div className="reviews-container">
          <div className="reviews-header">
            <div>
              <h2 style={{ fontFamily: 'Playfair Display', fontSize: '1.8rem', color: 'var(--white)', marginBottom: '4px' }}>Player Reviews & Comments</h2>
              <p style={{ color: 'var(--muted)', fontSize: '14px' }}>Genuine feedback and ratings from league players.</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--white)' }}>5.0</span>
              <div>
                <div className="review-stars">★★★★★</div>
                <span style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>{productReviews.length} comments</span>
              </div>
            </div>
          </div>

          <div className="reviews-grid-details" style={{ display: 'grid', gridTemplateColumns: window.innerWidth > 768 ? '1.5fr 1fr' : '1fr', gap: '40px', alignItems: 'start' }}>
            {/* Reviews List */}
            <div>
              {productReviews.length === 0 ? (
                <div style={{ padding: '40px 20px', border: '1px dashed var(--border)', textAlign: 'center', color: 'var(--muted)' }}>
                  No approved reviews yet for this bat. Be the first to leave a comment!
                </div>
              ) : (
                productReviews.map(rev => {
                  const hasLiked = rev.likedBy && currentUser && rev.likedBy.includes(currentUser.id);
                  const hasDisliked = rev.dislikedBy && currentUser && rev.dislikedBy.includes(currentUser.id);
                  return (
                    <div key={rev.id} className="review-card-item">
                      <div className="review-card-top">
                        <div className="review-card-user">
                          <div className="review-user-avatar">{rev.userName.charAt(0).toUpperCase()}</div>
                          <div>
                            <strong style={{ color: 'var(--white)', fontSize: '14px', display: 'block' }}>{rev.userName}</strong>
                            <span style={{ fontSize: '11px', color: 'var(--muted)' }}>{rev.date}</span>
                          </div>
                        </div>
                        <div className="review-stars">{'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}</div>
                      </div>
                      <p className="review-card-comment">{rev.comment}</p>
                      <div className="review-card-actions">
                        <button 
                          onClick={() => handleVoteReview(rev.id, 'like')} 
                          className={`review-action-btn ${hasLiked ? 'active' : ''}`}
                          style={hasLiked ? { color: 'var(--gold)' } : undefined}
                        >
                          <ThumbsUp size={12} fill={hasLiked ? "var(--gold)" : "none"} /> Like ({rev.likes})
                        </button>
                        <button 
                          onClick={() => handleVoteReview(rev.id, 'dislike')} 
                          className={`review-action-btn ${hasDisliked ? 'active' : ''}`}
                          style={hasDisliked ? { color: 'var(--red)' } : undefined}
                        >
                          <ThumbsDown size={12} fill={hasDisliked ? "var(--red)" : "none"} /> Dislike ({rev.dislikes})
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Write a Review Form */}
            <div style={{ background: 'var(--dark)', border: '1px solid var(--border)', padding: window.innerWidth <= 768 ? '20px 16px' : '30px 24px', borderRadius: '6px', width: '100%', boxSizing: 'border-box' }}>
              <h3 style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--white)', marginBottom: '20px', fontWeight: '700' }}>
                Write a Review
              </h3>
              <form onSubmit={handleReviewSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', color: 'var(--muted)', display: 'block' }}>Your Name *</label>
                  <input
                    type="text"
                    value={reviewForm.userName}
                    onChange={(e) => setReviewForm(prev => ({ ...prev, userName: e.target.value }))}
                    placeholder="e.g. Rahul Patel"
                    style={{ width: '100%', padding: '12px', background: 'var(--black)', border: '1px solid var(--border)', color: 'var(--white)', fontSize: '13px', outline: 'none' }}
                    required
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', color: 'var(--muted)', display: 'block' }}>Rating *</label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setReviewForm(prev => ({ ...prev, rating: star }))}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: star <= reviewForm.rating ? 'var(--gold)' : 'var(--border)',
                          fontSize: '24px',
                          cursor: 'pointer',
                          padding: 0
                        }}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', color: 'var(--muted)', display: 'block' }}>Your Feedback *</label>
                  <textarea
                    value={reviewForm.comment}
                    onChange={(e) => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
                    placeholder="Share your experience with the ping, balance, pickup, or grain alignment..."
                    style={{ width: '100%', padding: '12px', background: 'var(--black)', border: '1px solid var(--border)', color: 'var(--white)', fontSize: '13px', minHeight: '80px', outline: 'none' }}
                    required
                  />
                </div>

                <button type="submit" className="btn-secondary" style={{ width: '100%', padding: '12px', fontSize: '12px', letterSpacing: '1.5px', textTransform: 'uppercase', fontWeight: '700' }}>
                  Submit Review
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Product Q&A Section */}
        <div className="reviews-container" style={{ marginTop: '40px', borderTop: '1px solid var(--border)', paddingTop: '40px' }}>
          <div className="reviews-header" style={{ marginBottom: '24px' }}>
            <div>
              <h2 style={{ fontFamily: 'Playfair Display', fontSize: '1.8rem', color: 'var(--white)', marginBottom: '4px' }}>Product Q&As</h2>
              <p style={{ color: 'var(--muted)', fontSize: '14px' }}>Got questions? Get answers directly from VK workshops.</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '40px', textAlign: 'left' }}>
            
            {/* Q&A List (Show Asked Questions First) */}
            <div>
              {db.getQA().filter(q => q.productId === product.id).length === 0 ? (
                <div style={{ padding: '40px 20px', border: '1px dashed var(--border)', textAlign: 'center', color: 'var(--muted)' }}>
                  No questions asked about this bat yet. Feel free to ask a question below!
                </div>
              ) : (
                db.getQA().filter(q => q.productId === product.id).map(q => (
                  <div key={q.id} style={{
                    padding: '20px',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    marginBottom: '16px',
                    background: 'var(--dark)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.8rem', color: 'var(--gold)' }}>
                      <strong>Q: Asked by {q.user}</strong>
                      <span>{q.date}</span>
                    </div>
                    <p style={{ color: '#fff', fontSize: '0.95rem', fontWeight: 600, marginBottom: '12px' }}>{q.question}</p>
                    
                    {q.answer ? (
                      <div style={{ borderLeft: '2px solid var(--gold)', paddingLeft: '12px', marginTop: '10px' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Answer from VK Craftsman:</span>
                        <p style={{ color: 'var(--muted)', fontSize: '0.9rem', margin: 0 }}>{q.answer}</p>
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: 'var(--muted)', fontStyle: 'italic' }}>Pending answer from workshop...</span>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Ask a Question Form */}
            <div style={{ background: 'var(--dark)', border: '1px solid var(--border)', padding: window.innerWidth <= 768 ? '20px 16px' : '30px 24px', borderRadius: '6px', width: '100%', boxSizing: 'border-box' }}>
              <h3 style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--white)', marginBottom: '20px', fontWeight: '700' }}>
                Ask a Question
              </h3>
              <form onSubmit={(e) => {
                e.preventDefault();
                if (!currentUser) {
                  toast.info("Please login to ask a question.");
                  if (onRequestLogin) onRequestLogin();
                  return;
                }
                const qText = e.target.questionText.value.trim();
                const qUser = e.target.questionUser.value.trim() || 'Guest Player';
                if (!qText) {
                  toast.error("Question cannot be empty!");
                  return;
                }
                db.addQA(product.id, qText, qUser);
                toast.success("Question submitted to VK workshops! It will appear once answered.");
                e.target.reset();
              }} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', color: 'var(--muted)', display: 'block' }}>Your Name</label>
                  <input
                    type="text"
                    name="questionUser"
                    placeholder="e.g. Kunal G."
                    style={{ width: '100%', padding: '12px', background: 'var(--black)', border: '1px solid var(--border)', color: 'var(--white)', fontSize: '13px', outline: 'none' }}
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', color: 'var(--muted)', display: 'block' }}>Your Question *</label>
                  <textarea
                    name="questionText"
                    placeholder="Ask about handle shock absorption, custom weights, linseed oiling, grains, etc..."
                    style={{ width: '100%', padding: '12px', background: 'var(--black)', border: '1px solid var(--border)', color: 'var(--white)', fontSize: '13px', minHeight: '80px', outline: 'none' }}
                    required
                  />
                </div>

                <button type="submit" className="btn-secondary" style={{ width: '100%', padding: '12px', fontSize: '12px', letterSpacing: '1.5px', textTransform: 'uppercase', fontWeight: '700' }}>
                  Submit Question
                </button>
              </form>
            </div>

          </div>
        </div>

        {/* Similar Weapons Grid */}
        {relatedProducts.length > 0 && (
          <div className="related-products-section" style={{ marginTop: '60px', borderTop: '1px solid var(--border)', paddingTop: '40px', textAlign: 'left' }}>
            <h3 style={{ fontSize: '1.8rem', color: 'var(--white)', marginBottom: '20px', fontFamily: 'Playfair Display' }}>
              Similar Weapons
            </h3>
            <div className="similar-scroll-container" style={{ 
              display: 'flex', 
              gap: '16px', 
              overflowX: 'auto', 
              paddingBottom: '20px',
              scrollbarWidth: 'none', // Firefox
              msOverflowStyle: 'none', // IE/Edge
            }}>
              {relatedProducts.map(rel => (
                <div
                  key={rel.id}
                  onClick={() => {
                    onProductClick(rel);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  style={{
                    background: 'var(--dark)',
                    border: '1px solid var(--border)',
                    padding: '20px 12px',
                    cursor: 'pointer',
                    textAlign: 'center',
                    borderRadius: '8px',
                    transition: 'all 0.3s ease',
                    flex: '0 0 160px', // Fixed width for mobile friendly horizontal scroll
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--gold)'}
                  onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
                >
                  <img
                    src={rel.images?.[0] || "/assets/bat_single.png"}
                    alt={rel.name}
                    style={{ height: '120px', width: '100%', objectFit: 'contain', marginBottom: '16px' }}
                    onError={(e) => { e.target.src = "/assets/bat_single.png"; }}
                  />
                  <div>
                    <h4 style={{ 
                      fontSize: '13px', 
                      fontWeight: '700', 
                      color: 'var(--white)', 
                      marginBottom: '8px', 
                      display: '-webkit-box', 
                      WebkitLineClamp: 2, 
                      WebkitBoxOrient: 'vertical', 
                      overflow: 'hidden',
                      lineHeight: '1.3'
                    }}>{rel.name}</h4>
                    <div style={{ fontSize: '14px', color: 'var(--gold)', fontWeight: 800 }}>₹{(rel.price || 0).toLocaleString('en-IN')}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
