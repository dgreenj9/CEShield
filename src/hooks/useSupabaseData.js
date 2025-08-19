import { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

// Custom hooks for data management
export const useSupabaseData = (authUser) => {
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
