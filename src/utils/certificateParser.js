import { supabase } from '../services/supabaseClient';

// Parses a certificate image via the parse-certificate Supabase Edge Function.
// The Google Vision key lives server-side as a Supabase secret — it never
// ships to the browser. The user's auth JWT is attached automatically by
// supabase.functions.invoke().
export const parseCertificate = async (file) => {
  if (!file) return null;
  try {
    const base64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result || '';
        const comma = result.indexOf(',');
        resolve(comma >= 0 ? result.slice(comma + 1) : result);
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });

    const { data, error } = await supabase.functions.invoke('parse-certificate', {
      body: { imageBase64: base64, mimeType: file.type },
    });

    if (error) {
      console.error('parse-certificate error:', error);
      alert(`Error scanning certificate: ${error.message || 'unknown error'}`);
      return null;
    }
    if (data?.error) {
      console.error('parse-certificate returned error:', data.error);
      alert(`Error scanning certificate: ${data.error}`);
      return null;
    }
    if (!data) return null;

    // Function returns { title, provider, date, hours, category, raw }.
    // The caller in AddCourseModal only uses the first 5 fields.
    return {
      title: data.title || '',
      provider: data.provider || '',
      date: data.date || '',
      hours: data.hours || '',
      category: data.category || 'general',
    };
  } catch (err) {
    console.error('parseCertificate exception:', err);
    alert(`Error scanning certificate: ${err.message}`);
    return null;
  }
};
