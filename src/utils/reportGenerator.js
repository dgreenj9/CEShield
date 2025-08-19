import { colors } from './constants';
import { getRequirements, calculateHours } from './calculations';
import { createZip } from './zipCreator';

// Report Generation
export const generateReport = async (user, courses, certificatesOnly = false) => {
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
