import React, { useState, useEffect } from 'react';
import { colors } from '../utils/constants';
import CEShieldLogo from '../components/common/CEShieldLogo';

// Landing Page Component
const LandingPage = ({ onGetStarted }) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navStyle = {
    position: 'fixed', top: 0, width: '100%', zIndex: 1000, padding: '1rem 2rem',
    background: scrolled ? 'rgba(255, 255, 255, 0.98)' : 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)', transition: 'all 0.3s ease',
    boxShadow: scrolled ? '0 1px 3px rgba(0, 0, 0, 0.05)' : 'none'
  };

  const ButtonComponent = ({ children, onClick, style = {} }) => {
    const [hovered, setHovered] = useState(false);
    return (
      <button
        onClick={onClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: hovered ? '#2563eb' : colors.primaryBlue,
          color: 'white', border: 'none', fontWeight: 500, cursor: 'pointer',
          transition: 'all 0.2s ease',
          transform: hovered ? 'translateY(-1px)' : 'translateY(0)',
          boxShadow: hovered ? '0 4px 12px rgba(59, 130, 246, 0.2)' : 'none',
          ...style
        }}
      >
        {children}
      </button>
    );
  };

  const FeatureCard = ({ icon, title, desc, bg }) => {
    const [hovered, setHovered] = useState(false);
    return (
      <div
        style={{
          padding: '2rem', border: `1px solid ${hovered ? colors.primaryBlue : colors.slateLight}`,
          background: 'white', transition: 'all 0.2s ease',
          transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
          boxShadow: hovered ? '0 8px 24px rgba(0, 0, 0, 0.06)' : 'none'
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div style={{
          width: '48px', height: '48px', background: bg, display: 'flex',
          alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', fontSize: '1.5rem'
        }}>
          {icon}
        </div>
        <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: colors.textDark, fontWeight: 500 }}>
          {title}
        </h3>
        <p style={{ color: colors.textGray, lineHeight: 1.6 }}>{desc}</p>
      </div>
    );
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'white' }}>
      <nav style={navStyle}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <CEShieldLogo showTagline={false} size="medium" />
          <ButtonComponent onClick={onGetStarted} style={{ padding: '0.625rem 1.5rem' }}>
            Get Started
          </ButtonComponent>
        </div>
      </nav>

      <section style={{
        minHeight: '90vh', display: 'flex', alignItems: 'center', paddingTop: '100px',
        background: 'linear-gradient(180deg, #f0f9ff 0%, #e0f2fe 100%)', position: 'relative'
      }}>
        <div style={{
          content: '', position: 'absolute', bottom: 0, left: 0, right: 0, height: '100px',
          background: 'linear-gradient(180deg, transparent 0%, white 100%)'
        }}></div>
        
        <div style={{
          maxWidth: '1200px', margin: '0 auto', padding: '2rem', position: 'relative', zIndex: 1,
          display: 'grid', gridTemplateColumns: window.innerWidth > 768 ? '1fr 1fr' : '1fr',
          gap: '4rem', alignItems: 'center'
        }}>
          <div>
            <h1 style={{
              fontSize: window.innerWidth > 768 ? '3rem' : '2rem', lineHeight: 1.2,
              marginBottom: '1.5rem', color: colors.textDark, fontWeight: 400
            }}>
              Never Worry About License Renewal Again.
            </h1>
            <p style={{
              fontSize: '0.875rem', color: colors.textGray, marginBottom: '2rem',
              letterSpacing: '1.5px', textTransform: 'uppercase'
            }}>
              Track Education. Protect Your License.
            </p>
            <p style={{
              fontSize: '1.125rem', color: colors.slateMedium, marginBottom: '2rem', lineHeight: 1.75
            }}>
              CE Shield is the smart continuing education tracker designed by clinicians, for clinicians. Stay compliant, organized, and ahead of deadlines with intelligent tracking for PT and OT professionals.
            </p>
            <ButtonComponent onClick={onGetStarted} style={{ padding: '0.875rem 2rem', fontSize: '1.125rem' }}>
              Start Today
            </ButtonComponent>
          </div>
          
          {window.innerWidth > 768 && (
            <div style={{
              background: 'white', padding: '2rem', border: `1px solid ${colors.slateLight}`,
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.08)'
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', marginBottom: '1.5rem',
                paddingBottom: '1rem', borderBottom: `1px solid ${colors.slateLight}`
              }}>
                <CEShieldLogo showTagline={false} size="small" />
              </div>
              <div style={{ padding: '1rem', background: colors.grayLight }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '14px', color: colors.textGray }}>Overall Progress</span>
                  <span style={{ fontSize: '14px', fontWeight: 600 }}>30/40 Hours</span>
                </div>
                <div style={{ height: '6px', background: colors.slateLight, overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: colors.primaryBlue, width: '75%' }}></div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1.5rem' }}>
                <div style={{ padding: '1rem', background: colors.grayLight, borderLeft: `3px solid ${colors.primaryBlue}` }}>
                  <div style={{ fontSize: '12px', color: colors.textGray }}>Ethics</div>
                  <div style={{ fontWeight: 600, color: colors.primaryBlue }}>3/3 ✓</div>
                </div>
                <div style={{ padding: '1rem', background: colors.grayLight, borderLeft: '3px solid #e5e7eb' }}>
                  <div style={{ fontSize: '12px', color: colors.textGray }}>Cultural Comp.</div>
                  <div style={{ fontWeight: 600, color: colors.textGray }}>0/1</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <section style={{ padding: '5rem 2rem', background: 'white' }}>
        <div style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto 4rem' }}>
          <h2 style={{ fontSize: '2.25rem', marginBottom: '1rem', color: colors.textDark, fontWeight: 400 }}>
            Everything You Need for CE Compliance
          </h2>
          <p style={{ color: colors.textGray }}>Built by healthcare professionals, for healthcare professionals</p>
        </div>
        
        <div style={{
          maxWidth: '1200px', margin: '0 auto', display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem'
        }}>
          <FeatureCard 
            icon="📍" 
            title="State-Specific Requirements" 
            desc="Automatically tracks your state's PT & OT requirements including all mandatory training categories. Stay compliant with changing regulations and new requirements as they emerge."
            bg={colors.mutedTeal}
          />
          <FeatureCard 
            icon="📊" 
            title="Smart Category Tracking" 
            desc="Monitor all CE categories with automatic limit warnings. Track self-study, teaching hours, clinical instruction, and mandatory requirements."
            bg={colors.mutedPurple}
          />
          <FeatureCard 
            icon="🔒" 
            title="Secure Document Storage" 
            desc="Keep all certificates in one encrypted, HIPAA-compliant vault. Upload PDFs and images, download reports for audits anytime."
            bg={colors.lightBlue}
          />
        </div>
      </section>

      <section style={{ padding: '5rem 2rem', background: colors.grayLight, textAlign: 'center' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '2.25rem', marginBottom: '1.5rem', color: colors.textDark, fontWeight: 400 }}>
            Ready to Protect Your License?
          </h2>
          <p style={{ color: colors.textGray, marginBottom: '2rem' }}>
            Join PTs and OTs who track their CE with confidence.
          </p>
          <ButtonComponent onClick={onGetStarted} style={{ padding: '0.875rem 2rem', fontSize: '1.125rem' }}>
            Get Started
          </ButtonComponent>
        </div>
      </section>

      <footer style={{ background: colors.slateDark, color: 'white', padding: '3rem 2rem 2rem', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '2rem' }}>
          <svg width="44" height="29" viewBox="0 0 60 40" xmlns="http://www.w3.org/2000/svg">
            <g transform="translate(0, 3)">
              <path d="M10 0 L10 20 Q10 28 25 32 Q40 28 40 20 L40 0 Z" fill={colors.lightBlue}/>
              <path d="M20 0 L20 20 Q20 28 35 32 Q50 28 50 20 L50 0 Z" fill={colors.primaryBlue} opacity="0.85"/>
              <path d="M30 0 L30 20 Q30 28 45 32 Q60 28 60 20 L60 0 Z" fill={colors.primaryPurple} opacity="0.85"/>
            </g>
          </svg>
          <h2 style={{ fontSize: '20px', lineHeight: '20px', color: 'white', marginLeft: '8px' }}>
            <span style={{ fontWeight: 300 }}>CE</span><span style={{ fontWeight: 400 }}>Shield</span>
          </h2>
        </div>
        <div style={{ paddingTop: '2rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)', color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.875rem' }}>
          <p>© 2025 CE Shield. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
