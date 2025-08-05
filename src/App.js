import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Clock, FileText, Plus, Trash2, Download, Info, Loader2, Settings } from 'lucide-react';

// ⚠️ IMPORTANT: Add your Google Vision API key here
// Get your key from: https://console.cloud.google.com/apis/credentials
const GOOGLE_VISION_API_KEY = process.env.REACT_APP_GOOGLE_VISION_KEY || 'YOUR_API_KEY_HERE';
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
    headerView.setUint16(4, 0x0014, true); // Version needed
    headerView.setUint16(6, 0, true); // Flags
    headerView.setUint16(8, 0, true); // Compression method (none)
    headerView.setUint16(10, dosTime, true);
    headerView.setUint16(12, dosDate, true);
    headerView.setUint32(14, 0, true); // CRC-32 (0 for simplicity)
    headerView.setUint32(18, contentBytes.length, true); // Compressed size
    headerView.setUint32(22, contentBytes.length, true); // Uncompressed size
    headerView.setUint16(26, nameBytes.length, true); // Filename length
    headerView.setUint16(28, 0, true); // Extra field length
    
    // Store central directory info
    centralDirectory.push({
      offset,
      nameBytes,
      contentSize: contentBytes.length,
      dosTime,
      dosDate
    });
    
    // Add to file data
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
    cdView.setUint16(4, 0x0014, true); // Version made by
    cdView.setUint16(6, 0x0014, true); // Version needed
    cdView.setUint16(8, 0, true); // Flags
    cdView.setUint16(10, 0, true); // Compression
    cdView.setUint16(12, entry.dosTime, true);
    cdView.setUint16(14, entry.dosDate, true);
    cdView.setUint32(16, 0, true); // CRC-32
    cdView.setUint32(20, entry.contentSize, true); // Compressed size
    cdView.setUint32(24, entry.contentSize, true); // Uncompressed size
    cdView.setUint16(28, entry.nameBytes.length, true); // Filename length
    cdView.setUint16(30, 0, true); // Extra field length
    cdView.setUint16(32, 0, true); // Comment length
    cdView.setUint16(34, 0, true); // Disk number
    cdView.setUint16(36, 0, true); // Internal attributes
    cdView.setUint32(38, 0, true); // External attributes
    cdView.setUint32(42, entry.offset, true); // Offset
    
    fileDataArray.push(new Uint8Array(cdHeader));
    fileDataArray.push(entry.nameBytes);
    offset += cdHeader.byteLength + entry.nameBytes.length;
  }
  
  // Create end of central directory
  const eocd = new ArrayBuffer(22);
  const eocdView = new DataView(eocd);
  eocdView.setUint32(0, END_OF_CENTRAL_DIRECTORY, true);
  eocdView.setUint16(4, 0, true); // Disk number
  eocdView.setUint16(6, 0, true); // CD start disk
  eocdView.setUint16(8, files.length, true); // Entries on disk
  eocdView.setUint16(10, files.length, true); // Total entries
  eocdView.setUint32(12, offset - cdStart, true); // CD size
  eocdView.setUint32(16, cdStart, true); // CD offset
  eocdView.setUint16(20, 0, true); // Comment length
  
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

const CETracker = () => {
  // Initialize state from localStorage or defaults
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('ceTrackerUser');
    return saved ? JSON.parse(saved) : {
      name: '',
      licenseType: '',
      licenseNumber: '',
      renewalDate: '',
      isFirstRenewal: false
    };
  });

  const [courses, setCourses] = useState(() => {
    const saved = localStorage.getItem('ceTrackerCourses');
    return saved ? JSON.parse(saved) : [];
  });

  const [showAddCourse, setShowAddCourse] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
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

  // State for certificate parsing
  const [isParsing, setIsParsing] = useState(false);

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem('ceTrackerUser', JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem('ceTrackerCourses', JSON.stringify(courses));
  }, [courses]);

  // Define requirements based on license type
  const getRequirements = () => {
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
      
      // Add to specific category
      if (hours[course.category] !== undefined) {
        hours[course.category] += courseHours;
      }
      
      // Track format-based categories
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
      // Check if API key is set
      if (GOOGLE_VISION_API_KEY === 'YOUR_API_KEY_HERE') {
        alert('Please add your Google Vision API key to the code before using OCR.\n\nEdit the GOOGLE_VISION_API_KEY variable at the top of the file.');
        setIsParsing(false);
        return null;
      }

      // Convert file to base64
      const reader = new FileReader();
      const base64 = await new Promise((resolve) => {
        reader.onloadend = () => {
          // Remove data URL prefix to get pure base64
          const base64String = reader.result.split(',')[1];
          resolve(base64String);
        };
        reader.readAsDataURL(file);
      });

      // Call Google Vision API
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

      console.log('Extracted text:', extractedText);

      // Parse the extracted text
      const parsedData = {
        title: '',
        provider: '',
        date: '',
        hours: '',
        category: 'general'
      };

      // Extract course title (usually the largest/first substantive text after "Certificate")
      const titleMatch = extractedText.match(/Certificate\s+of\s+(?:Completion|Achievement|Attendance)?\s*(?:for)?\s*([^\n]+)/i) ||
                        extractedText.match(/(?:This is to certify that|This certifies that)[^\n]+(?:has successfully completed|completed|attended)\s*([^\n]+)/i) ||
                        extractedText.match(/([A-Z][^.!?\n]{10,60})/);
      if (titleMatch) {
        parsedData.title = titleMatch[1].trim().replace(/\s+/g, ' ');
      }

      // Extract provider
      const providerPatterns = [
        /(?:provided by|sponsored by|offered by|presented by|issued by)\s*:?\s*([^\n,]+)/i,
        /(?:Provider|Organization|Institution|Company)\s*:?\s*([^\n,]+)/i
      ];
      for (const pattern of providerPatterns) {
        const match = extractedText.match(pattern);
        if (match) {
          parsedData.provider = match[1].trim();
          break;
        }
      }

      // Extract hours
      const hoursPatterns = [
        /(\d+\.?\d*)\s*(?:contact\s*)?(?:hours?|ceus?|ce\s*hours?|continuing\s*education\s*units?)/i,
        /(?:hours?|ceus?)\s*:?\s*(\d+\.?\d*)/i,
        /(\d+\.?\d*)\s*(?:hours?\s*)?(?:of\s*continuing\s*education)/i
      ];
      for (const pattern of hoursPatterns) {
        const match = extractedText.match(pattern);
        if (match) {
          parsedData.hours = match[1];
          break;
        }
      }

      // Extract date
      const datePatterns = [
        /(?:Date|Completed|Completion|Issued)\s*:?\s*(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/i,
        /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/,
        /(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(\d{4})/i
      ];
      
      for (const pattern of datePatterns) {
        const match = extractedText.match(pattern);
        if (match) {
          if (pattern.source.includes('January')) {
            // Month name format
            const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                              'July', 'August', 'September', 'October', 'November', 'December'];
            const monthNum = monthNames.indexOf(match[1]) + 1;
            parsedData.date = `${match[3]}-${monthNum.toString().padStart(2, '0')}-${match[2].padStart(2, '0')}`;
          } else {
            // Numeric format
            const month = match[1].padStart(2, '0');
            const day = match[2].padStart(2, '0');
            const year = match[3].length === 2 ? '20' + match[3] : match[3];
            parsedData.date = `${year}-${month}-${day}`;
          }
          break;
        }
      }

      // Detect category based on content
      const textLower = extractedText.toLowerCase();
      if (/ethics|ethical\s*practice|professional\s*ethics/i.test(textLower)) {
        parsedData.category = 'ethics';
      } else if (/sexual\s*harassment|harassment\s*prevention/i.test(textLower)) {
        parsedData.category = 'sexualHarassment';
      } else if (/cultural\s*competenc|cultural\s*awareness|diversity|cultural\s*sensitivity/i.test(textLower)) {
        parsedData.category = 'culturalCompetency';
      } else if (/implicit\s*bias|unconscious\s*bias/i.test(textLower)) {
        parsedData.category = 'implicitBias';
      } else if (/dementia|alzheimer|cognitive\s*impairment/i.test(textLower)) {
        parsedData.category = 'dementia';
      }

      setIsParsing(false);
      return parsedData;
      
    } catch (error) {
      console.error('Error parsing certificate:', error);
      setIsParsing(false);
      alert(`Error scanning certificate: ${error.message}\n\nPlease check your API key and try again, or fill in the fields manually.`);
      return null;
    }
  };

  // Handle certificate upload
  const handleCertificateUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }
      
      // Check file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        alert('Please upload a PDF or image file (JPG, PNG)');
        return;
      }
      
      // Handle PDFs - they need to be converted to images first
      if (file.type === 'application/pdf') {
        alert('PDF scanning requires converting to image first.\n\nFor now, please:\n1. Take a screenshot of your PDF certificate\n2. Upload the screenshot instead\n\nOr fill in the fields manually.');
        return;
      }
      
      // Read file as base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        setNewCourse({
          ...newCourse,
          certificate: {
            name: file.name,
            type: file.type,
            data: reader.result
          }
        });

        // Ask if user wants to auto-fill form
        if (window.confirm('Would you like to scan this certificate to auto-fill the form fields?\n\nThis will use Google Vision API (requires API key).')) {
          const parsedData = await parseCertificate(file);
          if (parsedData) {
            // Update form fields with parsed data
            setNewCourse(prev => ({
              ...prev,
              title: parsedData.title || prev.title,
              provider: parsedData.provider || prev.provider,
              date: parsedData.date || prev.date,
              hours: parsedData.hours || prev.hours,
              category: parsedData.category || prev.category
            }));
            
            // Alert user about what was extracted
            const extracted = [];
            if (parsedData.title) extracted.push(`Title: ${parsedData.title}`);
            if (parsedData.provider) extracted.push(`Provider: ${parsedData.provider}`);
            if (parsedData.date) extracted.push(`Date: ${parsedData.date}`);
            if (parsedData.hours) extracted.push(`Hours: ${parsedData.hours}`);
            if (parsedData.category !== 'general') extracted.push(`Category: ${parsedData.category}`);
            
            if (extracted.length > 0) {
              alert('Successfully extracted:\n\n' + extracted.join('\n') + '\n\nPlease review and correct any fields as needed.');
            } else {
              alert('Could not extract information from this certificate. Please fill in the fields manually.');
            }
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Add new course
  const handleAddCourse = (e) => {
    e.preventDefault();
    
    // Validate hours
    const hoursNum = parseFloat(newCourse.hours);
    if (isNaN(hoursNum) || hoursNum <= 0) {
      alert('Please enter valid hours');
      return;
    }

    // Check limits before adding
    if (newCourse.format === 'selfStudy' && !newCourse.hasTest) {
      alert('Self-study courses must include a test to count for CE');
      return;
    }

    const newCourseData = {
      ...newCourse,
      id: Date.now(),
      hours: hoursNum
    };

    setCourses([...courses, newCourseData]);
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
  };

  // Delete course
  const deleteCourse = (id) => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      setCourses(courses.filter(c => c.id !== id));
    }
  };

  // Generate ZIP report with certificates
  const generateReport = async () => {
    const reportData = {
      user,
      courses,
      hours,
      requirements,
      generatedDate: new Date().toLocaleDateString()
    };
    
    // Create the HTML report
    let report = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CE Hours Report - ${user.name}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: white;
        }
        .header {
            background: #1e40af;
            color: white;
            padding: 30px;
            border-radius: 8px;
            margin-bottom: 30px;
        }
        .header h1 {
            margin: 0 0 10px 0;
            font-size: 28px;
        }
        .header p {
            margin: 5px 0;
            opacity: 0.9;
        }
        .section {
            margin-bottom: 30px;
            background: #f9fafb;
            padding: 20px;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
        }
        .section h2 {
            color: #1e40af;
            margin-top: 0;
            font-size: 20px;
            border-bottom: 2px solid #1e40af;
            padding-bottom: 10px;
        }
        .progress-bar {
            background: #e5e7eb;
            height: 24px;
            border-radius: 12px;
            overflow: hidden;
            margin: 10px 0;
        }
        .progress-fill {
            background: #1e40af;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 14px;
            font-weight: 600;
            transition: width 0.3s ease;
        }
        .requirement-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 0;
            border-bottom: 1px solid #e5e7eb;
        }
        .requirement-item:last-child {
            border-bottom: none;
        }
        .status-badge {
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 14px;
            font-weight: 600;
        }
        .complete {
            background: #10b981;
            color: white;
        }
        .incomplete {
            background: #ef4444;
            color: white;
        }
        .new-requirement {
            background: #3b82f6;
            color: white;
            font-size: 11px;
            padding: 2px 6px;
            border-radius: 4px;
            margin-left: 8px;
        }
        .course-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
        }
        .course-table th {
            background: #f3f4f6;
            padding: 12px;
            text-align: left;
            font-weight: 600;
            border-bottom: 2px solid #e5e7eb;
        }
        .course-table td {
            padding: 12px;
            border-bottom: 1px solid #e5e7eb;
        }
        .course-table tr:hover {
            background: #f9fafb;
        }
        .certificate-indicator {
            color: #10b981;
            font-size: 12px;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 14px;
        }
        @media print {
            body {
                padding: 0;
                background: white;
            }
            .header {
                background: #1e40af !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
            .section {
                break-inside: avoid;
            }
            .course-table {
                font-size: 12px;
            }
        }
        .alert {
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        .alert-success {
            background: #d1fae5;
            color: #065f46;
            border: 1px solid #a7f3d0;
        }
        .category-tag {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 12px;
            background: #e0e7ff;
            color: #3730a3;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Illinois ${user.licenseType} CE Hours Report</h1>
        <p><strong>${user.name}</strong></p>
        <p>License #${user.licenseNumber}</p>
        <p>Report Generated: ${reportData.generatedDate}</p>
        <p>Renewal Date: ${new Date(user.renewalDate).toLocaleDateString()}</p>
    </div>`;

    if (user.isFirstRenewal) {
      report += `
    <div class="alert alert-success">
        <strong>✓ First Renewal - CE Exempt</strong><br>
        No continuing education requirements for your first renewal period.
    </div>`;
    }

    report += `
    <div class="section">
        <h2>Overall Progress</h2>
        <p style="font-size: 18px; margin: 10px 0;">
            <strong>${hours.total} of ${requirements.total} hours completed</strong>
        </p>
        <div class="progress-bar">
            <div class="progress-fill" style="width: ${Math.min((hours.total / requirements.total) * 100, 100)}%">
                ${Math.round((hours.total / requirements.total) * 100)}%
            </div>
        </div>
    </div>

    <div class="section">
        <h2>Mandatory Requirements</h2>`;

    Object.entries(requirements.mandatory).forEach(([key, required]) => {
      if (required === 0) return;
      const completed = hours[key] || 0;
      const isComplete = completed >= required;
      const displayName = key.replace(/([A-Z])/g, ' $1').trim();
      const capitalizedName = displayName.charAt(0).toUpperCase() + displayName.slice(1);
      
      report += `
        <div class="requirement-item">
            <span>
                ${capitalizedName}
                ${key === 'culturalCompetency' ? '<span class="new-requirement">NEW 2025</span>' : ''}
            </span>
            <span class="status-badge ${isComplete ? 'complete' : 'incomplete'}">
                ${completed}/${required} hours
            </span>
        </div>`;
    });

    report += `
    </div>

    <div class="section">
        <h2>Course Details</h2>
        <table class="course-table">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Course Title</th>
                    <th>Provider</th>
                    <th>Category</th>
                    <th>Hours</th>
                    <th>Certificate</th>
                </tr>
            </thead>
            <tbody>`;

    courses.sort((a, b) => new Date(b.date) - new Date(a.date)).forEach((course, index) => {
      const categoryDisplay = course.category.replace(/([A-Z])/g, ' $1').trim();
      const capitalizedCategory = categoryDisplay.charAt(0).toUpperCase() + categoryDisplay.slice(1);
      
      report += `
                <tr>
                    <td>${new Date(course.date).toLocaleDateString()}</td>
                    <td>${course.title}</td>
                    <td>${course.provider}</td>
                    <td>
                        <span class="category-tag">${capitalizedCategory}</span>
                    </td>
                    <td>${course.hours}</td>
                    <td>
                        ${course.certificate ? '<span class="certificate-indicator">✓ Attached</span>' : '-'}
                    </td>
                </tr>`;
    });

    report += `
            </tbody>
        </table>
    </div>

    <div class="footer">
        <p>This report was generated from the Illinois CE Hours Tracker</p>
        <p>For questions about CE requirements, visit the Illinois Department of Financial and Professional Regulation</p>
    </div>
</body>
</html>`;

    // Prepare files for ZIP
    const files = [
      {
        name: 'CE_Report.html',
        content: report
      }
    ];

    // Add certificates to ZIP
    for (let i = 0; i < courses.length; i++) {
      const course = courses[i];
      if (course.certificate) {
        // Extract base64 data and convert to binary
        const base64Data = course.certificate.data.split(',')[1];
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let j = 0; j < binaryString.length; j++) {
          bytes[j] = binaryString.charCodeAt(j);
        }
        
        // Determine file extension
        const extension = course.certificate.type.includes('pdf') ? 'pdf' : 
                         course.certificate.type.includes('jpeg') || course.certificate.type.includes('jpg') ? 'jpg' : 'png';
        
        files.push({
          name: `certificates/${i + 1}_${course.title.replace(/[^a-z0-9]/gi, '_')}.${extension}`,
          content: bytes
        });
      }
    }

    try {
      // Create ZIP file
      const zipContent = await createZip(files);
      
      // Download ZIP
      const blob = new Blob([zipContent], { type: 'application/zip' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `CE_Report_${user.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.zip`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error creating ZIP:', error);
      alert('Error creating ZIP file. Falling back to HTML-only download.');
      
      // Fallback to HTML-only download
      const blob = new Blob([report], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `CE_Report_${user.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.html`;
      a.click();
      window.URL.revokeObjectURL(url);
    }
  };

  // Calculate days until renewal
  const getDaysUntilRenewal = () => {
    if (!user.renewalDate) return null;
    const renewal = new Date(user.renewalDate);
    const today = new Date();
    const diff = renewal - today;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const daysUntilRenewal = getDaysUntilRenewal();

  // Setup screen
  if (!user.licenseType) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-md mx-auto mt-10">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Illinois CE Hours Tracker</h1>
            <div>
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
                    <div className="text-xs text-gray-500 mt-1">40 hours/2 years</div>
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
                    <div className="text-xs text-gray-500 mt-1">24 hours/2 years</div>
                  </button>
                </div>
              </div>

              {user.licenseType && (
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
                      License Number
                    </label>
                    <input
                      type="text"
                      value={user.licenseNumber}
                      onChange={(e) => setUser({...user, licenseNumber: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
                    onClick={() => {}}
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

  // Main dashboard
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                Illinois {user.licenseType} CE Tracker
              </h1>
              <p className="text-gray-600">
                {user.name} • License #{user.licenseNumber}
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

        {/* API Key Warning */}
        {GOOGLE_VISION_API_KEY === 'YOUR_API_KEY_HERE' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" />
              <div className="text-yellow-800">
                <div className="font-semibold">OCR Not Configured</div>
                <div className="text-sm">
                  To enable automatic certificate scanning, add your Google Vision API key to the code.
                  Get your key from{' '}
                  <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="underline">
                    Google Cloud Console
                  </a>
                </div>
              </div>
            </div>
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

        {/* Cultural Competency Alert */}
        {!user.isFirstRenewal && hours.culturalCompetency === 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <Info className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
              <div className="text-blue-800">
                <div className="font-semibold">NEW 2025 Requirement!</div>
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
            <button
              onClick={generateReport}
              className="text-blue-600 hover:text-blue-700 flex items-center"
              title="Download report and certificates as ZIP"
            >
              <Download className="w-4 h-4 mr-1" />
              Export Report + Certificates
            </button>
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
                        <div className="flex items-center justify-center gap-2">
                          {course.certificate && (
                            <button
                              onClick={() => {
                                const link = document.createElement('a');
                                link.href = course.certificate.data;
                                link.download = course.certificate.name;
                                link.click();
                              }}
                              className="text-blue-600 hover:text-blue-700"
                              title="Download Certificate"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => deleteCourse(course.id)}
                            className="text-red-600 hover:text-red-700"
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

        {/* Add Course Modal */}
        {showAddCourse && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Add CE Course</h3>
                
                <div>
                  <div className="mb-4">
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
                      <div className="text-xs text-gray-600 bg-blue-50 p-2 rounded flex items-start">
                        <Info className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0 text-blue-600" />
                        <span>Upload a certificate to automatically scan and fill form fields (requires API key)</span>
                      </div>
                      {newCourse.certificate && (
                        <div className="flex items-center justify-between bg-gray-50 p-2 rounded">
                          <span className="text-sm text-gray-600 truncate">
                            <FileText className="inline w-4 h-4 mr-1" />
                            {newCourse.certificate.name}
                          </span>
                          <button
                            onClick={() => setNewCourse({...newCourse, certificate: null})}
                            className="text-red-600 hover:text-red-700 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Course Title *
                    </label>
                    <input
                      type="text"
                      value={newCourse.title}
                      onChange={(e) => setNewCourse({...newCourse, title: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Provider Name *
                    </label>
                    <input
                      type="text"
                      value={newCourse.provider}
                      onChange={(e) => setNewCourse({...newCourse, provider: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date Completed *
                    </label>
                    <input
                      type="date"
                      value={newCourse.date}
                      onChange={(e) => setNewCourse({...newCourse, date: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hours * <span className="text-xs text-gray-500">(1 hour = 50 minutes)</span>
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      value={newCourse.hours}
                      onChange={(e) => setNewCourse({...newCourse, hours: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category *
                    </label>
                    <select
                      value={newCourse.category}
                      onChange={(e) => setNewCourse({...newCourse, category: e.target.value})}
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

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Format *
                    </label>
                    <select
                      value={newCourse.format}
                      onChange={(e) => setNewCourse({...newCourse, format: e.target.value})}
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
                    <div className="mb-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={newCourse.hasTest}
                          onChange={(e) => setNewCourse({...newCourse, hasTest: e.target.checked})}
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
                      Add Course
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Settings Modal */}
        {showSettings && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Profile Settings</h3>
                
                <div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      License Type
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => {
                          if (user.licenseType !== 'PT' && courses.length > 0) {
                            if (window.confirm('Changing license type will update all requirements. Continue?')) {
                              setUser({...user, licenseType: 'PT'});
                            }
                          } else {
                            setUser({...user, licenseType: 'PT'});
                          }
                        }}
                        className={`p-3 rounded-lg border-2 ${
                          user.licenseType === 'PT' 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <div className="font-semibold">PT</div>
                        <div className="text-xs text-gray-600">40 hours/2 years</div>
                      </button>
                      <button
                        onClick={() => {
                          if (user.licenseType !== 'OT' && courses.length > 0) {
                            if (window.confirm('Changing license type will update all requirements. Continue?')) {
                              setUser({...user, licenseType: 'OT'});
                            }
                          } else {
                            setUser({...user, licenseType: 'OT'});
                          }
                        }}
                        className={`p-3 rounded-lg border-2 ${
                          user.licenseType === 'OT' 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <div className="font-semibold">OT</div>
                        <div className="text-xs text-gray-600">24 hours/2 years</div>
                      </button>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Your Name
                    </label>
                    <input
                      type="text"
                      value={user.name}
                      onChange={(e) => setUser({...user, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      License Number
                    </label>
                    <input
                      type="text"
                      value={user.licenseNumber}
                      onChange={(e) => setUser({...user, licenseNumber: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
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

                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => setShowSettings(false)}
                      className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        setShowSettings(false);
                        alert('Settings saved successfully!');
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CETracker;