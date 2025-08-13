import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Clock, FileText, Plus, Trash2, Download, Info, Loader2, Settings, Pencil, LogOut, User, Lock, Mail, Eye, EyeOff, Shield, ChevronDown } from 'lucide-react';
import { supabase } from './supabaseClient';

// Color palette from landing page
const colors = {
  primaryBlue: '#3b82f6',  // Sky blue, slightly more vibrant
  primaryPurple: '#8b5cf6',
  lightBlue: '#e0f2fe',    // Light blue background
  mutedPurple: '#e9d5ff',
  mutedTeal: '#cffafe',
  slateDark: '#1e293b',
  slateMedium: '#475569',
  slateLight: '#f1f5f9',
  grayLight: '#f9fafb',
  textDark: '#111827',
  textGray: '#6b7280'
};

// CE Shield Logo Component - Updated to match landing page design
const CEShieldLogo = ({ showTagline = true, className = "", size = "large" }) => {
  const scales = {
    small: { svg: "30", text: "14", tagline: "8" },
    medium: { svg: "44", text: "20", tagline: "10" },
    large: { svg: "54", text: "30", tagline: "12" }
  };
  
  const scale = scales[size] || scales.large;
  
  if (showTagline) {
    return (
      <div className={className}>
        <div className="flex items-center gap-2">
          <svg 
            width={scale.svg} 
            height={parseInt(scale.svg) * 0.67} 
            viewBox="0 0 60 40" 
            xmlns="http://www.w3.org/2000/svg"
            className="flex-shrink-0"
          >
            <g transform="translate(0, 4)">
              <path d="M10 0 L10 20 Q10 28 25 32 Q40 28 40 20 L40 0 Z" 
                    fill={colors.lightBlue}/>
              <path d="M20 0 L20 20 Q20 28 35 32 Q50 28 50 20 L50 0 Z" 
                    fill={colors.primaryBlue} opacity="0.85"/>
              <path d="M30 0 L30 20 Q30 28 45 32 Q60 28 60 20 L60 0 Z" 
                    fill={colors.primaryPurple} opacity="0.85"/>
            </g>
          </svg>
          <h1 className={`text-[${scale.text}px] leading-[${scale.text}px]`} style={{ color: colors.textDark }}>
            <span className="font-light">CE</span><span className="font-normal">Shield</span>
          </h1>
        </div>
        <p className={`text-[${scale.tagline}px] tracking-[1.5px] mt-2 uppercase`} style={{ color: colors.textGray, paddingLeft: '0' }}>
          Track Education. Protect Your License.
        </p>
      </div>
    );
  }
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg 
        width={scale.svg} 
        height={parseInt(scale.svg) * 0.67} 
        viewBox="0 0 60 40" 
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        <g transform="translate(0, 3)">
          <path d="M10 0 L10 20 Q10 28 25 32 Q40 28 40 20 L40 0 Z" 
                fill={colors.lightBlue}/>
          <path d="M20 0 L20 20 Q20 28 35 32 Q50 28 50 20 L50 0 Z" 
                fill={colors.primaryBlue} opacity="0.85"/>
          <path d="M30 0 L30 20 Q30 28 45 32 Q60 28 60 20 L60 0 Z" 
                fill={colors.primaryPurple} opacity="0.85"/>
        </g>
      </svg>
      <h2 className={`text-[${scale.text}px] leading-[${scale.text}px]`} style={{ color: colors.textDark }}>
        <span className="font-light">CE</span><span className="font-normal">Shield</span>
      </h2>
    </div>
  );
};

// Landing Page Component
function LandingPage({ onGetStarted }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'white' }}>
      {/* Navigation */}
      <nav 
        style={{
          position: 'fixed',
          top: 0,
          width: '100%',
          background: scrolled ? 'rgba(255, 255, 255, 0.98)' : 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          zIndex: 1000,
          padding: '1rem 2rem',
          boxShadow: scrolled ? '0 1px 3px rgba(0, 0, 0, 0.05)' : 'none',
          transition: 'all 0.3s ease'
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <CEShieldLogo showTagline={false} size="medium" />
          <button
            onClick={onGetStarted}
            style={{
              background: colors.primaryBlue,
              color: 'white',
              padding: '0.625rem 1.5rem',
              border: 'none',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#2563eb';
              e.target.style.transform = 'translateY(-1px)';
              e.target.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = colors.primaryBlue;
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = 'none';
            }}
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{
        minHeight: '90vh',
        display: 'flex',
        alignItems: 'center',
        background: 'linear-gradient(180deg, #f0f9ff 0%, #e0f2fe 100%)',
        paddingTop: '100px',
        position: 'relative'
      }}>
        <div style={{
          content: '',
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '100px',
          background: 'linear-gradient(180deg, transparent 0%, white 100%)'
        }}></div>
        
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '2rem',
          display: 'grid',
          gridTemplateColumns: window.innerWidth > 768 ? '1fr 1fr' : '1fr',
          gap: '4rem',
          alignItems: 'center',
          position: 'relative',
          zIndex: 1
        }}>
          <div>
            <h1 style={{
              fontSize: window.innerWidth > 768 ? '3rem' : '2rem',
              lineHeight: 1.2,
              marginBottom: '1.5rem',
              color: colors.textDark,
              fontWeight: 400
            }}>
              Never Worry About License Renewal Again.
            </h1>
            <p style={{
              fontSize: '0.875rem',
              color: colors.textGray,
              marginBottom: '2rem',
              letterSpacing: '1.5px',
              textTransform: 'uppercase'
            }}>
              Track Education. Protect Your License.
            </p>
            <p style={{
              fontSize: '1.125rem',
              color: colors.slateMedium,
              marginBottom: '2rem',
              lineHeight: 1.75
            }}>
              CE Shield is the smart continuing education tracker designed by clinicians, for clinicians. Stay compliant, organized, and ahead of deadlines with intelligent tracking for PT and OT professionals.
            </p>
            <button
              onClick={onGetStarted}
              style={{
                background: colors.primaryBlue,
                color: 'white',
                padding: '0.875rem 2rem',
                border: 'none',
                fontSize: '1.125rem',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#2563eb';
                e.target.style.transform = 'translateY(-1px)';
                e.target.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = colors.primaryBlue;
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }}
            >
              Start Today
            </button>
          </div>
          
          {window.innerWidth > 768 && (
            <div style={{
              background: 'white',
              padding: '2rem',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.08)',
              border: `1px solid ${colors.slateLight}`
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '1.5rem',
                paddingBottom: '1rem',
                borderBottom: `1px solid ${colors.slateLight}`
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

      {/* Features Section */}
      <section style={{ padding: '5rem 2rem', background: 'white' }}>
        <div style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto 4rem' }}>
          <h2 style={{ fontSize: '2.25rem', marginBottom: '1rem', color: colors.textDark, fontWeight: 400 }}>
            Everything You Need for CE Compliance
          </h2>
          <p style={{ color: colors.textGray }}>Built by healthcare professionals, for healthcare professionals</p>
        </div>
        
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '2rem'
        }}>
          {[
            { icon: '📍', title: 'State-Specific Requirements', desc: 'Automatically tracks your state\'s PT & OT requirements including all mandatory training categories. Stay compliant with changing regulations and new requirements as they emerge.', bg: colors.mutedTeal },
            { icon: '📊', title: 'Smart Category Tracking', desc: 'Monitor all CE categories with automatic limit warnings. Track self-study, teaching hours, clinical instruction, and mandatory requirements.', bg: colors.mutedPurple },
            { icon: '🔒', title: 'Secure Document Storage', desc: 'Keep all certificates in one encrypted, HIPAA-compliant vault. Upload PDFs and images, download reports for audits anytime.', bg: colors.lightBlue }
          ].map((feature, idx) => (
            <div key={idx} style={{
              padding: '2rem',
              transition: 'all 0.2s ease',
              border: `1px solid ${colors.slateLight}`,
              background: 'white'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.06)';
              e.currentTarget.style.borderColor = colors.primaryBlue;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.borderColor = colors.slateLight;
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                background: feature.bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.5rem',
                fontSize: '1.5rem'
              }}>
                {feature.icon}
              </div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: colors.textDark, fontWeight: 500 }}>
                {feature.title}
              </h3>
              <p style={{ color: colors.textGray, lineHeight: 1.6 }}>{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section style={{ padding: '5rem 2rem', background: colors.grayLight, textAlign: 'center' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '2.25rem', marginBottom: '1.5rem', color: colors.textDark, fontWeight: 400 }}>
            Ready to Protect Your License?
          </h2>
          <p style={{ color: colors.textGray, marginBottom: '2rem' }}>
            Join PTs and OTs who track their CE with confidence.
          </p>
          <button
            onClick={onGetStarted}
            style={{
              background: colors.primaryBlue,
              color: 'white',
              padding: '0.875rem 2rem',
              border: 'none',
              fontSize: '1.125rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#0891b2';
              e.target.style.transform = 'translateY(-1px)';
              e.target.style.boxShadow = '0 4px 12px rgba(6, 182, 212, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = colors.primaryBlue;
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = 'none';
            }}
          >
            Get Started
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: colors.slateDark, color: 'white', padding: '3rem 2rem 2rem', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '2rem' }}>
          <svg 
            width="44" 
            height="29" 
            viewBox="0 0 60 40" 
            xmlns="http://www.w3.org/2000/svg"
            className="flex-shrink-0"
          >
            <g transform="translate(0, 3)">
              <path d="M10 0 L10 20 Q10 28 25 32 Q40 28 40 20 L40 0 Z" 
                    fill={colors.lightBlue}/>
              <path d="M20 0 L20 20 Q20 28 35 32 Q50 28 50 20 L50 0 Z" 
                    fill={colors.primaryBlue} opacity="0.85"/>
              <path d="M30 0 L30 20 Q30 28 45 32 Q60 28 60 20 L60 0 Z" 
                    fill={colors.primaryPurple} opacity="0.85"/>
            </g>
          </svg>
          <h2 style={{ fontSize: '20px', lineHeight: '20px', color: 'white', marginLeft: '8px' }}>
            <span className="font-light">CE</span><span className="font-normal">Shield</span>
          </h2>
        </div>
        <div style={{ paddingTop: '2rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)', color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.875rem' }}>
          <p>© 2025 CE Shield. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

// Google Vision API key from environment variable
const GOOGLE_VISION_API_KEY = process.env.REACT_APP_GOOGLE_VISION_KEY || '';

// Simple ZIP file creation utility
const createZip = async (files) => {
  // ZIP file structure constants
  const LOCAL_FILE_HEADER = 0x04034b50;
  const CENTRAL_DIRECTORY_HEADER = 0x02014b50;
  const END_OF_CENTRAL_DIRECTORY = 0x06054b50;
  
  const encoder = new TextEncoder();
  const date = new Date();
  const dosDate = ((date.getFullYear() - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
  const dosTime = (date.getHours() << 11) | (date.getMinutes() << 5) | (date.getSeconds() >> 1);
  
  const fileDataArray = [];
  const centralDirectory = [];
  let offset = 0;
  
  // Process each file
  for (const file of files) {
    const nameBytes = encoder.encode(file.name);
    const contentBytes = file.content instanceof Uint8Array ? file.content : encoder.encode(file.content);
    
    // Create local file header
    const header = new ArrayBuffer(30);
    const headerView = new DataView(header);
    headerView.setUint32(0, LOCAL_FILE_HEADER, true);
    headerView.setUint16(4, 0x0014, true);
    headerView.setUint16(6, 0, true);
    headerView.setUint16(8, 0, true);
    headerView.setUint16(10, dosTime, true);
    headerView.setUint16(12, dosDate, true);
    headerView.setUint32(14, 0, true);
    headerView.setUint32(18, contentBytes.length, true);
    headerView.setUint32(22, contentBytes.length, true);
    headerView.setUint16(26, nameBytes.length, true);
    headerView.setUint16(28, 0, true);
    
    centralDirectory.push({
      offset,
      nameBytes,
      contentSize: contentBytes.length,
      dosTime,
      dosDate
    });
    
    fileDataArray.push(new Uint8Array(header));
    fileDataArray.push(nameBytes);
    fileDataArray.push(contentBytes);
    
    offset += header.byteLength + nameBytes.length + contentBytes.length;
  }
  
  // Create central directory
  const cdStart = offset;
  for (const entry of centralDirectory) {
    const cdHeader = new ArrayBuffer(46);
    const cdView = new DataView(cdHeader);
    cdView.setUint32(0, CENTRAL_DIRECTORY_HEADER, true);
    cdView.setUint16(4, 0x0014, true);
    cdView.setUint16(6, 0x0014, true);
    cdView.setUint16(8, 0, true);
    cdView.setUint16(10, 0, true);
    cdView.setUint16(12, entry.dosTime, true);
    cdView.setUint16(14, entry.dosDate, true);
    cdView.setUint32(16, 0, true);
    cdView.setUint32(20, entry.contentSize, true);
    cdView.setUint32(24, entry.contentSize, true);
    cdView.setUint16(28, entry.nameBytes.length, true);
    cdView.setUint16(30, 0, true);
    cdView.setUint16(32, 0, true);
    cdView.setUint16(34, 0, true);
    cdView.setUint16(36, 0, true);
    cdView.setUint32(38, 0, true);
    cdView.setUint32(42, entry.offset, true);
    
    fileDataArray.push(new Uint8Array(cdHeader));
    fileDataArray.push(entry.nameBytes);
    offset += cdHeader.byteLength + entry.nameBytes.length;
  }
  
  // Create end of central directory
  const eocd = new ArrayBuffer(22);
  const eocdView = new DataView(eocd);
  eocdView.setUint32(0, END_OF_CENTRAL_DIRECTORY, true);
  eocdView.setUint16(4, 0, true);
  eocdView.setUint16(6, 0, true);
  eocdView.setUint16(8, files.length, true);
  eocdView.setUint16(10, files.length, true);
  eocdView.setUint32(12, offset - cdStart, true);
  eocdView.setUint32(16, cdStart, true);
  eocdView.setUint16(20, 0, true);
  
  fileDataArray.push(new Uint8Array(eocd));
  
  // Combine all parts
  const totalSize = fileDataArray.reduce((sum, arr) => sum + arr.length, 0);
  const zipFile = new Uint8Array(totalSize);
  let position = 0;
  for (const arr of fileDataArray) {
    zipFile.set(arr, position);
    position += arr.length;
  }
  
  return zipFile;
};

// Auth Component with updated design
function AuthForm({ onSuccess }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!email || !password) return;
    
    setLoading(true);
    setError('');

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        if (data.user) {
          onSuccess(data.user);
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        if (data.user) {
          onSuccess(data.user);
        }
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: `linear-gradient(180deg, #f0f9ff 0%, #e0f2fe 100%)` }}>
      <div className="w-full max-w-md" style={{ background: 'white', padding: '2rem', boxShadow: '0 20px 40px rgba(0, 0, 0, 0.08)', border: `1px solid ${colors.slateLight}` }}>
        <div className="text-center mb-6">
          <div className="flex justify-center">
            <div className="flex items-center gap-2">
              <svg 
                width="54" 
                height="36" 
                viewBox="0 0 60 40" 
                xmlns="http://www.w3.org/2000/svg"
                className="flex-shrink-0"
              >
                <g transform="translate(0, 4)">
                  <path d="M10 0 L10 20 Q10 28 25 32 Q40 28 40 20 L40 0 Z" 
                        fill={colors.lightBlue}/>
                  <path d="M20 0 L20 20 Q20 28 35 32 Q50 28 50 20 L50 0 Z" 
                        fill={colors.primaryBlue} opacity="0.85"/>
                  <path d="M30 0 L30 20 Q30 28 45 32 Q60 28 60 20 L60 0 Z" 
                        fill={colors.primaryPurple} opacity="0.85"/>
                </g>
              </svg>
              <h1 style={{ fontSize: '30px', lineHeight: '30px', color: colors.textDark }}>
                <span className="font-light">CE</span><span className="font-normal">Shield</span>
              </h1>
            </div>
          </div>
          <p style={{ fontSize: '12px', letterSpacing: '1.5px', marginTop: '0.75rem', textTransform: 'uppercase', color: colors.textGray }}>
            Track Education. Protect Your License.
          </p>
        </div>
        </div>

        <div className="mb-6">
          <p className="text-center" style={{ color: colors.textGray }}>
            {isSignUp ? 'Create your account' : 'Sign in to your account'}
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block mb-2 text-sm font-medium" style={{ color: colors.textDark }}>
              <Mail className="inline w-4 h-4 mr-1" />
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 focus:outline-none focus:ring-2"
              style={{ 
                border: `1px solid ${colors.slateLight}`,
                background: colors.grayLight,
                focusRingColor: colors.primaryBlue
              }}
              required
            />
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium" style={{ color: colors.textDark }}>
              <Lock className="inline w-4 h-4 mr-1" />
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 pr-10 focus:outline-none focus:ring-2"
                style={{ 
                  border: `1px solid ${colors.slateLight}`,
                  background: colors.grayLight,
                  focusRingColor: colors.primaryBlue
                }}
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-2.5"
                style={{ color: colors.textGray }}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {error && (
            <div style={{ 
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#dc2626',
              padding: '0.75rem',
              fontSize: '0.875rem'
            }}>
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !email || !password}
            className="w-full py-2 px-4 flex items-center justify-center transition-all"
            style={{
              background: loading || !email || !password ? colors.slateMedium : colors.primaryBlue,
              color: 'white',
              border: 'none',
              fontWeight: 500,
              cursor: loading || !email || !password ? 'not-allowed' : 'pointer',
              opacity: loading || !email || !password ? 0.5 : 1
            }}
            onMouseEnter={(e) => {
              if (!loading && email && password) {
                e.target.style.background = '#2563eb';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading && email && password) {
                e.target.style.background = colors.primaryBlue;
              }
            }}
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                {isSignUp ? 'Create Account' : 'Sign In'}
              </>
            )}
          </button>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError('');
            }}
            className="text-sm"
            style={{ color: colors.primaryBlue, background: 'none', border: 'none', cursor: 'pointer' }}
          >
            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>
        </div>

        <div className="mt-6 pt-6" style={{ borderTop: `1px solid ${colors.slateLight}` }}>
          <p className="text-xs text-center" style={{ color: colors.textGray }}>
            Your data is securely stored and encrypted. We never share your information.
          </p>
        </div>
      </div>
    </div>
  );
}

// Main CE Tracker Component
export default function CETracker() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLanding, setShowLanding] = useState(true);
  
  // Check for existing session on mount
  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUser(user);
        setShowLanding(false);
      }
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setShowLanding(true);
    // Clear local data
    localStorage.removeItem('ce_tracker_user_profiles');
    localStorage.removeItem('ce_tracker_courses');
  };

  const handleGetStarted = () => {
    setShowLanding(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: colors.primaryBlue }} />
      </div>
    );
  }

  if (showLanding && !currentUser) {
    return <LandingPage onGetStarted={handleGetStarted} />;
  }

  if (!currentUser) {
    return <AuthForm onSuccess={setCurrentUser} />;
  }

  return <CETrackerDashboard user={currentUser} onSignOut={handleSignOut} />;
}

// CE Tracker Dashboard with updated design
function CETrackerDashboard({ user: authUser, onSignOut }) {
  // State management
  const [user, setUser] = useState({
    name: '',
    licenseType: '',
    licenseNumber: '',
    renewalDate: '',
    isFirstRenewal: false,
    state: 'IL'
  });

  const [profileComplete, setProfileComplete] = useState(false);
  const [courses, setCourses] = useState([]);
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [courseToDelete, setCourseToDelete] = useState(null);
  const [savingData, setSavingData] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  
  const [newCourse, setNewCourse] = useState({
    title: '',
    provider: '',
    date: '',
    hours: '',
    category: 'general',
    format: 'live',
    hasTest: false,
    certificate: null
  });

  const [isParsing, setIsParsing] = useState(false);

  // Load user data from Supabase on mount
  useEffect(() => {
    if (authUser) {
      loadUserData();
    }
  }, [authUser]);

  const loadUserData = async () => {
    setLoadingData(true);
    try {
      // Load user profile
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (profileData && !profileError) {
        setUser({
          name: profileData.name || '',
          licenseType: profileData.license_type || '',
          licenseNumber: profileData.license_number || '',
          renewalDate: profileData.renewal_date || '',
          isFirstRenewal: profileData.is_first_renewal || false,
          state: profileData.state || 'IL'
        });
        // Mark profile as complete if we have the required fields
        if (profileData.name && profileData.license_type && profileData.state) {
          setProfileComplete(true);
        }
      }

      // Load courses
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('*')
        .eq('user_id', authUser.id)
        .order('date', { ascending: false });

      if (coursesData && !coursesError) {
        setCourses(coursesData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      // Fallback to localStorage if Supabase fails
      const savedUser = localStorage.getItem('ceTrackerUser');
      const savedCourses = localStorage.getItem('ceTrackerCourses');
      if (savedUser) setUser(JSON.parse(savedUser));
      if (savedCourses) setCourses(JSON.parse(savedCourses));
    } finally {
      setLoadingData(false);
    }
  };

  // Save user profile to Supabase
  const saveUserProfile = async (userData) => {
    setSavingData(true);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          id: authUser.id,
          name: userData.name,
          license_type: userData.licenseType,
          license_number: userData.licenseNumber,
          renewal_date: userData.renewalDate,
          is_first_renewal: userData.isFirstRenewal,
          state: userData.state || 'IL',
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      
      // Also save to localStorage as backup
      localStorage.setItem('ceTrackerUser', JSON.stringify(userData));
      setProfileComplete(true);
      return true;
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Error saving profile. Please try again.');
      return false;
    } finally {
      setSavingData(false);
    }
  };

  // Define requirements based on state and license type
  const getRequirements = () => {
    if (user.state === 'IL') {
      if (user.licenseType === 'PT') {
        return {
          total: 40,
          mandatory: {
            ethics: 3,
            sexualHarassment: 1,
            culturalCompetency: 1,
            implicitBias: 1,
            dementia: 1
          },
          limits: {
            selfStudy: 30,
            teaching: 20,
            clinicalInstructor: 10,
            journalClubs: 5,
            inservices: 5,
            districtMeetings: 5,
            skillsCertification: 5
          }
        };
      } else if (user.licenseType === 'OT') {
        return {
          total: 24,
          mandatory: {
            ethics: 1,
            sexualHarassment: 1,
            culturalCompetency: 1,
            implicitBias: 1,
            dementia: 1
          },
          limits: {
            selfStudy: 12,
            teaching: 12,
            clinicalInstructor: 6,
            journalClubs: 3,
            inservices: 3,
            districtMeetings: 3,
            skillsCertification: 3
          }
        };
      }
    }
    return null;
  };

  // Calculate hours by category
  const calculateHours = () => {
    const hours = {
      total: 0,
      general: 0,
      ethics: 0,
      sexualHarassment: 0,
      culturalCompetency: 0,
      implicitBias: 0,
      dementia: 0,
      selfStudy: 0,
      teaching: 0,
      clinicalInstructor: 0,
      journalClubs: 0,
      inservices: 0,
      districtMeetings: 0,
      skillsCertification: 0
    };

    courses.forEach(course => {
      const courseHours = parseFloat(course.hours) || 0;
      hours.total += courseHours;
      
      if (hours[course.category] !== undefined) {
        hours[course.category] += courseHours;
      }
      
      if (course.format === 'selfStudy') {
        hours.selfStudy += courseHours;
      } else if (course.format === 'teaching') {
        hours.teaching += courseHours;
      }
    });

    return hours;
  };

  const hours = calculateHours();
  const requirements = getRequirements();

  // Check if approaching or exceeding limits
  const checkLimits = (category, currentHours) => {
    if (!requirements || !requirements.limits[category]) return 'ok';
    const limit = requirements.limits[category];
    if (currentHours >= limit) return 'exceeded';
    if (currentHours >= limit * 0.8) return 'warning';
    return 'ok';
  };

  // Parse certificate using Google Vision API
  const parseCertificate = async (file) => {
    setIsParsing(true);
    
    try {
      if (!GOOGLE_VISION_API_KEY) {
        alert('Google Vision API key is not configured. Please set the REACT_APP_GOOGLE_VISION_KEY environment variable.');
        setIsParsing(false);
        return null;
      }

      const reader = new FileReader();
      const base64 = await new Promise((resolve) => {
        reader.onloadend = () => {
          const base64String = reader.result.split(',')[1];
          resolve(base64String);
        };
        reader.readAsDataURL(file);
      });

      const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_VISION_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [{
            image: {
              content: base64
            },
            features: [{
              type: 'TEXT_DETECTION',
              maxResults: 1
            }]
          }]
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to call Google Vision API');
      }

      const result = await response.json();
      const extractedText = result.responses?.[0]?.fullTextAnnotation?.text || '';

      if (!extractedText) {
        throw new Error('No text found in image');
      }

      // Parse logic here (simplified for space)
      const parsedData = {
        title: '',
        provider: '',
        date: '',
        hours: '',
        category: 'general'
      };

      // Extract title
      const titleMatch = extractedText.match(/(?:has\s+)?(?:successfully\s+)?completed:?\s*(?:the\s+)?(?:course\s+)?(?:entitled\s+)?["']?([^"'\n]{5,100})["']?/i);
      if (titleMatch) {
        parsedData.title = titleMatch[1].trim();
      }

      // Extract hours
      const hoursMatch = extractedText.match(/(\d+\.?\d*)\s*(?:hours?|ceus?|ce\s*hours?)/i);
      if (hoursMatch) {
        parsedData.hours = hoursMatch[1];
      }

      setIsParsing(false);
      return parsedData;
      
    } catch (error) {
      console.error('Error parsing certificate:', error);
      setIsParsing(false);
      alert(`Error scanning certificate: ${error.message}`);
      return null;
    }
  };

  // Handle certificate upload
  const handleCertificateUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        e.target.value = '';
        return;
      }
      
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        alert('Please upload a PDF or image file (JPG, PNG)');
        e.target.value = '';
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = async () => {
        setNewCourse(prev => ({
          ...prev,
          certificate: {
            name: file.name,
            type: file.type,
            data: reader.result
          }
        }));

        // Only offer OCR scanning for images when adding a new course (not editing)
        if (!editingCourse && file.type !== 'application/pdf') {
          if (window.confirm('Would you like to scan this certificate to auto-fill the form fields?')) {
            const parsedData = await parseCertificate(file);
            if (parsedData) {
              setNewCourse(prev => ({
                ...prev,
                title: parsedData.title || prev.title,
                provider: parsedData.provider || prev.provider,
                date: parsedData.date || prev.date,
                hours: parsedData.hours || prev.hours,
                category: parsedData.category || prev.category
              }));
            }
          }
        }
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    }
  };

  // Add/Edit course with Supabase
  const handleAddCourse = async (e) => {
    e?.preventDefault?.();
    
    const hoursNum = parseFloat(newCourse.hours);
    if (isNaN(hoursNum) || hoursNum <= 0) {
      alert('Please enter valid hours');
      return;
    }

    if (newCourse.format === 'selfStudy' && !newCourse.hasTest) {
      alert('Self-study courses must include a test to count for CE');
      return;
    }

    setSavingData(true);
    try {
      const courseData = {
        user_id: authUser.id,
        title: newCourse.title,
        provider: newCourse.provider,
        date: newCourse.date,
        hours: hoursNum,
        category: newCourse.category,
        format: newCourse.format,
        has_test: newCourse.hasTest,
        certificate: newCourse.certificate,
        updated_at: new Date().toISOString()
      };

      if (editingCourse) {
        // Update existing course
        const { data, error } = await supabase
          .from('courses')
          .update(courseData)
          .eq('id', editingCourse.id)
          .select();

        if (error) throw error;
        
        setCourses(courses.map(c => 
          c.id === editingCourse.id ? data[0] : c
        ));
        setEditingCourse(null);
      } else {
        // Add new course
        const { data, error } = await supabase
          .from('courses')
          .insert([courseData])
          .select();

        if (error) throw error;
        
        setCourses([...courses, data[0]]);
      }

      // Reset form
      setNewCourse({
        title: '',
        provider: '',
        date: '',
        hours: '',
        category: 'general',
        format: 'live',
        hasTest: false,
        certificate: null
      });
      setShowAddCourse(false);
      
      // Save to localStorage as backup
      localStorage.setItem('ceTrackerCourses', JSON.stringify(courses));
    } catch (error) {
      console.error('Error saving course:', error);
      alert('Error saving course. Please try again.');
    } finally {
      setSavingData(false);
    }
  };

  // Edit course
  const editCourse = (course) => {
    setNewCourse({
      title: course.title,
      provider: course.provider,
      date: course.date,
      hours: course.hours.toString(),
      category: course.category,
      format: course.format,
      hasTest: course.has_test || false,
      certificate: course.certificate
    });
    setEditingCourse(course);
    setShowAddCourse(true);
  };

  // Delete course with Supabase
  const deleteCourse = async (courseId) => {
    setSavingData(true);
    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId);

      if (error) throw error;
      
      setCourses(prevCourses => prevCourses.filter(course => course.id !== courseId));
      setCourseToDelete(null);
      
      // Update localStorage backup
      localStorage.setItem('ceTrackerCourses', JSON.stringify(courses.filter(c => c.id !== courseId)));
    } catch (error) {
      console.error('Error deleting course:', error);
      alert('Error deleting course. Please try again.');
    } finally {
      setSavingData(false);
    }
  };

  const confirmDelete = (course) => {
    setCourseToDelete(course);
  };

  // Generate report with updated design
  const generateReport = async (certificatesOnly = false) => {
    try {
      const reportDate = new Date().toLocaleDateString();
      const reportContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CE Hours Report - ${user.name}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: ${colors.textDark};
      background: ${colors.grayLight};
      padding: 20px;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      padding: 40px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .header {
      border-bottom: 3px solid ${colors.primaryBlue};
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .logo-container {
      margin-bottom: 20px;
    }
    .logo-wrapper {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 4px;
    }
    .logo-text {
      font-size: 36px;
      line-height: 36px;
      color: ${colors.textDark};
      vertical-align: middle;
    }
    .tagline {
      font-size: 10px;
      color: ${colors.textGray};
      letter-spacing: 1.5px;
      text-transform: uppercase;
    }
    h1 { 
      color: ${colors.textDark};
      margin-bottom: 10px;
      font-size: 28px;
      font-weight: 400;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 30px;
      padding: 20px;
      background: ${colors.grayLight};
      border: 1px solid ${colors.slateLight};
    }
    .info-item {
      display: flex;
      flex-direction: column;
    }
    .info-label {
      font-size: 12px;
      color: ${colors.textGray};
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }
    .info-value {
      font-size: 16px;
      font-weight: 600;
      color: ${colors.textDark};
    }
    .progress-section {
      margin-bottom: 30px;
    }
    .progress-bar {
      width: 100%;
      height: 30px;
      background: ${colors.slateLight};
      overflow: hidden;
      position: relative;
      margin: 10px 0;
    }
    .progress-fill {
      height: 100%;
      background: ${colors.primaryBlue};
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      min-width: fit-content;
      padding: 0 15px;
    }
    .requirements-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin: 20px 0;
    }
    .requirement-item {
      padding: 15px;
      background: ${colors.grayLight};
      border-left: 4px solid ${colors.primaryBlue};
    }
    .requirement-complete {
      border-left-color: #10b981;
      background: #f0fdf4;
    }
    .requirement-incomplete {
      border-left-color: #ef4444;
      background: #fef2f2;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }
    th {
      background: ${colors.slateLight};
      padding: 12px;
      text-align: left;
      font-weight: 600;
      color: ${colors.slateMedium};
      border-bottom: 2px solid #e2e8f0;
    }
    td {
      padding: 12px;
      border-bottom: 1px solid #e2e8f0;
    }
    tr:hover {
      background: ${colors.grayLight};
    }
    .certificate-badge {
      display: inline-block;
      padding: 2px 8px;
      background: #10b981;
      color: white;
      font-size: 12px;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
      text-align: center;
      color: ${colors.textGray};
      font-size: 14px;
    }
    .alert {
      padding: 15px;
      margin-bottom: 20px;
    }
    .alert-info {
      background: ${colors.lightBlue};
      border-left: 4px solid ${colors.primaryBlue};
      color: ${colors.textDark};
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 15px;
      margin: 20px 0;
    }
    .stat-card {
      text-align: center;
      padding: 20px;
      background: ${colors.grayLight};
      border: 1px solid ${colors.slateLight};
    }
    .stat-value {
      font-size: 32px;
      font-weight: bold;
      color: ${colors.primaryBlue};
    }
    .stat-label {
      font-size: 14px;
      color: ${colors.textGray};
      margin-top: 5px;
    }
    @media print {
      body { background: white; padding: 0; }
      .container { box-shadow: none; padding: 20px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo-container">
        <div class="logo-wrapper">
          <svg width="54" height="36" viewBox="0 0 60 40" xmlns="http://www.w3.org/2000/svg">
            <g transform="translate(0, 4)">
              <path d="M10 0 L10 20 Q10 28 25 32 Q40 28 40 20 L40 0 Z" fill="${colors.lightBlue}"/>
              <path d="M20 0 L20 20 Q20 28 35 32 Q50 28 50 20 L50 0 Z" fill="${colors.primaryBlue}" opacity="0.85"/>
              <path d="M30 0 L30 20 Q30 28 45 32 Q60 28 60 20 L60 0 Z" fill="${colors.primaryPurple}" opacity="0.85"/>
            </g>
          </svg>
          <div class="logo-text"><span style="font-weight: 300;">CE</span><span style="font-weight: 400;">Shield</span></div>
        </div>
        <div class="tagline">TRACK EDUCATION. PROTECT YOUR LICENSE.</div>
      </div>
      <h1>${user.state} ${user.licenseType} Continuing Education Report</h1>
      <p style="color: ${colors.textGray}; margin-top: 10px;">Generated on ${reportDate}</p>
    </div>

    <div class="info-grid">
      <div class="info-item">
        <span class="info-label">Name</span>
        <span class="info-value">${user.name}</span>
      </div>
      <div class="info-item">
        <span class="info-label">State</span>
        <span class="info-value">${user.state === 'IL' ? 'Illinois' : user.state}</span>
      </div>
      <div class="info-item">
        <span class="info-label">License Type</span>
        <span class="info-value">${user.licenseType === 'PT' ? 'Physical Therapist' : 'Occupational Therapist'}</span>
      </div>
      <div class="info-item">
        <span class="info-label">License Number</span>
        <span class="info-value">${user.licenseNumber}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Renewal Date</span>
        <span class="info-value">${new Date(user.renewalDate).toLocaleDateString()}</span>
      </div>
    </div>

    ${user.isFirstRenewal ? `
    <div class="alert alert-info">
      <strong>First Renewal - CE Exempt</strong><br>
      No continuing education requirements needed for your first renewal.
    </div>
    ` : ''}

    <div class="progress-section">
      <h2 style="color: ${colors.textDark}; margin-bottom: 20px; font-weight: 400;">Overall Progress</h2>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">${hours.total}</div>
          <div class="stat-label">Hours Completed</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${requirements?.total || 0}</div>
          <div class="stat-label">Hours Required</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${Math.max(0, (requirements?.total || 0) - hours.total)}</div>
          <div class="stat-label">Hours Remaining</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${getDaysUntilRenewal() || 'N/A'}</div>
          <div class="stat-label">Days Until Renewal</div>
        </div>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${Math.min((hours.total / (requirements?.total || 1)) * 100, 100)}%">
          ${Math.round((hours.total / (requirements?.total || 1)) * 100)}% Complete
        </div>
      </div>
    </div>

    <div class="requirements-section">
      <h2 style="color: ${colors.textDark}; margin-bottom: 20px; font-weight: 400;">Mandatory Requirements</h2>
      <div class="requirements-grid">
        ${Object.entries(requirements?.mandatory || {}).map(([key, required]) => {
          if (required === 0) return '';
          const completed = hours[key] || 0;
          const isComplete = completed >= required;
          return `
            <div class="requirement-item ${isComplete ? 'requirement-complete' : 'requirement-incomplete'}">
              <strong>${key.replace(/([A-Z])/g, ' $1').trim()}</strong><br>
              <span style="font-size: 20px; font-weight: bold;">${completed}/${required}</span> hours
              ${key === 'culturalCompetency' ? '<br><small>(NEW 2025)</small>' : ''}
            </div>
          `;
        }).join('')}
      </div>
    </div>

    <div class="courses-section">
      <h2 style="color: ${colors.textDark}; margin-bottom: 20px; font-weight: 400;">Completed Courses</h2>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Course Title</th>
            <th>Provider</th>
            <th>Category</th>
            <th>Hours</th>
            <th>Documentation</th>
          </tr>
        </thead>
        <tbody>
          ${courses.sort((a, b) => new Date(b.date) - new Date(a.date)).map(course => `
            <tr>
              <td>${new Date(course.date).toLocaleDateString()}</td>
              <td>${course.title}</td>
              <td>${course.provider}</td>
              <td>${course.category.replace(/([A-Z])/g, ' $1').trim()}</td>
              <td style="text-align: center;">${course.hours}</td>
              <td>${course.certificate ? '<span class="certificate-badge">✓ On File</span>' : '-'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <p style="margin-top: 10px; color: ${colors.textGray}; font-size: 14px;">
        Total Courses: ${courses.length} | Total Hours: ${hours.total}
      </p>
    </div>

    <div class="footer">
      <p>This report was generated from CE Shield.</p>
      <p>Please retain this report and all certificates for your records.</p>
      <p style="margin-top: 10px; font-weight: 600;">
        Report Date: ${reportDate} | License Renewal: ${new Date(user.renewalDate).toLocaleDateString()}
      </p>
    </div>
  </div>
</body>
</html>
      `;

      const fileName = `CE_Report_${user.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.html`;

      if (!certificatesOnly) {
        // Download HTML report directly
        const blob = new Blob([reportContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(url);
        return;
      }

      // Create ZIP with certificates only
      try {
        const files = [];
        let certificateCount = 0;
        
        // Add certificates to ZIP
        courses.forEach((course, index) => {
          if (course.certificate) {
            certificateCount++;
            const base64Data = course.certificate.data.split(',')[1];
            const binaryData = atob(base64Data);
            const bytes = new Uint8Array(binaryData.length);
            for (let i = 0; i < binaryData.length; i++) {
              bytes[i] = binaryData.charCodeAt(i);
            }
            
            const extension = course.certificate.name.split('.').pop();
            const courseTitle = course.title.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
            const courseDate = new Date(course.date).toISOString().split('T')[0];
            files.push({
              name: `${courseDate}_${courseTitle}.${extension}`,
              content: bytes
            });
          }
        });

        if (certificateCount === 0) {
          alert('No certificates or documentation found to export.');
          return;
        }

        // Create ZIP file
        const zipData = await createZip(files);
        
        // Download ZIP file
        const blob = new Blob([zipData], { type: 'application/zip' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `CE_Certificates_${user.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.zip`;
        link.click();
        URL.revokeObjectURL(url);
        
        alert(`Successfully exported ${certificateCount} certificate(s)/document(s)`);
      } catch (error) {
        console.error('Error creating certificates ZIP:', error);
        alert('Error creating certificates ZIP. Please try downloading individual certificates from the course list.');
      }
      
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Error generating report. Please try again.');
    }
  };

  const getDaysUntilRenewal = () => {
    if (!user.renewalDate) return null;
    const renewal = new Date(user.renewalDate);
    const today = new Date();
    const diff = renewal - today;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const daysUntilRenewal = getDaysUntilRenewal();

  // Loading state
  if (loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: colors.primaryBlue }} />
      </div>
    );
  }

  // Setup screen with updated design
  if (!profileComplete) {
    return (
      <div className="min-h-screen p-4" style={{ background: colors.grayLight }}>
        <div className="max-w-md mx-auto mt-10">
          <div style={{ background: 'white', padding: '2rem', boxShadow: '0 10px 30px rgba(0, 0, 0, 0.06)', border: `1px solid ${colors.slateLight}` }}>
            <div className="flex justify-between items-center mb-6">
              <CEShieldLogo showTagline={false} size="medium" />
              <button
                onClick={onSignOut}
                style={{ color: colors.textGray, background: 'none', border: 'none', cursor: 'pointer' }}
                title="Sign Out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-4 p-3" style={{ background: colors.lightBlue }}>
              <p className="text-sm" style={{ color: colors.textDark }}>
                <User className="inline w-4 h-4 mr-1" />
                Signed in as: {authUser.email}
              </p>
            </div>

            <div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2" style={{ color: colors.textDark }}>
                  Select Your State
                </label>
                <div className="relative">
                  <select
                    value={user.state || ''}
                    onChange={(e) => setUser({...user, state: e.target.value})}
                    className="w-full px-3 py-2 appearance-none focus:outline-none focus:ring-2"
                    style={{ 
                      border: `1px solid ${colors.slateLight}`,
                      background: colors.grayLight,
                      focusRingColor: colors.primaryBlue
                    }}
                  >
                    <option value="">Choose a state</option>
                    <option value="IL">Illinois</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <ChevronDown className="w-5 h-5" style={{ color: colors.textGray }} />
                  </div>
                </div>
                <p className="text-xs mt-1" style={{ color: colors.textGray }}>
                  Currently supporting Illinois. More states coming soon!
                </p>
              </div>

              {user.state && (
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2" style={{ color: colors.textDark }}>
                    Select Your License Type
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setUser({...user, licenseType: 'PT'})}
                      className="p-4 transition-all"
                      style={{
                        border: `2px solid ${user.licenseType === 'PT' ? colors.primaryBlue : colors.slateLight}`,
                        background: user.licenseType === 'PT' ? colors.lightBlue : 'white',
                        cursor: 'pointer'
                      }}
                    >
                      <div className="font-semibold">PT</div>
                      <div className="text-sm" style={{ color: colors.textGray }}>Physical Therapist</div>
                      <div className="text-xs mt-1" style={{ color: colors.textGray }}>
                        {user.state === 'IL' ? '40 hours/2 years' : 'Requirements vary'}
                      </div>
                    </button>
                    <button
                      onClick={() => setUser({...user, licenseType: 'OT'})}
                      className="p-4 transition-all"
                      style={{
                        border: `2px solid ${user.licenseType === 'OT' ? colors.primaryBlue : colors.slateLight}`,
                        background: user.licenseType === 'OT' ? colors.lightBlue : 'white',
                        cursor: 'pointer'
                      }}
                    >
                      <div className="font-semibold">OT</div>
                      <div className="text-sm" style={{ color: colors.textGray }}>Occupational Therapist</div>
                      <div className="text-xs mt-1" style={{ color: colors.textGray }}>
                        {user.state === 'IL' ? '24 hours/2 years' : 'Requirements vary'}
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {user.state && user.licenseType && (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2" style={{ color: colors.textDark }}>
                      Your Name
                    </label>
                    <input
                      type="text"
                      value={user.name}
                      onChange={(e) => setUser({...user, name: e.target.value})}
                      className="w-full px-3 py-2 focus:outline-none focus:ring-2"
                      style={{ 
                        border: `1px solid ${colors.slateLight}`,
                        background: colors.grayLight,
                        focusRingColor: colors.primaryBlue
                      }}
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2" style={{ color: colors.textDark }}>
                      {user.state} License Number
                    </label>
                    <input
                      type="text"
                      value={user.licenseNumber}
                      onChange={(e) => setUser({...user, licenseNumber: e.target.value})}
                      className="w-full px-3 py-2 focus:outline-none focus:ring-2"
                      style={{ 
                        border: `1px solid ${colors.slateLight}`,
                        background: colors.grayLight,
                        focusRingColor: colors.primaryBlue
                      }}
                      placeholder={`Enter your ${user.state} license number`}
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2" style={{ color: colors.textDark }}>
                      Renewal Date
                    </label>
                    <input
                      type="date"
                      value={user.renewalDate}
                      onChange={(e) => setUser({...user, renewalDate: e.target.value})}
                      className="w-full px-3 py-2 focus:outline-none focus:ring-2"
                      style={{ 
                        border: `1px solid ${colors.slateLight}`,
                        background: colors.grayLight,
                        focusRingColor: colors.primaryBlue
                      }}
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={user.isFirstRenewal}
                        onChange={(e) => setUser({...user, isFirstRenewal: e.target.checked})}
                        className="mr-2"
                      />
                      <span className="text-sm">This is my first renewal (CE exempt)</span>
                    </label>
                  </div>

                  <button
                    onClick={() => saveUserProfile(user)}
                    className="w-full py-2 px-4 transition-all"
                    style={{
                      background: (!user.name || !user.licenseNumber || !user.renewalDate) ? colors.slateMedium : colors.primaryBlue,
                      color: 'white',
                      border: 'none',
                      fontWeight: 500,
                      cursor: (!user.name || !user.licenseNumber || !user.renewalDate) ? 'not-allowed' : 'pointer',
                      opacity: (!user.name || !user.licenseNumber || !user.renewalDate) ? 0.5 : 1
                    }}
                    disabled={!user.name || !user.licenseNumber || !user.renewalDate}
                  >
                    Continue
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main dashboard with updated design
  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #f0f9ff 0%, #e0f2fe 100%)' }}>
      <div className="max-w-7xl mx-auto p-4">
        {/* Header with updated design */}
        <div className="mb-6" style={{ background: 'white', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)', border: `1px solid ${colors.slateLight}` }}>
          <div className="flex justify-between items-start">
            <div style={{ textAlign: 'left' }}>
              <CEShieldLogo showTagline={true} size="medium" />
              <p className="mt-2 text-xs" style={{ color: colors.textGray, fontSize: '0.75rem' }}>
                {user.name} • {user.state} {user.licenseType} License #{user.licenseNumber}
              </p>
            </div>
            <div className="flex items-start gap-4">
              <button
                onClick={() => setShowSettings(true)}
                style={{ color: colors.textGray, background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem' }}
                title="Settings"
              >
                <Settings className="w-5 h-5" />
              </button>
              <button
                onClick={onSignOut}
                style={{ color: colors.textGray, background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem' }}
                title="Sign Out"
              >
                <LogOut className="w-5 h-5" />
              </button>
              <div className="text-right">
                {daysUntilRenewal !== null && (
                  <div className="text-lg font-semibold" style={{ color: daysUntilRenewal < 90 ? '#dc2626' : colors.textDark }}>
                    <Clock className="inline-block w-5 h-5 mr-1" />
                    {daysUntilRenewal} days until renewal
                  </div>
                )}
                <p className="text-sm" style={{ color: colors.textGray }}>
                  Renewal: {new Date(user.renewalDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Save indicator */}
        {savingData && (
          <div className="fixed top-4 right-4 px-4 py-2 flex items-center z-50" style={{ background: colors.primaryBlue, color: 'white', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)' }}>
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            Saving...
          </div>
        )}

        {/* First Renewal Notice */}
        {user.isFirstRenewal && (
          <div className="p-4 mb-6" style={{ background: '#f0fdf4', border: '1px solid #86efac' }}>
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 mr-2" style={{ color: '#10b981' }} />
              <span style={{ color: '#166534' }}>
                First renewal - No CE requirements needed!
              </span>
            </div>
          </div>
        )}

        {/* Cultural Competency Alert */}
        {user.state === 'IL' && !user.isFirstRenewal && hours.culturalCompetency === 0 && (
          <div className="p-4 mb-6" style={{ background: colors.lightBlue, border: `1px solid ${colors.primaryBlue}` }}>
            <div className="flex items-start">
              <Info className="w-5 h-5 mr-2 mt-0.5" style={{ color: colors.primaryBlue }} />
              <div style={{ color: colors.textDark }}>
                <div className="font-semibold">NEW 2025 Illinois Requirement!</div>
                <div className="text-sm">
                  Cultural competency training (1 hour) is now required. You have 3 renewal cycles to complete it, but you can start now.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Progress Overview with updated design */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Total Progress */}
          <div style={{ background: 'white', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)', border: `1px solid ${colors.slateLight}` }}>
            <h2 className="text-lg font-semibold mb-4" style={{ color: colors.textDark }}>Overall Progress</h2>
            <div className="relative pt-1">
              <div className="flex mb-2 items-center justify-between">
                <div>
                  <span className="text-xs font-semibold inline-block py-1 px-2 uppercase" style={{ background: colors.lightBlue, color: colors.primaryBlue }}>
                    Total CE Hours
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold inline-block" style={{ color: colors.primaryBlue }}>
                    {hours.total} / {requirements?.total || 0}
                  </span>
                </div>
              </div>
              <div className="overflow-hidden h-2 mb-4 text-xs flex" style={{ background: colors.slateLight }}>
                <div 
                  style={{ 
                    width: `${Math.min((hours.total / (requirements?.total || 1)) * 100, 100)}%`,
                    background: colors.primaryBlue
                  }}
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center"
                />
              </div>
            </div>
          </div>

          {/* Mandatory Requirements */}
          <div style={{ background: 'white', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)', border: `1px solid ${colors.slateLight}` }}>
            <h2 className="text-lg font-semibold mb-4" style={{ color: colors.textDark }}>Mandatory Requirements</h2>
            <div className="space-y-2">
              {Object.entries(requirements?.mandatory || {}).map(([key, required]) => {
                if (required === 0) return null;
                const completed = hours[key] || 0;
                const isComplete = completed >= required;
                const isNew2025 = key === 'culturalCompetency';
                
                return (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-sm capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                      {isNew2025 && <span className="text-xs ml-1" style={{ color: colors.primaryBlue }}>(NEW 2025)</span>}
                    </span>
                    <div className="flex items-center">
                      <span className="text-sm font-medium mr-2" style={{ color: isComplete ? '#10b981' : '#dc2626' }}>
                        {completed}/{required}
                      </span>
                      {isComplete ? (
                        <CheckCircle className="w-4 h-4" style={{ color: '#10b981' }} />
                      ) : (
                        <AlertCircle className="w-4 h-4" style={{ color: '#dc2626' }} />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Category Limits with updated design */}
        <div className="mb-6" style={{ background: 'white', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)', border: `1px solid ${colors.slateLight}` }}>
          <h2 className="text-lg font-semibold mb-4" style={{ color: colors.textDark }}>Category Limits</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(requirements?.limits || {}).map(([category, limit]) => {
              const current = hours[category] || 0;
              const status = checkLimits(category, current);
              
              return (
                <div key={category} className="text-center">
                  <div className="text-xs capitalize" style={{ color: colors.textGray }}>
                    {category.replace(/([A-Z])/g, ' $1').trim()}
                  </div>
                  <div className="text-lg font-semibold" style={{ 
                    color: status === 'exceeded' ? '#dc2626' : 
                           status === 'warning' ? '#f59e0b' : 
                           colors.textDark
                  }}>
                    {current}/{limit}
                  </div>
                  {status === 'exceeded' && (
                    <div className="text-xs" style={{ color: '#dc2626' }}>Limit exceeded!</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Add Course Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowAddCourse(true)}
            className="px-4 py-2 flex items-center transition-all"
            style={{
              background: colors.primaryBlue,
              color: 'white',
              border: 'none',
              fontWeight: 500,
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#2563eb';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = colors.primaryBlue;
            }}
          >
            <Plus className="w-5 h-5 mr-2" />
            Add CE Course
          </button>
        </div>

        {/* Course List with updated design */}
        <div style={{ background: 'white', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)', border: `1px solid ${colors.slateLight}` }}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold" style={{ color: colors.textDark }}>CE Courses</h2>
            <div className="flex gap-2">
              <button
                onClick={() => generateReport(false)}
                className="flex items-center text-sm"
                style={{ color: colors.primaryBlue, background: 'none', border: 'none', cursor: 'pointer' }}
                title="Download HTML report"
              >
                <Download className="w-4 h-4 mr-1" />
                HTML Report
              </button>
              <button
                onClick={() => generateReport(true)}
                className="flex items-center text-sm"
                style={{ color: colors.primaryBlue, background: 'none', border: 'none', cursor: 'pointer' }}
                title="Download all certificates/documentation as ZIP"
              >
                <Download className="w-4 h-4 mr-1" />
                Certificates (ZIP)
              </button>
            </div>
          </div>
          
          {courses.length === 0 ? (
            <p className="text-center py-8" style={{ color: colors.textGray }}>
              No courses added yet. Click "Add CE Course" to get started.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${colors.slateLight}` }}>
                    <th className="text-left py-2 px-2 text-sm font-medium" style={{ color: colors.textGray }}>Date</th>
                    <th className="text-left py-2 px-2 text-sm font-medium" style={{ color: colors.textGray }}>Course</th>
                    <th className="text-left py-2 px-2 text-sm font-medium" style={{ color: colors.textGray }}>Provider</th>
                    <th className="text-left py-2 px-2 text-sm font-medium" style={{ color: colors.textGray }}>Category</th>
                    <th className="text-center py-2 px-2 text-sm font-medium" style={{ color: colors.textGray }}>Hours</th>
                    <th className="text-center py-2 px-2 text-sm font-medium" style={{ color: colors.textGray }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.sort((a, b) => new Date(b.date) - new Date(a.date)).map(course => (
                    <tr key={course.id} style={{ borderBottom: `1px solid ${colors.slateLight}` }}>
                      <td className="py-2 px-2 text-sm">{new Date(course.date).toLocaleDateString()}</td>
                      <td className="py-2 px-2 text-sm">
                        <div>{course.title}</div>
                        <div className="flex items-center gap-2">
                          {course.format === 'selfStudy' && (
                            <span className="text-xs" style={{ color: colors.textGray }}>Self-study</span>
                          )}
                          {course.certificate && (
                            <span className="text-xs flex items-center" style={{ color: '#10b981' }}>
                              <FileText className="w-3 h-3 mr-1" />
                              Certificate
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2 px-2 text-sm">{course.provider}</td>
                      <td className="py-2 px-2 text-sm capitalize">
                        {course.category === 'culturalCompetency' && (
                          <span className="text-xs" style={{ color: colors.primaryBlue }}>(NEW) </span>
                        )}
                        {course.category.replace(/([A-Z])/g, ' $1').trim()}
                      </td>
                      <td className="py-2 px-2 text-sm text-center">{course.hours}</td>
                      <td className="py-2 px-2 text-sm text-center">
                        <div className="flex items-center justify-center gap-1">
                          {course.certificate && (
                            <button
                              type="button"
                              onClick={() => {
                                const link = document.createElement('a');
                                link.href = course.certificate.data;
                                link.download = course.certificate.name;
                                link.click();
                              }}
                              className="p-1"
                              style={{ color: colors.primaryBlue, background: 'none', border: 'none', cursor: 'pointer' }}
                              title="Download Certificate"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => editCourse(course)}
                            className="p-1"
                            style={{ color: colors.textGray, background: 'none', border: 'none', cursor: 'pointer' }}
                            title="Edit Course"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => confirmDelete(course)}
                            className="p-1"
                            style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer' }}
                            title="Delete Course"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        {/* Modals with updated design */}
        {showAddCourse && (
          <AddCourseModal />
        )}
        
        {courseToDelete && (
          <DeleteConfirmationModal />
        )}
        
        {showSettings && (
          <SettingsModal />
        )}
      </div>
    </div>
  );

  // Modal Components with updated design
  function AddCourseModal() {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="w-full max-w-md max-h-[90vh] overflow-y-auto" style={{ background: 'white', padding: '2rem', boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)' }}>
          <h3 className="text-lg font-semibold mb-4" style={{ color: colors.textDark }}>
            {editingCourse ? 'Edit CE Course' : 'Add CE Course'}
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: colors.textDark }}>
                Upload Certificate/Documentation <span className="text-xs" style={{ color: colors.textGray }}>(PDF, JPG, PNG)</span>
              </label>
              <div className="space-y-2">
                <div className="relative">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleCertificateUpload}
                    className="w-full px-3 py-2 text-sm"
                    style={{ border: `1px solid ${colors.slateLight}`, background: colors.grayLight }}
                    disabled={isParsing}
                  />
                  {isParsing && (
                    <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(255, 255, 255, 0.9)' }}>
                      <div className="text-center">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" style={{ color: colors.primaryBlue }} />
                        <div className="text-sm" style={{ color: colors.primaryBlue }}>Scanning certificate...</div>
                      </div>
                    </div>
                  )}
                </div>
                {newCourse.certificate && (
                  <div className="flex items-center justify-between p-2" style={{ background: colors.grayLight }}>
                    <span className="text-sm truncate" style={{ color: colors.textGray }}>
                      <FileText className="inline w-4 h-4 mr-1" />
                      {newCourse.certificate.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => setNewCourse(prev => ({...prev, certificate: null}))}
                      className="text-sm"
                      style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      Remove
                    </button>
                  </div>
                )}
                <p className="text-xs" style={{ color: colors.textGray }}>
                  Upload any supporting documentation: certificates, attendance lists, teaching records, etc.
                  {!editingCourse && ' • Images can be scanned for auto-fill.'}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: colors.textDark }}>
                Course Title *
              </label>
              <input
                type="text"
                value={newCourse.title}
                onChange={(e) => setNewCourse(prev => ({...prev, title: e.target.value}))}
                className="w-full px-3 py-2"
                style={{ border: `1px solid ${colors.slateLight}`, background: colors.grayLight }}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: colors.textDark }}>
                Provider Name *
              </label>
              <input
                type="text"
                value={newCourse.provider}
                onChange={(e) => setNewCourse(prev => ({...prev, provider: e.target.value}))}
                className="w-full px-3 py-2"
                style={{ border: `1px solid ${colors.slateLight}`, background: colors.grayLight }}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: colors.textDark }}>
                Date Completed *
              </label>
              <input
                type="date"
                value={newCourse.date}
                onChange={(e) => setNewCourse(prev => ({...prev, date: e.target.value}))}
                className="w-full px-3 py-2"
                style={{ border: `1px solid ${colors.slateLight}`, background: colors.grayLight }}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: colors.textDark }}>
                Hours * <span className="text-xs" style={{ color: colors.textGray }}>(1 hour = 50 minutes)</span>
              </label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                value={newCourse.hours}
                onChange={(e) => setNewCourse(prev => ({...prev, hours: e.target.value}))}
                className="w-full px-3 py-2"
                style={{ border: `1px solid ${colors.slateLight}`, background: colors.grayLight }}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: colors.textDark }}>
                Category *
              </label>
              <select
                value={newCourse.category}
                onChange={(e) => setNewCourse(prev => ({...prev, category: e.target.value}))}
                className="w-full px-3 py-2"
                style={{ border: `1px solid ${colors.slateLight}`, background: colors.grayLight }}
              >
                <option value="general">General CE</option>
                <option value="ethics">Ethics</option>
                <option value="sexualHarassment">Sexual Harassment Prevention</option>
                <option value="culturalCompetency">Cultural Competency (NEW 2025)</option>
                <option value="implicitBias">Implicit Bias</option>
                <option value="dementia">Alzheimer's Disease & Dementia</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: colors.textDark }}>
                Format *
              </label>
              <select
                value={newCourse.format}
                onChange={(e) => setNewCourse(prev => ({...prev, format: e.target.value}))}
                className="w-full px-3 py-2"
                style={{ border: `1px solid ${colors.slateLight}`, background: colors.grayLight }}
              >
                <option value="live">Live/In-Person</option>
                <option value="selfStudy">Self-Study/Online</option>
                <option value="teaching">Teaching</option>
                <option value="clinicalInstructor">Clinical Instructor</option>
                <option value="journalClubs">Journal Club</option>
                <option value="inservices">Departmental Inservice</option>
                <option value="districtMeetings">IPTA District Meeting</option>
                <option value="skillsCertification">Skills Certification (CPR, etc.)</option>
              </select>
            </div>

            {newCourse.format === 'selfStudy' && (
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newCourse.hasTest}
                    onChange={(e) => setNewCourse(prev => ({...prev, hasTest: e.target.checked}))}
                    className="mr-2"
                  />
                  <span className="text-sm">Course included a test (required for self-study)</span>
                </label>
              </div>
            )}

            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={() => {
                  setShowAddCourse(false);
                  setEditingCourse(null);
                  setNewCourse({
                    title: '',
                    provider: '',
                    date: '',
                    hours: '',
                    category: 'general',
                    format: 'live',
                    hasTest: false,
                    certificate: null
                  });
                }}
                className="px-4 py-2"
                style={{ color: colors.textDark, background: colors.slateLight, border: 'none', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddCourse}
                className="px-4 py-2"
                style={{ background: colors.primaryBlue, color: 'white', border: 'none', cursor: 'pointer' }}
              >
                {editingCourse ? 'Update Course' : 'Add Course'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function DeleteConfirmationModal() {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="w-full max-w-md" style={{ background: 'white', padding: '2rem', boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)' }}>
          <h3 className="text-lg font-semibold mb-4" style={{ color: colors.textDark }}>Confirm Deletion</h3>
          <p className="mb-6" style={{ color: colors.textGray }}>
            Are you sure you want to delete the course "{courseToDelete.title}"? This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setCourseToDelete(null)}
              className="px-4 py-2"
              style={{ color: colors.textDark, background: colors.slateLight, border: 'none', cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              onClick={() => deleteCourse(courseToDelete.id)}
              className="px-4 py-2"
              style={{ background: '#dc2626', color: 'white', border: 'none', cursor: 'pointer' }}
            >
              Delete Course
            </button>
          </div>
        </div>
      </div>
    );
  }

  function SettingsModal() {
    const [localUser, setLocalUser] = useState({...user});
    
    const handleSave = async () => {
      const saved = await saveUserProfile(localUser);
      if (saved) {
        setUser(localUser);
        setShowSettings(false);
        alert('Settings saved successfully!');
      }
    };
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="w-full max-w-md" style={{ background: 'white', padding: '2rem', boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)' }}>
          <h3 className="text-lg font-semibold mb-4" style={{ color: colors.textDark }}>Profile Settings</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: colors.textDark }}>
                State
              </label>
              <select
                value={localUser.state || 'IL'}
                onChange={(e) => setLocalUser({...localUser, state: e.target.value})}
                className="w-full px-3 py-2"
                style={{ border: `1px solid ${colors.slateLight}`, background: colors.grayLight }}
              >
                <option value="IL">Illinois</option>
              </select>
              <p className="text-xs mt-1" style={{ color: colors.textGray }}>
                Currently supporting Illinois. More states coming soon!
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: colors.textDark }}>
                License Type
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => {
                    if (localUser.licenseType !== 'PT' && courses.length > 0) {
                      if (window.confirm('Changing license type will update all requirements. Continue?')) {
                        setLocalUser({...localUser, licenseType: 'PT'});
                      }
                    } else {
                      setLocalUser({...localUser, licenseType: 'PT'});
                    }
                  }}
                  className="p-3"
                  style={{
                    border: `2px solid ${localUser.licenseType === 'PT' ? colors.primaryBlue : colors.slateLight}`,
                    background: localUser.licenseType === 'PT' ? colors.lightBlue : 'white',
                    cursor: 'pointer'
                  }}
                >
                  <div className="font-semibold">PT</div>
                  <div className="text-xs" style={{ color: colors.textGray }}>
                    {localUser.state === 'IL' ? '40 hours/2 years' : 'Requirements vary'}
                  </div>
                </button>
                <button
                  onClick={() => {
                    if (localUser.licenseType !== 'OT' && courses.length > 0) {
                      if (window.confirm('Changing license type will update all requirements. Continue?')) {
                        setLocalUser({...localUser, licenseType: 'OT'});
                      }
                    } else {
                      setLocalUser({...localUser, licenseType: 'OT'});
                    }
                  }}
                  className="p-3"
                  style={{
                    border: `2px solid ${localUser.licenseType === 'OT' ? colors.primaryBlue : colors.slateLight}`,
                    background: localUser.licenseType === 'OT' ? colors.lightBlue : 'white',
                    cursor: 'pointer'
                  }}
                >
                  <div className="font-semibold">OT</div>
                  <div className="text-xs" style={{ color: colors.textGray }}>
                    {localUser.state === 'IL' ? '24 hours/2 years' : 'Requirements vary'}
                  </div>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: colors.textDark }}>
                Your Name
              </label>
              <input
                type="text"
                value={localUser.name}
                onChange={(e) => setLocalUser({...localUser, name: e.target.value})}
                className="w-full px-3 py-2"
                style={{ border: `1px solid ${colors.slateLight}`, background: colors.grayLight }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: colors.textDark }}>
                {localUser.state} License Number
              </label>
              <input
                type="text"
                value={localUser.licenseNumber}
                onChange={(e) => setLocalUser({...localUser, licenseNumber: e.target.value})}
                className="w-full px-3 py-2"
                style={{ border: `1px solid ${colors.slateLight}`, background: colors.grayLight }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: colors.textDark }}>
                Renewal Date
              </label>
              <input
                type="date"
                value={localUser.renewalDate}
                onChange={(e) => setLocalUser({...localUser, renewalDate: e.target.value})}
                className="w-full px-3 py-2"
                style={{ border: `1px solid ${colors.slateLight}`, background: colors.grayLight }}
              />
            </div>

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={localUser.isFirstRenewal}
                  onChange={(e) => setLocalUser({...localUser, isFirstRenewal: e.target.checked})}
                  className="mr-2"
                />
                <span className="text-sm">This is my first renewal (CE exempt)</span>
              </label>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowSettings(false)}
                className="px-4 py-2"
                style={{ color: colors.textDark, background: colors.slateLight, border: 'none', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2"
                style={{ 
                  background: savingData ? colors.slateMedium : colors.primaryBlue, 
                  color: 'white', 
                  border: 'none', 
                  cursor: savingData ? 'not-allowed' : 'pointer',
                  opacity: savingData ? 0.5 : 1
                }}
                disabled={savingData}
              >
                {savingData ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}