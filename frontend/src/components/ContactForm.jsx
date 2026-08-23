import { useState } from 'react';
import { Send } from 'lucide-react';
import { db } from '../data/db';
import { toast } from 'react-toastify';

export default function ContactForm({ about, onNewLead }) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    cricketLevel: 'Club Player',
    preferredWeight: '1150 - 1180g',
    message: ''
  });
  const [success, setSuccess] = useState(false);

  const handleInputChange = (e) => {
    let { name, value } = e.target;
    if (name === 'phone' || name === 'pincode' || name === 'pin') {
      value = value.replace(/[^0-9]/g, '');
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      toast.error("Name and Phone Number are required!");
      return;
    }
    if (!/[a-zA-Z]/.test(formData.name)) {
      toast.error("Name must contain alphabets.");
      return;
    }
    if (!/^[6-9]\d{9}$/.test(formData.phone)) {
      toast.error("Please enter a valid 10-digit Indian Mobile Number.");
      return;
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    const leadMessage = `Level: ${formData.cricketLevel}. Pref Weight: ${formData.preferredWeight}. Message: ${formData.message || 'No additional message.'}`;
    const lead = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      message: leadMessage,
      type: "Contact Form",
      status: "New"
    };

    db.addLead(lead);

    // Get WhatsApp number from settings
    const settings = db.getSettings();
    const whatsappNum = settings.contactWhatsapp || '9274543199';
    const messageText = `Hi! I want to submit custom specifications for a VK bat:
- Name: ${formData.name}
- Phone: ${formData.phone}
- Email: ${formData.email || 'N/A'}
- Experience: ${formData.cricketLevel}
- Weight: ${formData.preferredWeight}
- Specifications: ${formData.message || 'None'}`;

    const whatsappLink = `https://wa.me/91${whatsappNum}?text=${encodeURIComponent(messageText)}`;
    window.open(whatsappLink, '_blank');

    setSuccess(true);
    setFormData({
      name: '',
      phone: '',
      email: '',
      cricketLevel: 'Club Player',
      preferredWeight: '1150 - 1180g',
      message: ''
    });

    if (onNewLead) onNewLead();
  };

  const phoneCall = `tel:+91${about?.phone1 || '9274543199'}`;
  const whatsappUrl = `https://wa.me/91${about?.phone2 || '9274543199'}?text=Hi! I want to order a VK Bat House cricket bat.`;

  return (
    <section id="contact" className="contact section-padding" style={{ background: 'var(--black)', borderTop: '1px solid var(--border)' }}>
      <div className="container">
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <span className="section-tag">Get In Touch</span>
          <h2 className="section-title">
            Ready to Order Your<br />
            <span style={{ background: 'linear-gradient(135deg,var(--gold),var(--gold2))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Perfect Bat?
            </span>
          </h2>
          <p style={{ color: 'var(--muted)', fontSize: '15px', maxWidth: '600px', margin: '16px auto 0', lineHeight: '1.7' }}>
            Reach out via WhatsApp, call, or submit your custom specifications below. Every cleft is pressed and shaped to your specific requirements.
          </p>
        </div>

        {/* Outer Layout: Form on Left, Contact Details on Right */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '50px', alignItems: 'start', textAlign: 'left' }}>
          
          {/* Custom Requirement Form */}
          <div className="product-card" style={{ background: 'var(--dark)', cursor: 'default' }}>
            <div className="product-tier">Custom Specs</div>
            <h3 className="product-name" style={{ marginBottom: '24px' }}>Requirement Form</h3>
            
            {success ? (
              <div style={{
                padding: '24px',
                background: 'rgba(201, 168, 76, 0.05)',
                border: '1px solid var(--gold)',
                textAlign: 'center'
              }}>
                <h4 style={{ color: 'var(--gold)', marginBottom: '8px', fontFamily: 'Playfair Display', fontSize: '1.2rem' }}>Thank You!</h4>
                <p style={{ color: 'var(--muted)', fontSize: '0.95rem', fontFamily: 'Barlow', lineHeight: '1.5' }}>
                  Your custom requirements have been recorded. We will contact you shortly.
                </p>
                <button onClick={() => setSuccess(false)} className="product-btn" style={{ marginTop: '20px' }}>
                  Submit Another Form
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '6px', color: 'var(--muted)' }}>Full Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      style={{ width: '100%', background: 'var(--black)', border: '1px solid var(--border)', padding: '12px', color: 'var(--white)', outline: 'none', fontFamily: 'Barlow' }}
                      placeholder="e.g. Sumit Patel"
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '6px', color: 'var(--muted)' }}>Contact Number *</label>
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      style={{ width: '100%', background: 'var(--black)', border: '1px solid var(--border)', padding: '12px', color: 'var(--white)', outline: 'none', fontFamily: 'Barlow' }}
                      placeholder="e.g. 99094 54977"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '6px', color: 'var(--muted)' }}>Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    style={{ width: '100%', background: 'var(--black)', border: '1px solid var(--border)', padding: '12px', color: 'var(--white)', outline: 'none', fontFamily: 'Barlow' }}
                    placeholder="e.g. player@gmail.com"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '6px', color: 'var(--muted)' }}>Cricket Experience</label>
                    <select
                      name="cricketLevel"
                      value={formData.cricketLevel}
                      onChange={handleInputChange}
                      style={{ width: '100%', background: 'var(--black)', border: '1px solid var(--border)', padding: '12px', color: 'var(--white)', outline: 'none', fontFamily: 'Barlow' }}
                    >
                      <option>Professional / League</option>
                      <option>Club Player</option>
                      <option>School/College Team</option>
                      <option>Tennis Cricket</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '6px', color: 'var(--muted)' }}>Preferred Bat Weight</label>
                    <select
                      name="preferredWeight"
                      value={formData.preferredWeight}
                      onChange={handleInputChange}
                      style={{ width: '100%', background: 'var(--black)', border: '1px solid var(--border)', padding: '12px', color: 'var(--white)', outline: 'none', fontFamily: 'Barlow' }}
                    >
                      <option>Light (1110 - 1140g)</option>
                      <option>Medium (1150 - 1180g)</option>
                      <option>Heavy (1190 - 1220g)</option>
                      <option>Very Heavy (1230g+)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '6px', color: 'var(--muted)' }}>Custom Specs / Message</label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    style={{ width: '100%', background: 'var(--black)', border: '1px solid var(--border)', padding: '12px', color: 'var(--white)', outline: 'none', minHeight: '80px', fontFamily: 'Barlow' }}
                    placeholder="Enter spine height, edge thickness, handle type, or grip preference..."
                  />
                </div>

                <button type="submit" className="product-btn" style={{ background: 'var(--gold)', color: 'var(--black)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  Submit Specifications <Send size={14} />
                </button>
              </form>
            )}
          </div>

          {/* Template Details & Map */}
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Call Us Card */}
              <a href={phoneCall} className="contact-card fade-in" style={{ display: 'block', textDecoration: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <span style={{ fontSize: '24px' }}>📞</span>
                  <div>
                    <div style={{ fontSize: '9px', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--gold)' }}>Call Us</div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--white)', marginTop: '2px' }}>+91 {about?.phone1 || '99094 54977'}</div>
                    <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>Mon–Sat, 9am–7pm · Closed on Amavasya</div>
                  </div>
                </div>
              </a>

              {/* Email Us Card */}
              <a href={`mailto:${about?.email || 'vishwakarmabat@gmail.com'}`} className="contact-card fade-in" style={{ display: 'block', textDecoration: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <span style={{ fontSize: '24px' }}>✉️</span>
                  <div>
                    <div style={{ fontSize: '9px', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--gold)' }}>Email</div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--white)', marginTop: '2px' }}>{about?.email || 'vishwakarmabat@gmail.com'}</div>
                    <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>Reply within 24 hours</div>
                  </div>
                </div>
              </a>

              {/* Visit Us Card */}
              <a href="https://maps.google.com/?q=VK+Bat+House+Chaklasi" target="_blank" rel="noopener noreferrer" className="contact-card fade-in" style={{ display: 'block', textDecoration: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <span style={{ fontSize: '24px' }}>📍</span>
                  <div>
                    <div style={{ fontSize: '9px', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--gold)' }}>Visit Us</div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--white)', marginTop: '2px' }}>VK Bat House, Chaklasi</div>
                    <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>Uttarsanda Bhalej Road, Gujarat 387315</div>
                  </div>
                </div>
              </a>

              {/* Order on WhatsApp */}
              <a href={whatsappUrl} className="whatsapp-btn fade-in" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', display: 'flex', justifyContent: 'center', margin: 0 }}>
                <span style={{ fontSize: '20px' }}>💬</span> Order on WhatsApp
              </a>

              {/* Social Channels */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '10px' }}>
                <a href={`https://www.instagram.com/${about?.instagram || 'vishwakarma_bat'}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--muted)', textDecoration: 'none', fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', transition: '.2s' }} onMouseOver={(e) => e.target.style.color='var(--gold)'} onMouseOut={(e) => e.target.style.color='var(--muted)'}>
                  📸 Instagram
                </a>
                <a href={`https://www.youtube.com/${about?.youtube || '@VishwakarmaBathouse'}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--muted)', textDecoration: 'none', fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', transition: '.2s' }} onMouseOver={(e) => e.target.style.color='var(--gold)'} onMouseOut={(e) => e.target.style.color='var(--muted)'}>
                  ▶️ YouTube
                </a>
              </div>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
