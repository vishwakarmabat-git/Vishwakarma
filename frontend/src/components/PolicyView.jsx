import { ArrowLeft } from 'lucide-react';

export default function PolicyView({ title, content, onBack }) {
  return (
    <section className="section-padding" style={{ background: 'var(--black)', flexGrow: 1 }}>
      <div className="container" style={{ maxWidth: '800px' }}>
        <button 
          onClick={onBack} 
          style={{ background: 'transparent', border: 'none', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '30px', fontSize: '14px' }}
        >
          <ArrowLeft size={16} /> Back to Home
        </button>
        
        <h1 style={{ fontFamily: 'Playfair Display', fontSize: '2.5rem', marginBottom: '40px', color: 'var(--white)' }}>
          {title}
        </h1>

        <div 
          className="policy-content"
          style={{ 
            background: 'var(--dark)', 
            padding: '40px', 
            borderRadius: '8px', 
            border: '1px solid var(--border)',
            color: 'var(--muted)',
            lineHeight: '1.8',
            fontSize: '15px',
            whiteSpace: 'pre-wrap'
          }}
        >
          {content || `No content available for ${title} yet.`}
        </div>
      </div>
    </section>
  );
}
