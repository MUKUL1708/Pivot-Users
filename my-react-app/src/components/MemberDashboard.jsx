import { useState, useEffect } from 'react';
import { memberService } from '../services/memberService';
import { eventService } from '../services/eventService';
import volunteerService from '../services/volunteerService';
import VolunteerOpportunities from './VolunteerOpportunities';
import './MemberDashboard.css';

const MemberDashboard = ({ currentUser, onViewChange }) => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [hiveDetails, setHiveDetails] = useState(null);
  const [hiveMates, setHiveMates] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [allHiveEvents, setAllHiveEvents] = useState([]);
  const [volunteerNotifications, setVolunteerNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalHiveMates: 0,
    upcomingEvents: 0,
    totalEvents: 0,
    volunteerNotifications: 0
  });

  // Fetch member dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        console.log('📊 Fetching member dashboard data for:', currentUser?.memberName);

        // Fetch volunteer notifications
        let notifications = [];
        try {
          notifications = await volunteerService.getVolunteerNotifications(currentUser.email);
        } catch (notificationError) {
          console.warn('⚠️ Could not fetch volunteer notifications:', notificationError.message);
        }

        // Fetch hive mates (approved members of the same hive)
        let hiveMatesData = [];
        try {
          const hiveMatesSnapshot = await memberService.getApprovedMembers(currentUser.hiveName);
          hiveMatesSnapshot.forEach((doc) => {
            const memberData = doc.data();
            // Don't include the current user in hive mates list
            if (memberData.email !== currentUser.email) {
              hiveMatesData.push({
                id: doc.id,
                ...memberData
              });
            }
          });
        } catch (memberError) {
          console.warn('⚠️ Could not fetch hive mates, continuing without members:', memberError.message);
          // Continue execution with empty members array
        }

        // Fetch events for the member (includes hive events + admin events)
        let allEvents = [];
        try {
          allEvents = await eventService.getEventsForMember(currentUser.hiveName);
        } catch (eventError) {
          console.warn('⚠️ Primary member event fetch failed, trying fallback method:', eventError.message);
          try {
            // Fallback: try to get hive events only
            allEvents = await eventService.getEventsByHive(currentUser.hiveName);
          } catch (fallbackError) {
            console.warn('⚠️ All event fetch methods failed, continuing without events:', fallbackError.message);
            // Continue execution with empty events array
          }
        }
        
        // Filter upcoming events
        const today = new Date().toISOString().split('T')[0];
        const upcoming = allEvents.filter(event => 
          event.startDate >= today && 
          (event.status === 'active' || event.status === 'approved')
        );

        // Get hive details from the current user's approved data
        const hiveInfo = {
          name: currentUser.hiveName,
          leader: currentUser.approvedData?.createdBy || 'Hive Leader',
          memberCount: hiveMatesData.length + 1, // +1 for current user
          description: currentUser.approvedData?.description || 'Tech community fostering growth and collaboration',
          campus: currentUser.approvedData?.campusName || 'Campus',
          location: currentUser.approvedData?.campusLocation || 'Location'
        };

        setHiveMates(hiveMatesData);
        setUpcomingEvents(upcoming.slice(0, 5)); // Show only 5 upcoming events
        setAllHiveEvents(allEvents);
        setHiveDetails(hiveInfo);
        setVolunteerNotifications(notifications);
        setStats({
          totalHiveMates: hiveMatesData.length,
          upcomingEvents: upcoming.length,
          totalEvents: allEvents.length,
          volunteerNotifications: notifications.length
        });

        console.log('✅ Member dashboard data loaded successfully');
      } catch (error) {
        console.error('💥 Error fetching some dashboard data:', error);
        // Don't show error state, just log and continue with partial data
        // The individual data fetching has their own error handling
      } finally {
        setLoading(false);
      }
    };

    if (currentUser?.hiveName) {
      fetchDashboardData();
    }
  }, [currentUser]);

  const handleViewChange = (view) => {
    setCurrentView(view);
  };

  if (loading) {
    return (
      <div className="member-dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="member-dashboard-error">
        <p>❌ {error}</p>
        <button onClick={() => window.location.reload()} className="retry-button">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="member-dashboard">
      {currentView === 'dashboard' && (
        <>
          {/* Header */}
          <div className="member-header">
            <h1>👥 Welcome back, {currentUser.memberName}!</h1>
            <p className="member-subtitle">Member of {currentUser.hiveName}</p>
          </div>

          {/* Quick Stats */}
          <div className="member-stats">
            <div className="stat-item">
              <span className="stat-number">{stats.totalHiveMates}</span>
              <span className="stat-label">Hive Mates</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{stats.upcomingEvents}</span>
              <span className="stat-label">Upcoming Events</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{stats.totalEvents}</span>
              <span className="stat-label">Total Events</span>
            </div>
          </div>

          {/* Dashboard Cards */}
          <div className="dashboard-cards">
            <div className="dashboard-card">
              <h3>🏠 My Hive Details</h3>
              <p>Learn more about {hiveDetails?.name} and connect with the community.</p>
              <div className="card-info">
                <small>🏢 {hiveDetails?.campus} • 👥 {hiveDetails?.memberCount} members</small>
              </div>
              <button 
                className="card-button" 
                onClick={() => handleViewChange('hive-details')}
              >
                View Hive Details
              </button>
            </div>
            
            <div className="dashboard-card">
              <h3>👥 Hive Mates</h3>
              <p>Connect and collaborate with your {stats.totalHiveMates} hive mates.</p>
              <div className="card-info">
                <small>💬 Network • 🤝 Collaborate • 🚀 Grow together</small>
              </div>
              <button 
                className="card-button"
                onClick={() => handleViewChange('hive-mates')}
              >
                Meet Hive Mates
              </button>
            </div>
            
            <div className="dashboard-card">
              <h3>📅 Upcoming Events</h3>
              <p>Don't miss out on {stats.upcomingEvents} upcoming events from your hive and admin.</p>
              <div className="card-info">
                <small>🎉 Hive Events • 🚀 Admin Events • 🏆 Competitions</small>
              </div>
              <button 
                className="card-button"
                onClick={() => handleViewChange('events')}
              >
                View All Events
              </button>
            </div>
            
            <div className="dashboard-card">
              <h3>🙋‍♀️ Volunteer Opportunities</h3>
              <p>Make a difference! Join volunteer opportunities and help your community.</p>
              <div className="card-info">
                <small>🎆 Community Service • 🚀 Skill Building • 🏆 Impact</small>
                {stats.volunteerNotifications > 0 && (
                  <div className="notification-badge">
                    🔔 {stats.volunteerNotifications} new opportunities!
                  </div>
                )}
              </div>
              <button 
                className="card-button"
                onClick={() => handleViewChange('volunteer-opportunities')}
              >
                View Opportunities
              </button>
            </div>
            
            <div className="dashboard-card">
              <h3>⚙️ My Profile</h3>
              <p>Manage your profile settings and preferences.</p>
              <div className="card-info">
                <small>📝 Edit Info • 🔔 Notifications • 🎯 Skills</small>
              </div>
              <button 
                className="card-button"
                onClick={() => handleViewChange('profile')}
              >
                Edit Profile
              </button>
            </div>
          </div>

          {/* Member Information & Quick Actions */}
          <div className="member-info">
            <div className="info-card">
              <h3>📋 Member Information</h3>
              <div className="member-details">
                <p><strong>Name:</strong> {currentUser.memberName}</p>
                <p><strong>Email:</strong> {currentUser.email}</p>
                <p><strong>Hive:</strong> {currentUser.hiveName}</p>
                <p><strong>Member Since:</strong> {new Date(currentUser.generatedAt || Date.now()).toLocaleDateString()}</p>
              </div>
            </div>
            
            <div className="info-card">
              <h3>🚀 Quick Actions</h3>
              <div className="quick-actions">
                <button 
                  className="action-btn primary"
                  onClick={() => handleViewChange('events')}
                >
                  📅 Browse Events
                </button>
                <button 
                  className="action-btn secondary"
                  onClick={() => handleViewChange('hive-mates')}
                >
                  👥 Find Teammates
                </button>
                <button 
                  className="action-btn tertiary"
                  onClick={() => handleViewChange('hive-details')}
                >
                  🏠 Hive Info
                </button>
              </div>
            </div>
          </div>

          {/* Recent Activity Preview */}
          {upcomingEvents.length > 0 && (
            <div className="recent-activity">
              <h3>🔥 Upcoming Events Preview</h3>
              <div className="event-preview-list">
                {upcomingEvents.slice(0, 3).map((event) => (
                  <div key={event.id} className="event-preview-item">
                    <div className="event-date">
                      <span className="day">{new Date(event.startDate).getDate()}</span>
                      <span className="month">{new Date(event.startDate).toLocaleDateString('en', { month: 'short' })}</span>
                    </div>
                    <div className="event-info">
                      <h4>{event.eventName}</h4>
                      <p>{event.eventType} • {event.mode}</p>
                      <p className="event-organizer">{
                        !event.hiveName || event.hiveName === 'admin' || event.organizerType === 'admin' 
                          ? '🚀 Organized by Admin' 
                          : `🏠 Organized by ${event.hiveName}`
                      }</p>
                    </div>
                    <div className="event-status">
                      <span className={`status ${event.status}`}>{event.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {currentView === 'hive-details' && (
        <HiveDetailsView 
          hiveDetails={hiveDetails}
          onBack={() => handleViewChange('dashboard')}
          currentUser={currentUser}
        />
      )}

      {currentView === 'hive-mates' && (
        <HiveMatesView 
          hiveMates={hiveMates}
          onBack={() => handleViewChange('dashboard')}
          currentUser={currentUser}
        />
      )}

      {currentView === 'events' && (
        <EventsView 
          upcomingEvents={upcomingEvents}
          allEvents={allHiveEvents}
          onBack={() => handleViewChange('dashboard')}
          currentUser={currentUser}
        />
      )}

      {currentView === 'profile' && (
        <ProfileView 
          onBack={() => handleViewChange('dashboard')}
          currentUser={currentUser}
        />
      )}

      {currentView === 'volunteer-opportunities' && (
        <VolunteerOpportunities 
          onBack={() => handleViewChange('dashboard')}
          currentUser={currentUser}
        />
      )}
    </div>
  );
};

// Hive Details View Component
const HiveDetailsView = ({ hiveDetails, onBack, currentUser }) => (
  <div className="hive-details-view">
    <div className="view-header">
      <button className="back-button" onClick={onBack}>
        ← Back to Dashboard
      </button>
      <h2>🏠 {hiveDetails?.name} Details</h2>
    </div>

    <div className="hive-details-content">
      <div className="hive-info-card">
        <h3>🏢 Hive Information</h3>
        <div className="hive-info-grid">
          <div className="info-item">
            <span className="label">Hive Name:</span>
            <span className="value">{hiveDetails?.name}</span>
          </div>
          <div className="info-item">
            <span className="label">Campus:</span>
            <span className="value">{hiveDetails?.campus}</span>
          </div>
          <div className="info-item">
            <span className="label">Location:</span>
            <span className="value">{hiveDetails?.location}</span>
          </div>
          <div className="info-item">
            <span className="label">Total Members:</span>
            <span className="value">{hiveDetails?.memberCount}</span>
          </div>
          <div className="info-item">
            <span className="label">Hive Leader:</span>
            <span className="value">{hiveDetails?.leader}</span>
          </div>
        </div>
      </div>

      <div className="hive-description-card">
        <h3>📝 About Our Hive</h3>
        <p>{hiveDetails?.description}</p>
      </div>

      <div className="hive-contact-card">
        <h3>📞 Get in Touch</h3>
        <p>Connect with other members, participate in discussions, and grow together!</p>
        <div className="contact-actions">
          <button className="contact-btn">💬 Join Discussion</button>
          <button className="contact-btn">📧 Contact Leader</button>
        </div>
      </div>
    </div>
  </div>
);

// Hive Mates View Component
const HiveMatesView = ({ hiveMates, onBack, currentUser }) => (
  <div className="hive-mates-view">
    <div className="view-header">
      <button className="back-button" onClick={onBack}>
        ← Back to Dashboard
      </button>
      <h2>👥 Your Hive Mates ({hiveMates.length})</h2>
    </div>

    <div className="hive-mates-content">
      {hiveMates.length === 0 ? (
        <div className="empty-state">
          <h3>🔍 No other members yet</h3>
          <p>You're one of the first members! More hive mates will join soon.</p>
        </div>
      ) : (
        <div className="members-grid">
          {hiveMates.map((member) => (
            <div key={member.id} className="member-card">
              <div className="member-avatar">
                {member.name?.charAt(0)?.toUpperCase() || '👤'}
              </div>
              <div className="member-info">
                <h4>{member.name}</h4>
                <p className="member-course">{member.course} - {member.branch}</p>
                <p className="member-year">Year {member.year}</p>
                <p className="member-college">{member.collegeName}</p>
                {member.skills && member.skills.length > 0 && (
                  <div className="member-skills">
                    <span className="skills-label">Skills:</span>
                    <div className="skills-tags">
                      {member.skills.slice(0, 3).map((skill, index) => (
                        <span key={index} className="skill-tag">{skill}</span>
                      ))}
                      {member.skills.length > 3 && (
                        <span className="skill-tag more">+{member.skills.length - 3}</span>
                      )}
                    </div>
                  </div>
                )}
                <div className="member-actions">
                  <button className="connect-btn">🤝 Connect</button>
                  <button className="message-btn">💬 Message</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
);

// Events View Component
const EventsView = ({ upcomingEvents, allEvents, onBack, currentUser }) => {
  const [activeTab, setActiveTab] = useState('upcoming');
  
  const completedEvents = allEvents.filter(event => event.status === 'completed');
  const draftEvents = allEvents.filter(event => event.status === 'draft');

  return (
    <div className="events-view">
      <div className="view-header">
        <button className="back-button" onClick={onBack}>
          ← Back to Dashboard
        </button>
        <h2>📅 Events for {currentUser.hiveName} Members</h2>
      </div>

      <div className="events-tabs">
        <button 
          className={`tab ${activeTab === 'upcoming' ? 'active' : ''}`}
          onClick={() => setActiveTab('upcoming')}
        >
          🔮 Upcoming ({upcomingEvents.length})
        </button>
        <button 
          className={`tab ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          📋 All Events ({allEvents.length})
        </button>
        <button 
          className={`tab ${activeTab === 'completed' ? 'active' : ''}`}
          onClick={() => setActiveTab('completed')}
        >
          ✅ Completed ({completedEvents.length})
        </button>
      </div>

      <div className="events-content">
        {activeTab === 'upcoming' && (
          <EventsList events={upcomingEvents} emptyMessage="No upcoming events scheduled." />
        )}
        {activeTab === 'all' && (
          <EventsList events={allEvents} emptyMessage="No events found." />
        )}
        {activeTab === 'completed' && (
          <EventsList events={completedEvents} emptyMessage="No completed events yet." />
        )}
      </div>
    </div>
  );
};

// Events List Component
const EventsList = ({ events, emptyMessage }) => (
  <div className="events-list">
    {events.length === 0 ? (
      <div className="empty-state">
        <h3>📅 {emptyMessage}</h3>
        <p>Check back later for updates!</p>
      </div>
    ) : (
      events.map((event) => (
        <div key={event.id} className="event-card">
          <div className="event-header">
            <h4>{event.eventName}</h4>
            <span className={`event-status ${event.status}`}>{event.status}</span>
          </div>
          <div className="event-details">
            <p><strong>Type:</strong> {event.eventType}</p>
            <p><strong>Mode:</strong> {event.mode}</p>
            <p><strong>Date:</strong> {new Date(event.startDate).toLocaleDateString()} - {new Date(event.endDate).toLocaleDateString()}</p>
            <p><strong>Venue:</strong> {event.venue}</p>
            <p><strong>Organized by:</strong> {
              !event.hiveName || event.hiveName === 'admin' || event.organizerType === 'admin' 
                ? '🚀 Admin' 
                : `🏠 ${event.hiveName}`
            }</p>
            {event.registrationFees > 0 && (
              <p><strong>Registration Fee:</strong> ₹{event.registrationFees}</p>
            )}
          </div>
          {event.eventDescription && (
            <div className="event-description">
              <p>{event.eventDescription}</p>
            </div>
          )}
          <div className="event-actions">
            <button className="event-btn primary">📋 View Details</button>
            {event.status === 'active' && (
              <button className="event-btn secondary">✍️ Register</button>
            )}
          </div>
        </div>
      ))
    )}
  </div>
);

// Profile View Component  
const ProfileView = ({ onBack, currentUser }) => (
  <div className="profile-view">
    <div className="view-header">
      <button className="back-button" onClick={onBack}>
        ← Back to Dashboard
      </button>
      <h2>⚙️ My Profile</h2>
    </div>

    <div className="profile-content">
      <div className="profile-section">
        <h3>👤 Personal Information</h3>
        <div className="profile-form">
          <div className="form-group">
            <label>Full Name</label>
            <input type="text" value={currentUser.memberName} disabled />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={currentUser.email} disabled />
          </div>
          <div className="form-group">
            <label>Hive</label>
            <input type="text" value={currentUser.hiveName} disabled />
          </div>
        </div>
      </div>

      {currentUser.approvedData && (
        <div className="profile-section">
          <h3>🎓 Academic Information</h3>
          <div className="profile-info-grid">
            <div className="info-item">
              <span className="label">Course:</span>
              <span className="value">{currentUser.approvedData.course}</span>
            </div>
            <div className="info-item">
              <span className="label">Branch:</span>
              <span className="value">{currentUser.approvedData.branch}</span>
            </div>
            <div className="info-item">
              <span className="label">Year:</span>
              <span className="value">{currentUser.approvedData.year}</span>
            </div>
            <div className="info-item">
              <span className="label">College:</span>
              <span className="value">{currentUser.approvedData.collegeName}</span>
            </div>
          </div>
        </div>
      )}

      <div className="profile-section">
        <h3>🔔 Preferences</h3>
        <p>Profile editing and preference management will be available soon!</p>
        <button className="profile-btn" disabled>Coming Soon</button>
      </div>
    </div>
  </div>
);

export default MemberDashboard;