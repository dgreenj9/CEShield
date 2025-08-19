import React, { useState } from 'react';
import { AlertCircle, CheckCircle, Clock, FileText, Plus, Trash2, Download, Info, Loader2, Settings, Pencil, LogOut, User } from 'lucide-react';
import { colors } from '../utils/constants';
import { getRequirements, calculateHours } from '../utils/calculations';
import { generateReport } from '../utils/reportGenerator';
import { useSupabaseData } from '../hooks/useSupabaseData';
import CEShieldLogo from '../components/common/CEShieldLogo';
import CertificationsMatrix from '../components/dashboard/CertificationsMatrix';
import AddCourseModal from '../components/courses/AddCourseModal';
import DeleteConfirmationModal from '../components/courses/DeleteConfirmationModal';
import SettingsModal from '../components/settings/SettingsModal';
import ProfileSetup from '../components/auth/ProfileSetup';

// Main Dashboard Component
const Dashboard = ({ authUser, onSignOut }) => {
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

export default Dashboard;
