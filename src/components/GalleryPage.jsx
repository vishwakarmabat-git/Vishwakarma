import React, { useState } from 'react';
import { Play, Eye, X, Image as ImageIcon, Video } from 'lucide-react';

export default function GalleryPage({ gallery = [] }) {
  const [selectedAlbum, setSelectedAlbum] = useState('all');
  const [lightboxItem, setLightboxItem] = useState(null);

  // List unique album names for filtering
  const albums = ['all', ...new Set(gallery.map(item => item.album).filter(Boolean))];

  const filteredGallery = selectedAlbum === 'all'
    ? gallery
    : gallery.filter(item => item.album === selectedAlbum);

  return (
    <section className="section-padding" style={{ background: 'var(--black)', flexGrow: 1 }}>
      <div className="container">
        
        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <span className="section-tag">Brand Showcase</span>
          <h2 className="section-title">
            VK media <span style={{ background: 'linear-gradient(135deg,var(--gold),var(--gold2))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Gallery</span>
          </h2>
          <p style={{ color: 'var(--muted)', fontSize: '14px', marginTop: '12px', maxWidth: '600px', margin: '12px auto 0' }}>
            Explore our workshop crafting procedures, tournament match milestones, and direct reviews from our players.
          </p>
        </div>

        {/* Album Filters */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '40px' }}>
          {albums.map(album => (
            <button
              key={album}
              onClick={() => setSelectedAlbum(album)}
              className={`btn btn-secondary ${selectedAlbum === album ? 'active' : ''}`}
              style={{
                background: selectedAlbum === album ? 'var(--gold)' : 'transparent',
                color: selectedAlbum === album ? '#fff' : 'var(--gold)',
                borderColor: selectedAlbum === album ? 'var(--gold)' : 'var(--border)',
                fontSize: '11px',
                padding: '8px 16px',
                borderRadius: '0px'
              }}
            >
              {album === 'all' ? 'All Media' : album}
            </button>
          ))}
        </div>

        {/* Masonry Layout Grid */}
        {filteredGallery.length === 0 ? (
          <div style={{ padding: '60px', color: 'var(--muted)', textAlign: 'center' }}>
            No gallery items uploaded in this folder yet.
          </div>
        ) : (
          <div className="masonry-grid-layout">
            {filteredGallery.map((item) => {
              const isVideo = item.type === 'video';
              return (
                <div
                  key={item.id}
                  className="masonry-grid-item"
                  onClick={() => setLightboxItem(item)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="masonry-media-wrapper">
                    
                    {/* Media tags */}
                    <span className="masonry-tag badge badge-gold" style={{ background: isVideo ? '#e74c3c' : 'rgba(0,0,0,0.7)', color: '#fff', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {isVideo ? <Video size={10} /> : <ImageIcon size={10} />}
                      {item.album}
                    </span>

                    {/* Image / Video preview wrapper */}
                    <div style={{ position: 'relative', overflow: 'hidden', background: '#08080a' }} className="instagram-grid-item">
                      {isVideo ? (
                        <div style={{ position: 'relative', aspectRatio: '1.5', display: 'flex', alignItems: 'center', justify: 'center' }}>
                          {(item.url.includes('youtube.com') || item.url.includes('youtu.be')) ? (
                            <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                              <iframe 
                                src={item.url.includes('watch?v=') ? item.url.replace('watch?v=', 'embed/') : item.url.includes('youtu.be/') ? item.url.replace('youtu.be/', 'youtube.com/embed/') : item.url.includes('shorts/') ? item.url.replace('shorts/', 'embed/') : item.url}
                                style={{ width: '100%', height: '100%', border: 'none', pointerEvents: 'none', opacity: 0.7 }}
                                tabIndex="-1"
                              />
                            </div>
                          ) : (
                            <video
                              src={item.url}
                              className="insta-img"
                              style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7, transition: 'transform 0.4s ease' }}
                            />
                          )}
                          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.3)' }}>
                            <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'var(--gold)', display: 'flex', alignItems: 'center', justify: 'center', color: '#fff' }}>
                              <Play size={20} fill="#fff" />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <img
                          src={item.url}
                          alt={item.title}
                          style={{ width: '100%', display: 'block', height: 'auto', transition: 'transform 0.4s ease' }}
                          onError={(e) => { e.target.src = "/assets/poster.jpg"; }}
                          className="zoom-image insta-img"
                        />
                      )}
                      
                      <div className="insta-overlay" style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', opacity: 0, transition: 'opacity 0.3s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                        <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>View Full</span>
                      </div>
                    </div>
                  </div>

                  <div className="masonry-info">
                    <h4 className="masonry-title">{item.title}</h4>
                    <span className="masonry-subtitle">VK Craftsmanship</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* LIGHTBOX MODAL */}
      {lightboxItem && (
        <div
          className="modal-overlay"
          onClick={() => setLightboxItem(null)}
          style={{ zIndex: 2000, background: 'rgba(0,0,0,0.95)' }}
        >
          <div
            className="modal-content"
            onClick={e => e.stopPropagation()}
            style={{
              maxWidth: '800px',
              width: '95%',
              background: 'transparent',
              border: 'none',
              padding: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              boxShadow: 'none'
            }}
          >
            <button
              onClick={() => setLightboxItem(null)}
              style={{
                position: 'absolute',
                top: '-40px',
                right: '0',
                background: 'transparent',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '18px'
              }}
            >
              <X size={24} /> Close
            </button>

            {lightboxItem.type === 'video' ? (
              (lightboxItem.url.includes('youtube.com') || lightboxItem.url.includes('youtu.be')) ? (
                <iframe 
                  src={lightboxItem.url.includes('watch?v=') ? lightboxItem.url.replace('watch?v=', 'embed/') : lightboxItem.url.includes('youtu.be/') ? lightboxItem.url.replace('youtu.be/', 'youtube.com/embed/') : lightboxItem.url.includes('shorts/') ? lightboxItem.url.replace('shorts/', 'embed/') : lightboxItem.url}
                  style={{ width: '100%', minHeight: '60vh', border: 'none', background: '#000' }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video
                  src={lightboxItem.url}
                  controls
                  autoPlay
                  style={{ width: '100%', maxHeight: '75vh', objectFit: 'contain', background: '#000' }}
                />
              )
            ) : (
              <img
                src={lightboxItem.url}
                alt={lightboxItem.title}
                style={{ width: '100%', maxHeight: '75vh', objectFit: 'contain' }}
                onError={(e) => { e.target.src = "/assets/poster.jpg"; }}
              />
            )}

            <div style={{ marginTop: '16px', textAlign: 'center', color: '#fff' }}>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '4px' }}>{lightboxItem.title}</h3>
              <span className="badge badge-gold">{lightboxItem.album}</span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
