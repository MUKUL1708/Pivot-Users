import React, { useState } from 'react';
import './LoginPopup.css';
import { saveHiveData, saveMemberData, validateHiveData } from '../services/hiveService.js';
import { authenticateCredentials, storeHiveSession, storeMemberSession } from '../services/authService.js';
import { 
  getApprovedHivesForSelection, 
  saveMemberApplication, 
  validateMemberData
} from '../services/memberService.js';

const LoginPopup = ({ isOpen, onClose, onOptionSelect }) => {
  const [currentView, setCurrentView] = useState('options'); // 'options', 'login', 'hive-form', 'member-form'
  const [currentSection, setCurrentSection] = useState(1); // For multi-section forms (1-4)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Loading and error states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [validationErrors, setValidationErrors] = useState([]);
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  // Approved hives for member selection
  const [approvedHives, setApprovedHives] = useState([]);
  const [hivesLoading, setHivesLoading] = useState(false);
  
  // Hive Form Data
  const [hiveFormData, setHiveFormData] = useState({
    // Section 1: Personal Info
    name: '',
    course: '',
    branch: '',
    year: '',
    mobile: '',
    codingLanguages: [],
    
    // Section 2: College Info
    campusName: '',
    campusLocation: '',
    
    // Section 3: Hive Vision
    hiveName: '',
    expectedAudience: '',
    facultyAdvisorName: '',
    facultyAdvisorContact: '',
    linkedinProfile: '',
    githubProfile: '',
    
    // Section 4: Commitment
    leadershipExperience: '',
    achievements: '',
    longTermVision: '',
    termsAccepted: false
  });
  
  // Member Form Data
  const [memberFormData, setMemberFormData] = useState({
    // Section 1: Personal Info
    name: '',
    course: '',
    branch: '',
    year: '',
    mobile: '',
    email: '',
    
    // Section 2: Academic Info
    cgpa: '',
    skills: [],
    collegeName: '',
    
    // Section 3: Interests
    interestedEvents: [],
    priorProjects: '',
    eventParticipation: '',
    
    // Section 4: Goals
    selectedHive: null,
    linkedinProfile: '',
    githubProfile: '',
    heardAbout: '',
    mainGoal: '',
    subscription: false,
    termsAccepted: false
  });

  const handleCreateHive = () => {
    setCurrentView('hive-form');
    setCurrentSection(1);
  };

  const handleRegisterMember = async () => {
    setCurrentView('member-form');
    setCurrentSection(1);
    
    // Load approved hives for selection
    if (approvedHives.length === 0) {
      await loadApprovedHives();
    }
  };
  
  const loadApprovedHives = async () => {
    setHivesLoading(true);
    try {
      console.log('🏗️ Loading approved hives for member registration...');
      const hives = await getApprovedHivesForSelection();
      setApprovedHives(hives);
      console.log(`✅ Loaded ${hives.length} approved hives`);
    } catch (error) {
      console.error('💥 Error loading approved hives:', error);
      setSubmitError('Failed to load available hives. Please try again.');
    } finally {
      setHivesLoading(false);
    }
  };

  const handleShowLogin = () => {
    setCurrentView('login');
  };

  const handleBackToOptions = () => {
    setCurrentView('options');
    setCurrentSection(1);
    setEmail('');
    setPassword('');
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous errors
    setLoginError('');
    setIsLoggingIn(true);
    
    try {
      console.log('🔐 Attempting hive login:', { email });
      
      // Validate input
      if (!email || !password) {
        setLoginError('Please enter both email and password.');
        return;
      }
      
      // Authenticate against both hive and member credentials
      const authResult = await authenticateCredentials(email, password);
      
      if (!authResult.success) {
        console.log('❌ Authentication failed:', authResult.error);
        setLoginError(authResult.error);
        return;
      }
      
      const user = authResult.userType === 'hive' ? authResult.hive : authResult.member;
      const displayName = authResult.userType === 'hive' ? user.hiveName : `${user.memberName} (${user.hiveName})`;
      
      console.log('✅ Authentication successful:', displayName);
      
      // Store session for persistence based on user type
      if (authResult.userType === 'hive') {
        storeHiveSession(user);
      } else {
        storeMemberSession(user);
      }
      
      // Notify parent component of successful login
      if (onOptionSelect) {
        onOptionSelect('login-success', {
          user,
          userType: authResult.userType,
          message: authResult.message
        });
      }
      
      // Clear form and close popup
      setEmail('');
      setPassword('');
      handleClose();
      
    } catch (error) {
      console.error('💥 Login error:', error);
      setLoginError('Login failed. Please try again later.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleClose = () => {
    setCurrentView('options');
    setCurrentSection(1);
    setEmail('');
    setPassword('');
    
    // Reset error and success states
    setSubmitError('');
    setSubmitSuccess('');
    setValidationErrors([]);
    setLoginError('');
    setIsSubmitting(false);
    setIsLoggingIn(false);
    
    // Reset form data
    setHiveFormData({
      name: '', course: '', branch: '', year: '', mobile: '', codingLanguages: [],
      campusName: '', campusLocation: '',
      hiveName: '', expectedAudience: '', facultyAdvisorName: '', facultyAdvisorContact: '', linkedinProfile: '', githubProfile: '',
      leadershipExperience: '', achievements: '', longTermVision: '', termsAccepted: false
    });
    setMemberFormData({
      name: '', course: '', branch: '', year: '', mobile: '', email: '',
      cgpa: '', skills: [], collegeName: '',
      interestedEvents: [], priorProjects: '', eventParticipation: '',
      selectedHive: null, linkedinProfile: '', githubProfile: '', heardAbout: '', mainGoal: '', subscription: false, termsAccepted: false
    });
    onClose();
  };
  
  const handleNextSection = () => {
    if (currentSection < 4) {
      setCurrentSection(currentSection + 1);
    }
  };
  
  const handlePreviousSection = () => {
    if (currentSection > 1) {
      setCurrentSection(currentSection - 1);
    } else {
      setCurrentView('options');
      setCurrentSection(1);
    }
  };
  
  const handleHiveFormSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous errors
    setSubmitError('');
    setSubmitSuccess('');
    setValidationErrors([]);
    
    // Validate form data
    const validation = validateHiveData(hiveFormData);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      setSubmitError('Please fill in all required fields.');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Save to Firebase
      const hiveId = await saveHiveData(hiveFormData);
      
      console.log('Hive form submitted successfully:', { hiveId, data: hiveFormData });
      
      // Show success message
      setSubmitSuccess('Your hive application has been submitted successfully! You will receive a confirmation email shortly.');
      
      // Notify parent component
      if (onOptionSelect) {
        onOptionSelect('create-hive', { hiveId, ...hiveFormData });
      }
      
      // Close popup after a short delay to show success message
      setTimeout(() => {
        handleClose();
      }, 2000);
      
    } catch (error) {
      console.error('Error submitting hive form:', error);
      setSubmitError(`Failed to submit application: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleMemberFormSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous errors
    setSubmitError('');
    setSubmitSuccess('');
    setValidationErrors([]);
    
    // Validate form data
    const validation = validateMemberData(memberFormData);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      setSubmitError('Please fill in all required fields and select a hive.');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Save member application to Firebase
      const memberId = await saveMemberApplication(memberFormData);
      
      console.log('Member application submitted successfully:', { memberId, hiveName: memberFormData.selectedHive?.hiveName });
      
      // Show success message
      setSubmitSuccess(`Your application to join ${memberFormData.selectedHive?.hiveName} has been submitted successfully! The hive leader will review your application.`);
      
      // Notify parent component
      if (onOptionSelect) {
        onOptionSelect('register-member', { memberId, ...memberFormData });
      }
      
      // Close popup after a short delay to show success message
      setTimeout(() => {
        handleClose();
      }, 3000);
      
    } catch (error) {
      console.error('Error submitting member application:', error);
      setSubmitError(`Failed to submit application: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const updateHiveFormData = (field, value) => {
    setHiveFormData(prev => ({ ...prev, [field]: value }));
  };
  
  const updateMemberFormData = (field, value) => {
    setMemberFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="popup-overlay" onClick={handleClose}>
      <div className="popup-content" onClick={(e) => e.stopPropagation()}>
        {currentView === 'options' ? (
          // OPTIONS VIEW
          <>
            <div className="popup-header">
              <h2>Welcome to the Ecosystem</h2>
              <button className="close-btn" onClick={handleClose}>×</button>
            </div>
            
            <div className="options-container">
              <p className="welcome-text">
                Choose your path to join our community
              </p>
              
              <div className="option-cards">
                <div className="option-card hive-card" onClick={handleCreateHive}>
                  <div className="card-icon">🏗️</div>
                  <h3>Create a New Hive</h3>
                  <p>Start your own community and become a hive leader. Build, manage, and grow your network.</p>
                  <div className="card-features">
                    <span className="feature">• Full admin control</span>
                    <span className="feature">• Custom branding</span>
                    <span className="feature">• Member management</span>
                    <span className="feature">• Analytics dashboard</span>
                  </div>
                  <button className="option-btn create-btn">
                    <span>Create Hive</span>
                    <div className="btn-arrow">→</div>
                  </button>
                </div>
                
                <div className="option-card member-card" onClick={handleRegisterMember}>
                  <div className="card-icon">👥</div>
                  <h3>Register as a Member</h3>
                  <p>Join an existing hive and connect with like-minded individuals in established communities.</p>
                  <div className="card-features">
                    <span className="feature">• Browse hives</span>
                    <span className="feature">• Join discussions</span>
                    <span className="feature">• Network building</span>
                    <span className="feature">• Community events</span>
                  </div>
                  <button className="option-btn member-btn">
                    <span>Join as Member</span>
                    <div className="btn-arrow">→</div>
                  </button>
                </div>
              </div>
              
              <div className="popup-footer">
                <p>Already have an account? <button className="link-btn" onClick={handleShowLogin}>Sign In</button></p>
              </div>
            </div>
          </>
        ) : currentView === 'login' ? (
          // LOGIN VIEW
          <>
            <div className="popup-header">
              <div className="header-with-back">
                <button className="back-btn" onClick={handleBackToOptions}>←</button>
                <h2>Welcome Back</h2>
              </div>
              <button className="close-btn" onClick={handleClose}>×</button>
            </div>
            
            <div className="login-container">
              <p className="login-welcome-text">
                Sign in to access your hive dashboard
              </p>
              
              {loginError && (
                <div className="status-message error-message">
                  <div className="status-icon">⚠️</div>
                  <div className="status-content">
                    <h4>Login Failed</h4>
                    <p>{loginError}</p>
                  </div>
                </div>
              )}
              
              <form className="login-form" onSubmit={handleLoginSubmit}>
                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your hive email address"
                    disabled={isLoggingIn}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    disabled={isLoggingIn}
                    required
                  />
                </div>
                
                <div className="form-options">
                  <label className="checkbox-label">
                    <input type="checkbox" className="remember-checkbox" />
                    <span className="checkbox-text">Remember me</span>
                  </label>
                  <button type="button" className="forgot-link">Forgot password?</button>
                </div>
                
                <div className="form-actions">
                  <button type="submit" className="login-submit-btn" disabled={isLoggingIn}>
                    {isLoggingIn ? (
                      <>
                        <span className="loading-spinner"></span>
                        Signing In...
                      </>
                    ) : (
                      <>
                        <span>Sign In</span>
                        <div className="btn-arrow">→</div>
                      </>
                    )}
                  </button>
                </div>
                
                <div className="login-footer">
                  <p>Don't have an account? <button type="button" className="link-btn" onClick={handleBackToOptions}>Choose your path</button></p>
                </div>
              </form>
            </div>
          </>
        ) : currentView === 'hive-form' ? (
          // HIVE CREATION FORM VIEW
          <>
            <div className="popup-header">
              <div className="header-with-back">
                <button className="back-btn" onClick={handlePreviousSection}>←</button>
                <h2>Create Your Hive</h2>
              </div>
              <button className="close-btn" onClick={handleClose}>×</button>
            </div>
            
            <div className="form-container">
              <div className="progress-bar">
                <div className="progress-steps">
                  {[1, 2, 3, 4].map(step => (
                    <div key={step} className={`progress-step ${currentSection >= step ? 'active' : ''}`}>
                      <span className="step-number">{step}</span>
                      <span className="step-label">
                        {step === 1 && 'Personal Info'}
                        {step === 2 && 'College Info'}
                        {step === 3 && 'Hive Vision'}
                        {step === 4 && 'Commitment'}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="progress-line" style={{width: `${((currentSection - 1) / 3) * 100}%`}}></div>
              </div>
              
              {/* Hive Form Sections */}
              <div className="section-content">
                {currentSection === 1 && (
                  <div className="form-section">
                    <h3 className="section-title">Personal Information</h3>
                    <p className="section-description">Tell us about yourself to create your hive profile</p>
                    
                    <div className="form-grid">
                      <div className="form-group">
                        <label htmlFor="hive-name">Full Name *</label>
                        <input
                          type="text"
                          id="hive-name"
                          value={hiveFormData.name}
                          onChange={(e) => updateHiveFormData('name', e.target.value)}
                          placeholder="Enter your full name"
                          required
                        />
                      </div>
                      
                      <div className="form-group">
                        <label htmlFor="hive-mobile">Mobile Number *</label>
                        <input
                          type="tel"
                          id="hive-mobile"
                          value={hiveFormData.mobile}
                          onChange={(e) => updateHiveFormData('mobile', e.target.value)}
                          placeholder="Enter your mobile number"
                          required
                        />
                      </div>
                      
                      <div className="form-group">
                        <label htmlFor="hive-course">Course *</label>
                        <select
                          id="hive-course"
                          value={hiveFormData.course}
                          onChange={(e) => updateHiveFormData('course', e.target.value)}
                          required
                        >
                          <option value="">Select your course</option>
                          <option value="B.Tech">B.Tech</option>
                          <option value="B.E">B.E</option>
                          <option value="MCA">MCA</option>
                          <option value="M.Tech">M.Tech</option>
                          <option value="BCA">BCA</option>
                          <option value="BSc Computer Science">BSc Computer Science</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      
                      <div className="form-group">
                        <label htmlFor="hive-branch">Branch *</label>
                        <select
                          id="hive-branch"
                          value={hiveFormData.branch}
                          onChange={(e) => updateHiveFormData('branch', e.target.value)}
                          required
                        >
                          <option value="">Select your branch</option>
                          <option value="Computer Science Engineering">Computer Science Engineering</option>
                          <option value="Information Technology">Information Technology</option>
                          <option value="Electronics & Communication">Electronics & Communication</option>
                          <option value="Electrical Engineering">Electrical Engineering</option>
                          <option value="Mechanical Engineering">Mechanical Engineering</option>
                          <option value="Civil Engineering">Civil Engineering</option>
                          <option value="Data Science">Data Science</option>
                          <option value="Artificial Intelligence">Artificial Intelligence</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      
                      <div className="form-group">
                        <label htmlFor="hive-year">Year of Study *</label>
                        <select
                          id="hive-year"
                          value={hiveFormData.year}
                          onChange={(e) => updateHiveFormData('year', e.target.value)}
                          required
                        >
                          <option value="">Select year</option>
                          <option value="1st Year">1st Year</option>
                          <option value="2nd Year">2nd Year</option>
                          <option value="3rd Year">3rd Year</option>
                          <option value="4th Year">4th Year</option>
                          <option value="5th Year">5th Year</option>
                          <option value="Graduate">Graduate</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="form-group full-width">
                      <label>Coding Languages You're Efficient In *</label>
                      <div className="checkbox-grid">
                        {['JavaScript', 'Python', 'Java', 'C++', 'C', 'React', 'Node.js', 'PHP', 'Go', 'Rust', 'Swift', 'Kotlin'].map(lang => (
                          <label key={lang} className="checkbox-label">
                            <input
                              type="checkbox"
                              checked={hiveFormData.codingLanguages.includes(lang)}
                              onChange={(e) => {
                                const languages = [...hiveFormData.codingLanguages];
                                if (e.target.checked) {
                                  languages.push(lang);
                                } else {
                                  const index = languages.indexOf(lang);
                                  if (index > -1) languages.splice(index, 1);
                                }
                                updateHiveFormData('codingLanguages', languages);
                              }}
                            />
                            <span className="checkbox-text">{lang}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                
                {currentSection === 2 && (
                  <div className="form-section">
                    <h3 className="section-title">College Information</h3>
                    <p className="section-description">Tell us about your college and campus</p>
                    
                    <div className="form-grid">
                      <div className="form-group full-width">
                        <label htmlFor="campus-name">Name of the Campus *</label>
                        <input
                          type="text"
                          id="campus-name"
                          value={hiveFormData.campusName}
                          onChange={(e) => updateHiveFormData('campusName', e.target.value)}
                          placeholder="Enter your college/university name"
                          required
                        />
                      </div>
                      
                      <div className="form-group full-width">
                        <label htmlFor="campus-location">Location of the Campus *</label>
                        <input
                          type="text"
                          id="campus-location"
                          value={hiveFormData.campusLocation}
                          onChange={(e) => updateHiveFormData('campusLocation', e.target.value)}
                          placeholder="City, State, Country"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="info-card">
                      <div className="info-icon">🏫</div>
                      <div className="info-content">
                        <h4>Why do we need this information?</h4>
                        <p>Campus information helps us verify your eligibility and connect you with other hives in your region. This enables better collaboration and resource sharing.</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {currentSection === 3 && (
                  <div className="form-section">
                    <h3 className="section-title">Your Hive Vision</h3>
                    <p className="section-description">Define your community and leadership approach</p>
                    
                    <div className="form-grid">
                      <div className="form-group full-width">
                        <label htmlFor="hive-name-field">Name of Your Hive *</label>
                        <input
                          type="text"
                          id="hive-name-field"
                          value={hiveFormData.hiveName}
                          onChange={(e) => updateHiveFormData('hiveName', e.target.value)}
                          placeholder="Enter a unique name for your hive"
                          required
                        />
                      </div>
                      
                      <div className="form-group">
                        <label htmlFor="expected-audience">Expected Audience Size *</label>
                        <select
                          id="expected-audience"
                          value={hiveFormData.expectedAudience}
                          onChange={(e) => updateHiveFormData('expectedAudience', e.target.value)}
                          required
                        >
                          <option value="">Select range</option>
                          <option value="1-10">1-10 members</option>
                          <option value="11-20">11-20 members</option>
                          <option value="21-30">21-30 members</option>
                          <option value="31-40">31-40 members</option>
                          <option value="41-50">41-50 members</option>
                        </select>
                      </div>
                      
                      <div className="form-group">
                        <label htmlFor="faculty-advisor">Faculty Advisor Name *</label>
                        <input
                          type="text"
                          id="faculty-advisor"
                          value={hiveFormData.facultyAdvisorName}
                          onChange={(e) => updateHiveFormData('facultyAdvisorName', e.target.value)}
                          placeholder="Enter faculty advisor's name"
                          required
                        />
                      </div>
                      
                      <div className="form-group">
                        <label htmlFor="faculty-contact">Faculty Advisor Contact *</label>
                        <input
                          type="tel"
                          id="faculty-contact"
                          value={hiveFormData.facultyAdvisorContact}
                          onChange={(e) => updateHiveFormData('facultyAdvisorContact', e.target.value)}
                          placeholder="Phone number or email"
                          required
                        />
                      </div>
                      
                      <div className="form-group">
                        <label htmlFor="linkedin-profile">LinkedIn Profile</label>
                        <input
                          type="url"
                          id="linkedin-profile"
                          value={hiveFormData.linkedinProfile}
                          onChange={(e) => updateHiveFormData('linkedinProfile', e.target.value)}
                          placeholder="https://linkedin.com/in/your-profile"
                        />
                      </div>
                      
                      <div className="form-group">
                        <label htmlFor="github-profile">GitHub Profile</label>
                        <input
                          type="url"
                          id="github-profile"
                          value={hiveFormData.githubProfile}
                          onChange={(e) => updateHiveFormData('githubProfile', e.target.value)}
                          placeholder="https://github.com/your-username"
                        />
                      </div>
                    </div>
                    
                    <div className="highlight-card">
                      <div className="highlight-icon">🎨</div>
                      <div className="highlight-content">
                        <h4>Pro Tip: Creating a Memorable Hive Name</h4>
                        <p>Choose a name that reflects your community's values and goals. Consider combining tech terms with creative elements that represent your vision!</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {currentSection === 4 && (
                  <div className="form-section">
                    <h3 className="section-title">Commitment & Support</h3>
                    <p className="section-description">Share your experience and long-term vision</p>
                    
                    <div className="form-grid">
                      <div className="form-group full-width">
                        <label htmlFor="leadership-experience">Leadership Experience *</label>
                        <textarea
                          id="leadership-experience"
                          value={hiveFormData.leadershipExperience}
                          onChange={(e) => updateHiveFormData('leadershipExperience', e.target.value)}
                          placeholder="Describe your leadership experience (clubs, projects, teams, etc.)"
                          rows={4}
                          required
                        />
                      </div>
                      
                      <div className="form-group full-width">
                        <label htmlFor="achievements">Notable Achievements</label>
                        <textarea
                          id="achievements"
                          value={hiveFormData.achievements}
                          onChange={(e) => updateHiveFormData('achievements', e.target.value)}
                          placeholder="Share your academic, technical, or extracurricular achievements"
                          rows={3}
                        />
                      </div>
                      
                      <div className="form-group full-width">
                        <label htmlFor="long-term-vision">Long-term Vision for Your Hive *</label>
                        <textarea
                          id="long-term-vision"
                          value={hiveFormData.longTermVision}
                          onChange={(e) => updateHiveFormData('longTermVision', e.target.value)}
                          placeholder="Describe your goals and vision for the community you want to build"
                          rows={4}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="terms-section">
                      <h4>Declaration & Terms</h4>
                      <div className="declaration-card">
                        <p><strong>By creating a hive, I declare that:</strong></p>
                        <ul>
                          <li>All information provided is accurate and truthful</li>
                          <li>I have the necessary permissions from my institution</li>
                          <li>I commit to actively managing and growing my hive community</li>
                          <li>I will maintain professional standards and follow community guidelines</li>
                          <li>I understand that hive leadership comes with responsibilities</li>
                        </ul>
                      </div>
                      
                      <label className="checkbox-label terms-checkbox">
                        <input
                          type="checkbox"
                          checked={hiveFormData.termsAccepted}
                          onChange={(e) => updateHiveFormData('termsAccepted', e.target.checked)}
                          required
                        />
                        <span className="checkbox-text">
                          I accept the terms and conditions and declare that all information provided is accurate *
                        </span>
                      </label>
                    </div>
                  </div>
                )}
                
              </div>
              
              {/* Status Messages */}
              {submitError && (
                <div className="status-message error-message">
                  <div className="status-icon">⚠️</div>
                  <div className="status-content">
                    <h4>Submission Error</h4>
                    <p>{submitError}</p>
                    {validationErrors.length > 0 && (
                      <ul>
                        {validationErrors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}
              
              {submitSuccess && (
                <div className="status-message success-message">
                  <div className="status-icon">✅</div>
                  <div className="status-content">
                    <h4>Application Submitted!</h4>
                    <p>{submitSuccess}</p>
                  </div>
                </div>
              )}
              
              <div className="form-navigation">
                {currentSection > 1 && (
                  <button type="button" className="nav-btn prev-btn" onClick={handlePreviousSection} disabled={isSubmitting}>
                    Previous
                  </button>
                )}
                {currentSection < 4 ? (
                  <button type="button" className="nav-btn next-btn" onClick={handleNextSection} disabled={isSubmitting}>
                    Next
                  </button>
                ) : (
                  <button type="button" className="nav-btn submit-btn" onClick={handleHiveFormSubmit} disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <span className="loading-spinner"></span>
                        Submitting...
                      </>
                    ) : (
                      'Create Hive'
                    )}
                  </button>
                )}
              </div>
            </div>
          </>
        ) : currentView === 'member-form' ? (
          // MEMBER REGISTRATION FORM VIEW
          <>
            <div className="popup-header">
              <div className="header-with-back">
                <button className="back-btn" onClick={handlePreviousSection}>←</button>
                <h2>Join as Member</h2>
              </div>
              <button className="close-btn" onClick={handleClose}>×</button>
            </div>
            
            <div className="form-container">
              <div className="progress-bar">
                <div className="progress-steps">
                  {[1, 2, 3, 4].map(step => (
                    <div key={step} className={`progress-step ${currentSection >= step ? 'active' : ''}`}>
                      <span className="step-number">{step}</span>
                      <span className="step-label">
                        {step === 1 && 'Personal Info'}
                        {step === 2 && 'Academic Info'}
                        {step === 3 && 'Interests'}
                        {step === 4 && 'Goals'}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="progress-line" style={{width: `${((currentSection - 1) / 3) * 100}%`}}></div>
              </div>
              
              {/* Member Form Sections */}
              <div className="section-content">
                {currentSection === 1 && (
                  <div className="form-section">
                    <h3 className="section-title">Personal Information</h3>
                    <p className="section-description">Let's get to know you better to create your member profile</p>
                    
                    <div className="form-grid">
                      <div className="form-group">
                        <label htmlFor="member-name">Full Name *</label>
                        <input
                          type="text"
                          id="member-name"
                          value={memberFormData.name}
                          onChange={(e) => updateMemberFormData('name', e.target.value)}
                          placeholder="Enter your full name"
                          required
                        />
                      </div>
                      
                      <div className="form-group">
                        <label htmlFor="member-email">Email Address *</label>
                        <input
                          type="email"
                          id="member-email"
                          value={memberFormData.email}
                          onChange={(e) => updateMemberFormData('email', e.target.value)}
                          placeholder="Enter your email address"
                          required
                        />
                      </div>
                      
                      <div className="form-group">
                        <label htmlFor="member-mobile">Mobile Number *</label>
                        <input
                          type="tel"
                          id="member-mobile"
                          value={memberFormData.mobile}
                          onChange={(e) => updateMemberFormData('mobile', e.target.value)}
                          placeholder="Enter your mobile number"
                          required
                        />
                      </div>
                      
                      <div className="form-group">
                        <label htmlFor="member-course">Course *</label>
                        <select
                          id="member-course"
                          value={memberFormData.course}
                          onChange={(e) => updateMemberFormData('course', e.target.value)}
                          required
                        >
                          <option value="">Select your course</option>
                          <option value="B.Tech">B.Tech</option>
                          <option value="B.E">B.E</option>
                          <option value="MCA">MCA</option>
                          <option value="M.Tech">M.Tech</option>
                          <option value="BCA">BCA</option>
                          <option value="BSc Computer Science">BSc Computer Science</option>
                          <option value="MSc Computer Science">MSc Computer Science</option>
                          <option value="Diploma">Diploma</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      
                      <div className="form-group">
                        <label htmlFor="member-branch">Branch *</label>
                        <select
                          id="member-branch"
                          value={memberFormData.branch}
                          onChange={(e) => updateMemberFormData('branch', e.target.value)}
                          required
                        >
                          <option value="">Select your branch</option>
                          <option value="Computer Science Engineering">Computer Science Engineering</option>
                          <option value="Information Technology">Information Technology</option>
                          <option value="Electronics & Communication">Electronics & Communication</option>
                          <option value="Electrical Engineering">Electrical Engineering</option>
                          <option value="Mechanical Engineering">Mechanical Engineering</option>
                          <option value="Civil Engineering">Civil Engineering</option>
                          <option value="Data Science">Data Science</option>
                          <option value="Artificial Intelligence">Artificial Intelligence</option>
                          <option value="Cyber Security">Cyber Security</option>
                          <option value="Software Engineering">Software Engineering</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      
                      <div className="form-group">
                        <label htmlFor="member-year">Year of Study *</label>
                        <select
                          id="member-year"
                          value={memberFormData.year}
                          onChange={(e) => updateMemberFormData('year', e.target.value)}
                          required
                        >
                          <option value="">Select year</option>
                          <option value="1st Year">1st Year</option>
                          <option value="2nd Year">2nd Year</option>
                          <option value="3rd Year">3rd Year</option>
                          <option value="4th Year">4th Year</option>
                          <option value="5th Year">5th Year</option>
                          <option value="Graduate">Graduate</option>
                          <option value="Post Graduate">Post Graduate</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="info-card">
                      <div className="info-icon">👤</div>
                      <div className="info-content">
                        <h4>Building Your Profile</h4>
                        <p>Your personal information helps us match you with the right hives and opportunities. We keep your data secure and use it only to enhance your community experience.</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Add missing sections 2, 3, 4 for member form - reuse from earlier in file */}
                {currentSection === 2 && (
                  <div className="form-section">
                    <h3 className="section-title">Academic Information</h3>
                    <p className="section-description">Share your academic background and technical skills</p>
                    
                    <div className="form-grid">
                      <div className="form-group full-width">
                        <label htmlFor="college-name-member">College/University Name *</label>
                        <input
                          type="text"
                          id="college-name-member"
                          value={memberFormData.collegeName}
                          onChange={(e) => updateMemberFormData('collegeName', e.target.value)}
                          placeholder="Enter your college or university name"
                          required
                        />
                      </div>
                      
                      <div className="form-group">
                        <label htmlFor="member-cgpa-field">CGPA/Percentage *</label>
                        <input
                          type="text"
                          id="member-cgpa-field"
                          value={memberFormData.cgpa}
                          onChange={(e) => updateMemberFormData('cgpa', e.target.value)}
                          placeholder="e.g., 8.5 CGPA or 85%"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="form-group full-width">
                      <label>Technical Skills & Programming Languages *</label>
                      <div className="checkbox-grid">
                        {['JavaScript', 'Python', 'Java', 'C++', 'C', 'React', 'Node.js', 'Angular', 'Vue.js', 'PHP', 'Go', 'Rust', 'Swift', 'Kotlin', 'Flutter', 'React Native', 'Django', 'Spring Boot', 'MySQL', 'MongoDB', 'PostgreSQL', 'AWS', 'Docker', 'Git'].map(skill => (
                          <label key={skill} className="checkbox-label">
                            <input
                              type="checkbox"
                              checked={memberFormData.skills.includes(skill)}
                              onChange={(e) => {
                                const skills = [...memberFormData.skills];
                                if (e.target.checked) {
                                  skills.push(skill);
                                } else {
                                  const index = skills.indexOf(skill);
                                  if (index > -1) skills.splice(index, 1);
                                }
                                updateMemberFormData('skills', skills);
                              }}
                            />
                            <span className="checkbox-text">{skill}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    
                    <div className="highlight-card">
                      <div className="highlight-icon">📚</div>
                      <div className="highlight-content">
                        <h4>Academic Excellence Matters</h4>
                        <p>Your academic performance and technical skills help us understand your learning journey and match you with relevant opportunities and peers.</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {currentSection === 3 && (
                  <div className="form-section">
                    <h3 className="section-title">Your Interests</h3>
                    <p className="section-description">Tell us about your interests and experience with tech events</p>
                    
                    <div className="form-group full-width">
                      <label>Which type of tech events interest you? *</label>
                      <div className="checkbox-grid">
                        {['Hackathons', 'Technical Workshops', 'Coding Competitions', 'Seminars & Webinars', 'Project Showcases', 'Career Fairs', 'Startup Pitches', 'Open Source Contributions', 'Study Groups', 'Mentorship Programs'].map(event => (
                          <label key={event} className="checkbox-label">
                            <input
                              type="checkbox"
                              checked={memberFormData.interestedEvents.includes(event)}
                              onChange={(e) => {
                                const events = [...memberFormData.interestedEvents];
                                if (e.target.checked) {
                                  events.push(event);
                                } else {
                                  const index = events.indexOf(event);
                                  if (index > -1) events.splice(index, 1);
                                }
                                updateMemberFormData('interestedEvents', events);
                              }}
                            />
                            <span className="checkbox-text">{event}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    
                    <div className="form-grid">
                      <div className="form-group full-width">
                        <label htmlFor="prior-projects-member">Prior Projects & Technical Work</label>
                        <textarea
                          id="prior-projects-member"
                          value={memberFormData.priorProjects}
                          onChange={(e) => updateMemberFormData('priorProjects', e.target.value)}
                          placeholder="Describe your personal projects, internships, or technical work (GitHub links, live demos, etc.)"
                          rows={4}
                        />
                      </div>
                      
                      <div className="form-group full-width">
                        <label htmlFor="event-participation-member">Event Participation History</label>
                        <textarea
                          id="event-participation-member"
                          value={memberFormData.eventParticipation}
                          onChange={(e) => updateMemberFormData('eventParticipation', e.target.value)}
                          placeholder="Share your experience with hackathons, competitions, workshops, or tech events you've attended"
                          rows={3}
                        />
                      </div>
                    </div>
                    
                    <div className="info-card">
                      <div className="info-icon">🎆</div>
                      <div className="info-content">
                        <h4>Discover Your Tech Community</h4>
                        <p>Your interests help us connect you with like-minded peers and relevant events. Whether you're a beginner or experienced, there's a place for everyone!</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {currentSection === 4 && (
                  <div className="form-section">
                    <h3 className="section-title">Goals & Additional Information</h3>
                    <p className="section-description">Help us understand your goals and how you found us</p>
                    
                    <div className="form-grid">
                      <div className="form-group">
                        <label htmlFor="member-linkedin-field">LinkedIn Profile</label>
                        <input
                          type="url"
                          id="member-linkedin-field"
                          value={memberFormData.linkedinProfile}
                          onChange={(e) => updateMemberFormData('linkedinProfile', e.target.value)}
                          placeholder="https://linkedin.com/in/your-profile"
                        />
                      </div>
                      
                      <div className="form-group">
                        <label htmlFor="member-github-field">GitHub Profile</label>
                        <input
                          type="url"
                          id="member-github-field"
                          value={memberFormData.githubProfile}
                          onChange={(e) => updateMemberFormData('githubProfile', e.target.value)}
                          placeholder="https://github.com/your-username"
                        />
                      </div>
                      
                      <div className="form-group">
                        <label htmlFor="heard-about-member">How did you hear about us? *</label>
                        <select
                          id="heard-about-member"
                          value={memberFormData.heardAbout}
                          onChange={(e) => updateMemberFormData('heardAbout', e.target.value)}
                          required
                        >
                          <option value="">Select an option</option>
                          <option value="College/University">College/University</option>
                          <option value="Friend/Peer">Friend/Peer</option>
                          <option value="Social Media">Social Media</option>
                          <option value="Tech Event/Workshop">Tech Event/Workshop</option>
                          <option value="Online Search">Online Search</option>
                          <option value="Faculty/Professor">Faculty/Professor</option>
                          <option value="Career Fair">Career Fair</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="form-group full-width">
                      <label htmlFor="hive-selection">Select a Hive to Join *</label>
                      {hivesLoading ? (
                        <div className="hives-loading">
                          <span className="loading-spinner"></span>
                          Loading available hives...
                        </div>
                      ) : (
                        <select
                          id="hive-selection"
                          value={memberFormData.selectedHive?.id || ''}
                          onChange={(e) => {
                            const selectedHive = approvedHives.find(hive => hive.id === e.target.value);
                            updateMemberFormData('selectedHive', selectedHive || null);
                          }}
                          required
                        >
                          <option value="">Choose a hive to join</option>
                          {approvedHives.map(hive => (
                            <option key={hive.id} value={hive.id}>
                              {hive.hiveName} - {hive.campusName} ({hive.memberCount || 0}/{hive.expectedAudience} members)
                            </option>
                          ))}
                        </select>
                      )}
                      
                      {memberFormData.selectedHive && (
                        <div className="selected-hive-info">
                          <h4>🏠 {memberFormData.selectedHive.hiveName}</h4>
                          <div className="hive-details">
                            <p><strong>Campus:</strong> {memberFormData.selectedHive.campusName}</p>
                            <p><strong>Location:</strong> {memberFormData.selectedHive.campusLocation}</p>
                            <p><strong>Leader:</strong> {memberFormData.selectedHive.creatorName}</p>
                            <p><strong>Members:</strong> {memberFormData.selectedHive.memberCount || 0} / {memberFormData.selectedHive.expectedAudience}</p>
                          </div>
                        </div>
                      )}
                      
                      {approvedHives.length === 0 && !hivesLoading && (
                        <div className="no-hives-available">
                          <p>⚠️ No hives are currently accepting new members. Please check back later or contact support.</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="form-group full-width">
                      <label htmlFor="main-goal-member">What's your main goal for joining the community? *</label>
                      <textarea
                        id="main-goal-member"
                        value={memberFormData.mainGoal}
                        onChange={(e) => updateMemberFormData('mainGoal', e.target.value)}
                        placeholder="Tell us what you hope to achieve (e.g., learning new skills, networking, career growth, contributing to projects)"
                        rows={4}
                        required
                      />
                    </div>
                    
                    <div className="subscription-section">
                      <h4>Stay Connected</h4>
                      <div className="subscription-card">
                        <div className="subscription-content">
                          <h5>📩 Newsletter Subscription</h5>
                          <p>Get the latest updates on tech events, job opportunities, and community highlights delivered to your inbox.</p>
                          <ul>
                            <li>Weekly tech event notifications</li>
                            <li>Job and internship opportunities</li>
                            <li>Community achievements and success stories</li>
                            <li>Exclusive member-only content</li>
                          </ul>
                        </div>
                        <label className="checkbox-label subscription-checkbox">
                          <input
                            type="checkbox"
                            checked={memberFormData.subscription}
                            onChange={(e) => updateMemberFormData('subscription', e.target.checked)}
                          />
                          <span className="checkbox-text">
                            Yes, I want to subscribe to the newsletter and stay updated
                          </span>
                        </label>
                      </div>
                    </div>
                    
                    <div className="terms-section">
                      <h4>Declaration & Terms</h4>
                      <div className="declaration-card">
                        <p><strong>By registering as a member, I declare that:</strong></p>
                        <ul>
                          <li>All information provided is accurate and truthful</li>
                          <li>I agree to follow community guidelines and code of conduct</li>
                          <li>I will actively participate and contribute positively to the community</li>
                          <li>I understand that membership privileges can be revoked for misconduct</li>
                          <li>I consent to the use of my information for community matching and communication</li>
                        </ul>
                      </div>
                      
                      <label className="checkbox-label terms-checkbox">
                        <input
                          type="checkbox"
                          checked={memberFormData.termsAccepted}
                          onChange={(e) => updateMemberFormData('termsAccepted', e.target.checked)}
                          required
                        />
                        <span className="checkbox-text">
                          I accept the terms and conditions and declare that all information provided is accurate *
                        </span>
                      </label>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Status Messages */}
              {submitError && (
                <div className="status-message error-message">
                  <div className="status-icon">⚠️</div>
                  <div className="status-content">
                    <h4>Registration Error</h4>
                    <p>{submitError}</p>
                  </div>
                </div>
              )}
              
              {submitSuccess && (
                <div className="status-message success-message">
                  <div className="status-icon">✅</div>
                  <div className="status-content">
                    <h4>Welcome to the Community!</h4>
                    <p>{submitSuccess}</p>
                  </div>
                </div>
              )}
              
              <div className="form-navigation">
                {currentSection > 1 && (
                  <button type="button" className="nav-btn prev-btn" onClick={handlePreviousSection} disabled={isSubmitting}>
                    Previous
                  </button>
                )}
                {currentSection < 4 ? (
                  <button type="button" className="nav-btn next-btn" onClick={handleNextSection} disabled={isSubmitting}>
                    Next
                  </button>
                ) : (
                  <button type="button" className="nav-btn submit-btn" onClick={handleMemberFormSubmit} disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <span className="loading-spinner"></span>
                        Registering...
                      </>
                    ) : (
                      'Register'
                    )}
                  </button>
                )}
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
};

export default LoginPopup;
