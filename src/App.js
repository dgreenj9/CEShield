import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Clock, FileText, Plus, Trash2, Download, Info, Loader2, Settings, Pencil, LogOut, User, Lock, Mail, Eye, EyeOff, Shield } from 'lucide-react';
import { supabase } from './supabaseClient';

// CE Shield Logo Component
const CEShieldLogo = ({ showTagline = true, className = "" }) => {
  if (showTagline) {
    return (
      <div className={className}>
        <div className="flex items-center justify-center gap-2">
          {/* Shield Icon */}
          <svg 
            width="60" 
            height="40" 
            viewBox="0 0 60 40" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <g transform="translate(0, 0)">
              <path d="M10 0 L10 20 Q10 28 25 32 Q40 28 40 20 L40 0 Z" 
                    fill="#dbeafe"/>
              <path d="M20 0 L20 20 Q20 28 35 32 Q50 28 50 20 L50 0 Z" 
                    fill="#06b6d4" opacity="0.85"/>
              <path d="M30 0 L30 20 Q30 28 45 32 Q60 28 60 20 L60 0 Z" 
                    fill="#8b5cf6" opacity="0.85"/>
            </g>
          </svg>
          {/* Text Logo - adjusted to match shield height */}
          <h1 className="text-[40px] leading-[40px] font-light text-gray-900">
            CE<span className="font-medium">Shield</span>
          </h1>
        </div>
        <p className="text-xs text-gray-600 tracking-wider text-center mt-1">
          TRACK EDUCATION. PROTECT YOUR LICENSE.
        </p>
      </div>
    );
  }
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Shield Icon Only */}
      <svg 
        width="40" 
        height="32" 
        viewBox="0 0 60 40" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <g transform="translate(0, 0)">
          <path d="M10 0 L10 20 Q10 28 25 32 Q40 28 40 20 L40 0 Z" 
                fill="#dbeafe"/>
          <path d="M20 0 L20 20 Q20 28 35 32 Q50 28 50 20 L50 0 Z" 
                fill="#06b6d4" opacity="0.85"/>
          <path d="M30 0 L30 20 Q30 28 45 32 Q60 28 60 20 L60 0 Z" 
                fill="#8b5cf6" opacity="0.85"/>
        </g>
      </svg>
      <h2 className="text-[32px] leading-[32px] font-light text-gray-900">
        CE<span className="font-medium">Shield</span>
      </h2>
    </div>
  );
};

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

// Auth Component
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="inline-block">
              <div className="flex items-center justify-center gap-2">
                <svg 
                  width="60" 
                  height="40" 
                  viewBox="0 0 60 40" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <g transform="translate(0, 0)">
                    <path d="M10 0 L10 20 Q10 28 25 32 Q40 28 40 20 L40 0 Z" 
                          fill="#dbeafe"/>
                    <path d="M20 0 L20 20 Q20 28 35 32 Q50 28 50 20 L50 0 Z" 
                          fill="#06b6d4" opacity="0.85"/>
                    <path d="M30 0 L30 20 Q30 28 45 32 Q60 28 60 20 L60 0 Z" 
                          fill="#8b5cf6" opacity="0.85"/>
                  </g>
                </svg>
                <h1 className="text-[40px] leading-[40px] font-light text-gray-900">
                  CE<span className="font-medium">Shield</span>
                </h1>
              </div>
              <p className="text-xs text-gray-600 tracking-wider text-center mt-1">
                TRACK EDUCATION. PROTECT YOUR LICENSE.
              </p>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <p className="text-gray-700 text-center">
            {isSignUp ? 'Create your account' : 'Sign in to your account'}
          </p>
        </div>

        <div onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Mail className="inline w-4 h-4 mr-1" />
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Lock className="inline w-4 h-4 mr-1" />
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-2.5 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-md text-sm">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !email || !password}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
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
            className="text-blue-600 hover:text-blue-700 text-sm"
          >
            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
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
  
  // Check for existing session on mount
  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    // Clear local data
    localStorage.removeItem('ce_tracker_user_profiles');
    localStorage.removeItem('ce_tracker_courses');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!currentUser) {
    return <AuthForm onSuccess={setCurrentUser} />;
  }

  return <CETrackerDashboard user={currentUser} onSignOut={handleSignOut} />;
}

// CE Tracker Dashboard (your existing component with modifications)
function CETrackerDashboard({ user: authUser, onSignOut }) {
  // State management
  const [user, setUser] = useState({
    name: '',
    licenseType: '',
    licenseNumber: '',
    renewalDate: '',
    isFirstRenewal: false,
    state: 'IL' // Add state field, default to Illinois
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

  // Save user profile to Supabase (only when explicitly called)
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

  // Remove the auto-save useEffect - we'll save manually instead

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
    // Add other states here in the future
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

  // Parse certificate using Google Vision API (same as before)
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
        e.target.value = ''; // Reset the input
        return;
      }
      
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        alert('Please upload a PDF or image file (JPG, PNG)');
        e.target.value = ''; // Reset the input
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
      e.target.value = ''; // Reset the input after processing
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

  // Generate report or certificates
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
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      background: #f5f5f5;
      padding: 20px;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      padding: 40px;
      border-radius: 10px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .header {
      border-bottom: 3px solid #2563eb;
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
      font-size: 40px;
      line-height: 40px;
      font-weight: 300;
      color: #111;
    }
    .logo-text span {
      font-weight: 500;
    }
    .tagline {
      font-size: 10px;
      color: #666;
      letter-spacing: 1.5px;
    }
    h1 { 
      color: #1e40af;
      margin-bottom: 10px;
      font-size: 28px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 30px;
      padding: 20px;
      background: #f8fafc;
      border-radius: 8px;
    }
    .info-item {
      display: flex;
      flex-direction: column;
    }
    .info-label {
      font-size: 12px;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }
    .info-value {
      font-size: 16px;
      font-weight: 600;
      color: #1e293b;
    }
    .progress-section {
      margin-bottom: 30px;
    }
    .progress-bar {
      width: 100%;
      height: 30px;
      background: #e5e7eb;
      border-radius: 15px;
      overflow: hidden;
      position: relative;
      margin: 10px 0;
    }
    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #3b82f6, #2563eb);
      border-radius: 15px;
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
      background: #f8fafc;
      border-radius: 8px;
      border-left: 4px solid #3b82f6;
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
      background: #f1f5f9;
      padding: 12px;
      text-align: left;
      font-weight: 600;
      color: #475569;
      border-bottom: 2px solid #e2e8f0;
    }
    td {
      padding: 12px;
      border-bottom: 1px solid #e2e8f0;
    }
    tr:hover {
      background: #f8fafc;
    }
    .certificate-badge {
      display: inline-block;
      padding: 2px 8px;
      background: #10b981;
      color: white;
      border-radius: 4px;
      font-size: 12px;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
      text-align: center;
      color: #64748b;
      font-size: 14px;
    }
    .alert {
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 20px;
    }
    .alert-info {
      background: #dbeafe;
      border-left: 4px solid #3b82f6;
      color: #1e40af;
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
      background: #f8fafc;
      border-radius: 8px;
    }
    .stat-value {
      font-size: 32px;
      font-weight: bold;
      color: #2563eb;
    }
    .stat-label {
      font-size: 14px;
      color: #64748b;
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
          <svg width="60" height="40" viewBox="0 0 60 40" xmlns="http://www.w3.org/2000/svg">
            <g transform="translate(0, 0)">
              <path d="M10 0 L10 20 Q10 28 25 32 Q40 28 40 20 L40 0 Z" fill="#dbeafe"/>
              <path d="M20 0 L20 20 Q20 28 35 32 Q50 28 50 20 L50 0 Z" fill="#06b6d4" opacity="0.85"/>
              <path d="M30 0 L30 20 Q30 28 45 32 Q60 28 60 20 L60 0 Z" fill="#8b5cf6" opacity="0.85"/>
            </g>
          </svg>
          <div class="logo-text">CE<span>Shield</span></div>
        </div>
        <div class="tagline">TRACK EDUCATION. PROTECT YOUR LICENSE.</div>
      </div>
      <h1>${user.state} ${user.licenseType} Continuing Education Report</h1>
      <p style="color: #64748b; margin-top: 10px;">Generated on ${reportDate}</p>
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
      <h2 style="color: #1e293b; margin-bottom: 20px;">Overall Progress</h2>
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
          <div class="stat-value">${daysUntilRenewal || 'N/A'}</div>
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
      <h2 style="color: #1e293b; margin-bottom: 20px;">Mandatory Requirements</h2>
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
      <h2 style="color: #1e293b; margin-bottom: 20px;">Completed Courses</h2>
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
      <p style="margin-top: 10px; color: #64748b; font-size: 14px;">
        Total Courses: ${courses.length} | Total Hours: ${hours.total}
      </p>
    </div>

    <div class="category-limits">
      <h2 style="color: #1e293b; margin: 30px 0 20px;">Category Limits</h2>
      <div class="requirements-grid">
        ${Object.entries(requirements?.limits || {}).map(([category, limit]) => {
          const current = hours[category] || 0;
          const percentage = (current / limit) * 100;
          const status = checkLimits(category, current);
          return `
            <div class="requirement-item" style="border-left-color: ${
              status === 'exceeded' ? '#ef4444' : 
              status === 'warning' ? '#f59e0b' : 
              '#3b82f6'
            }">
              <strong>${category.replace(/([A-Z])/g, ' $1').trim()}</strong><br>
              <span style="font-size: 20px; font-weight: bold; color: ${
                status === 'exceeded' ? '#ef4444' : '#1e293b'
              }">${current}/${limit}</span> hours
              ${status === 'exceeded' ? '<br><small style="color: #ef4444;">Limit exceeded!</small>' : ''}
            </div>
          `;
        }).join('')}
      </div>
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
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Setup screen - show if profile is not complete
  if (!profileComplete) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-md mx-auto mt-10">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center">
                <CEShieldLogo showTagline={false} className="h-10" />
              </div>
              <button
                onClick={onSignOut}
                className="text-gray-500 hover:text-gray-700"
                title="Sign Out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <User className="inline w-4 h-4 mr-1" />
                Signed in as: {authUser.email}
              </p>
            </div>

            <div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Your State
                </label>
                <div className="relative">
                  <select
                    value={user.state || ''}
                    onChange={(e) => setUser({...user, state: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Choose a state</option>
                    <option value="IL">Illinois</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Currently supporting Illinois. More states coming soon!
                </p>
              </div>

              {user.state && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Your License Type
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setUser({...user, licenseType: 'PT'})}
                      className={`p-4 rounded-lg border-2 ${
                        user.licenseType === 'PT' 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className="font-semibold">PT</div>
                      <div className="text-sm text-gray-600">Physical Therapist</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {user.state === 'IL' ? '40 hours/2 years' : 'Requirements vary'}
                      </div>
                    </button>
                    <button
                      onClick={() => setUser({...user, licenseType: 'OT'})}
                      className={`p-4 rounded-lg border-2 ${
                        user.licenseType === 'OT' 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className="font-semibold">OT</div>
                      <div className="text-sm text-gray-600">Occupational Therapist</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {user.state === 'IL' ? '24 hours/2 years' : 'Requirements vary'}
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {user.state && user.licenseType && (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Your Name
                    </label>
                    <input
                      type="text"
                      value={user.name}
                      onChange={(e) => setUser({...user, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {user.state} License Number
                    </label>
                    <input
                      type="text"
                      value={user.licenseNumber}
                      onChange={(e) => setUser({...user, licenseNumber: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder={`Enter your ${user.state} license number`}
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Renewal Date
                    </label>
                    <input
                      type="date"
                      value={user.renewalDate}
                      onChange={(e) => setUser({...user, renewalDate: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
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

  // Main dashboard (rest of your existing UI with minor modifications)
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4">
        {/* Header with Sign Out button */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <div className="mb-2">
                <div className="flex items-center gap-2">
                  <svg 
                    width="40" 
                    height="32" 
                    viewBox="0 0 60 40" 
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <g transform="translate(0, 0)">
                      <path d="M10 0 L10 20 Q10 28 25 32 Q40 28 40 20 L40 0 Z" 
                            fill="#dbeafe"/>
                      <path d="M20 0 L20 20 Q20 28 35 32 Q50 28 50 20 L50 0 Z" 
                            fill="#06b6d4" opacity="0.85"/>
                      <path d="M30 0 L30 20 Q30 28 45 32 Q60 28 60 20 L60 0 Z" 
                            fill="#8b5cf6" opacity="0.85"/>
                    </g>
                  </svg>
                  <h2 className="text-[32px] leading-[32px] font-light text-gray-900">
                    CE<span className="font-medium">Shield</span>
                  </h2>
                </div>
                <p className="text-xs text-gray-600 tracking-wider mt-1">
                  TRACK EDUCATION. PROTECT YOUR LICENSE.
                </p>
              </div>
              <p className="text-gray-700 mt-2">
                {user.name} • {user.state} {user.licenseType} License #{user.licenseNumber}
              </p>
            </div>
            <div className="flex items-start gap-4">
              <button
                onClick={() => setShowSettings(true)}
                className="text-gray-600 hover:text-gray-800 p-2"
                title="Settings"
              >
                <Settings className="w-5 h-5" />
              </button>
              <button
                onClick={onSignOut}
                className="text-gray-600 hover:text-gray-800 p-2"
                title="Sign Out"
              >
                <LogOut className="w-5 h-5" />
              </button>
              <div className="text-right">
                {daysUntilRenewal !== null && (
                  <div className={`text-lg font-semibold ${
                    daysUntilRenewal < 90 ? 'text-red-600' : 'text-gray-700'
                  }`}>
                    <Clock className="inline-block w-5 h-5 mr-1" />
                    {daysUntilRenewal} days until renewal
                  </div>
                )}
                <p className="text-sm text-gray-600">
                  Renewal: {new Date(user.renewalDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Save indicator */}
        {savingData && (
          <div className="fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center z-50">
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            Saving...
          </div>
        )}

        {/* First Renewal Notice */}
        {user.isFirstRenewal && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
              <span className="text-green-800">
                First renewal - No CE requirements needed!
              </span>
            </div>
          </div>
        )}

        {/* Cultural Competency Alert - Illinois specific */}
        {user.state === 'IL' && !user.isFirstRenewal && hours.culturalCompetency === 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <Info className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
              <div className="text-blue-800">
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
          {/* Total Progress */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Overall Progress</h2>
            <div className="relative pt-1">
              <div className="flex mb-2 items-center justify-between">
                <div>
                  <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
                    Total CE Hours
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold inline-block text-blue-600">
                    {hours.total} / {requirements?.total || 0}
                  </span>
                </div>
              </div>
              <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-200">
                <div 
                  style={{ width: `${Math.min((hours.total / (requirements?.total || 1)) * 100, 100)}%` }}
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-600"
                />
              </div>
            </div>
          </div>

          {/* Mandatory Requirements */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Mandatory Requirements</h2>
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
                      {isNew2025 && <span className="text-blue-600 text-xs ml-1">(NEW 2025)</span>}
                    </span>
                    <div className="flex items-center">
                      <span className={`text-sm font-medium mr-2 ${isComplete ? 'text-green-600' : 'text-red-600'}`}>
                        {completed}/{required}
                      </span>
                      {isComplete ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-600" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Category Limits */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Category Limits</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(requirements?.limits || {}).map(([category, limit]) => {
              const current = hours[category] || 0;
              const status = checkLimits(category, current);
              
              return (
                <div key={category} className="text-center">
                  <div className="text-xs text-gray-600 capitalize">
                    {category.replace(/([A-Z])/g, ' $1').trim()}
                  </div>
                  <div className={`text-lg font-semibold ${
                    status === 'exceeded' ? 'text-red-600' : 
                    status === 'warning' ? 'text-yellow-600' : 
                    'text-gray-800'
                  }`}>
                    {current}/{limit}
                  </div>
                  {status === 'exceeded' && (
                    <div className="text-xs text-red-600">Limit exceeded!</div>
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
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add CE Course
          </button>
        </div>

        {/* Course List */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">CE Courses</h2>
            <div className="flex gap-2">
              <button
                onClick={() => generateReport(false)}
                className="text-blue-600 hover:text-blue-700 flex items-center text-sm"
                title="Download HTML report"
              >
                <Download className="w-4 h-4 mr-1" />
                HTML Report
              </button>
              <button
                onClick={() => generateReport(true)}
                className="text-blue-600 hover:text-blue-700 flex items-center text-sm"
                title="Download all certificates/documentation as ZIP"
              >
                <Download className="w-4 h-4 mr-1" />
                Certificates (ZIP)
              </button>
            </div>
          </div>
          
          {courses.length === 0 ? (
            <p className="text-gray-600 text-center py-8">
              No courses added yet. Click "Add CE Course" to get started.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2 text-sm font-medium text-gray-700">Date</th>
                    <th className="text-left py-2 px-2 text-sm font-medium text-gray-700">Course</th>
                    <th className="text-left py-2 px-2 text-sm font-medium text-gray-700">Provider</th>
                    <th className="text-left py-2 px-2 text-sm font-medium text-gray-700">Category</th>
                    <th className="text-center py-2 px-2 text-sm font-medium text-gray-700">Hours</th>
                    <th className="text-center py-2 px-2 text-sm font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.sort((a, b) => new Date(b.date) - new Date(a.date)).map(course => (
                    <tr key={course.id} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-2 text-sm">{new Date(course.date).toLocaleDateString()}</td>
                      <td className="py-2 px-2 text-sm">
                        <div>{course.title}</div>
                        <div className="flex items-center gap-2">
                          {course.format === 'selfStudy' && (
                            <span className="text-xs text-gray-500">Self-study</span>
                          )}
                          {course.certificate && (
                            <span className="text-xs text-green-600 flex items-center">
                              <FileText className="w-3 h-3 mr-1" />
                              Certificate
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2 px-2 text-sm">{course.provider}</td>
                      <td className="py-2 px-2 text-sm capitalize">
                        {course.category === 'culturalCompetency' && (
                          <span className="text-blue-600 text-xs">(NEW) </span>
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
                              className="p-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded"
                              title="Download Certificate"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => editCourse(course)}
                            className="p-1 text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded"
                            title="Edit Course"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => confirmDelete(course)}
                            className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
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
        
        {/* Add all the modals here */}
        {showAddCourse && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  {editingCourse ? 'Edit CE Course' : 'Add CE Course'}
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload Certificate/Documentation <span className="text-xs text-gray-500">(PDF, JPG, PNG)</span>
                    </label>
                    <div className="space-y-2">
                      <div className="relative">
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={handleCertificateUpload}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          disabled={isParsing}
                        />
                        {isParsing && (
                          <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center rounded-md">
                            <div className="text-center">
                              <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto mb-2" />
                              <div className="text-sm text-blue-600">Scanning certificate...</div>
                            </div>
                          </div>
                        )}
                      </div>
                      {newCourse.certificate && (
                        <div className="flex items-center justify-between bg-gray-50 p-2 rounded">
                          <span className="text-sm text-gray-600 truncate">
                            <FileText className="inline w-4 h-4 mr-1" />
                            {newCourse.certificate.name}
                          </span>
                          <button
                            type="button"
                            onClick={() => setNewCourse(prev => ({...prev, certificate: null}))}
                            className="text-red-600 hover:text-red-700 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                      <p className="text-xs text-gray-500">
                        Upload any supporting documentation: certificates, attendance lists, teaching records, journal club participation, etc.
                        {editingCourse && !isParsing && ' • Images (JPG/PNG) can be scanned for auto-fill.'}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Course Title *
                    </label>
                    <input
                      type="text"
                      value={newCourse.title}
                      onChange={(e) => setNewCourse(prev => ({...prev, title: e.target.value}))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Provider Name *
                    </label>
                    <input
                      type="text"
                      value={newCourse.provider}
                      onChange={(e) => setNewCourse(prev => ({...prev, provider: e.target.value}))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date Completed *
                    </label>
                    <input
                      type="date"
                      value={newCourse.date}
                      onChange={(e) => setNewCourse(prev => ({...prev, date: e.target.value}))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hours * <span className="text-xs text-gray-500">(1 hour = 50 minutes)</span>
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      value={newCourse.hours}
                      onChange={(e) => setNewCourse(prev => ({...prev, hours: e.target.value}))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category *
                    </label>
                    <select
                      value={newCourse.category}
                      onChange={(e) => setNewCourse(prev => ({...prev, category: e.target.value}))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Format *
                    </label>
                    <select
                      value={newCourse.format}
                      onChange={(e) => setNewCourse(prev => ({...prev, format: e.target.value}))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
                      className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleAddCourse}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      {editingCourse ? 'Update Course' : 'Add Course'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
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

  // Modal Components (defined inside CETrackerDashboard)
  function AddCourseForm() {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload Certificate <span className="text-xs text-gray-500">(JPG, PNG only for OCR)</span>
          </label>
          <div className="space-y-2">
            <div className="relative">
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleCertificateUpload}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                disabled={isParsing}
              />
              {isParsing && (
                <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center rounded-md">
                  <div className="text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto mb-2" />
                    <div className="text-sm text-blue-600">Scanning certificate...</div>
                  </div>
                </div>
              )}
            </div>
            {newCourse.certificate && (
              <div className="flex items-center justify-between bg-gray-50 p-2 rounded">
                <span className="text-sm text-gray-600 truncate">
                  <FileText className="inline w-4 h-4 mr-1" />
                  {newCourse.certificate.name}
                </span>
                <button
                  onClick={() => setNewCourse(prev => ({...prev, certificate: null}))}
                  className="text-red-600 hover:text-red-700 text-sm"
                >
                  Remove
                </button>
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Course Title *
          </label>
          <input
            type="text"
            value={newCourse.title}
            onChange={(e) => setNewCourse(prev => ({...prev, title: e.target.value}))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Provider Name *
          </label>
          <input
            type="text"
            value={newCourse.provider}
            onChange={(e) => setNewCourse(prev => ({...prev, provider: e.target.value}))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date Completed *
          </label>
          <input
            type="date"
            value={newCourse.date}
            onChange={(e) => setNewCourse(prev => ({...prev, date: e.target.value}))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Hours * <span className="text-xs text-gray-500">(1 hour = 50 minutes)</span>
          </label>
          <input
            type="number"
            step="0.5"
            min="0.5"
            value={newCourse.hours}
            onChange={(e) => setNewCourse(prev => ({...prev, hours: e.target.value}))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category *
          </label>
          <select
            value={newCourse.category}
            onChange={(e) => setNewCourse(prev => ({...prev, category: e.target.value}))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Format *
          </label>
          <select
            value={newCourse.format}
            onChange={(e) => setNewCourse(prev => ({...prev, format: e.target.value}))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={handleAddCourse}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            {editingCourse ? 'Update Course' : 'Add Course'}
          </button>
        </div>
      </div>
    );
  }

  function DeleteConfirmationModal() {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-md w-full p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Confirm Deletion</h3>
          <p className="text-gray-600 mb-6">
            Are you sure you want to delete the course "{courseToDelete.title}"? This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setCourseToDelete(null)}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={() => deleteCourse(courseToDelete.id)}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Delete Course
            </button>
          </div>
        </div>
      </div>
    );
  }

  function SettingsModal() {
    // Local state for the form
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
        <div className="bg-white rounded-lg max-w-md w-full">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Profile Settings</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  State
                </label>
                <select
                  value={localUser.state || 'IL'}
                  onChange={(e) => setLocalUser({...localUser, state: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="IL">Illinois</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Currently supporting Illinois. More states coming soon!
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                    className={`p-3 rounded-lg border-2 ${
                      localUser.licenseType === 'PT' 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="font-semibold">PT</div>
                    <div className="text-xs text-gray-600">
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
                    className={`p-3 rounded-lg border-2 ${
                      localUser.licenseType === 'OT' 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="font-semibold">OT</div>
                    <div className="text-xs text-gray-600">
                      {localUser.state === 'IL' ? '24 hours/2 years' : 'Requirements vary'}
                    </div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Name
                </label>
                <input
                  type="text"
                  value={localUser.name}
                  onChange={(e) => setLocalUser({...localUser, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {localUser.state} License Number
                </label>
                <input
                  type="text"
                  value={localUser.licenseNumber}
                  onChange={(e) => setLocalUser({...localUser, licenseNumber: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Renewal Date
                </label>
                <input
                  type="date"
                  value={localUser.renewalDate}
                  onChange={(e) => setLocalUser({...localUser, renewalDate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  disabled={savingData}
                >
                  {savingData ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}