import React, { useState, useEffect } from 'react';
import { colors } from '../utils/constants';
import CEShieldLogo from '../components/common/CEShieldLogo';
import LogoLink from '../components/common/LogoLink';
import useCountUp from '../hooks/useCountUp';
import siteStats from '../data/siteStats.json';

// Module-scope components. Defining these inside LandingPage would create a
// fresh component type on every parent render (scroll/resize state changes
// constantly here), remounting the buttons mid-hover and resetting the
// count-up animation.
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

// Big landing-page stat that counts up from 0 when scrolled into view.
// Serif display numerals are the one editorial moment we keep on the
// marketing surfaces.
const CountedStat = ({ target, label, suffix }) => {
  const { ref, displayValue } = useCountUp(target, { duration: 1200 });
  return (
    <div ref={ref}>
      <div
        className="font-display tabular-nums"
        style={{
          fontSize: '2.4rem',
          fontWeight: 500,
          color: colors.textDark,
          letterSpacing: '-0.02em',
          lineHeight: 1,
        }}
      >
        {displayValue}{suffix}
      </div>
      <div style={{ fontSize: '0.85rem', color: colors.textGray, marginTop: 4 }}>{label}</div>
    </div>
  );
};

// Landing Page Component
const LandingPage = ({ onGetStarted }) => {
  const [scrolled, setScrolled] = useState(false);
  // SSR-safe viewport tracking. Defaults to desktop layout so prerendered
  // HTML matches the most common visitor; resize listener corrects on the
  // client after hydration.
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setIsDesktop(window.innerWidth > 768);
    setScrolled(window.scrollY > 20);
    const onResize = () => setIsDesktop(window.innerWidth > 768);
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onScroll);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  const navStyle = {
    position: 'fixed', top: 0, width: '100%', zIndex: 1000, padding: '1rem 2rem',
    background: scrolled ? 'rgba(255, 255, 255, 0.98)' : 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)', transition: 'all 0.3s ease',
    boxShadow: scrolled ? '0 1px 3px rgba(0, 0, 0, 0.05)' : 'none'
  };

  // Per-card SVG marks. Each one is a tiny editorial diagram that maps
  // conceptually to the card's eyebrow — matrix grid, branching paths,
  // shield check, locked stack. Stroke-only so they read as restrained
  // technical illustration, not decoration.
  const MARKS = {
    matrix: (color) => (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
        <rect x="2" y="2"  width="7" height="7" rx="1" stroke={color} strokeWidth="1.4" />
        <rect x="13" y="2" width="7" height="7" rx="1" stroke={color} strokeWidth="1.4" />
        <rect x="2" y="13" width="7" height="7" rx="1" stroke={color} strokeWidth="1.4" />
        <rect x="13" y="13" width="7" height="7" rx="1" fill={color} />
      </svg>
    ),
    fanout: (color) => (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
        <circle cx="3.5" cy="11" r="1.6" fill={color} />
        <path d="M5 11 L19 3"   stroke={color} strokeWidth="1.2" strokeLinecap="round" />
        <path d="M5 11 L19 7"   stroke={color} strokeWidth="1.2" strokeLinecap="round" />
        <path d="M5 11 L19 11"  stroke={color} strokeWidth="1.2" strokeLinecap="round" />
        <path d="M5 11 L19 15"  stroke={color} strokeWidth="1.2" strokeLinecap="round" />
        <path d="M5 11 L19 19"  stroke={color} strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
    shieldCheck: (color) => (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
        <path d="M11 2 L19 5 V11 C19 15.5 15.5 18.5 11 20 C6.5 18.5 3 15.5 3 11 V5 L11 2 Z" stroke={color} strokeWidth="1.4" strokeLinejoin="round" />
        <path d="M7.5 11 L10 13.5 L14.5 8.5" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    vault: (color) => (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
        <rect x="4" y="9" width="14" height="11" rx="1.5" stroke={color} strokeWidth="1.4" />
        <path d="M7 9 V6.5 C7 4.5 8.8 3 11 3 C13.2 3 15 4.5 15 6.5 V9" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
        <circle cx="11" cy="14" r="1.4" fill={color} />
        <path d="M11 15.4 V17.5" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  };

  // Refined feature card: mono numeral eyebrow ("01 INTELLIGENCE"), thin
  // hairline accent that fills in on hover, restrained SVG mark on the right
  // (replaces the previous emoji boxes). Hairline-gradient top edge on hover
  // gives a Vercel-like "alive" feel without animation overhead.
  const FeatureCard = ({ index, eyebrow, mark, markColor, title, desc }) => {
    const [hovered, setHovered] = useState(false);
    return (
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          position: 'relative',
          padding: '1.75rem',
          background: 'white',
          border: `1px solid ${colors.slateLight}`,
          borderRadius: 14,
          transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
          transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
          boxShadow: hovered
            ? '0 8px 24px rgba(15, 23, 42, 0.07), 0 1px 2px rgba(15, 23, 42, 0.04)'
            : '0 1px 2px rgba(15, 23, 42, 0.04)',
          borderColor: hovered ? '#cbd5e1' : colors.slateLight,
          overflow: 'hidden',
        }}
      >
        {/* Hairline gradient that animates in on hover. */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 2,
            background: 'linear-gradient(90deg, #3b82f6 0%, #8b5cf6 100%)',
            opacity: hovered ? 1 : 0,
            transition: 'opacity 0.2s ease',
          }}
        />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div
            className="font-mono"
            style={{
              fontSize: '0.7rem',
              color: colors.textGray,
              letterSpacing: '0.06em',
              fontWeight: 500,
            }}
          >
            {String(index).padStart(2, '0')} &nbsp;·&nbsp; {eyebrow}
          </div>
          <div
            style={{
              width: 36, height: 36, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              borderLeft: `2px solid ${markColor}`,
              paddingLeft: 8,
            }}
          >
            {MARKS[mark]?.(markColor)}
          </div>
        </div>
        <h3 style={{
          fontSize: '1.15rem',
          margin: 0,
          marginBottom: '0.625rem',
          color: colors.textDark,
          fontWeight: 600,
          letterSpacing: '-0.015em',
          lineHeight: 1.25,
        }}>
          {title}
        </h3>
        <p style={{ color: colors.textGray, lineHeight: 1.6, margin: 0, fontSize: '0.92rem' }}>{desc}</p>
      </div>
    );
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'white' }}>
      <a href="#main-content" className="skip-to-main">Skip to main content</a>
      <nav aria-label="Primary" style={navStyle} className="cs-public-nav">
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <LogoLink size="medium" />
          <div className="cs-nav-links" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <a
              href="/credentials"
              className="cs-nav-secondary"
              style={{
                color: colors.slateMedium,
                textDecoration: 'none',
                fontSize: '0.95rem',
                fontWeight: 500,
              }}
            >
              Credentials
            </a>
            <a
              href="/career-paths"
              className="cs-nav-secondary"
              style={{
                color: colors.slateMedium,
                textDecoration: 'none',
                fontSize: '0.95rem',
                fontWeight: 500,
              }}
            >
              Career Paths
            </a>
            <a
              href="/methodology"
              className="cs-nav-secondary"
              style={{
                color: colors.slateMedium,
                textDecoration: 'none',
                fontSize: '0.95rem',
                fontWeight: 500,
              }}
            >
              Methodology
            </a>
            <a
              href="/about"
              className="cs-nav-secondary"
              style={{
                color: colors.slateMedium,
                textDecoration: 'none',
                fontSize: '0.95rem',
                fontWeight: 500,
              }}
            >
              About
            </a>
            <ButtonComponent onClick={onGetStarted} style={{ padding: '0.55rem 1.1rem', fontSize: '0.9rem' }}>
              Get Started
            </ButtonComponent>
          </div>
        </div>
      </nav>

      <main id="main-content">
      <section
        className="bg-dot-grid"
        style={{
          minHeight: '90vh', display: 'flex', alignItems: 'center', paddingTop: '100px',
          background: 'linear-gradient(180deg, #FAFAF6 0%, #F3F1E9 100%)',
          backgroundImage:
            'radial-gradient(circle, rgba(15, 23, 42, 0.06) 1px, transparent 1px), linear-gradient(180deg, #FAFAF6 0%, #F3F1E9 100%)',
          backgroundSize: '22px 22px, auto',
          position: 'relative',
        }}
      >
        <div style={{
          content: '', position: 'absolute', bottom: 0, left: 0, right: 0, height: '100px',
          background: 'linear-gradient(180deg, transparent 0%, #FAFAF6 100%)'
        }}></div>
        
        <div className="cs-hero-grid" style={{
          maxWidth: '1200px', margin: '0 auto', padding: '2rem', position: 'relative', zIndex: 1,
          display: 'grid', gridTemplateColumns: isDesktop ? '1fr 1fr' : '1fr',
          gap: '4rem', alignItems: 'center'
        }}>
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 12px',
              background: colors.mutedPurple,
              color: colors.primaryPurple,
              borderRadius: 999,
              fontSize: '0.75rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '1.25rem',
            }}>
              Career intelligence for rehab professionals
            </div>
            <h1
              style={{
                fontSize: isDesktop ? '2.85rem' : '2rem',
                lineHeight: 1.1,
                marginBottom: '1.5rem',
                color: colors.textDark,
                fontWeight: 700,
                letterSpacing: '-0.025em',
              }}
            >
              Stop guessing which credential moves your career forward.
            </h1>
            <p style={{
              fontSize: '1.125rem', color: colors.slateMedium, marginBottom: '2rem', lineHeight: 1.7,
            }}>
              CE Shield ranks <strong>{siteStats.certCount} rehabilitation credentials</strong> across six
              evidence-backed dimensions, swaps the rubric by career path
              (clinical, business, academic clinical, research, or healthtech), and tracks
              your CE compliance in parallel. <strong>{siteStats.citationTotal.toLocaleString()} curated citations</strong>{' '}
              back the scores &mdash; built by physical therapists in
              collaboration with research librarians.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <ButtonComponent onClick={onGetStarted} style={{ padding: '0.875rem 1.75rem', fontSize: '1.05rem' }}>
                Explore the matrix
              </ButtonComponent>
              <a
                href="/career-paths"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '0.875rem 1.5rem',
                  fontSize: '1.05rem',
                  color: colors.primaryBlue,
                  background: 'white',
                  border: `1px solid ${colors.primaryBlue}`,
                  textDecoration: 'none',
                  fontWeight: 500,
                  borderRadius: 6,
                  transition: 'all 0.2s ease',
                }}
              >
                See the five paths &rarr;
              </a>
            </div>
            <p style={{ marginTop: '1.5rem', color: colors.textGray, fontSize: '0.9rem' }}>
              Free during beta &middot; free for students, always &middot; compliance tracking included.
            </p>
          </div>

          {isDesktop && (
            // Hairline gradient border via padded wrapper. Vercel pattern —
            // the border itself shows the brand gradient instead of a flat
            // line, then the inner card sits on top of white.
            <div style={{
              padding: 1,
              borderRadius: 14,
              background:
                'linear-gradient(135deg, rgba(59, 130, 246, 0.55) 0%, rgba(139, 92, 246, 0.35) 50%, rgba(15, 23, 42, 0.10) 100%)',
              boxShadow: '0 18px 36px rgba(15, 23, 42, 0.09), 0 2px 4px rgba(15, 23, 42, 0.04)',
            }}>
            <div style={{
              background: 'white', padding: '1.5rem', borderRadius: 13,
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: '0.75rem', paddingBottom: '0.75rem',
                borderBottom: `1px solid ${colors.slateLight}`,
              }}>
                <div className="tabular-nums" style={{
                  fontSize: '0.7rem', color: colors.textGray,
                  textTransform: 'uppercase', letterSpacing: '0.12em',
                  fontWeight: 600,
                }}>
                  Top 5 &middot; balanced lens
                </div>
                <div style={{ fontSize: '0.7rem', color: colors.textGray }}>
                  of {siteStats.certCount}
                </div>
              </div>
              {[
                { name: 'Pulmonary Rehabilitation', score: 92, type: 'Meta-analysis', evidence: '6MWD +49m · 68% fewer hosps' },
                { name: 'AACVPR Cardiac Rehab', score: 89, type: 'Systematic Review', evidence: '26% mortality reduction' },
                { name: 'Otago Exercise Programme', score: 86, type: 'Meta-analysis', evidence: '35–40% fall reduction' },
                { name: 'CIMT', score: 84, type: 'Systematic Review', evidence: 'Stroke motor recovery' },
                { name: 'LSVT LOUD', score: 81, type: 'RCT', evidence: 'Parkinson dysarthria gains' },
              ].map((row, i) => (
                <div key={row.name} style={{
                  display: 'grid',
                  gridTemplateColumns: '20px 1fr auto',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem 0',
                  borderBottom: i < 4 ? `1px solid ${colors.slateLight}` : 'none',
                }}>
                  <div
                    className="tabular-nums"
                    style={{
                      fontSize: '0.68rem',
                      color: colors.textGray,
                      fontWeight: 500,
                      letterSpacing: '0.04em',
                    }}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{
                      fontWeight: 600,
                      fontSize: '0.92rem',
                      color: colors.textDark,
                      letterSpacing: '-0.01em',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>{row.name}</div>
                    <div style={{
                      fontSize: '0.72rem',
                      color: colors.textGray,
                      marginTop: 2,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {row.evidence}
                    </div>
                  </div>
                  <div
                    className="tabular-nums"
                    style={{
                      minWidth: 44,
                      textAlign: 'right',
                      fontWeight: 700,
                      fontSize: '1.15rem',
                      color: colors.textDark,
                      letterSpacing: '-0.025em',
                    }}
                  >{row.score}</div>
                </div>
              ))}
              <div style={{
                marginTop: '0.75rem',
                fontSize: '0.72rem',
                color: colors.textGray,
                textAlign: 'center',
              }}>
                Switch lenses to re-rank for clinical, business, or academic priorities.
              </div>
            </div>
            </div>
          )}
        </div>
      </section>

      {/* By-the-numbers strip */}
      <section className="cs-section-pad-tight" style={{
        padding: '2.5rem 2rem',
        background: 'white',
        borderTop: `1px solid ${colors.slateLight}`,
        borderBottom: `1px solid ${colors.slateLight}`,
      }}>
        <div style={{
          maxWidth: '1100px', margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '1.5rem',
          textAlign: 'center',
        }}>
          {[
            { target: siteStats.certCount, label: 'Certifications scored' },
            { target: siteStats.citationTotal, label: 'Curated citations' },
            { target: siteStats.rctSrMa, label: 'RCTs + systematic reviews + meta-analyses' },
            { target: 5, label: 'Career-path lenses' },
            { target: 6, label: 'Adjustable dimensions per lens' },
          ].map((stat) => <CountedStat key={stat.label} {...stat} />)}
        </div>
      </section>

      <section className="cs-section-pad" style={{ padding: '5rem 2rem', background: '#FAFAF6' }}>
        <div style={{ textAlign: 'center', maxWidth: '760px', margin: '0 auto 4rem' }}>
          <h2
            style={{
              fontSize: 'clamp(1.5rem, 5.5vw, 2.1rem)',
              marginBottom: '1rem',
              color: colors.textDark,
              fontWeight: 600,
              letterSpacing: '-0.02em',
              lineHeight: 1.15,
            }}
          >
            One product for the whole career arc.
          </h2>
          <p style={{ color: colors.textGray, fontSize: '1.05rem', lineHeight: 1.6 }}>
            Career intelligence, compliance tracking, and a curated evidence
            library &mdash; so credential decisions are driven by data, not
            by marketing.
          </p>
        </div>

        <div style={{
          maxWidth: '1200px', margin: '0 auto', display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem',
        }}>
          <FeatureCard
            index={1}
            eyebrow="INTELLIGENCE"
            mark="matrix"
            markColor={colors.primaryPurple}
            title="Credential Intelligence"
            desc={`${siteStats.certCount} credentials ranked across six adjustable dimensions per lens. ${siteStats.citationTotal.toLocaleString()} curated citations behind the scores.`}
          />
          <FeatureCard
            index={2}
            eyebrow="PATHS"
            mark="fanout"
            markColor={colors.primaryBlue}
            title="Five Career Paths"
            desc="Clinical, business, academic clinical, research, and healthtech. Each lens uses its own dimensions and default weights, so the matrix surfaces different top picks depending on where you actually want to go."
          />
          <FeatureCard
            index={3}
            eyebrow="COMPLIANCE"
            mark="shieldCheck"
            markColor={colors.sage}
            title="State-Specific Compliance"
            desc="Illinois PT and OT verified, including implicit bias, cultural competency, and Alzheimer's mandatories. Wisconsin and North Carolina in beta. More states monthly."
          />
          <FeatureCard
            index={4}
            eyebrow="DOCUMENTS"
            mark="vault"
            markColor={colors.ochre}
            title="Audit-Ready Documents"
            desc="Upload certificates, generate audit-ready reports, export ZIPs of everything for your licensing board. Your evidence binder, always renewal-ready."
          />
        </div>
      </section>

      <section className="cs-section-pad" style={{ padding: '5rem 2rem', background: '#F3F1E9', textAlign: 'center' }}>
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>
          <h2
            style={{
              fontSize: 'clamp(1.5rem, 5.5vw, 2.1rem)',
              marginBottom: '1.25rem',
              color: colors.textDark,
              fontWeight: 600,
              letterSpacing: '-0.02em',
              lineHeight: 1.15,
            }}
          >
            Pick your next certification with evidence on your side.
          </h2>
          <p style={{ color: colors.textGray, marginBottom: '2rem', lineHeight: 1.6 }}>
            Free during beta · Free for students, always · Independent
            scoring &mdash; we take no money from certification programs.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <ButtonComponent onClick={onGetStarted} style={{ padding: '0.875rem 2rem', fontSize: '1.125rem' }}>
              Open the matrix
            </ButtonComponent>
            <a
              href="/career-paths"
              style={{
                padding: '0.875rem 1.75rem',
                fontSize: '1.05rem',
                color: colors.primaryBlue,
                background: 'white',
                border: `1px solid ${colors.primaryBlue}`,
                textDecoration: 'none',
                fontWeight: 500,
                borderRadius: 6,
              }}
            >
              See the five paths
            </a>
          </div>
        </div>
      </section>

      </main>
      <footer className="cs-footer-pad" style={{ background: colors.slateDark, color: 'white', padding: '3rem 2rem 2rem', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '2rem' }}>
          <svg width="44" height="29" viewBox="0 0 60 40" xmlns="http://www.w3.org/2000/svg">
            <g transform="translate(0, 3)">
              <path d="M10 0 L10 20 Q10 28 25 32 Q40 28 40 20 L40 0 Z" fill={colors.lightBlue}/>
              <path d="M20 0 L20 20 Q20 28 35 32 Q50 28 50 20 L50 0 Z" fill={colors.primaryBlue} opacity="0.85"/>
              <path d="M30 0 L30 20 Q30 28 45 32 Q60 28 60 20 L60 0 Z" fill={colors.primaryPurple} opacity="0.85"/>
            </g>
          </svg>
          <h2 style={{ fontSize: '20px', lineHeight: '20px', color: 'white', marginLeft: '8px' }}>
            <span style={{ fontWeight: 200, letterSpacing: '0.03em' }}>CE</span><span style={{ fontWeight: 700 }}>Shield</span>
          </h2>
        </div>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '2rem',
          marginBottom: '1.25rem',
          flexWrap: 'wrap',
        }}>
          <a href="/career-paths" style={{ color: 'rgba(255,255,255,0.85)', textDecoration: 'none', fontSize: '0.9rem' }}>
            Career Paths
          </a>
          <a href="/methodology" style={{ color: 'rgba(255,255,255,0.85)', textDecoration: 'none', fontSize: '0.9rem' }}>
            Methodology
          </a>
          <a href="/about" style={{ color: 'rgba(255,255,255,0.85)', textDecoration: 'none', fontSize: '0.9rem' }}>
            About
          </a>
          <a href="mailto:hello@ceshield.com" style={{ color: 'rgba(255,255,255,0.85)', textDecoration: 'none', fontSize: '0.9rem' }}>
            Contact
          </a>
        </div>
        <div style={{ paddingTop: '1.25rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)', color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.875rem' }}>
          <p>&copy; 2026 CE Shield. Independent. No sponsor relationships.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
