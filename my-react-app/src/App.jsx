import { useState, useEffect } from 'react'
import './App.css'
import { app, analytics } from './firebase'
import Navbar from './components/Navbar'
import LoginPopup from './components/LoginPopup'
import FirebaseTest from './components/FirebaseTest'
import MemberManagement from './components/MemberManagement'
import EventCreationModal from './components/EventCreationModal'
import EventsManagement from './components/EventsManagement'
import MemberDashboard from './components/MemberDashboard'
import AboutUs from './components/AboutUs'
import Vision from './components/Vision'
import Programs from './components/Programs'
import { checkAuthStatus, clearUserSession } from './services/authService'
import { memberService } from './services/memberService'
import { eventService } from './services/eventService'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from './firebase'

function App() {
  const [isLoginPopupOpen, setIsLoginPopupOpen] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [userType, setUserType] = useState(null) // 'hive' or 'member'
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [currentView, setCurrentView] = useState('dashboard') // 'dashboard', 'member-status', 'member-management', or 'events-management'
  const [isEventModalOpen, setIsEventModalOpen] = useState(false)
  const [memberStats, setMemberStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  })

  // Check for existing authentication on app load
  useEffect(() => {
    const checkExistingAuth = async () => {
      try {
        console.log('🔍 Checking existing authentication...');
        const authStatus = await checkAuthStatus();
        
        if (authStatus.isAuthenticated) {
          const displayName = authStatus.userType === 'hive' ? authStatus.user.hiveName : `${authStatus.user.memberName} (${authStatus.user.hiveName})`;
          console.log(`✅ User already authenticated as ${authStatus.userType}:`, displayName);
          setIsAuthenticated(true);
          setCurrentUser(authStatus.user);
          setUserType(authStatus.userType);
        } else {
          console.log('❌ No existing authentication found');
        }
      } catch (error) {
        console.error('💥 Error checking auth status:', error);
      } finally {
        setIsCheckingAuth(false);
      }
    };
    
    checkExistingAuth();
  }, []);

  // Fetch member statistics for hive dashboard
  useEffect(() => {
    const fetchMemberStats = async () => {
      if (isAuthenticated && userType === 'hive' && currentUser?.hiveName) {
        try {
          console.log('📊 Fetching member stats for hive:', currentUser.hiveName);
          
          // Get pending applications count (processed applications are deleted from this collection)
          const pendingQuery = query(
            collection(db, 'members'),
            where('selectedHiveName', '==', currentUser.hiveName)
          );
          const pendingSnapshot = await getDocs(pendingQuery);
          const pendingCount = pendingSnapshot.size;
          
          // Get approved members count
          const approvedSnapshot = await memberService.getApprovedMembers(currentUser.hiveName);
          const approvedCount = approvedSnapshot.size;
          
          // Get rejected members count
          const rejectedSnapshot = await memberService.getRejectedMembers(currentUser.hiveName);
          const rejectedCount = rejectedSnapshot.size;
          
          const stats = {
            pending: pendingCount,
            approved: approvedCount,
            rejected: rejectedCount,
            total: pendingCount + approvedCount + rejectedCount
          };
          
          setMemberStats(stats);
          console.log('✅ Member stats updated:', stats);
        } catch (error) {
          console.error('💥 Error fetching member stats:', error);
          // Keep default stats on error
        }
      }
    };

    fetchMemberStats();
  }, [isAuthenticated, userType, currentUser?.hiveName]);

  const handleLoginClick = () => {
    setIsLoginPopupOpen(true)
  }

  const handleClosePopup = () => {
    setIsLoginPopupOpen(false)
  }

  const handleLogout = () => {
    console.log(`🚪 Logging out ${userType} user`);
    clearUserSession();
    setIsAuthenticated(false);
    setCurrentUser(null);
    setUserType(null);
    setCurrentView('dashboard'); // Reset view on logout
    console.log('✅ Logout successful');
  }

  const handleViewChange = (view) => {
    setCurrentView(view);
  }

  const handleCreateEvent = async (eventData) => {
    try {
      console.log('🎉 Creating event for hive:', currentUser.hiveName);
      console.log('📋 Event data being submitted:', eventData);
      
      const result = await eventService.createEvent(eventData);
      console.log('✅ Event created successfully with ID:', result.id);
      
      alert('Event request submitted successfully! 🎉\n\nYour event has been sent to the admin for approval. You can view its status in the Events Management section.');
    } catch (error) {
      console.error('💥 Error creating event:', error);
      alert('Failed to create event. Please try again.');
      throw error; // Re-throw to let modal handle it
    }
  }

  const handleOptionSelect = (option, data = null) => {
    console.log('Selected option:', option, data)
    
    switch(option) {
      case 'create-hive':
        console.log('🏗️ User submitted hive creation request');
        // Hive creation form was submitted - show success message
        alert('Hive application submitted successfully! You will receive a confirmation email shortly.');
        break
      case 'register-member':
        console.log('👥 User registered as member');
        // Member registration was completed - show success message
        const hiveName = data?.selectedHive?.hiveName || 'the selected hive';
        alert(`Application submitted successfully! Your application to join ${hiveName} has been sent to the hive leader for review.`);
        break
      case 'login-success':
        const displayName = data.userType === 'hive' ? data.user.hiveName : `${data.user.memberName} (${data.user.hiveName})`;
        console.log(`✅ ${data.userType} login successful:`, displayName);
        // Successful authentication - update state
        setIsAuthenticated(true);
        setCurrentUser(data.user);
        setUserType(data.userType);
        setIsLoginPopupOpen(false);
        console.log(`🏠 Redirected to ${data.userType} dashboard for:`, displayName);
        return; // Don't close popup here as it's already closed
      default:
        console.log('Unknown option selected:', option)
    }
    
    // Close the popup after selection (except for login-success which handles it itself)
    setIsLoginPopupOpen(false)
  }

  // Show loading while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="app loading-app">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      {/* Navbar/Title Bar */}
      <Navbar 
        onLoginClick={handleLoginClick}
        isAuthenticated={isAuthenticated}
        currentUser={currentUser}
        userType={userType}
        onLogout={handleLogout}
      />
      
      {/* Body */}
      <main className="main-content">
        <div className="content-container">
          {isAuthenticated && currentUser ? (
            userType === 'hive' ? (
              // Authenticated Hive Dashboard
              <>
                {currentView === 'dashboard' && (
                  <>
                    <div className="hive-header">
                      <h1>🏠 Welcome back to {currentUser.hiveName}!</h1>
                      <p className="hive-subtitle">Hello, {currentUser.creatorName} - Hive Leader</p>
                    </div>
                  
                    <div className="hive-dashboard">
                      <div className="dashboard-cards">
                        <div className="dashboard-card">
                          <h3>📋 Member Status</h3>
                          <p>Total: {memberStats.total} • Pending: {memberStats.pending} • Approved: {memberStats.approved} • Rejected: {memberStats.rejected}</p>
                          <button className="card-button" onClick={() => handleViewChange('member-status')}>Review Applications</button>
                        </div>
                        
                        <div className="dashboard-card">
                          <h3>👥 Member Management</h3>
                          <p>View and monitor your approved hive members ({memberStats.approved} active members).</p>
                          <button 
                            className="card-button"
                            onClick={() => handleViewChange('member-management')}
                          >
                            View Members
                          </button>
                        </div>
                        
                        <div className="dashboard-card">
                          <h3>📅 Events & Activities</h3>
                          <p>Create and manage hive events and activities.</p>
                          <button 
                            className="card-button"
                            onClick={() => handleViewChange('events-management')}
                          >
                            Manage Events
                          </button>
                        </div>
                        
                        <div className="dashboard-card">
                          <h3>⚙️ Hive Settings</h3>
                          <p>Customize your hive preferences and settings.</p>
                          <button className="card-button">Edit Settings</button>
                        </div>
                      </div>
                      
                      <div className="hive-info">
                        <div className="info-card">
                          <h3>🎆 Hive Information</h3>
                          <div className="hive-details">
                            <p><strong>Hive Name:</strong> {currentUser.hiveName}</p>
                            <p><strong>Leader:</strong> {currentUser.creatorName}</p>
                            <p><strong>Contact:</strong> {currentUser.email}</p>
                            <p><strong>Login Time:</strong> {new Date(currentUser.loginTime).toLocaleString()}</p>
                          </div>
                        </div>
                        
                        <div className="info-card">
                          <h3>🚀 Quick Actions</h3>
                          <div className="quick-actions">
                            <button 
                              className="action-btn primary"
                              onClick={() => setIsEventModalOpen(true)}
                            >
                              Create Event
                            </button>
                            <button className="action-btn secondary">Invite Members</button>
                            <button className="action-btn tertiary">View Reports</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {currentView === 'member-status' && (
                  <>
                    <div className="view-header">
                      <button 
                        className="back-button"
                        onClick={() => handleViewChange('dashboard')}
                      >
                        ← Back to Dashboard
                      </button>
                    </div>
                    <MemberManagement hive={currentUser} mode="applications" />
                  </>
                )}

                {currentView === 'member-management' && (
                  <>
                    <div className="view-header">
                      <button 
                        className="back-button"
                        onClick={() => handleViewChange('dashboard')}
                      >
                        ← Back to Dashboard
                      </button>
                    </div>
                    <MemberManagement hive={currentUser} mode="members" />
                  </>
                )}

                {currentView === 'events-management' && (
                  <>
                    <div className="view-header">
                      <button 
                        className="back-button"
                        onClick={() => handleViewChange('dashboard')}
                      >
                        ← Back to Dashboard
                      </button>
                    </div>
                    <EventsManagement 
                      hive={currentUser} 
                      onCreateEvent={() => setIsEventModalOpen(true)}
                    />
                  </>
                )}
              </>
            ) : (
              // Authenticated Member Dashboard
              <MemberDashboard 
                currentUser={currentUser} 
                onViewChange={handleViewChange}
              />
            )
          ) : (
            // Non-authenticated Landing Page
            <>
              {/* Hero Section */}
              <section className="hero-section">
                <div className="hero-content">
                  <h1>Welcome to the Pivot</h1>
                  <p>Connect, collaborate, and grow your tech community!</p>
                  <div className="hero-actions">
                    <button onClick={handleLoginClick} className="btn-primary">Join Now</button>
                    <button onClick={() => { document.getElementById('about').scrollIntoView({ behavior: 'smooth' }); }} className="btn-secondary">Learn More</button>
                  </div>
                </div>
              </section>

              {/* About Us Section */}
              <section id="about">
                <AboutUs />
              </section>

              {/* Vision & Core Values Section */}
              <section id="vision">
                <Vision />
              </section>

              {/* Programs & Events Section */}
              <section id="programs">
                <Programs />
              </section>

              {/* Call to Action */}
              <section className="cta-section">
                <div className="cta-content">
                  <h2>Ready to Join Our Community?</h2>
                  <p>Create an account or sign in to get started with your Pivot journey.</p>
                  <button onClick={handleLoginClick} className="btn-primary">Get Started</button>
                </div>
              </section>
            </>
          )}
        </div>
      </main>
      
      {/* Login Popup - only show when not authenticated */}
      {!isAuthenticated && (
        <LoginPopup 
          isOpen={isLoginPopupOpen}
          onClose={handleClosePopup}
          onOptionSelect={handleOptionSelect}
        />
      )}
      
      {/* Event Creation Modal - only show when hive is authenticated */}
      {isAuthenticated && userType === 'hive' && (
        <EventCreationModal
          isOpen={isEventModalOpen}
          onClose={() => setIsEventModalOpen(false)}
          onSubmit={handleCreateEvent}
          hive={currentUser}
        />
      )}
    </div>
  )
}

export default App
