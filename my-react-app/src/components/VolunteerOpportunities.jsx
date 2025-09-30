import { useState, useEffect } from 'react';
import volunteerService from '../services/volunteerService';
import './VolunteerOpportunities.css';

const VolunteerOpportunities = ({ currentUser, onBack }) => {
  const [opportunities, setOpportunities] = useState([]);
  const [applications, setApplications] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('opportunities');
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [applicationData, setApplicationData] = useState({
    phone: '',
    skills: [],
    experience: '',
    availability: '',
    motivation: '',
    tshirtSize: ''
  });

  // Fetch data on component mount
  useEffect(() => {
    fetchAllData();
    
    // Set up periodic refresh every 30 seconds to check for new notifications
    const refreshInterval = setInterval(() => {
      volunteerService.getVolunteerNotifications(currentUser.email)
        .then(updatedNotifications => {
          setNotifications(updatedNotifications);
        })
        .catch(err => {
          console.error('Error refreshing notifications:', err);
        });
    }, 30000);
    
    // Clean up interval on component unmount
    return () => clearInterval(refreshInterval);
  }, [currentUser.email]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [opportunitiesData, applicationsData, notificationsData] = await Promise.all([
        volunteerService.getActiveVolunteerOpportunities(),
        volunteerService.getMemberApplications(currentUser.email),
        volunteerService.getVolunteerNotifications(currentUser.email)
      ]);

      setOpportunities(opportunitiesData);
      setApplications(applicationsData);
      setNotifications(notificationsData);
    } catch (err) {
      console.error('Error fetching volunteer data:', err);
      setError('Failed to load volunteer opportunities. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = (opportunity) => {
    setSelectedOpportunity(opportunity);
    setApplicationData({
      phone: '',
      skills: currentUser.approvedData?.skills || [],
      experience: '',
      availability: '',
      motivation: '',
      tshirtSize: ''
    });
    setShowApplicationModal(true);
  };

  const handleSubmitApplication = async (e) => {
    e.preventDefault();
    try {
      const memberData = {
        memberEmail: currentUser.email,
        memberName: currentUser.memberName,
        hiveName: currentUser.hiveName,
        ...applicationData
      };

      await volunteerService.applyForVolunteer(selectedOpportunity.id, memberData);
      
      alert('Application submitted successfully! 🎉\n\nYour volunteer application has been sent for review. You will be notified of the decision soon.');
      
      setShowApplicationModal(false);
      setSelectedOpportunity(null);
      
      // Refresh applications and notifications
      const [updatedApplications, updatedNotifications] = await Promise.all([
        volunteerService.getMemberApplications(currentUser.email),
        volunteerService.getVolunteerNotifications(currentUser.email)
      ]);
      
      setApplications(updatedApplications);
      setNotifications(updatedNotifications);
    } catch (err) {
      console.error('Error submitting application:', err);
      alert(`Failed to submit application: ${err.message}`);
    }
  };

  const handleMarkNotificationRead = async (notificationId) => {
    try {
      await volunteerService.markNotificationAsRead(notificationId);
      setNotifications(notifications.filter(n => n.id !== notificationId));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const getApplicationStatus = (opportunityId) => {
    const application = applications.find(app => app.volunteerId === opportunityId);
    return application ? application.status : null;
  };

  const canApply = (opportunity) => {
    const applicationStatus = getApplicationStatus(opportunity.id);
    return !applicationStatus && opportunity.spotsRemaining > 0;
  };

  if (loading) {
    return (
      <div className="volunteer-opportunities-loading">
        <div className="loading-spinner"></div>
        <p>Loading volunteer opportunities...</p>
      </div>
    );
  }

  return (
    <div className="volunteer-opportunities">
      <div className="volunteer-header">
        <button className="back-button" onClick={onBack}>
          ← Back to Dashboard
        </button>
        <div className="header-content">
          <h2>🙋‍♀️ Volunteer Opportunities</h2>
          <p>Join us and make a difference in your community!</p>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <span className="error-icon">⚠️</span>
          <span>{error}</span>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* Notifications Banner */}
      {notifications.length > 0 && (
        <div className="notifications-banner">
          <div className="notifications-header">
            <h3>🔔 New Notifications ({notifications.length})</h3>
          </div>
          <div className="notifications-list">
            {notifications.slice(0, 3).map((notification) => (
              <div key={notification.id} className="notification-item">
                <div className="notification-content">
                  <h4>{notification.title}</h4>
                  <p>{notification.message}</p>
                </div>
                <button 
                  className="mark-read-btn"
                  onClick={() => handleMarkNotificationRead(notification.id)}
                >
                  ✓
                </button>
              </div>
            ))}
            {notifications.length > 3 && (
              <div className="more-notifications">
                +{notifications.length - 3} more notifications
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="volunteer-tabs">
        <button 
          className={`tab ${activeTab === 'opportunities' ? 'active' : ''}`}
          onClick={() => setActiveTab('opportunities')}
        >
          🎯 Available Opportunities ({opportunities.length})
        </button>
        <button 
          className={`tab ${activeTab === 'applications' ? 'active' : ''}`}
          onClick={() => setActiveTab('applications')}
        >
          📋 My Applications ({applications.length})
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'opportunities' && (
          <div className="opportunities-grid">
            {opportunities.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🙋‍♀️</div>
                <h3>No volunteer opportunities available</h3>
                <p>Check back later for new opportunities to make a difference!</p>
              </div>
            ) : (
              opportunities.map((opportunity) => {
                const applicationStatus = getApplicationStatus(opportunity.id);
                
                return (
                  <div key={opportunity.id} className="opportunity-card">
                    <div className="opportunity-header">
                      <h3>{opportunity.title || 'Volunteer Opportunity'}</h3>
                      <div className="opportunity-meta">
                        <span className="spots-remaining">
                          {opportunity.spotsRemaining} spots remaining
                        </span>
                      </div>
                    </div>

                    {opportunity.event && (
                      <div className="event-info-section">
                        <div className="event-title">📅 {opportunity.event.eventName}</div>
                        {opportunity.event.startDate && (
                          <div className="event-date">
                            <span className="info-icon">🗓️</span>
                            <span>{new Date(opportunity.event.startDate).toLocaleDateString(undefined, {
                              weekday: 'short',
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}</span>
                          </div>
                        )}
                        {opportunity.event.venue && (
                          <div className="event-venue">
                            <span className="info-icon">📍</span>
                            <span>{opportunity.event.venue}</span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="opportunity-details">
                      <p className="description">
                        {opportunity.description || 'Help us make a difference in the community!'}
                      </p>

                      <div className="opportunity-info">
                        {opportunity.deadline && (
                          <div className="info-item">
                            <span className="info-icon">⏰</span>
                            <span>Apply by: {new Date(opportunity.deadline).toLocaleDateString()}</span>
                          </div>
                        )}
                        <div className="info-item">
                          <span className="info-icon">👥</span>
                          <span>{opportunity.currentApplications}/{opportunity.maxVolunteers} volunteers</span>
                        </div>
                        {opportunity.requirements && (
                          <div className="info-item">
                            <span className="info-icon">📋</span>
                            <span>Requirements: {opportunity.requirements}</span>
                          </div>
                        )}
                      </div>

                      {opportunity.benefits && (
                        <div className="benefits">
                          <h4>💫 What you'll gain:</h4>
                          <p>{opportunity.benefits}</p>
                        </div>
                      )}
                    </div>

                    <div className="opportunity-actions">
                      {applicationStatus ? (
                        <div className={`application-status ${applicationStatus}`}>
                          <span className="status-icon">
                            {applicationStatus === 'pending' && '⏳'}
                            {applicationStatus === 'approved' && '✅'}
                            {applicationStatus === 'rejected' && '❌'}
                          </span>
                          <span className="status-text">
                            {applicationStatus === 'pending' && 'Application Pending'}
                            {applicationStatus === 'approved' && 'Application Approved'}
                            {applicationStatus === 'rejected' && 'Application Rejected'}
                          </span>
                        </div>
                      ) : canApply(opportunity) ? (
                        <button 
                          className="apply-button"
                          onClick={() => handleApply(opportunity)}
                        >
                          🙋‍♀️ Apply Now
                        </button>
                      ) : (
                        <div className="application-status full">
                          <span className="status-icon">🚫</span>
                          <span className="status-text">No spots available</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === 'applications' && (
          <div className="applications-list">
            {applications.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📋</div>
                <h3>No applications yet</h3>
                <p>Apply for volunteer opportunities to see your applications here.</p>
              </div>
            ) : (
              applications.map((application) => (
                <div key={application.id} className="application-card">
                  <div className="application-header">
                    <h3>{application.opportunity?.title || 'Volunteer Position'}</h3>
                    <div className={`status-badge ${application.status}`}>
                      {application.status === 'pending' && '⏳ Pending Review'}
                      {application.status === 'approved' && '✅ Approved'}
                      {application.status === 'rejected' && '❌ Rejected'}
                    </div>
                  </div>

                  <div className="application-details">
                    <div className="detail-item">
                      <span className="detail-label">Applied:</span>
                      <span>{application.appliedAt?.seconds ? 
                        new Date(application.appliedAt.seconds * 1000).toLocaleDateString() : 
                        'Unknown'
                      }</span>
                    </div>
                    
                    {application.motivation && (
                      <div className="detail-item">
                        <span className="detail-label">Motivation:</span>
                        <span>{application.motivation}</span>
                      </div>
                    )}

                    {application.adminNote && (
                      <div className="admin-note">
                        <span className="note-label">Admin Note:</span>
                        <span>{application.adminNote}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Application Modal */}
      {showApplicationModal && (
        <div className="modal-overlay" onClick={() => setShowApplicationModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Apply for Volunteer Position</h3>
              <button onClick={() => setShowApplicationModal(false)}>×</button>
            </div>

            <div className="modal-body">
              <div className="opportunity-summary">
                <h4>{selectedOpportunity?.title || 'Volunteer Opportunity'}</h4>
                <p>{selectedOpportunity?.description}</p>
              </div>

              <form onSubmit={handleSubmitApplication} className="application-form">
                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    value={applicationData.phone}
                    onChange={(e) => setApplicationData({...applicationData, phone: e.target.value})}
                    placeholder="Your contact number"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Relevant Skills</label>
                  <textarea
                    value={Array.isArray(applicationData.skills) ? applicationData.skills.join(', ') : applicationData.skills}
                    onChange={(e) => setApplicationData({...applicationData, skills: e.target.value.split(',').map(s => s.trim())})}
                    placeholder="List your relevant skills (comma separated)"
                    rows="3"
                  />
                </div>

                <div className="form-group">
                  <label>Previous Experience</label>
                  <textarea
                    value={applicationData.experience}
                    onChange={(e) => setApplicationData({...applicationData, experience: e.target.value})}
                    placeholder="Describe any relevant experience you have"
                    rows="3"
                  />
                </div>

                <div className="form-group">
                  <label>Availability</label>
                  <textarea
                    value={applicationData.availability}
                    onChange={(e) => setApplicationData({...applicationData, availability: e.target.value})}
                    placeholder="When are you available to volunteer?"
                    rows="2"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Tshirt Size *</label>
                  <select
                    value={applicationData.tshirtSize}
                    onChange={(e) => setApplicationData({...applicationData, tshirtSize: e.target.value})}
                    required
                  >
                    <option value="">Select your T-shirt size</option>
                    <option value="XS">XS</option>
                    <option value="S">S</option>
                    <option value="M">M</option>
                    <option value="L">L</option>
                    <option value="XL">XL</option>
                    <option value="XXL">XXL</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Why do you want to volunteer? *</label>
                  <textarea
                    value={applicationData.motivation}
                    onChange={(e) => setApplicationData({...applicationData, motivation: e.target.value})}
                    placeholder="Tell us why you're interested in this volunteer opportunity"
                    rows="4"
                    required
                  />
                </div>

                <div className="form-actions">
                  <button type="button" onClick={() => setShowApplicationModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="submit-button">
                    Submit Application
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VolunteerOpportunities;