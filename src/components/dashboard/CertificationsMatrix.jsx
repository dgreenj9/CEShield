import React, { useState } from 'react';
import { ChevronDown, BookOpen, ExternalLink, Info } from 'lucide-react';
import { colors } from '../../utils/constants';
import { formatCitation, citationsData } from '../../utils/citationsDataFinal';
import { CERTIFICATION_TO_CITATION_MAP, METHODOLOGY_CONTENT } from '../../utils/certificationCitationMap';

// Certifications Matrix Component
const CertificationsMatrix = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('elite');
  const [searchTerm, setSearchTerm] = useState('');
  const [showMethodology, setShowMethodology] = useState(false);
  const [showCitations, setShowCitations] = useState(false);
  const [expandedCitations, setExpandedCitations] = useState({});
  
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

  // Enhanced function to get citations using the mapping table
  const getCitationsForCertification = (certificationName) => {
    // First try the explicit mapping
    const mappedCategory = CERTIFICATION_TO_CITATION_MAP[certificationName];
    if (mappedCategory && citationsData[mappedCategory]) {
      return citationsData[mappedCategory];
    }
    
    // Fallback to exact match
    if (citationsData[certificationName]) {
      return citationsData[certificationName];
    }
    
    // Fallback to partial matching
    const keys = Object.keys(citationsData);
    for (const key of keys) {
      if (key.toLowerCase().includes(certificationName.toLowerCase()) || 
          certificationName.toLowerCase().includes(key.toLowerCase())) {
        return citationsData[key];
      }
    }
    
    return [];
  };

  const toggleCitationsForCert = (certName) => {
    setExpandedCitations(prev => ({
      ...prev,
      [certName]: !prev[certName]
    }));
  };

  const CitationSection = ({ certName }) => {
    const citations = getCitationsForCertification(certName);
    const isExpanded = expandedCitations[certName];
    
    if (citations.length === 0) return null;
    
    return (
      <div className="mt-2 pt-2" style={{ borderTop: `1px solid ${colors.slateLight}` }}>
        <button
          onClick={() => toggleCitationsForCert(certName)}
          className="flex items-center gap-2 text-xs hover:bg-gray-100 px-2 py-1 rounded transition-colors"
          style={{ color: colors.primaryBlue }}
        >
          <BookOpen className="w-3 h-3" />
          {isExpanded ? 'Hide' : 'View'} Citations ({citations.length})
          <ChevronDown className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </button>
        
        {isExpanded && (
          <div className="mt-2 space-y-1">
            {citations.map((citation, index) => (
              <div 
                key={citation.id || index}
                className="text-xs p-2 rounded"
                style={{ 
                  background: colors.grayLight, 
                  color: colors.textGray,
                  borderLeft: `2px solid ${colors.primaryBlue}`
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="font-medium mb-1" style={{ color: colors.textDark }}>
                      {citation.title}
                    </div>
                    <div className="text-xs space-y-1">
                      {citation.authors && (
                        <div><strong>Authors:</strong> {citation.authors}</div>
                      )}
                      {citation.journal && (
                        <div><strong>Journal:</strong> {citation.journal}</div>
                      )}
                      {citation.year && (
                        <div><strong>Year:</strong> {citation.year}</div>
                      )}
                      {citation.type && (
                        <span 
                          className="inline-block px-1.5 py-0.5 rounded text-xs"
                          style={{ 
                            background: colors.lightBlue, 
                            color: colors.primaryBlue,
                            fontSize: '0.7rem'
                          }}
                        >
                          {citation.type}
                        </span>
                      )}
                      {citation.pmcId && (
                        <div className="mt-1">
                          <strong>PMC:</strong> {citation.pmcId}
                        </div>
                      )}
                      {citation.pubmedId && (
                        <div>
                          <strong>PubMed ID:</strong> {citation.pubmedId}
                        </div>
                      )}
                      {citation.doi && (
                        <div>
                          <strong>DOI:</strong> {citation.doi}
                        </div>
                      )}
                    </div>
                  </div>
                  {citation.url && (
                    <a
                      href={citation.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0 p-1 hover:bg-white rounded transition-colors"
                      style={{ color: colors.primaryBlue }}
                      title="Open citation link"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="mb-6" style={{ background: 'white', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)', border: `1px solid ${colors.slateLight}` }}>
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 mb-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <h2 className="text-base md:text-lg font-semibold" style={{ color: colors.textDark }}>
            Continuing Education By Clinical Quality Impact
          </h2>
          <span className="text-xs px-2 py-1" style={{ background: colors.lightBlue, color: colors.primaryBlue, borderRadius: '4px' }}>
            110 Ranked
          </span>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm transition-all w-full sm:w-auto justify-center"
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
        <div className="mb-4 flex flex-col md:flex-row gap-3">
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
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
                className="px-2 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm transition-all flex-1 sm:flex-initial"
                style={{
                  background: selectedFilter === filter.value ? colors.primaryBlue : colors.grayLight,
                  color: selectedFilter === filter.value ? 'white' : colors.textGray,
                  border: `1px solid ${selectedFilter === filter.value ? colors.primaryBlue : colors.slateLight}`,
                  cursor: 'pointer'
                }}
              >
                <span className="hidden sm:inline">{filter.label}</span>
                <span className="sm:hidden">
                  {filter.value === 'all' ? 'All' : 
                   filter.value === 'elite' ? '90+' :
                   filter.value === 'high' ? '70-89' :
                   filter.value === 'moderate' ? '50-69' :
                   filter.value === 'low' ? '30-49' : '<30'}
                </span>
                <span className="ml-1">({filter.count})</span>
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="Search certifications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-1.5 text-sm w-full md:w-auto"
            style={{ 
              border: `1px solid ${colors.slateLight}`,
              background: colors.grayLight,
              minWidth: '0',
              md: { minWidth: '200px' }
            }}
          />
        </div>
      )}

      <div className="space-y-2">
        {filteredCerts.map((cert) => (
          <div 
            key={`${cert.rank}-${cert.name}`}
            className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-3 transition-all hover:bg-gray-50"
            style={{ 
              background: colors.grayLight,
              borderLeft: `3px solid ${cert.score >= 90 ? '#22c55e' : cert.score >= 70 ? colors.primaryBlue : cert.score >= 50 ? '#f59e0b' : '#f97316'}`
            }}
          >
            {/* Mobile: Row layout for rank and score */}
            <div className="flex items-center justify-between sm:contents">
              <div className="text-center sm:text-center" style={{ minWidth: '40px' }}>
                <div className="text-xs" style={{ color: colors.textGray }}>Rank</div>
                <div className="font-semibold" style={{ color: colors.textDark }}>#{cert.rank}</div>
              </div>
              
              {/* Mobile: Score shown at top right */}
              <div className="sm:hidden">
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
            
            {/* Content section */}
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="font-medium text-sm sm:text-base" style={{ color: colors.textDark }}>
                  {cert.name}
                </span>
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
              <div className="text-xs sm:text-sm" style={{ color: colors.textGray }}>
                {cert.evidence}
              </div>
              <CitationSection certName={cert.name} />
            </div>
            
            {/* Desktop: Score on the right */}
            <div className="hidden sm:block text-center" style={{ minWidth: '60px' }}>
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
                onClick={() => setShowMethodology(true)}
                className="text-xs mt-2 flex items-center gap-1 hover:underline"
                style={{ color: colors.primaryBlue, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                <Info className="w-3 h-3" />
                View Full Methodology →
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
        </div>
      )}
      
      {showCitations && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowCitations(false)}
        >
          <div 
            className="bg-white rounded-lg shadow-xl max-w-4xl max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            style={{ width: '90%' }}
          >
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold" style={{ color: colors.textDark }}>
                Complete Evidence-Based Certification Research Citations
              </h3>
              <button
                onClick={() => setShowCitations(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              <div className="mb-4 p-3 rounded" style={{ background: colors.lightBlue }}>
                <p className="text-sm" style={{ color: colors.primaryBlue }}>
                  <strong>284 Total Citations</strong> from evidence-based rehabilitation certification research. 
                  Citations are organized by certification type and include peer-reviewed studies, systematic reviews, 
                  meta-analyses, and professional guidelines.
                </p>
              </div>
              
              <div className="space-y-6">
                {Object.entries(citationsData).map(([certName, citations]) => (
                  <div key={certName} className="border-l-4 pl-4" style={{ borderColor: colors.primaryBlue }}>
                    <h4 className="font-medium mb-2" style={{ color: colors.textDark }}>
                      {certName} ({citations.length} citations)
                    </h4>
                    <div className="space-y-2">
                      {citations.map((citation, index) => (
                        <div 
                          key={citation.id || index}
                          className="text-sm p-2 rounded"
                          style={{ background: colors.grayLight }}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <div className="flex-1">
                              <div className="font-medium mb-1" style={{ color: colors.textDark }}>
                                {citation.title}
                              </div>
                              <div className="text-xs" style={{ color: colors.textGray }}>
                                {formatCitation(citation)}
                              </div>
                              {citation.type && (
                                <span 
                                  className="inline-block px-2 py-0.5 rounded text-xs mt-1"
                                  style={{ 
                                    background: colors.mutedTeal, 
                                    color: '#0891b2',
                                    fontSize: '0.7rem'
                                  }}
                                >
                                  {citation.type}
                                </span>
                              )}
                            </div>
                            {citation.url && (
                              <a
                                href={citation.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-shrink-0 p-1 hover:bg-white rounded transition-colors"
                                style={{ color: colors.primaryBlue }}
                                title="Open citation link"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="p-4 border-t text-center">
              <p className="text-xs" style={{ color: colors.textGray }}>
                Citations compiled from multiple evidence-based rehabilitation certification analysis reports
              </p>
            </div>
          </div>
        </div>
      )}
      
      {showMethodology && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowMethodology(false)}
        >
          <div 
            className="bg-white rounded-lg shadow-xl max-w-4xl max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            style={{ width: '90%' }}
          >
            <div className="p-4 border-b flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold" style={{ color: colors.textDark }}>
                  {METHODOLOGY_CONTENT.title}
                </h3>
                <p className="text-xs mt-1" style={{ color: colors.textGray }}>
                  {METHODOLOGY_CONTENT.version}
                </p>
              </div>
              <button
                onClick={() => setShowMethodology(false)}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[75vh]">
              <div className="mb-6">
                <p className="text-sm leading-relaxed" style={{ color: colors.textGray }}>
                  {METHODOLOGY_CONTENT.overview}
                </p>
              </div>
              
              <div className="mb-6">
                <h4 className="font-semibold mb-4" style={{ color: colors.textDark }}>
                  Scoring Components
                </h4>
                <div className="space-y-4">
                  {METHODOLOGY_CONTENT.scoringComponents.map((component, index) => (
                    <div 
                      key={index}
                      className="p-4 rounded-lg"
                      style={{ background: colors.grayLight, borderLeft: `4px solid ${colors.primaryBlue}` }}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h5 className="font-medium" style={{ color: colors.textDark }}>
                          {component.name}
                        </h5>
                        <span 
                          className="px-2 py-1 rounded text-sm font-semibold"
                          style={{ background: colors.primaryBlue, color: 'white' }}
                        >
                          {component.weight}
                        </span>
                      </div>
                      <p className="text-sm mb-2" style={{ color: colors.textGray }}>
                        {component.description}
                      </p>
                      <ul className="space-y-1">
                        {component.criteria.map((criterion, idx) => (
                          <li key={idx} className="text-xs flex items-start gap-2" style={{ color: colors.textGray }}>
                            <span style={{ color: colors.primaryBlue }}>•</span>
                            {criterion}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="mb-6">
                <h4 className="font-semibold mb-4" style={{ color: colors.textDark }}>
                  Evidence Tiers
                </h4>
                <div className="space-y-2">
                  {METHODOLOGY_CONTENT.scoringTiers.map((tier, index) => (
                    <div 
                      key={index}
                      className="flex items-center gap-3 p-3 rounded"
                      style={{ background: colors.grayLight }}
                    >
                      <div 
                        className="w-12 h-12 rounded flex items-center justify-center text-white font-bold"
                        style={{ background: tier.color }}
                      >
                        {tier.count}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium" style={{ color: colors.textDark }}>
                            {tier.tier}
                          </span>
                          <span className="text-sm" style={{ color: colors.textGray }}>
                            ({tier.range} points)
                          </span>
                        </div>
                        <p className="text-xs mt-1" style={{ color: colors.textGray }}>
                          {tier.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="mb-6">
                <h4 className="font-semibold mb-3" style={{ color: colors.textDark }}>
                  Key Findings
                </h4>
                <ul className="space-y-2">
                  {METHODOLOGY_CONTENT.keyFindings.map((finding, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm" style={{ color: colors.textGray }}>
                      <span style={{ color: colors.primaryBlue }}>✓</span>
                      {finding}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="mb-6">
                <h4 className="font-semibold mb-3" style={{ color: colors.textDark }}>
                  Study Limitations
                </h4>
                <ul className="space-y-2">
                  {METHODOLOGY_CONTENT.limitations.map((limitation, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm" style={{ color: colors.textGray }}>
                      <span style={{ color: '#f59e0b' }}>⚠</span>
                      {limitation}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="p-4 rounded" style={{ background: colors.lightBlue }}>
                <p className="text-sm" style={{ color: colors.primaryBlue }}>
                  <strong>Data Source:</strong> {METHODOLOGY_CONTENT.dataSource}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CertificationsMatrix;
