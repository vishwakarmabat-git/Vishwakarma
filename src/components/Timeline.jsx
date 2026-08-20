import { useState } from 'react';
import { db } from '../data/db';

export default function Timeline() {
  const [steps] = useState(() => db.getCraftSteps() || []);

  const displaySteps = steps.length > 0 ? steps : [
    { id: "step-1", num: "01", title: "Willow Selection", desc: "Every bat begins with expert selection of the finest English and Kashmir Willow clefts, checking for vertical grains and weight density." },
    { id: "step-2", num: "02", title: "Blade Cleft Prep", desc: "The raw willow block is cut, seasoned, and slowly air-dried to preserve natural cellular moisture, guaranteeing a resilient blade profile." },
    { id: "step-3", num: "03", title: "Manual Profile Shaping", desc: "Using traditional draw-knives and hand-planes, we carve the spine and edge thicknesses to optimize the bat's natural sweet spot." },
    { id: "step-4", num: "04", title: "5-Ton Fibers Pressing", desc: "We compress the wood under a multi-ton hydraulic roller. This hardens the surface wood cells to deliver maximum ping out of the box." },
    { id: "step-5", num: "05", title: "Handle Fitting", desc: "A premium Singapore cane handle is bound with elastic rubber layers and glued deep into the cleft to absorb impact vibrations." },
    { id: "step-6", num: "06", title: "Fine Sanding & Oiling", desc: "The bat is repeatedly hand-sanded with fine grits and treated with raw linseed oil to seal the wood fibers and keep the face clean." },
    { id: "step-7", num: "07", title: "Quality Audit & Grip", desc: "We run a final check on the exact weight, center of gravity, and pickup before applying the premium chevron grip and decals." }
  ];

  return (
    <section className="process" id="process" style={{ background: 'var(--black)', padding: '100px 0' }}>
      <div className="process-header fade-in" style={{ textAlign: 'center', marginBottom: '50px' }}>
        <span className="section-tag">The Craft</span>
        <h2 className="section-title" style={{ fontSize: '2.5rem' }}>
          From Willow to<br />
          <span style={{ background: 'linear-gradient(135deg,var(--gold),var(--gold2))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Championship Weapon
          </span>
        </h2>
        <p style={{ color: 'var(--muted)', fontSize: '15px', marginTop: '16px', maxWidth: '520px', margin: '16px auto 0', lineHeight: '1.6' }}>
          Every single VK bat goes through a meticulous manual process at our Chaklasi workshop before it reaches the pitch.
        </p>
      </div>

      <div className="timeline-container">
        {displaySteps.map((step, idx) => (
          <div key={step.id || idx} className="timeline-item fade-in">
            <div className="timeline-dot"></div>
            <div className="timeline-content">
              <div className="timeline-num">{step.num}</div>
              <h3 className="timeline-title">{step.title}</h3>
              <p className="timeline-desc" style={{ margin: 0 }}>{step.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
