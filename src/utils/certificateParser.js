import { GOOGLE_VISION_API_KEY } from './constants';

// Certificate parsing utility
export const parseCertificate = async (file) => {
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
