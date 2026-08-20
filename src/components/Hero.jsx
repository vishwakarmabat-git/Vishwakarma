import React, { useState, useEffect } from 'react';

export default function Hero({ banners = [], onShopClick, onContactClick }) {
  const [activeIdx, setActiveIdx] = useState(0);

  // Filter only active banners
  const activeBanners = banners.filter(b => b.active !== false);

  useEffect(() => {
    if (activeBanners.length <= 1) return;
    const timer = setInterval(() => {
      setActiveIdx(prev => (prev + 1) % activeBanners.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [activeBanners.length]);

  if (activeBanners.length === 0) {
    return (
      <section className="hero" id="hero" style={{ height: '70vh', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid var(--border)' }}>
        <div className="hero-content">
          <h1 className="hero-title" style={{ color: '#000000' }}>VK <span>Bat House</span></h1>
          <p className="hero-sub" style={{ color: 'var(--muted)' }}>Handcrafted premium bats. Est. Chaklasi.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="hero-slider-container" id="hero">
      {activeBanners.map((banner, idx) => {
        const isActive = idx === activeIdx;

        return (
          <div
            key={banner.id}
            className={`hero-slide ${isActive ? 'active' : ''}`}
            style={{ zIndex: isActive ? 5 : 1 }}
          >
            {/* Ambient Background Grid & Glows */}
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 75% 50%, rgba(212, 175, 55, 0.04) 0%, rgba(227, 27, 35, 0.02) 50%, transparent 100%)', pointerEvents: 'none' }}></div>
            
            {/* Added Yellow Light Effect */}
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 40% 40%, rgba(255, 223, 0, 0.08) 0%, transparent 60%)', filter: 'blur(60px)', pointerEvents: 'none' }}></div>

            <div style={{ position: 'absolute', inset: 0, opacity: 0.1, backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '40px 40px', pointerEvents: 'none' }}></div>

            <div className="hero-slide-grid">
              {/* Left Side: Content */}
              <div className="hero-slide-content-left" style={{ opacity: isActive ? 1 : 0, transform: isActive ? 'translateY(0)' : 'translateY(25px)', transition: 'all 0.9s cubic-bezier(0.25, 1, 0.5, 1)' }}>
                
                {/* Handcrafted Badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', background: 'rgba(212, 175, 55, 0.08)', border: '1px solid rgba(212, 175, 55, 0.18)', padding: '6px 14px', borderRadius: '30px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--red)', boxShadow: '0 0 8px var(--red)' }}></span>
                  <span style={{ color: 'var(--gold)', fontSize: '10px', fontWeight: '700', letterSpacing: '2px', textTransform: 'uppercase', fontFamily: 'Barlow Condensed' }}>
                    Est. 2003 · 100% Handcrafted Clefts
                  </span>
                </div>

                <h1 className="hero-title" style={{ color: 'var(--white)', fontWeight: '900', lineHeight: '1.08', marginBottom: '24px', textTransform: 'uppercase', fontFamily: 'Barlow Condensed', letterSpacing: '-0.01em' }}>
                  {banner.title.includes(" ") ? (
                    <>
                      {banner.title.substring(0, banner.title.lastIndexOf(" "))}{' '}
                      <span style={{ fontSize: 'inherit', background: 'linear-gradient(135deg, var(--gold) 30%, var(--gold2) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: '900' }}>
                        {banner.title.substring(banner.title.lastIndexOf(" ") + 1)}
                      </span>
                    </>
                  ) : (
                    <span>{banner.title}</span>
                  )}
                </h1>
                
                <p className="hero-sub" style={{ color: 'var(--muted)', fontSize: '15px', lineHeight: '1.7', marginBottom: '38px', maxWidth: '520px', opacity: 0.95 }}>
                  {banner.subtitle}
                </p>
                
                <div className="hero-btns" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  <a
                    href={banner.ctaLink || "#categories"}
                    onClick={(e) => {
                      if (banner.ctaLink === "#categories") {
                        e.preventDefault();
                        onShopClick();
                      } else if (banner.ctaLink === "#contact") {
                        e.preventDefault();
                        onContactClick();
                      }
                    }}
                    className="btn-primary glow-hover"
                  >
                    {banner.ctaText || "Explore Collection"}
                  </a>
                  <button onClick={onContactClick} className="btn-outline" style={{ borderColor: 'rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.01)' }}>
                    Contact Workshop
                  </button>
                </div>
              </div>

              {/* Right Side: Clean Bat Image with Glow backdrop */}
              <div className={`hero-slide-media-right float-animation ${idx === 0 ? 'hide-on-desktop' : ''}`} style={{ flex: '1', display: 'flex', justifyContent: 'center', alignItems: 'center', opacity: isActive ? 1 : 0, transform: isActive ? 'scale(1)' : 'scale(0.93)', transition: 'all 0.9s cubic-bezier(0.25, 1, 0.5, 1)' }}>
                {/* Radial Glow */}
                <div style={{
                  position: 'absolute',
                  width: '320px',
                  height: '320px',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(212,175,55,0.15) 0%, rgba(227,27,35,0.04) 60%, transparent 100%)',
                  filter: 'blur(35px)',
                  zIndex: 1,
                  pointerEvents: 'none'
                }}></div>
                
                <img
                  src={banner.desktopImage}
                  alt={banner.title}
                  onError={(e) => { e.target.src = "/assets/bat_single.png"; }}
                  style={{
                    position: 'relative',
                    zIndex: 2,
                    maxWidth: '100%',
                    height: 'auto',
                    maxHeight: '80vh',
                    objectFit: 'contain',
                    filter: 'drop-shadow(20px 20px 40px rgba(0,0,0,0.8))'
                  }}
                />
              </div>
            </div>
          </div>
        );
      })}

      {/* Slider dots indicator */}
      {activeBanners.length > 1 && (
        <div className="slider-dots">
          {activeBanners.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIdx(idx)}
              className={`slider-dot ${idx === activeIdx ? 'active' : ''}`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
