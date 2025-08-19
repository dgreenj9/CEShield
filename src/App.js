import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from './services/supabaseClient';
import LandingPage from './pages/LandingPage';
import AuthForm from './components/auth/AuthForm';
import Dashboard from './pages/Dashboard';
import { colors } from './utils/constants';

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

  return <Dashboard authUser={currentUser} onSignOut={handleSignOut} />;
}
