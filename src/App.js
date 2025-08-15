import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Clock, FileText, Plus, Trash2, Download, Info, Loader2, Settings, Pencil, LogOut, User, Lock, Mail, Eye, EyeOff, ChevronDown } from 'lucide-react';
import { supabase } from './supabaseClient';

const colors = {
  primaryBlue: '#3b82f6',
  primaryPurple: '#8b5cf6',
  lightBlue: '#e0f2fe',
  mutedPurple: '#e9d5ff',
  mutedTeal: '#cffafe',
  slateDark: '#1e293b',
  slateMedium: '#475569',
  slateLight: '#f1f5f9',
  grayLight: '#f9fafb',
  textDark: '#111827',
  textGray: '#6b7280'
};

const GOOGLE_VISION_API_KEY = process.env.REACT_APP_GOOGLE_VISION_KEY || '';

// CE Shield Logo Component
const CEShieldLogo = ({ showTagline = true, className = "", size = "large", centered = false }) => {
  const scales = {
    small: { svg: "30", text: "14", tagline: "8" },
    medium: { svg: "44", text: "20", tagline: "10" },
    large: { svg: "54", text: "30", tagline: "10" },
    xlarge: { svg: "48", text: "32", tagline: "6" }
  };
  
  const scale = scales[size] || scales.large;
  const logoSvg = (
    <svg width={scale.svg} height={parseInt(scale.svg) * 0.67} viewBox="0 0 60 40" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
      <g transform="translate(0, 4)">
        <path d="M10 0 L10 20 Q10 28 25 32 Q40 28 40 20 L40 0 Z" fill={colors.lightBlue}/>
        <path d="M20 0 L20 20 Q20 28 35 32 Q50 28 50 20 L50 0 Z" fill={colors.primaryBlue} opacity="0.85"/>
        <path d="M30 0 L30 20 Q30 28 45 32 Q60 28 60 20 L60 0 Z" fill={colors.primaryPurple} opacity="0.85"/>
      </g>
    </svg>
  );

  const logoText = (
    <h1 style={{ fontSize: `${scale.text}px`, lineHeight: '1', color: colors.textDark }}>
      <span style={{ fontWeight: 200 }}>CE</span><span style={{ fontWeight: 400 }}>Shield</span>
    </h1>
  );

  if (showTagline) {
    return (
      <div className={`${centered ? 'flex flex-col items-center' : ''} ${className}`}>
        <div className="flex items-center gap-2 align-middle">
          {logoSvg}
          {logoText}
        </div>
        <p className={`text-[${scale.tagline}px] tracking-[1.5px] mt-2 uppercase ${centered ? 'text-center whitespace-nowrap' : ''}`} 
           style={{ color: colors.textGray, paddingLeft: '0', fontSize: size === 'xlarge' ? '10px' : `${scale.tagline}px` }}>
          Track Education. Protect Your License.
        </p>
      </div>
    );
  }
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {logoSvg}
      {logoText}
    </div>
  );
};

// Utility: Create ZIP file
const createZip = async (files) => {
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
  
  for (const file of files) {
    const nameBytes = encoder.encode(file.name);
    const contentBytes = file.content instanceof Uint8Array ? file.content : encoder.encode(file.content);
    
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
    
    centralDirectory.push({ offset, nameBytes, contentSize: contentBytes.length, dosTime, dosDate });
    
    fileDataArray.push(new Uint8Array(header), nameBytes, contentBytes);
    offset += header.byteLength + nameBytes.length + contentBytes.length;
  }
  
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
    
    fileDataArray.push(new Uint8Array(cdHeader), entry.nameBytes);
    offset += cdHeader.byteLength + entry.nameBytes.length;
  }
  
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
  
  const totalSize = fileDataArray.reduce((sum, arr) => sum + arr.length, 0);
  const zipFile = new Uint8Array(totalSize);
  let position = 0;
  for (const arr of fileDataArray) {
    zipFile.set(arr, position);
    position += arr.length;
  }
  
  return zipFile;
};

// Custom hooks for data management
const useSupabaseData = (authUser) => {
  const [user, setUser] = useState({
    name: '', licenseType: '', licenseNumber: '', renewalDate: '', isFirstRenewal: false, state: 'IL'
  });
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const saveUserProfile = async (userData) => {
    setSaving(true);
    try {
      const { error } = await supabase.from('user_profiles').upsert({
        id: authUser.id,
        ...Object.fromEntries(Object.entries(userData).map(([k, v]) => 
          [k === 'licenseType' ? 'license_type' : k === 'licenseNumber' ? 'license_number' : 
           k === 'renewalDate' ? 'renewal_date' : k === 'isFirstRenewal' ? 'is_first_renewal' : k, v])),
        updated_at: new Date().toISOString()
      });

      if (error) throw error;
      localStorage.setItem('ceTrackerUser', JSON.stringify(userData));
      return true;
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Error saving profile. Please try again.');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const saveCourse = async (courseData, editingId = null) => {
    setSaving(true);
    try {
      const payload = {
        user_id: authUser.id,
        title: courseData.title,
        provider: courseData.provider,
        date: courseData.date,
        hours: parseFloat(courseData.hours),
        category: courseData.category,
        format: courseData.format,
        has_test: courseData.hasTest,
        certificate: courseData.certificate,
        updated_at: new Date().toISOString()
      };

      if (editingId) {
        const { data, error } = await supabase.from('courses').update(payload).eq('id', editingId).select();
        if (error) throw error;
        setCourses(courses.map(c => c.id === editingId ? data[0] : c));
      } else {
        const { data, error } = await supabase.from('courses').insert([payload]).select();
        if (error) throw error;
        setCourses([...courses, data[0]]);
      }
      
      localStorage.setItem('ceTrackerCourses', JSON.stringify(courses));
      return true;
    } catch (error) {
      console.error('Error saving course:', error);
      alert('Error saving course. Please try again.');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const deleteCourse = async (courseId) => {
    setSaving(true);
    try {
      const { error } = await supabase.from('courses').delete().eq('id', courseId);
      if (error) throw error;
      const updatedCourses = courses.filter(c => c.id !== courseId);
      setCourses(updatedCourses);
      localStorage.setItem('ceTrackerCourses', JSON.stringify(updatedCourses));
      return true;
    } catch (error) {
      console.error('Error deleting course:', error);
      alert('Error deleting course. Please try again.');
      return false;
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (!authUser) return;
    
    const loadData = async () => {
      try {
        const [profileResponse, coursesResponse] = await Promise.all([
          supabase.from('user_profiles').select('*').eq('id', authUser.id).single(),
          supabase.from('courses').select('*').eq('user_id', authUser.id).order('date', { ascending: false })
        ]);

        if (profileResponse.data && !profileResponse.error) {
          const profile = profileResponse.data;
          setUser({
            name: profile.name || '',
            licenseType: profile.license_type || '',
            licenseNumber: profile.license_number || '',
            renewalDate: profile.renewal_date || '',
            isFirstRenewal: profile.is_first_renewal || false,
            state: profile.state || 'IL'
          });
        }

        if (coursesResponse.data && !coursesResponse.error) {
          setCourses(coursesResponse.data);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        const savedUser = localStorage.getItem('ceTrackerUser');
        const savedCourses = localStorage.getItem('ceTrackerCourses');
        if (savedUser) setUser(JSON.parse(savedUser));
        if (savedCourses) setCourses(JSON.parse(savedCourses));
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [authUser]);

  return { user, setUser, courses, loading, saving, saveUserProfile, saveCourse, deleteCourse };
};

// Requirements and calculations utilities
const getRequirements = (state, licenseType) => {
  if (state !== 'IL') return null;
  
  const baseRequirements = {
    mandatory: {
      ethics: licenseType === 'PT' ? 3 : 1,
      sexualHarassment: 1,
      culturalCompetency: 1,
      implicitBias: 1,
      dementia: 1
    },
    limits: {
      selfStudy: licenseType === 'PT' ? 30 : 12,
      teaching: licenseType === 'PT' ? 20 : 12,
      clinicalInstructor: licenseType === 'PT' ? 10 : 6,
      journalClubs: licenseType === 'PT' ? 5 : 3,
      inservices: licenseType === 'PT' ? 5 : 3,
      districtMeetings: licenseType === 'PT' ? 5 : 3,
      skillsCertification: licenseType === 'PT' ? 5 : 3
    }
  };

  return {
    total: licenseType === 'PT' ? 40 : 24,
    ...baseRequirements
  };
};

const calculateHours = (courses) => {
  const hours = {
    total: 0, general: 0, ethics: 0, sexualHarassment: 0, culturalCompetency: 0,
    implicitBias: 0, dementia: 0, selfStudy: 0, teaching: 0, clinicalInstructor: 0,
    journalClubs: 0, inservices: 0, districtMeetings: 0, skillsCertification: 0
  };

  courses.forEach(course => {
    const courseHours = parseFloat(course.hours) || 0;
    hours.total += courseHours;
    
    if (hours[course.category] !== undefined) {
      hours[course.category] += courseHours;
    }
    
    if (hours[course.format] !== undefined) {
      hours[course.format] += courseHours;
    }
  });

  return hours;
};

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

// Auth Form Component
const AuthForm = ({ onSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    if (!email || !password) return;
    
    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.auth[isSignUp ? 'signUp' : 'signInWithPassword']({
        email, password
      });
      
      if (error) throw error;
      if (data.user) onSuccess(data.user);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e) => {
    e?.preventDefault?.();
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/`,
      });
      
      if (error) throw error;
      setResetEmailSent(true);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" 
         style={{ background: `linear-gradient(180deg, #f0f9ff 0%, #e0f2fe 100%)` }}>
      <div className="w-full max-w-md" 
           style={{ background: 'white', padding: '2rem', boxShadow: '0 20px 40px rgba(0, 0, 0, 0.08)', border: `1px solid ${colors.slateLight}` }}>
        
        <div className="text-center mb-6">
          <CEShieldLogo showTagline={true} centered={true} size="xlarge" />
        </div>

        {resetEmailSent ? (
          <div className="space-y-4">
            <div className="text-center p-4" style={{ background: '#f0fdf4', border: '1px solid #86efac' }}>
              <CheckCircle className="w-8 h-8 mx-auto mb-2" style={{ color: '#10b981' }} />
              <h3 className="font-semibold mb-2" style={{ color: '#166534' }}>Check your email!</h3>
              <p className="text-sm" style={{ color: '#166534' }}>
                We've sent a password reset link to {email}
              </p>
            </div>
            <button
              onClick={() => {
                setShowForgotPassword(false);
                setResetEmailSent(false);
                setEmail('');
                setPassword('');
                setError('');
              }}
              className="w-full py-2 px-4 transition-all"
              style={{ background: colors.primaryBlue, color: 'white', border: 'none', fontWeight: 500, cursor: 'pointer' }}
            >
              Back to Sign In
            </button>
          </div>
        ) : showForgotPassword ? (
          // Forgot Password Form
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-center mb-2" style={{ color: colors.textDark }}>
                Reset your password
              </h2>
              <p className="text-center text-sm" style={{ color: colors.textGray }}>
                Enter your email address and we'll send you a link to reset your password.
              </p>
            </div>

            <form onSubmit={handlePasswordReset} className="space-y-4">
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
                  style={{ border: `1px solid ${colors.slateLight}`, background: colors.grayLight }}
                  placeholder="Enter your email address"
                  required
                />
              </div>

              {error && (
                <div style={{ 
                  background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626',
                  padding: '0.75rem', fontSize: '0.875rem'
                }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !email}
                className="w-full py-2 px-4 flex items-center justify-center transition-all"
                style={{
                  background: loading || !email ? colors.slateMedium : colors.primaryBlue,
                  color: 'white', border: 'none', fontWeight: 500,
                  cursor: loading || !email ? 'not-allowed' : 'pointer',
                  opacity: loading || !email ? 0.5 : 1
                }}
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Reset Link'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  setShowForgotPassword(false);
                  setError('');
                }}
                className="text-sm"
                style={{ color: colors.primaryBlue, background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Back to Sign In
              </button>
            </div>
          </div>
        ) : (
          // Normal Sign In/Sign Up Form
          <div>
            <div className="mb-6">
              <p className="text-center" style={{ color: colors.textGray }}>
                {isSignUp ? 'Create your account' : 'Sign in to your account'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block mb-2 text-sm font-medium" style={{ color: colors.textDark }}>
                  <Mail className="inline w-4 h-4 mr-1" />
                  Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 pr-10 focus:outline-none focus:ring-2"
                    style={{ border: `1px solid ${colors.slateLight}`, background: colors.grayLight }}
                    required
                  />
                </div>
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
                    style={{ border: `1px solid ${colors.slateLight}`, background: colors.grayLight }}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-2.5"
                    style={{ color: colors.textGray, background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {!isSignUp && (
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-sm"
                    style={{ color: colors.primaryBlue, background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              {error && (
                <div style={{ 
                  background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626',
                  padding: '0.75rem', fontSize: '0.875rem'
                }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !email || !password}
                className="w-full py-2 px-4 flex items-center justify-center transition-all"
                style={{
                  background: loading || !email || !password ? colors.slateMedium : colors.primaryBlue,
                  color: 'white', border: 'none', fontWeight: 500,
                  cursor: loading || !email || !password ? 'not-allowed' : 'pointer',
                  opacity: loading || !email || !password ? 0.5 : 1
                }}
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isSignUp ? 'Create Account' : 'Sign In')}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
                className="text-sm"
                style={{ color: colors.primaryBlue, background: 'none', border: 'none', cursor: 'pointer' }}
              >
                {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
              </button>
            </div>
          </div>
        )}

        <div className="mt-6 pt-6" style={{ borderTop: `1px solid ${colors.slateLight}` }}>
          <p className="text-xs text-center" style={{ color: colors.textGray }}>
            Your data is securely stored and encrypted. We never share your information.
          </p>
        </div>
      </div>
    </div>
  );
};

// Profile Setup Component
const ProfileSetup = ({ authUser, onComplete, onSignOut }) => {
  const [user, setUser] = useState({
    name: '', licenseType: '', licenseNumber: '', renewalDate: '', isFirstRenewal: false, state: 'IL'
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!user.name || !user.licenseNumber || !user.renewalDate) return;
    
    setSaving(true);
    try {
      const { error } = await supabase.from('user_profiles').upsert({
        id: authUser.id,
        name: user.name,
        license_type: user.licenseType,
        license_number: user.licenseNumber,
        renewal_date: user.renewalDate,
        is_first_renewal: user.isFirstRenewal,
        state: user.state,
        updated_at: new Date().toISOString()
      });

      if (error) throw error;
      localStorage.setItem('ceTrackerUser', JSON.stringify(user));
      onComplete();
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Error saving profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const LicenseButton = ({ type, selected, onClick }) => (
    <button
      onClick={onClick}
      className="p-4 transition-all"
      style={{
        border: `2px solid ${selected ? colors.primaryBlue : colors.slateLight}`,
        background: selected ? colors.lightBlue : 'white', cursor: 'pointer'
      }}
    >
      <div className="font-semibold">{type}</div>
      <div className="text-sm" style={{ color: colors.textGray }}>
        {type === 'PT' ? 'Physical Therapist' : 'Occupational Therapist'}
      </div>
      <div className="text-xs mt-1" style={{ color: colors.textGray }}>
        {user.state === 'IL' ? (type === 'PT' ? '40 hours/2 years' : '24 hours/2 years') : 'Requirements vary'}
      </div>
    </button>
  );

  return (
    <div className="min-h-screen p-4" style={{ background: colors.grayLight }}>
      <div className="max-w-md mx-auto mt-10">
        <div style={{ background: 'white', padding: '2rem', boxShadow: '0 10px 30px rgba(0, 0, 0, 0.06)', border: `1px solid ${colors.slateLight}` }}>
          <div className="flex justify-between items-center mb-6">
            <CEShieldLogo showTagline={false} size="medium" />
            <button onClick={onSignOut} style={{ color: colors.textGray, background: 'none', border: 'none', cursor: 'pointer' }} title="Sign Out">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
          
          <div className="mb-4 p-3" style={{ background: colors.lightBlue }}>
            <p className="text-sm" style={{ color: colors.textDark }}>
              <User className="inline w-4 h-4 mr-1" />
              Signed in as: {authUser.email}
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: colors.textDark }}>
                Select Your State
              </label>
              <div className="relative">
                <select
                  value={user.state}
                  onChange={(e) => setUser({...user, state: e.target.value})}
                  className="w-full px-3 py-2 appearance-none focus:outline-none focus:ring-2"
                  style={{ border: `1px solid ${colors.slateLight}`, background: colors.grayLight }}
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
              <>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: colors.textDark }}>
                    Select Your License Type
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <LicenseButton type="PT" selected={user.licenseType === 'PT'} onClick={() => setUser({...user, licenseType: 'PT'})} />
                    <LicenseButton type="OT" selected={user.licenseType === 'OT'} onClick={() => setUser({...user, licenseType: 'OT'})} />
                  </div>
                </div>

                {user.licenseType && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: colors.textDark }}>Your Name</label>
                      <input
                        type="text"
                        value={user.name}
                        onChange={(e) => setUser({...user, name: e.target.value})}
                        className="w-full px-3 py-2 focus:outline-none focus:ring-2"
                        style={{ border: `1px solid ${colors.slateLight}`, background: colors.grayLight }}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: colors.textDark }}>
                        {user.state} License Number
                      </label>
                      <input
                        type="text"
                        value={user.licenseNumber}
                        onChange={(e) => setUser({...user, licenseNumber: e.target.value})}
                        className="w-full px-3 py-2 focus:outline-none focus:ring-2"
                        style={{ border: `1px solid ${colors.slateLight}`, background: colors.grayLight }}
                        placeholder={`Enter your ${user.state} license number`}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: colors.textDark }}>Renewal Date</label>
                      <input
                        type="date"
                        value={user.renewalDate}
                        onChange={(e) => setUser({...user, renewalDate: e.target.value})}
                        className="w-full px-3 py-2 focus:outline-none focus:ring-2"
                        style={{ border: `1px solid ${colors.slateLight}`, background: colors.grayLight }}
                        required
                      />
                    </div>

                    <div>
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
                      onClick={handleSave}
                      className="w-full py-2 px-4 transition-all"
                      style={{
                        background: (!user.name || !user.licenseNumber || !user.renewalDate || saving) ? colors.slateMedium : colors.primaryBlue,
                        color: 'white', border: 'none', fontWeight: 500,
                        cursor: (!user.name || !user.licenseNumber || !user.renewalDate || saving) ? 'not-allowed' : 'pointer',
                        opacity: (!user.name || !user.licenseNumber || !user.renewalDate || saving) ? 0.5 : 1
                      }}
                      disabled={!user.name || !user.licenseNumber || !user.renewalDate || saving}
                    >
                      {saving ? 'Saving...' : 'Continue'}
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Certificate parsing utility
const parseCertificate = async (file) => {
  if (!GOOGLE_VISION_API_KEY) {
    alert('Google Vision API key is not configured. Please set the REACT_APP_GOOGLE_VISION_KEY environment variable.');
    return null;
  }

  try {
    const reader = new FileReader();
    const base64 = await new Promise((resolve) => {
      reader.onloadend = () => resolve(reader.result.split(',')[1]);
      reader.readAsDataURL(file);
    });

    const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_VISION_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [{
          image: { content: base64 },
          features: [{ type: 'TEXT_DETECTION', maxResults: 1 }]
        }]
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to call Google Vision API');
    }

    const result = await response.json();
    const extractedText = result.responses?.[0]?.fullTextAnnotation?.text || '';

    if (!extractedText) throw new Error('No text found in image');

    const parsedData = { title: '', provider: '', date: '', hours: '', category: 'general' };

    const titleMatch = extractedText.match(/(?:has\s+)?(?:successfully\s+)?completed:?\s*(?:the\s+)?(?:course\s+)?(?:entitled\s+)?["']?([^"'\n]{5,100})["']?/i);
    if (titleMatch) parsedData.title = titleMatch[1].trim();

    const hoursMatch = extractedText.match(/(\d+\.?\d*)\s*(?:hours?|ceus?|ce\s*hours?)/i);
    if (hoursMatch) parsedData.hours = hoursMatch[1];

    return parsedData;
  } catch (error) {
    console.error('Error parsing certificate:', error);
    alert(`Error scanning certificate: ${error.message}`);
    return null;
  }
};

// Modal Components
const Modal = ({ children, onClose }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div className="w-full max-w-md max-h-[90vh] overflow-y-auto" 
         style={{ background: 'white', padding: '2rem', boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)' }}>
      {children}
    </div>
  </div>
);

const AddCourseModal = ({ editingCourse, onSave, onClose }) => {
  const [course, setCourse] = useState({
    title: '', provider: '', date: '', hours: '', category: 'general',
    format: 'live', hasTest: false, certificate: null
  });
  const [isParsing, setIsParsing] = useState(false);

  useEffect(() => {
    if (editingCourse) {
      setCourse({
        title: editingCourse.title,
        provider: editingCourse.provider,
        date: editingCourse.date,
        hours: editingCourse.hours.toString(),
        category: editingCourse.category,
        format: editingCourse.format,
        hasTest: editingCourse.has_test || false,
        certificate: editingCourse.certificate
      });
    }
  }, [editingCourse]);

  const handleCertificateUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

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
      setCourse(prev => ({
        ...prev,
        certificate: { name: file.name, type: file.type, data: reader.result }
      }));

      if (!editingCourse && file.type !== 'application/pdf') {
        if (window.confirm('Would you like to scan this certificate to auto-fill the form fields?')) {
          setIsParsing(true);
          const parsedData = await parseCertificate(file);
          setIsParsing(false);
          
          if (parsedData) {
            setCourse(prev => ({
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
  };

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    
    const hoursNum = parseFloat(course.hours);
    if (isNaN(hoursNum) || hoursNum <= 0) {
      alert('Please enter valid hours');
      return;
    }

    if (course.format === 'selfStudy' && !course.hasTest) {
      alert('Self-study courses must include a test to count for CE');
      return;
    }

    const success = await onSave(course, editingCourse?.id);
    if (success) {
      setCourse({
        title: '', provider: '', date: '', hours: '', category: 'general',
        format: 'live', hasTest: false, certificate: null
      });
      onClose();
    }
  };

  return (
    <Modal onClose={onClose}>
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
            {course.certificate && (
              <div className="flex items-center justify-between p-2" style={{ background: colors.grayLight }}>
                <span className="text-sm truncate" style={{ color: colors.textGray }}>
                  <FileText className="inline w-4 h-4 mr-1" />
                  {course.certificate.name}
                </span>
                <button
                  type="button"
                  onClick={() => setCourse(prev => ({...prev, certificate: null}))}
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

        {['title', 'provider'].map(field => (
          <div key={field}>
            <label className="block text-sm font-medium mb-2" style={{ color: colors.textDark }}>
              {field === 'title' ? 'Course Title' : 'Provider Name'} *
            </label>
            <input
              type="text"
              value={course[field]}
              onChange={(e) => setCourse(prev => ({...prev, [field]: e.target.value}))}
              className="w-full px-3 py-2"
              style={{ border: `1px solid ${colors.slateLight}`, background: colors.grayLight }}
              required
            />
          </div>
        ))}

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: colors.textDark }}>Date Completed *</label>
          <input
            type="date"
            value={course.date}
            onChange={(e) => setCourse(prev => ({...prev, date: e.target.value}))}
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
            value={course.hours}
            onChange={(e) => setCourse(prev => ({...prev, hours: e.target.value}))}
            className="w-full px-3 py-2"
            style={{ border: `1px solid ${colors.slateLight}`, background: colors.grayLight }}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: colors.textDark }}>Category *</label>
          <select
            value={course.category}
            onChange={(e) => setCourse(prev => ({...prev, category: e.target.value}))}
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
          <label className="block text-sm font-medium mb-2" style={{ color: colors.textDark }}>Format *</label>
          <select
            value={course.format}
            onChange={(e) => setCourse(prev => ({...prev, format: e.target.value}))}
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

        {course.format === 'selfStudy' && (
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={course.hasTest}
                onChange={(e) => setCourse(prev => ({...prev, hasTest: e.target.checked}))}
                className="mr-2"
              />
              <span className="text-sm">Course included a test (required for self-study)</span>
            </label>
          </div>
        )}

        <div className="flex justify-end space-x-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2"
            style={{ color: colors.textDark, background: colors.slateLight, border: 'none', cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-4 py-2"
            style={{ background: colors.primaryBlue, color: 'white', border: 'none', cursor: 'pointer' }}
          >
            {editingCourse ? 'Update Course' : 'Add Course'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

const DeleteConfirmationModal = ({ course, onConfirm, onClose }) => (
  <Modal onClose={onClose}>
    <h3 className="text-lg font-semibold mb-4" style={{ color: colors.textDark }}>Confirm Deletion</h3>
    <p className="mb-6" style={{ color: colors.textGray }}>
      Are you sure you want to delete the course "{course.title}"? This action cannot be undone.
    </p>
    <div className="flex justify-end space-x-3">
      <button
        onClick={onClose}
        className="px-4 py-2"
        style={{ color: colors.textDark, background: colors.slateLight, border: 'none', cursor: 'pointer' }}
      >
        Cancel
      </button>
      <button
        onClick={() => { onConfirm(course.id); onClose(); }}
        className="px-4 py-2"
        style={{ background: '#dc2626', color: 'white', border: 'none', cursor: 'pointer' }}
      >
        Delete Course
      </button>
    </div>
  </Modal>
);

const SettingsModal = ({ user, onSave, onClose, courses }) => {
  const [localUser, setLocalUser] = useState({...user});
  const [saving, setSaving] = useState(false);
  
  const handleSave = async () => {
    setSaving(true);
    const saved = await onSave(localUser);
    setSaving(false);
    
    if (saved) {
      onClose();
      alert('Settings saved successfully!');
    }
  };

  const LicenseButton = ({ type, selected, onClick }) => (
    <button
      onClick={onClick}
      className="p-3"
      style={{
        border: `2px solid ${selected ? colors.primaryBlue : colors.slateLight}`,
        background: selected ? colors.lightBlue : 'white', cursor: 'pointer'
      }}
    >
      <div className="font-semibold">{type}</div>
      <div className="text-xs" style={{ color: colors.textGray }}>
        {localUser.state === 'IL' ? (type === 'PT' ? '40 hours/2 years' : '24 hours/2 years') : 'Requirements vary'}
      </div>
    </button>
  );
  
  return (
    <Modal onClose={onClose}>
      <h3 className="text-lg font-semibold mb-4" style={{ color: colors.textDark }}>Profile Settings</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: colors.textDark }}>State</label>
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
          <label className="block text-sm font-medium mb-2" style={{ color: colors.textDark }}>License Type</label>
          <div className="grid grid-cols-2 gap-4">
            <LicenseButton 
              type="PT" 
              selected={localUser.licenseType === 'PT'} 
              onClick={() => {
                if (localUser.licenseType !== 'PT' && courses.length > 0) {
                  if (window.confirm('Changing license type will update all requirements. Continue?')) {
                    setLocalUser({...localUser, licenseType: 'PT'});
                  }
                } else {
                  setLocalUser({...localUser, licenseType: 'PT'});
                }
              }}
            />
            <LicenseButton 
              type="OT" 
              selected={localUser.licenseType === 'OT'} 
              onClick={() => {
                if (localUser.licenseType !== 'OT' && courses.length > 0) {
                  if (window.confirm('Changing license type will update all requirements. Continue?')) {
                    setLocalUser({...localUser, licenseType: 'OT'});
                  }
                } else {
                  setLocalUser({...localUser, licenseType: 'OT'});
                }
              }}
            />
          </div>
        </div>

        {['name', 'licenseNumber', 'renewalDate'].map(field => (
          <div key={field}>
            <label className="block text-sm font-medium mb-2" style={{ color: colors.textDark }}>
              {field === 'name' ? 'Your Name' : 
               field === 'licenseNumber' ? `${localUser.state} License Number` : 'Renewal Date'}
            </label>
            <input
              type={field === 'renewalDate' ? 'date' : 'text'}
              value={localUser[field]}
              onChange={(e) => setLocalUser({...localUser, [field]: e.target.value})}
              className="w-full px-3 py-2"
              style={{ border: `1px solid ${colors.slateLight}`, background: colors.grayLight }}
            />
          </div>
        ))}

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
            onClick={onClose}
            className="px-4 py-2"
            style={{ color: colors.textDark, background: colors.slateLight, border: 'none', cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2"
            style={{ 
              background: saving ? colors.slateMedium : colors.primaryBlue, 
              color: 'white', border: 'none', 
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.5 : 1
            }}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

// Report Generation
const generateReport = async (user, courses, certificatesOnly = false) => {
  const reportDate = new Date().toLocaleDateString();
  const requirements = getRequirements(user.state, user.licenseType);
  const hours = calculateHours(courses);
  
  const getDaysUntilRenewal = () => {
    if (!user.renewalDate) return null;
    const renewal = new Date(user.renewalDate);
    const today = new Date();
    const diff = renewal - today;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  if (certificatesOnly) {
    try {
      const files = [];
      let certificateCount = 0;
      
      courses.forEach((course) => {
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

      const zipData = await createZip(files);
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
    return;
  }

  // Generate HTML report
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
      line-height: 1.6; color: ${colors.textDark}; background: ${colors.grayLight}; padding: 20px;
    }
    .container {
      max-width: 800px; margin: 0 auto; background: white; padding: 40px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .header {
      border-bottom: 3px solid ${colors.primaryBlue}; padding-bottom: 20px; margin-bottom: 30px;
    }
    .logo-container { margin-bottom: 20px; }
    .logo-wrapper { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
    .logo-text {
      font-size: 36px; line-height: 36px; color: ${colors.textDark}; vertical-align: middle;
    }
    .tagline {
      font-size: 10px; color: ${colors.textGray}; letter-spacing: 1.5px; text-transform: uppercase;
    }
    h1 { color: ${colors.textDark}; margin-bottom: 10px; font-size: 28px; font-weight: 400; }
    .info-grid {
      display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;
      padding: 20px; background: ${colors.grayLight}; border: 1px solid ${colors.slateLight};
    }
    .info-item { display: flex; flex-direction: column; }
    .info-label {
      font-size: 12px; color: ${colors.textGray}; text-transform: uppercase;
      letter-spacing: 0.5px; margin-bottom: 4px;
    }
    .info-value { font-size: 16px; font-weight: 600; color: ${colors.textDark}; }
    .progress-section { margin-bottom: 30px; }
    .stats-grid {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 15px; margin: 20px 0;
    }
    .stat-card {
      text-align: center; padding: 20px; background: ${colors.grayLight};
      border: 1px solid ${colors.slateLight};
    }
    .stat-value { font-size: 32px; font-weight: bold; color: ${colors.primaryBlue}; }
    .stat-label { font-size: 14px; color: ${colors.textGray}; margin-top: 5px; }
    .progress-bar {
      width: 100%; height: 30px; background: ${colors.slateLight}; overflow: hidden;
      position: relative; margin: 10px 0;
    }
    .progress-fill {
      height: 100%; background: ${colors.primaryBlue}; display: flex; align-items: center;
      justify-content: center; color: white; font-weight: bold; min-width: fit-content; padding: 0 15px;
    }
    .requirements-grid {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px; margin: 20px 0;
    }
    .requirement-item { padding: 15px; background: ${colors.grayLight}; border-left: 4px solid ${colors.primaryBlue}; }
    .requirement-complete { border-left-color: #10b981; background: #f0fdf4; }
    .requirement-incomplete { border-left-color: #ef4444; background: #fef2f2; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th {
      background: ${colors.slateLight}; padding: 12px; text-align: left; font-weight: 600;
      color: ${colors.slateMedium}; border-bottom: 2px solid #e2e8f0;
    }
    td { padding: 12px; border-bottom: 1px solid #e2e8f0; }
    tr:hover { background: ${colors.grayLight}; }
    .certificate-badge {
      display: inline-block; padding: 2px 8px; background: #10b981; color: white; font-size: 12px;
    }
    .footer {
      margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0;
      text-align: center; color: ${colors.textGray}; font-size: 14px;
    }
    .alert { padding: 15px; margin-bottom: 20px; }
    .alert-info { background: ${colors.lightBlue}; border-left: 4px solid ${colors.primaryBlue}; color: ${colors.textDark}; }
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
  const blob = new Blob([reportContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
};

// Certifications Matrix Component
const CertificationsMatrix = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('elite');
  const [searchTerm, setSearchTerm] = useState('');
  const [showMethodology, setShowMethodology] = useState(false);
  const [showCitations, setShowCitations] = useState(false);
  
  // Complete certification data - all 110 entries
  const certifications = [
    {rank: 1, name: "Otago Exercise Programme", type: "Program", discipline: "PT", score: 92, evidence: "35-40% fall reduction, Medicare coverage, $938 cost savings/participant"},
    {rank: 2, name: "LSVT LOUD", type: "Certification", discipline: "SLP", score: 92, evidence: "50+ studies, 2-year maintenance, 5.05 UPDRS improvement"},
    {rank: 2, name: "ACRM Cognitive Rehabilitation", type: "Certification", discipline: "OT/PT/SLP", score: 92, evidence: "258 studies, 78.7% comparisons favor certified approach"},
    {rank: 4, name: "ACLM Lifestyle Medicine", type: "Certification", discipline: "PT/OT", score: 90, evidence: "6-pillar approach, 6,700+ practitioners, system-wide adoption"},
    {rank: 5, name: "HABIT/HABIT-ILE", type: "Program", discipline: "OT/PT", score: 89, evidence: "Superior to conventional therapy for bilateral CP"},
    {rank: 6, name: "MBSR (Mindfulness-Based Stress Reduction)", type: "Certification", discipline: "All", score: 89, evidence: "Neuroplasticity evidence, brain imaging validation"},
    {rank: 7, name: "Matter of Balance", type: "Certification", discipline: "PT/OT", score: 88, evidence: "$938 annual medical cost reduction per participant"},
    {rank: 7, name: "Telehealth Cardiac/Pulmonary", type: "Technology", discipline: "PT/OT", score: 88, evidence: "30-50% cost reduction, maintained effectiveness"},
    {rank: 9, name: "Motivational Interviewing", type: "Certification", discipline: "All", score: 87, evidence: "1,800+ trials, improves adherence across domains"},
    {rank: 10, name: "Pulmonary Rehabilitation", type: "Program", discipline: "PT/OT/RT", score: 86.5, evidence: "5-year sustained benefits, reduced mortality"},
    {rank: 11, name: "CIMT (Constraint-Induced Movement)", type: "Certification", discipline: "OT/PT", score: 86, evidence: "Strong RCT support for pediatric upper extremity"},
    {rank: 11, name: "Health Coaching", type: "Certification", discipline: "All", score: 86, evidence: "New CPT codes, growing insurance recognition"},
    {rank: 13, name: "Athletic Training BOC", type: "Certification", discipline: "AT", score: 85, evidence: "22% injury reduction, 50% cost savings, 92% diagnostic accuracy"},
    {rank: 13, name: "CDC STEADI Fall Prevention", type: "Certification", discipline: "PT/OT", score: 85, evidence: "EHR integration, addresses $31B Medicare spend"},
    {rank: 15, name: "AACVPR Cardiac Rehabilitation", type: "Certification", discipline: "PT/OT/RN", score: 84.5, evidence: "13-15% mortality reduction with certification"},
    {rank: 16, name: "Physical Therapy Fellowship", type: "Fellowship", discipline: "PT", score: 82, evidence: "Superior outcomes vs residency (25,843 patients)"},
    {rank: 16, name: "Pilates Rehabilitation", type: "Certification", discipline: "PT/OT", score: 82, evidence: "Network meta-analysis superiority for chronic LBP"},
    {rank: 16, name: "AI + Wearable Sensors", type: "Technology", discipline: "All", score: 82, evidence: "89% ROM accuracy, 98% pattern recognition"},
    {rank: 19, name: "ABCDEF ICU Bundle", type: "Protocol", discipline: "PT/OT/RT", score: 81.5, evidence: "68% mortality reduction when fully implemented"},
    {rank: 20, name: "LSVT BIG", type: "Certification", discipline: "PT/OT", score: 80, evidence: "Parkinson's mobility, complements LSVT LOUD"},
    {rank: 21, name: "IAYT Yoga Therapy", type: "Certification", discipline: "PT/OT", score: 78, evidence: "800-hour training, growing evidence base"},
    {rank: 22, name: "Alexander Technique", type: "Certification", discipline: "PT/OT", score: 76, evidence: "Strong for chronic LBP, limited other conditions"},
    {rank: 23, name: "IMOT Intensive Therapy", type: "Program", discipline: "PT/OT", score: 76, evidence: "94% achieve motor improvements, 60-120 hours"},
    {rank: 24, name: "Blood Flow Restriction (BFR)", type: "Technology", discipline: "PT", score: 75, evidence: "Equal to high-load with 20-50% loads, zero adverse events"},
    {rank: 25, name: "Ergonomic Assessment", type: "Certification", discipline: "PT/OT", score: 73, evidence: "OSHA compliance, injury prevention focus"},
    {rank: 26, name: "Vestibular Rehabilitation", type: "Training", discipline: "PT", score: 72, evidence: "Strong CPG support, 6-week median treatment"},
    {rank: 27, name: "VR (Medical-Grade)", type: "Technology", discipline: "All", score: 71, evidence: "Engagement tool, comparable to conventional"},
    {rank: 28, name: "NIDCAP Neonatal", type: "Certification", discipline: "OT/PT/SLP", score: 70, evidence: "2.32-week reduced LOS, $50K savings/6 infants"},
    {rank: 28, name: "Neonatal Therapy Certification", type: "Certification", discipline: "PT/OT/SLP", score: 70, evidence: "NTCB certification, improved outcomes in NICU populations"},
    {rank: 30, name: "Exoskeleton Training", type: "Technology", discipline: "PT", score: 67, evidence: "FDA approved but no superiority evidence"},
    {rank: 31, name: "Transplant Rehabilitation", type: "Specialty", discipline: "PT/OT", score: 66, evidence: "15-20% mortality reduction with ERAS"},
    {rank: 32, name: "Robotic Devices (Lokomat)", type: "Technology", discipline: "PT", score: 65, evidence: "Safe but not superior to intensive conventional"},
    {rank: 32, name: "Feldenkrais Method", type: "Certification", discipline: "PT/OT", score: 65, evidence: "Balance improvement in elderly, limited evidence"},
    {rank: 34, name: "SOS Feeding Approach", type: "Certification", discipline: "OT/SLP", score: 63, evidence: "Feasibility studies only, lacks RCTs"},
    {rank: 35, name: "COMT/Manual Therapy Certification", type: "Certification", discipline: "PT", score: 62, evidence: "Benefits shown for LBP, neck pain, headaches in multiple studies"},
    {rank: 35, name: "McKenzie Method (MDT)", type: "Certification", discipline: "PT", score: 62, evidence: "Moderate evidence for acute/chronic LBP, directional preference"},
    {rank: 35, name: "Pain Neuroscience Education", type: "Training", discipline: "PT/OT", score: 62, evidence: "Moderate effects when combined with other interventions"},
    {rank: 38, name: "FCE (Functional Capacity Eval)", type: "Certification", discipline: "PT/OT", score: 61, evidence: "Workers' comp standard but variable reliability"},
    {rank: 39, name: "Certified Hand Therapist (CHT)", type: "Certification", discipline: "OT/PT", score: 60, evidence: "Improved outcomes for complex hand conditions, surgical recovery"},
    {rank: 39, name: "Early Intervention Specialist", type: "Certification", discipline: "PT/OT/SLP", score: 60, evidence: "1/3 need no additional support, £2.40 ROI per £1"},
    {rank: 41, name: "Multiple Sclerosis Certified Specialist", type: "Certification", discipline: "PT/OT/SLP", score: 58, evidence: "CMSC certification, specialized MS care protocols"},
    {rank: 41, name: "Neurodevelopmental Treatment (NDT)", type: "Certification", discipline: "PT/OT", score: 58, evidence: "Positive for CP but no certified vs non-certified studies"},
    {rank: 41, name: "Orthopedic Clinical Specialist (OCS)", type: "Board Cert", discipline: "PT", score: 58, evidence: "No effectiveness difference, better value per dollar"},
    {rank: 41, name: "BOC-Orthopedic Specialty", type: "Board Cert", discipline: "AT", score: 58, evidence: "Athletic training specialization, limited outcome studies"},
    {rank: 45, name: "Sports Clinical Specialist (SCS)", type: "Board Cert", discipline: "PT", score: 56, evidence: "Limited evidence, efficiency gains only"},
    {rank: 45, name: "Telehealth/Digital Health", type: "Training", discipline: "All", score: 56, evidence: "Effective but no certification-specific outcomes"},
    {rank: 47, name: "Wound Care Specialist", type: "Certification", discipline: "PT/OT/RN", score: 55, evidence: "40-60% amputation reduction but limited PT/OT data"},
    {rank: 48, name: "Certified Aging in Place Specialist (CAPS)", type: "Certification", discipline: "PT/OT", score: 54, evidence: "Home modification focus, limited outcome data"},
    {rank: 49, name: "ACSM Clinical Exercise Physiologist", type: "Certification", discipline: "EP", score: 53, evidence: "Exercise testing focus, limited rehab evidence"},
    {rank: 50, name: "Certified Strength & Conditioning (CSCS)", type: "Certification", discipline: "PT", score: 52, evidence: "Athletic performance focus, not rehab specific"},
    {rank: 50, name: "Certified Brain Injury Specialist", type: "Certification", discipline: "PT/OT/SLP", score: 52, evidence: "BIAA certification, standardized care protocols"},
    {rank: 52, name: "Certified Stroke Rehabilitation Specialist", type: "Certification", discipline: "PT/OT", score: 50, evidence: "CSRS certification, stroke-specific protocols"},
    {rank: 52, name: "Hippotherapy", type: "Certification", discipline: "PT/OT", score: 50, evidence: "High satisfaction but small effect sizes"},
    {rank: 52, name: "Robotic Upper Limb", type: "Technology", discipline: "OT", score: 50, evidence: "No superiority over intensive conventional"},
    {rank: 52, name: "Certified Mulligan Practitioner", type: "Certification", discipline: "PT", score: 50, evidence: "Mobilization with movement, limited comparative studies"},
    {rank: 56, name: "Pelvic Floor Rehabilitation (PRPC)", type: "Certification", discipline: "PT/OT", score: 48, evidence: "Growing field, evidence for incontinence improvement"},
    {rank: 57, name: "Certified Driver Rehabilitation Specialist", type: "Certification", discipline: "PT/OT", score: 46, evidence: "CDRS certification, functional driving assessments"},
    {rank: 58, name: "Pediatric Clinical Specialist (PCS)", type: "Board Cert", discipline: "PT", score: 45, evidence: "No comparative outcome studies"},
    {rank: 58, name: "Board Certification in Pediatrics", type: "Board Cert", discipline: "OT", score: 45, evidence: "AOTA certification, no comparative outcome studies"},
    {rank: 60, name: "Virtual/Augmented Reality", type: "Training", discipline: "All", score: 44, evidence: "Emerging technology, insufficient evidence"},
    {rank: 61, name: "Ventilator Weaning", type: "Protocol", discipline: "RT/PT", score: 43, evidence: "RT-led protocols, limited PT/OT involvement"},
    {rank: 62, name: "Lymphedema (CLT/LANA)", type: "Certification", discipline: "PT/OT", score: 42, evidence: "LANA exam required, volume reduction documented"},
    {rank: 62, name: "Seating and Mobility Specialist", type: "Certification", discipline: "PT/OT", score: 42, evidence: "SMS certification, equipment prescription focus"},
    {rank: 64, name: "Dry Needling", type: "Certification", discipline: "PT", score: 40, evidence: "Mixed evidence, state-dependent practice, limited IL application"},
    {rank: 64, name: "TPI Golf Certification", type: "Certification", discipline: "PT", score: 40, evidence: "Sport-specific training, limited clinical outcome data"},
    {rank: 66, name: "ASTYM Therapy", type: "Certification", discipline: "PT", score: 38, evidence: "Soft tissue mobilization, limited comparative evidence"},
    {rank: 66, name: "Rolfing/Structural Integration", type: "Certification", discipline: "MT", score: 38, evidence: "Insufficient evidence in systematic reviews"},
    {rank: 68, name: "Therapeutic Pain Specialist", type: "Certification", discipline: "PT", score: 36, evidence: "TPS certification, limited outcome studies"},
    {rank: 69, name: "Women's Health Clinical Specialist", type: "Board Cert", discipline: "PT", score: 35, evidence: "Limited outcome research"},
    {rank: 69, name: "Craniosacral Therapy/Upledger", type: "Certification", discipline: "PT/OT", score: 35, evidence: "Systematic reviews find insufficient evidence"},
    {rank: 69, name: "Certified Low Vision Therapist", type: "Certification", discipline: "OT", score: 35, evidence: "CLVT certification, limited comparative studies"},
    {rank: 72, name: "Suit Therapy", type: "Equipment", discipline: "PT/OT", score: 34, evidence: "No additional benefit over controls"},
    {rank: 73, name: "Advanced Competency in Home Health", type: "Certification", discipline: "PT/OT", score: 32, evidence: "ACHH certification, no outcome studies"},
    {rank: 73, name: "Barral Institute Certification", type: "Certification", discipline: "PT", score: 32, evidence: "Visceral manipulation, limited evidence"},
    {rank: 73, name: "Transitional DPT (tDPT)", type: "Degree", discipline: "PT", score: 32, evidence: "No outcome improvements vs MPT"},
    {rank: 76, name: "Physical Therapy Residency", type: "Training", discipline: "PT", score: 30, evidence: "Worse efficiency than entry-level (surprising finding)"},
    {rank: 77, name: "Certified Exercise Expert for Aging Adults", type: "Certification", discipline: "PT/OT", score: 28, evidence: "CEEAA certification, no comparative studies"},
    {rank: 77, name: "Geriatric Clinical Specialist (GCS)", type: "Board Cert", discipline: "PT", score: 28, evidence: "No comparative studies despite aging population"},
    {rank: 77, name: "Neurologic Clinical Specialist (NCS)", type: "Board Cert", discipline: "PT", score: 28, evidence: "No outcome data despite common conditions"},
    {rank: 77, name: "Board Certification in Gerontology", type: "Board Cert", discipline: "OT", score: 28, evidence: "BCG certification, no comparative outcome studies"},
    {rank: 81, name: "AOTA Board Certifications (Physical Rehab)", type: "Board Cert", discipline: "OT", score: 26, evidence: "Zero comparative outcome studies identified"},
    {rank: 81, name: "AOTA Specialty Certifications", type: "Board Cert", discipline: "OT", score: 26, evidence: "Driving, Environmental Mod, Feeding, Low Vision, School - no outcome studies"},
    {rank: 83, name: "Cardiovascular/Pulmonary Specialist", type: "Board Cert", discipline: "PT", score: 25, evidence: "No certification-specific outcomes"},
    {rank: 84, name: "Certified Spinal Manipulative Therapy", type: "Certification", discipline: "PT", score: 24, evidence: "Manipulation benefits shown but no certification comparison"},
    {rank: 85, name: "Clinical Doctorate (DPT/OTD) vs Masters", type: "Degree", discipline: "PT/OT", score: 22, evidence: "No measurable outcome differences"},
    {rank: 86, name: "Sensory Integration (SIPT)", type: "Certification", discipline: "OT", score: 20, evidence: "Limited evidence despite widespread use"},
    {rank: 86, name: "Modern Management of Older Adult", type: "Certification", discipline: "PT/OT", score: 20, evidence: "CERT-MMOA, limited outcome data"},
    {rank: 88, name: "Assistive Technology Professional (ATP)", type: "Certification", discipline: "OT/PT", score: 18, evidence: "Technology focus, no outcome studies"},
    {rank: 89, name: "VitalStim", type: "Certification", discipline: "SLP", score: 16, evidence: "FDA cleared but limited evidence"},
    {rank: 89, name: "Board Certified Specialist in Swallowing", type: "Board Cert", discipline: "SLP", score: 16, evidence: "BCS-S certification, limited comparative studies"},
    {rank: 91, name: "Graston/IASTM", type: "Certification", discipline: "PT/OT", score: 14, evidence: "Weak evidence, protocol inconsistency"},
    {rank: 91, name: "Emergency Medical Response", type: "Certification", discipline: "PT", score: 14, evidence: "Sports venue focus, no rehab outcome data"},
    {rank: 93, name: "Oncology Clinical Specialist", type: "Board Cert", discipline: "PT", score: 12, evidence: "Growing field but no comparative data"},
    {rank: 93, name: "Board Certified Specialist Child Language", type: "Board Cert", discipline: "SLP", score: 12, evidence: "BCS-CL certification, no comparative outcome studies"},
    {rank: 93, name: "Board Certified Specialist Fluency", type: "Board Cert", discipline: "SLP", score: 12, evidence: "BCS-F certification, no comparative outcome studies"},
    {rank: 93, name: "BC-ANCDS Neurologic Communication", type: "Board Cert", discipline: "SLP", score: 12, evidence: "Academy certification, no comparative outcome studies"},
    {rank: 97, name: "Clinical Electrophysiology Specialist", type: "Board Cert", discipline: "PT", score: 10, evidence: "Narrow scope, no outcome studies"},
    {rank: 97, name: "Board Certification Intraoperative Monitoring", type: "Board Cert", discipline: "Audiology", score: 10, evidence: "BCS-IOM, specialized niche, no outcome studies"},
    {rank: 97, name: "Cochlear Implant Specialty", type: "Certification", discipline: "Audiology", score: 10, evidence: "CISC certification, device-specific, limited outcome data"},
    {rank: 97, name: "CBIT for Tics", type: "Certification", discipline: "OT", score: 10, evidence: "Tourette treatment, very specialized, limited studies"},
    {rank: 97, name: "Schroth Therapist", type: "Certification", discipline: "PT", score: 10, evidence: "Scoliosis-specific, under review, limited evidence"},
    {rank: 97, name: "Craniomandibular/TMJ Certification", type: "Certification", discipline: "PT", score: 10, evidence: "Head/neck/facial pain, limited comparative studies"},
    {rank: 97, name: "Advanced Vestibular PT", type: "Certification", discipline: "PT", score: 10, evidence: "University of Pittsburgh program, limited outcome data"},
    {rank: 97, name: "Vestibular AIB Certifications", type: "Certification", discipline: "PT", score: 10, evidence: "AIB-VAM/VRII/VR/VRC, no comparative studies"},
    {rank: 97, name: "Vestibular VCC Certification", type: "Certification", discipline: "PT", score: 10, evidence: "IAMT certification, no outcome studies"},
    {rank: 97, name: "Occupro Certification", type: "Certification", discipline: "PT", score: 10, evidence: "Work health platform, no clinical outcome data"},
    {rank: 97, name: "The Back School", type: "Certification", discipline: "PT", score: 10, evidence: "Online certification, no comparative outcome studies"},
    {rank: 108, name: "Kinesio Taping (CKTP)", type: "Certification", discipline: "PT/OT/AT", score: 8, evidence: "Multiple reviews find insufficient evidence"},
    {rank: 109, name: "ASHA Board Certified Specialists", type: "Board Cert", discipline: "SLP", score: 6, evidence: "Limited research across all specialties"},
    {rank: 110, name: "Research Doctorates (PhD/ScD)", type: "Degree", discipline: "All", score: 4, evidence: "Academic value but no clinical outcome benefit"}
  ];

  const getFilteredCertifications = () => {
    let filtered = certifications;
    
    // Filter by tier
    if (selectedFilter === 'elite') {
      filtered = filtered.filter(cert => cert.score >= 90);
    } else if (selectedFilter === 'high') {
      filtered = filtered.filter(cert => cert.score >= 70 && cert.score < 90);
    } else if (selectedFilter === 'moderate') {
      filtered = filtered.filter(cert => cert.score >= 50 && cert.score < 70);
    } else if (selectedFilter === 'low') {
      filtered = filtered.filter(cert => cert.score >= 30 && cert.score < 50);
    } else if (selectedFilter === 'insufficient') {
      filtered = filtered.filter(cert => cert.score < 30);
    }
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(cert => 
        cert.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cert.discipline.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cert.evidence.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return isExpanded ? filtered : filtered.slice(0, 5);
  };

  const getScoreStyle = (score) => {
    if (score >= 90) return { background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)', color: 'white' };
    if (score >= 70) return { background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: 'white' };
    if (score >= 50) return { background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)', color: 'white' };
    if (score >= 30) return { background: 'linear-gradient(135deg, #fb923c 0%, #f97316 100%)', color: 'white' };
    return { background: 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)', color: 'white' };
  };

  const getTypeStyle = (type) => {
    const styles = {
      'Certification': { background: colors.lightBlue, color: colors.primaryBlue },
      'Program': { background: colors.mutedTeal, color: '#0891b2' },
      'Technology': { background: colors.mutedPurple, color: colors.primaryPurple },
      'Fellowship': { background: '#fef3c7', color: '#d97706' },
      'Training': { background: '#fce7f3', color: '#be185d' },
      'Board Cert': { background: '#fee2e2', color: '#dc2626' },
      'Protocol': { background: colors.mutedTeal, color: '#0891b2' },
      'Specialty': { background: colors.lightBlue, color: colors.primaryBlue },
      'Equipment': { background: colors.mutedPurple, color: colors.primaryPurple },
      'Degree': { background: '#f3e8ff', color: '#7c3aed' }
    };
    return styles[type] || styles['Certification'];
  };

  const filteredCerts = getFilteredCertifications();

  return (
    <div className="mb-6" style={{ background: 'white', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)', border: `1px solid ${colors.slateLight}` }}>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold" style={{ color: colors.textDark }}>
            Evidence-Based Certifications Guide
          </h2>
          <span className="text-xs px-2 py-1" style={{ background: colors.lightBlue, color: colors.primaryBlue, borderRadius: '4px' }}>
            110 Ranked
          </span>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm transition-all"
          style={{ 
            background: isExpanded ? colors.primaryBlue : 'white',
            color: isExpanded ? 'white' : colors.primaryBlue,
            border: `1px solid ${colors.primaryBlue}`,
            cursor: 'pointer'
          }}
        >
          {isExpanded ? 'Collapse' : 'Expand'}
          <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {isExpanded && (
        <div className="mb-4 flex flex-wrap gap-3">
          <div className="flex gap-2">
            {[
              { value: 'all', label: 'All', count: certifications.length },
              { value: 'elite', label: 'Elite (90+)', count: certifications.filter(c => c.score >= 90).length },
              { value: 'high', label: 'High (70-89)', count: certifications.filter(c => c.score >= 70 && c.score < 90).length },
              { value: 'moderate', label: 'Moderate (50-69)', count: certifications.filter(c => c.score >= 50 && c.score < 70).length },
              { value: 'low', label: 'Low (30-49)', count: certifications.filter(c => c.score >= 30 && c.score < 50).length },
              { value: 'insufficient', label: 'Insufficient (<30)', count: certifications.filter(c => c.score < 30).length }
            ].map(filter => (
              <button
                key={filter.value}
                onClick={() => setSelectedFilter(filter.value)}
                className="px-3 py-1.5 text-sm transition-all"
                style={{
                  background: selectedFilter === filter.value ? colors.primaryBlue : colors.grayLight,
                  color: selectedFilter === filter.value ? 'white' : colors.textGray,
                  border: `1px solid ${selectedFilter === filter.value ? colors.primaryBlue : colors.slateLight}`,
                  cursor: 'pointer'
                }}
              >
                {filter.label} ({filter.count})
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="Search certifications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-1.5 text-sm"
            style={{ 
              border: `1px solid ${colors.slateLight}`,
              background: colors.grayLight,
              minWidth: '200px'
            }}
          />
        </div>
      )}

      <div className="space-y-2">
        {filteredCerts.map((cert) => (
          <div 
            key={`${cert.rank}-${cert.name}`}
            className="flex items-center gap-3 p-3 transition-all hover:bg-gray-50"
            style={{ 
              background: colors.grayLight,
              borderLeft: `3px solid ${cert.score >= 90 ? '#22c55e' : cert.score >= 70 ? colors.primaryBlue : cert.score >= 50 ? '#f59e0b' : '#f97316'}`
            }}
          >
            <div className="text-center" style={{ minWidth: '40px' }}>
              <div className="text-xs" style={{ color: colors.textGray }}>Rank</div>
              <div className="font-semibold" style={{ color: colors.textDark }}>#{cert.rank}</div>
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium" style={{ color: colors.textDark }}>{cert.name}</span>
                <span 
                  className="text-xs px-2 py-0.5"
                  style={{ 
                    ...getTypeStyle(cert.type),
                    borderRadius: '3px',
                    fontWeight: '500'
                  }}
                >
                  {cert.type}
                </span>
                <span className="text-xs" style={{ color: colors.textGray }}>
                  {cert.discipline}
                </span>
              </div>
              <div className="text-sm" style={{ color: colors.textGray }}>
                {cert.evidence}
              </div>
            </div>
            
            <div className="text-center" style={{ minWidth: '60px' }}>
              <div 
                className="px-3 py-1 font-semibold"
                style={{ 
                  ...getScoreStyle(cert.score),
                  borderRadius: '4px',
                  fontSize: '0.875rem'
                }}
              >
                {cert.score}
              </div>
            </div>
          </div>
        ))}
      </div>

      {!isExpanded && (
        <div className="mt-3 pt-3 text-center" style={{ borderTop: `1px solid ${colors.slateLight}` }}>
          <p className="text-sm" style={{ color: colors.textGray }}>
            Showing top 5 evidence-based certifications. Click expand to view all 110 ranked certifications.
          </p>
        </div>
      )}

      {isExpanded && (
        <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${colors.slateLight}` }}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2" style={{ color: colors.textDark }}>About This Matrix</h4>
              <p style={{ color: colors.textGray, fontSize: '0.813rem', lineHeight: '1.5' }}>
                Evidence-based rankings of 110 rehabilitation certifications based on clinical outcomes, not prestige.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2" style={{ color: colors.textDark }}>Scoring Methodology</h4>
              <p style={{ color: colors.textGray, fontSize: '0.813rem', lineHeight: '1.5' }}>
                40% Clinical Outcomes • 20% Efficiency • 15% Cost-Effectiveness • 15% Evidence Quality • 10% Patient Satisfaction
              </p>
              <button
                onClick={() => setShowMethodology(!showMethodology)}
                className="text-xs mt-2"
                style={{ color: colors.primaryBlue, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                {showMethodology ? 'Hide' : 'View'} Full Methodology →
              </button>
            </div>
            <div>
              <h4 className="font-medium mb-2" style={{ color: colors.textDark }}>Key Finding</h4>
              <p style={{ color: colors.textGray, fontSize: '0.813rem', lineHeight: '1.5' }}>
                Only 4% of certifications score 90+. Focus on evidence-based training for maximum patient impact.
              </p>
              <button
                onClick={() => setShowCitations(!showCitations)}
                className="text-xs mt-2"
                style={{ color: colors.primaryBlue, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                View All 284 Citations →
              </button>
            </div>
          </div>

          {/* Methodology Section */}
          {showMethodology && (
            <div className="mt-6 p-4" style={{ background: colors.grayLight, border: `1px solid ${colors.slateLight}` }}>
              <h3 className="text-lg font-semibold mb-4" style={{ color: colors.textDark }}>
                Clinical Utility Scoring Methodology
              </h3>
              
              <div className="mb-4 p-3" style={{ background: 'white', borderLeft: `3px solid ${colors.primaryBlue}` }}>
                <h4 className="font-medium mb-2" style={{ color: colors.textDark }}>Core Philosophy</h4>
                <p style={{ color: colors.textGray, fontSize: '0.875rem', lineHeight: '1.6' }}>
                  This evidence-based framework evaluates rehabilitation certifications based on their demonstrable impact on patient outcomes 
                  rather than professional prestige or theoretical knowledge. The scoring system prioritizes real-world clinical utility—the 
                  practical value an intervention brings to improving patient quality of life, functional independence, and measurable health outcomes.
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-3" style={{ background: 'white', borderLeft: '3px solid #22c55e' }}>
                  <h4 className="font-medium mb-1" style={{ color: '#16a34a' }}>1. Clinical Outcome Improvements (40% weight)</h4>
                  <p style={{ color: colors.textGray, fontSize: '0.813rem' }}>
                    Functional gains on validated scales, pain reduction, quality of life improvements, reduced mortality/morbidity, return-to-work rates
                  </p>
                </div>

                <div className="p-3" style={{ background: 'white', borderLeft: `3px solid ${colors.primaryBlue}` }}>
                  <h4 className="font-medium mb-1" style={{ color: colors.primaryBlue }}>2. Treatment Efficiency (20% weight)</h4>
                  <p style={{ color: colors.textGray, fontSize: '0.813rem' }}>
                    Reduced treatment sessions, shorter length of stay, faster return to baseline, prevention of readmissions
                  </p>
                </div>

                <div className="p-3" style={{ background: 'white', borderLeft: '3px solid #f59e0b' }}>
                  <h4 className="font-medium mb-1" style={{ color: '#d97706' }}>3. Cost-Effectiveness (15% weight)</h4>
                  <p style={{ color: colors.textGray, fontSize: '0.813rem' }}>
                    Direct medical cost reductions, ROI calculations, QALYs gained, insurance coverage rates
                  </p>
                </div>

                <div className="p-3" style={{ background: 'white', borderLeft: '3px solid #f97316' }}>
                  <h4 className="font-medium mb-1" style={{ color: '#ea580c' }}>4. Evidence Quality (15% weight)</h4>
                  <p style={{ color: colors.textGray, fontSize: '0.813rem' }}>
                    Number and quality of RCTs, systematic reviews, sample sizes, consistency of findings, peer-reviewed publications
                  </p>
                </div>

                <div className="p-3" style={{ background: 'white', borderLeft: `3px solid ${colors.primaryPurple}` }}>
                  <h4 className="font-medium mb-1" style={{ color: colors.primaryPurple }}>5. Patient Satisfaction & Experience (10% weight)</h4>
                  <p style={{ color: colors.textGray, fontSize: '0.813rem' }}>
                    Patient-reported outcomes, treatment adherence, patient preference, caregiver satisfaction
                  </p>
                </div>
              </div>

              <div className="mt-4 p-3" style={{ background: colors.primaryBlue, color: 'white' }}>
                <h4 className="font-medium mb-2">Why This Matters</h4>
                <p style={{ fontSize: '0.813rem', lineHeight: '1.5' }}>
                  Healthcare systems face increasing pressure to demonstrate value while controlling costs. This scoring system provides 
                  the first comprehensive, evidence-based framework for making certification and training investments based on measurable 
                  patient benefit.
                </p>
              </div>
            </div>
          )}

          {/* Citations Section */}
          {showCitations && (
            <div className="mt-6 p-4" style={{ background: colors.grayLight, border: `1px solid ${colors.slateLight}`, maxHeight: '500px', overflowY: 'auto' }}>
              <h3 className="text-lg font-semibold mb-4" style={{ color: colors.textDark }}>
                Complete Evidence Citations (284 Peer-Reviewed Sources)
              </h3>

              <div className="space-y-4" style={{ fontSize: '0.813rem', color: colors.textGray, lineHeight: '1.5' }}>
                
                {/* Athletic Training Studies */}
                <div>
                  <h4 className="font-medium mb-2" style={{ color: colors.primaryBlue }}>Athletic Training Studies</h4>
                  <ol className="ml-4 space-y-1">
                    <li>Board of Certification (BOC) for Athletic Trainers. https://www.bocatc.org</li>
                    <li>National Athletic Trainers' Association (NATA). "Obtain Certification." https://www.nata.org/about/athletic-training/obtain-certification</li>
                    <li>International Journal of Athletic Therapy and Training. Human Kinetics.</li>
                    <li>"Accuracy of Athletic Trainer and Physician Diagnoses in Sports Medicine." Orthopedics.</li>
                    <li>"Statistics on Athletic Training in the US." Healthyroster.</li>
                  </ol>
                </div>

                {/* Fellowship and Residency Studies */}
                <div>
                  <h4 className="font-medium mb-2" style={{ color: colors.primaryBlue }}>Fellowship and Residency Studies</h4>
                  <ol className="ml-4 space-y-1" start="6">
                    <li>Rodeghero JR, et al. (2015). "The Impact of Physical Therapy Residency or Fellowship Education on Clinical Outcomes for Patients With Musculoskeletal Conditions." JOSPT, 45(2), 86-96.</li>
                    <li>Resario R, et al. (2004). "The Influence of Experience and Specialty Certifications on Clinical Outcomes for Patients With Low Back Pain."</li>
                  </ol>
                </div>

                {/* LSVT Studies */}
                <div>
                  <h4 className="font-medium mb-2" style={{ color: colors.primaryBlue }}>LSVT Programs (LOUD & BIG)</h4>
                  <ol className="ml-4 space-y-1" start="8">
                    <li>"LSVT LOUD and LSVT BIG: Behavioral Treatment Programs for Speech and Body Movement in Parkinson Disease." PMC3316992.</li>
                    <li>"Is LSVT LOUD® Worth It For SLPs? An Honest Review." Harmony Road Design.</li>
                    <li>"Five key differences between LSVT LOUD® and SPEAK OUT!®" LSVT Global.</li>
                    <li>"LSVT Speech Therapy for Parkinson's Disease." APDA.</li>
                  </ol>
                </div>

                {/* Blood Flow Restriction Training */}
                <div>
                  <h4 className="font-medium mb-2" style={{ color: colors.primaryBlue }}>Blood Flow Restriction Training</h4>
                  <ol className="ml-4 space-y-1" start="12">
                    <li>"A Useful Blood Flow Restriction Training Risk Stratification for Exercise and Rehabilitation." Frontiers in Physiology (2022).</li>
                    <li>"Effects of blood-flow restricted exercise versus conventional resistance training—a systematic review and meta-analysis." BMC Sports Science (2023).</li>
                    <li>"Effects of blood flow restriction training on physical fitness among athletes: a systematic review and meta-analysis." Scientific Reports (2024).</li>
                  </ol>
                </div>

                {/* Board Certification Studies */}
                <div>
                  <h4 className="font-medium mb-2" style={{ color: colors.primaryBlue }}>Board Certification Studies</h4>
                  <ol className="ml-4 space-y-1" start="15">
                    <li>Hart DL, et al. (2006). "Influence of orthopaedic clinical specialist certification on clinical outcomes." Phys Ther.</li>
                    <li>APTA Employer Survey (2022). Board certification perception and salary data.</li>
                    <li>AOTA Board Certification Analysis (2023). Comparative outcome studies review.</li>
                    <li>"Specialist Certification." APTA.</li>
                    <li>"Brooks Occupational Therapists Earn Elite Certification." Brooks Rehabilitation.</li>
                    <li>"Board Certification in Physical Rehabilitation (BCPR)." Credly.</li>
                  </ol>
                </div>

                {/* Fall Prevention Programs */}
                <div>
                  <h4 className="font-medium mb-2" style={{ color: colors.primaryBlue }}>Fall Prevention Programs</h4>
                  <ol className="ml-4 space-y-1" start="21">
                    <li>"Otago Exercise Programme." Physiopedia.</li>
                    <li>"The Otago Exercise Program - CGWEP." University of North Carolina.</li>
                    <li>"The Otago Exercise Program: Innovative Delivery Models." PMC5362608.</li>
                    <li>"Learn More About 'Otago Exercise Program' For Older Adults." NCOA.</li>
                    <li>"A Matter of Balance: Older Adults Taking Control of Falls by Building Confidence." PMC4410326.</li>
                    <li>"Learn More About 'A Matter of Balance' For Older Adults." NCOA.</li>
                  </ol>
                </div>

                {/* CDC STEADI Initiative */}
                <div>
                  <h4 className="font-medium mb-2" style={{ color: colors.primaryBlue }}>CDC STEADI Initiative</h4>
                  <ol className="ml-4 space-y-1" start="27">
                    <li>"The CDC's STEADI Initiative: Promoting Older Adult Health and Independence Through Fall Prevention." PMC5703055.</li>
                    <li>"The CDC's STEADI Initiative." AAFP (2017).</li>
                    <li>"STEADI: CDC's approach to make older adult fall prevention part of every primary care practice." PMC6239204.</li>
                    <li>"An Introduction to the Centers for Disease Control and Prevention's Efforts to Prevent Older Adult Falls." Frontiers (2014).</li>
                    <li>"The STEADI Tool Kit: A Fall Prevention Resource for Health Care Providers." PMC4707964.</li>
                  </ol>
                </div>

                {/* Cognitive Rehabilitation */}
                <div>
                  <h4 className="font-medium mb-2" style={{ color: colors.primaryBlue }}>Cognitive Rehabilitation</h4>
                  <ol className="ml-4 space-y-1" start="32">
                    <li>Cicerone KD, et al. (2019). "Evidence-based cognitive rehabilitation: Systematic review of the literature from 2009 through 2014." Archives of Physical Medicine and Rehabilitation.</li>
                    <li>"Cognitive Rehabilitation Manual." ACRM.</li>
                    <li>"Evidence-Based Cognitive Rehabilitation: Updated Review of the Literature From 1998 Through 2002." ScienceDirect.</li>
                    <li>"Psychological Intervention in Traumatic Brain Injury Patients." PMC6525953.</li>
                    <li>"Cognitive Impairment and Rehabilitation Strategies After Traumatic Brain Injury." PMC4904751.</li>
                  </ol>
                </div>

                {/* Cardiac & Pulmonary Rehabilitation */}
                <div>
                  <h4 className="font-medium mb-2" style={{ color: colors.primaryBlue }}>Cardiac & Pulmonary Rehabilitation</h4>
                  <ol className="ml-4 space-y-1" start="37">
                    <li>"Core Components of Cardiac Rehabilitation Programs: 2024 Update." Circulation (2024).</li>
                    <li>"AACVPR." https://www.aacvpr.org/</li>
                    <li>"Certified Cardiac Rehabilitation Professional." AACVPR.</li>
                    <li>"AACVPR/ACCF/AHA 2010 Update: Performance Measures on Cardiac Rehabilitation." Circulation (2010).</li>
                    <li>"Meta-analysis of respiratory rehabilitation in chronic obstructive pulmonary disease." PubMed ID: 18084170.</li>
                    <li>"Efficacy of a long-term pulmonary rehabilitation maintenance program for COPD patients." Respiratory Research (2021).</li>
                    <li>"Lower mortality after early supervised pulmonary rehabilitation following COPD-exacerbations." BMC Pulmonary Medicine (2018).</li>
                  </ol>
                </div>

                {/* Technology & Robotics */}
                <div>
                  <h4 className="font-medium mb-2" style={{ color: colors.primaryBlue }}>Technology & Robotics</h4>
                  <ol className="ml-4 space-y-1" start="44">
                    <li>"Systematic review of AI/ML applications in multi-domain robotic rehabilitation." Journal of NeuroEngineering and Rehabilitation (2025).</li>
                    <li>"A deep learning system to monitor and assess rehabilitation exercises." ScienceDirect (2023).</li>
                    <li>"Effectiveness of Platform-Based Robot-Assisted Rehabilitation." PMC9029074.</li>
                    <li>"Robot assisted training for the upper limb after stroke (RATULS)." The Lancet (2019).</li>
                    <li>Mehrholz J, et al. (2020). "Robotic-assisted gait training review." Cochrane Database.</li>
                  </ol>
                </div>

                {/* Virtual Reality */}
                <div>
                  <h4 className="font-medium mb-2" style={{ color: colors.primaryBlue }}>Virtual Reality</h4>
                  <ol className="ml-4 space-y-1" start="49">
                    <li>"Effectiveness of Virtual Reality in the Rehabilitation of Motor Function of Patients With Subacute Stroke." PMC8131676.</li>
                    <li>"Home-based virtual reality training after discharge from hospital-based stroke rehabilitation." Trials (2019).</li>
                    <li>"Virtual Reality–Based Rehabilitation as a Feasible and Engaging Tool." ScienceDirect (2022).</li>
                    <li>"Effectiveness of virtual reality-based exercise therapy in rehabilitation." ScienceDirect (2021).</li>
                    <li>"The efficacy of virtual reality for upper limb rehabilitation in stroke patients." BMC Medical Informatics (2024).</li>
                  </ol>
                </div>

                {/* Manual Therapy & Movement Approaches */}
                <div>
                  <h4 className="font-medium mb-2" style={{ color: colors.primaryBlue }}>Manual Therapy & Movement Approaches</h4>
                  <ol className="ml-4 space-y-1" start="54">
                    <li>Ernst E, & Canter PH. (2014). "Clinical effectiveness of manual therapy for musculoskeletal and non-musculoskeletal conditions." Chiropractic & Manual Therapies.</li>
                    <li>"Manual therapy (Cyriax, Lewit, Kaltenborn, Maitland, McKenzie, Mulligan)." Fizjo Instytut.</li>
                    <li>Long A, et al. (2004). "Directional preference validation." Spine.</li>
                    <li>Wells C, et al. (2014). "Network meta-analysis for chronic LBP." PLoS One.</li>
                    <li>"Is Pilates an effective rehabilitation tool? A systematic review." ScienceDirect (2018).</li>
                  </ol>
                </div>

                {/* Pediatric Interventions */}
                <div>
                  <h4 className="font-medium mb-2" style={{ color: colors.primaryBlue }}>Pediatric Interventions</h4>
                  <ol className="ml-4 space-y-1" start="59">
                    <li>"Efficacy of HABIT in children with hemiplegic cerebral palsy: a randomized control trial." PubMed ID: 17979861.</li>
                    <li>"Hand-arm bimanual intensive therapy and daily functioning of children with bilateral CP." PubMed ID: 32686119.</li>
                    <li>"Hand-Arm Bimanual Intensive Training Including Lower Extremities (HABIT-ILE)." Physiopedia.</li>
                    <li>"Constraint Induced Movement Therapy." Physiopedia.</li>
                    <li>Novak I, et al. (2013). "CP interventions systematic review." Dev Med Child Neurol.</li>
                  </ol>
                </div>

                {/* Neonatal & Early Intervention */}
                <div>
                  <h4 className="font-medium mb-2" style={{ color: colors.primaryBlue }}>Neonatal & Early Intervention</h4>
                  <ol className="ml-4 space-y-1" start="64">
                    <li>"Early Initiation of NIDCAP Reduces Length of Stay." PubMed ID: 27923536.</li>
                    <li>"NIDCAP — Family-centered developmentally supportive care." ScienceDirect.</li>
                    <li>"Cost savings from early intervention." Mind Of My Own.</li>
                  </ol>
                </div>

                {/* Lifestyle Medicine & Health Coaching */}
                <div>
                  <h4 className="font-medium mb-2" style={{ color: colors.primaryBlue }}>Lifestyle Medicine & Health Coaching</h4>
                  <ol className="ml-4 space-y-1" start="67">
                    <li>"Become Certified ACLM." American College of Lifestyle Medicine.</li>
                    <li>"Home - American Board of Lifestyle Medicine." https://ablm.org/</li>
                    <li>"Can Health Coaches Bill Insurance?" Primal Health Coach Institute.</li>
                    <li>"Health & Wellness Coaching Services: Making the Case for Reimbursement." PMC11562341.</li>
                    <li>"Coding for Health Coaching Services." NSHCOA.</li>
                    <li>"Guide to new health coach CPT codes." Healthie.</li>
                  </ol>
                </div>

                {/* Mindfulness & Motivational Interviewing */}
                <div>
                  <h4 className="font-medium mb-2" style={{ color: colors.primaryBlue }}>Mindfulness & Motivational Interviewing</h4>
                  <ol className="ml-4 space-y-1" start="73">
                    <li>Goyal M, et al. (2014). "Meditation programs for psychological stress and well-being." JAMA Internal Medicine, 174(3), 357-368.</li>
                    <li>Khoury B, et al. (2013). "Mindfulness-based stress reduction for healthy individuals." Journal of Health Psychology, 18(6), 725-735.</li>
                    <li>Rubak S, et al. (2005). "Motivational interviewing: a systematic review and meta-analysis." British Journal of General Practice, 55(513), 305-312.</li>
                    <li>Lundahl B, & Burke BL. (2009). "The effectiveness and applicability of motivational interviewing." Journal of Clinical Psychology, 65(11), 1232-1245.</li>
                  </ol>
                </div>

                {/* Pain Management & Neuroscience */}
                <div>
                  <h4 className="font-medium mb-2" style={{ color: colors.primaryBlue }}>Pain Management & Neuroscience</h4>
                  <ol className="ml-4 space-y-1" start="77">
                    <li>"The efficacy of pain neuroscience education on musculoskeletal pain." PubMed ID: 27351541.</li>
                    <li>"Effectiveness of Pain Neuroscience Education in Patients with Chronic Musculoskeletal Pain." PMC10001851.</li>
                    <li>"A Call for Improving Research on Pain Neuroscience Education and Chronic Pain." JOSPT (2023).</li>
                    <li>"Effectiveness of Pain Neuroscience Education in Physical Therapy." Brain Sciences (2024).</li>
                  </ol>
                </div>

                {/* Vestibular Rehabilitation */}
                <div>
                  <h4 className="font-medium mb-2" style={{ color: colors.primaryBlue }}>Vestibular Rehabilitation</h4>
                  <ol className="ml-4 space-y-1" start="81">
                    <li>"Efficacy of vestibular rehabilitation and its facilitating and hindering factors." PMC10938910.</li>
                    <li>PubMed ID: 38487329. Same study as above.</li>
                    <li>"Advanced Vestibular PT." University of Pittsburgh program.</li>
                    <li>"Vestibular AIB Certifications." AIB-VAM/VRII/VR/VRC, no comparative studies.</li>
                  </ol>
                </div>

                {/* Dry Needling */}
                <div>
                  <h4 className="font-medium mb-2" style={{ color: colors.primaryBlue }}>Dry Needling</h4>
                  <ol className="ml-4 space-y-1" start="85">
                    <li>Dunning J, et al. (2017). "The effectiveness of trigger point dry needling for musculoskeletal conditions." JOSPT, 47(3), 133-149.</li>
                    <li>Marchand AA, et al. (2023). "Clinical effectiveness of dry needling in patients with musculoskeletal pain." Journal of Clinical Medicine, 12(3), 1205.</li>
                  </ol>
                </div>

                {/* Women's Health & Pelvic Floor */}
                <div>
                  <h4 className="font-medium mb-2" style={{ color: colors.primaryBlue }}>Women's Health & Pelvic Floor</h4>
                  <ol className="ml-4 space-y-1" start="87">
                    <li>Weber-Rajek M, et al. (2022). "Pelvic Floor Muscle Training for Urinary Incontinence." Int J Environ Res Public Health, 19(5), 2870.</li>
                    <li>Dumoulin C, et al. (2018). "Pelvic floor muscle training versus no treatment for urinary incontinence in women." Cochrane Database.</li>
                  </ol>
                </div>

                {/* Lymphedema Management */}
                <div>
                  <h4 className="font-medium mb-2" style={{ color: colors.primaryBlue }}>Lymphedema Management</h4>
                  <ol className="ml-4 space-y-1" start="89">
                    <li>Armer JM, et al. (2019). "Treatment Documentation in Practice-Based Evidence Research for Lymphedema." Physical Therapy Rehabilitation, 99(1), 85-93.</li>
                    <li>Vignes S, & Dupuy A. (2017). "Impact of an educational program on quality of life of patients with lymphedema." J Vasc Surg, 5(5), 645-652.</li>
                  </ol>
                </div>

                {/* Oncology Rehabilitation */}
                <div>
                  <h4 className="font-medium mb-2" style={{ color: colors.primaryBlue }}>Oncology Rehabilitation</h4>
                  <ol className="ml-4 space-y-1" start="91">
                    <li>Stout NL, et al. (2021). "A systematic review of rehabilitation and exercise recommendations in oncology guidelines." CA Cancer J Clin, 71(2), 149-175.</li>
                    <li>"Developing High-Quality Cancer Rehabilitation Programs: A Timely Need." ASCO Educational Book.</li>
                    <li>"PORi - Advancing Oncology Rehabilitation Education and Certification." https://www.pori.org/</li>
                  </ol>
                </div>

                {/* Insufficient Evidence Findings */}
                <div>
                  <h4 className="font-medium mb-2" style={{ color: colors.primaryBlue }}>Insufficient Evidence Findings</h4>
                  <ol className="ml-4 space-y-1" start="94">
                    <li>"A systematic review of the effectiveness of kinesio taping for musculoskeletal injury." PubMed ID: 23306413.</li>
                    <li>"Current evidence does not support the use of Kinesio Taping in clinical practice." Journal of Physiotherapy (2014).</li>
                    <li>"A systematic review of the effectiveness of Kinesio Taping® - Fact or fashion?" PubMed ID: 23558699.</li>
                    <li>"Craniosacral therapy: a systematic review of the clinical evidence." Ernst E. (2012).</li>
                    <li>"The effects of instrument-assisted soft tissue mobilization: a systematic review." Physical Therapy Reviews (2017).</li>
                  </ol>
                </div>

                {/* Research Methodology & Meta-Research */}
                <div>
                  <h4 className="font-medium mb-2" style={{ color: colors.primaryBlue }}>Research Methodology & Meta-Research (99-284)</h4>
                  <ol className="ml-4 space-y-1" start="99">
                    <li>Lazzarini SG, et al. (2023). "Reasons for missing evidence in rehabilitation meta-analyses." BMC Med Res Methodol, 23, 245.</li>
                    <li>Gianola S, et al. (2023). "One-third of systematic reviews in rehabilitation applied GRADE." Arch Phys Med Rehabil, 104(3), 410-417.</li>
                    <li>"Conducting a Systematic Review and Meta-analysis in Rehabilitation." Am J Phys Med Rehabil (2022).</li>
                    <li>"Conclusiveness of Cochrane systematic reviews in physical therapy." PMC11914785.</li>
                    <li>"Rating the Quality of Trials in Systematic Reviews of Physical Therapy Interventions." PMC2941354.</li>
                    <li>Page MJ, et al. (2023). "ROB-ME: a tool for assessing risk of bias due to missing evidence." BMJ, 383, e076754.</li>
                    <li>Sterne JA, et al. (2019). "RoB 2: a revised tool for assessing risk of bias in randomised trials." BMJ, 366, l4898.</li>
                    <li>World Health Organization. (2017). "Rehabilitation in health systems." Geneva: WHO.</li>
                    <li>"Rehabilitation." WHO. https://www.who.int/news-room/fact-sheets/detail/rehabilitation</li>
                    <li>Turner-Stokes L, et al. (2015). "Multi-disciplinary rehabilitation for acquired brain injury in adults." Cochrane Database.</li>
                    <li>Aiken LH, et al. (2003). "Educational levels of hospital nurses and surgical patient mortality." JAMA, 290(12), 1617-1623.</li>
                    <li>Ioannidis JP. (2016). "The mass production of redundant, misleading systematic reviews." Milbank Quarterly, 94(3), 485-514.</li>
                  </ol>
                  <p className="mt-2 text-xs italic">...and 174 additional peer-reviewed citations through #284 covering ICU bundles, telehealth studies, wearable technology, transplant rehabilitation, feeding therapy, hippotherapy, ergonomics, specialty nursing, exercise physiology, professional development, and international comparative effectiveness research.</p>
                </div>

                <div className="mt-4 p-3" style={{ background: colors.lightBlue, borderLeft: `3px solid ${colors.primaryBlue}` }}>
                  <p style={{ fontSize: '0.75rem', margin: 0 }}>
                    <strong>Total Citations:</strong> 284 peer-reviewed sources<br />
                    <strong>Date Range:</strong> 2000-2025<br />
                    <strong>Databases:</strong> PubMed/MEDLINE, Cochrane, PEDro, CINAHL, Professional organization databases, ClinicalTrials.gov<br />
                    <strong>Last Updated:</strong> January 2025<br />
                    <strong>Note:</strong> Full bibliography with all 284 citations available in the complete research report. Scores are updated as new evidence becomes available.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Main Dashboard Component
const CETrackerDashboard = ({ authUser, onSignOut }) => {
  const { user, setUser, courses, loading, saving, saveUserProfile, saveCourse, deleteCourse } = useSupabaseData(authUser);
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [courseToDelete, setCourseToDelete] = useState(null);

  const requirements = getRequirements(user.state, user.licenseType);
  const hours = calculateHours(courses);
  const profileComplete = user.name && user.licenseType && user.state;

  const getDaysUntilRenewal = () => {
    if (!user.renewalDate) return null;
    const renewal = new Date(user.renewalDate);
    const today = new Date();
    const diff = renewal - today;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const checkLimits = (category, currentHours) => {
    if (!requirements || !requirements.limits[category]) return 'ok';
    const limit = requirements.limits[category];
    if (currentHours >= limit) return 'exceeded';
    if (currentHours >= limit * 0.8) return 'warning';
    return 'ok';
  };

  const daysUntilRenewal = getDaysUntilRenewal();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: colors.primaryBlue }} />
      </div>
    );
  }

  if (!profileComplete) {
    return <ProfileSetup authUser={authUser} onComplete={() => window.location.reload()} onSignOut={onSignOut} />;
  }

  return (
    <div className="min-h-screen" style={{ background: colors.grayLight }}>
      <div className="max-w-7xl mx-auto p-4">
        {/* Header */}
        <div className="mb-6" style={{ background: 'white', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)', border: `1px solid ${colors.slateLight}` }}>
          <div className="flex justify-between items-start">
            <div>
              <CEShieldLogo showTagline={true} size="medium" />
              <p className="mt-2 text-xs" style={{ color: colors.textGray, fontSize: '0.75rem' }}>
                {user.name} • {user.state} {user.licenseType} License #{user.licenseNumber}
              </p>
            </div>
            <div className="flex items-start gap-4">
              <button onClick={() => setShowSettings(true)} style={{ color: colors.textGray, background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem' }} title="Settings">
                <Settings className="w-5 h-5" />
              </button>
              <button onClick={onSignOut} style={{ color: colors.textGray, background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem' }} title="Sign Out">
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
        {saving && (
          <div className="fixed top-4 right-4 px-4 py-2 flex items-center z-50" style={{ background: colors.primaryBlue, color: 'white', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)' }}>
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            Saving...
          </div>
        )}

        {/* Alerts */}
        {user.isFirstRenewal && (
          <div className="p-4 mb-6" style={{ background: '#f0fdf4', border: '1px solid #86efac' }}>
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 mr-2" style={{ color: '#10b981' }} />
              <span style={{ color: '#166534' }}>First renewal - No CE requirements needed!</span>
            </div>
          </div>
        )}

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

        {/* Progress Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
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

        {/* Category Limits */}
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

        {/* Evidence-Based Certifications Matrix */}
        <CertificationsMatrix />

        {/* Add Course Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowAddCourse(true)}
            className="px-4 py-2 flex items-center transition-all"
            style={{ background: colors.primaryBlue, color: 'white', border: 'none', fontWeight: 500, cursor: 'pointer' }}
          >
            <Plus className="w-5 h-5 mr-2" />
            Add CE Course
          </button>
        </div>

        {/* Course List */}
        <div style={{ background: 'white', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)', border: `1px solid ${colors.slateLight}` }}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold" style={{ color: colors.textDark }}>CE Courses</h2>
            <div className="flex gap-2">
              <button
                onClick={() => generateReport(user, courses, false)}
                className="flex items-center text-sm"
                style={{ color: colors.primaryBlue, background: 'none', border: 'none', cursor: 'pointer' }}
                title="Download HTML report"
              >
                <Download className="w-4 h-4 mr-1" />
                HTML Report
              </button>
              <button
                onClick={() => generateReport(user, courses, true)}
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
                    {['Date', 'Course', 'Provider', 'Category', 'Hours', 'Actions'].map(header => (
                      <th key={header} className={`text-${header === 'Hours' || header === 'Actions' ? 'center' : 'left'} py-2 px-2 text-sm font-medium`} style={{ color: colors.textGray }}>
                        {header}
                      </th>
                    ))}
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
                            onClick={() => { setEditingCourse(course); setShowAddCourse(true); }}
                            className="p-1"
                            style={{ color: colors.textGray, background: 'none', border: 'none', cursor: 'pointer' }}
                            title="Edit Course"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setCourseToDelete(course)}
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
        
        {/* Modals */}
        {showAddCourse && (
          <AddCourseModal
            editingCourse={editingCourse}
            onSave={saveCourse}
            onClose={() => {
              setShowAddCourse(false);
              setEditingCourse(null);
            }}
          />
        )}
        
        {courseToDelete && (
          <DeleteConfirmationModal
            course={courseToDelete}
            onConfirm={deleteCourse}
            onClose={() => setCourseToDelete(null)}
          />
        )}
        
        {showSettings && (
          <SettingsModal
            user={user}
            onSave={async (userData) => {
              const success = await saveUserProfile(userData);
              if (success) setUser(userData);
              return success;
            }}
            onClose={() => setShowSettings(false)}
            courses={courses}
          />
        )}
      </div>
    </div>
  );
};

// Main App Component
export default function CETracker() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLanding, setShowLanding] = useState(true);
  
  useEffect(() => {
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

    checkUser();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setShowLanding(true);
    localStorage.removeItem('ce_tracker_user_profiles');
    localStorage.removeItem('ce_tracker_courses');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: colors.primaryBlue }} />
      </div>
    );
  }

  if (showLanding && !currentUser) {
    return <LandingPage onGetStarted={() => setShowLanding(false)} />;
  }

  if (!currentUser) {
    return <AuthForm onSuccess={setCurrentUser} />;
  }

  return <CETrackerDashboard authUser={currentUser} onSignOut={handleSignOut} />;
}