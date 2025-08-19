// Requirements and calculations utilities
export const getRequirements = (state, licenseType) => {
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

export const calculateHours = (courses) => {
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
