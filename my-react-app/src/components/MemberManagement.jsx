import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { memberService } from '../services/memberService';
import MemberApplicationCard from './MemberApplicationCard';
import MemberCredentialsModal from './MemberCredentialsModal';
import ApprovedMembersList from './ApprovedMembersList';
import './MemberManagement.css';

const MemberManagement = ({ hive, mode = 'applications' }) => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [filter, setFilter] = useState('all'); // all, recent, thisWeek, thisMonth
  const [searchTerm, setSearchTerm] = useState('');
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [generatedCredentials, setGeneratedCredentials] = useState(null);
  const [approvedMemberData, setApprovedMemberData] = useState(null);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  });

  // Fetch member applications for this hive
  useEffect(() => {
    if (!hive?.hiveName || mode !== 'applications') return;

    setLoading(true);
    setError('');

    // Query for pending applications for this hive
    const applicationsQuery = query(
      collection(db, 'members'),
      where('selectedHiveName', '==', hive.hiveName)
    );

    // Also query for approved and rejected to get stats
    const approvedQuery = query(
      collection(db, 'members_approved'),
      where('selectedHiveName', '==', hive.hiveName)
    );

    const rejectedQuery = query(
      collection(db, 'members_rejected'),
      where('selectedHiveName', '==', hive.hiveName)
    );

    // Subscribe to real-time updates for pending applications
    const unsubscribe = onSnapshot(applicationsQuery, (snapshot) => {
      const applicationsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Sort by createdAt in descending order (newest first)
      applicationsList.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateB - dateA;
      });
      
      setApplications(applicationsList);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching applications:', error);
      setError('Failed to load member applications. Please try again.');
      setLoading(false);
    });

    // Get stats
    const fetchStats = async () => {
      try {
        // Count approved members
        const approvedSnapshot = await memberService.getApprovedMembers(hive.hiveName);
        const approvedCount = approvedSnapshot.size;

        // Count rejected members  
        const rejectedSnapshot = await memberService.getRejectedMembers(hive.hiveName);
        const rejectedCount = rejectedSnapshot.size;

        setStats(prevStats => ({
          ...prevStats,
          approved: approvedCount,
          rejected: rejectedCount
        }));
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();

    return () => unsubscribe();
  }, [hive?.hiveName, mode]);

  // If mode is 'members', show the approved members list instead
  if (mode === 'members') {
    return <ApprovedMembersList hive={hive} />;
  }

  // Update stats when applications change
  useEffect(() => {
    setStats(prevStats => ({
      ...prevStats,
      pending: applications.length,
      total: prevStats.approved + prevStats.rejected + applications.length
    }));
  }, [applications, stats.approved, stats.rejected]);

  // Filter applications based on selected filter and search term
  const filteredApplications = applications.filter(application => {
    // Search filter
    const matchesSearch = !searchTerm || 
      application.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      application.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      application.course?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      application.branch?.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    // Date filter
    if (filter === 'all') return true;
    
    const applicationDate = application.createdAt ? 
      new Date(application.createdAt) : new Date();
    const now = new Date();
    const diffTime = Math.abs(now - applicationDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    switch (filter) {
      case 'recent':
        return diffDays <= 3;
      case 'thisWeek':
        return diffDays <= 7;
      case 'thisMonth':
        return diffDays <= 30;
      default:
        return true;
    }
  });

  const handleApprove = async (applicationId, applicationData) => {
    setProcessingId(applicationId);
    try {
      const credentials = await memberService.approveMember(applicationId, applicationData);
      
      setGeneratedCredentials(credentials);
      setApprovedMemberData(applicationData);
      setShowCredentialsModal(true);
      
      // Remove from local state immediately for better UX
      setApplications(prev => prev.filter(app => app.id !== applicationId));
      
    } catch (error) {
      console.error('Error approving member:', error);
      setError('Failed to approve member. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (applicationId, applicationData) => {
    setProcessingId(applicationId);
    try {
      await memberService.rejectMember(applicationId, applicationData);
      
      // Remove from local state immediately for better UX
      setApplications(prev => prev.filter(app => app.id !== applicationId));
      
    } catch (error) {
      console.error('Error rejecting member:', error);
      setError('Failed to reject member. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleCloseCredentialsModal = () => {
    setShowCredentialsModal(false);
    setGeneratedCredentials(null);
    setApprovedMemberData(null);
  };

  const getFilterLabel = (filterValue) => {
    switch (filterValue) {
      case 'recent': return 'Last 3 Days';
      case 'thisWeek': return 'This Week';
      case 'thisMonth': return 'This Month';
      default: return 'All Applications';
    }
  };

  if (loading) {
    return (
      <div className="member-management">
        <div className="member-management-header">
          <h2>👥 Member Applications</h2>
          <p>Managing applications for <span className="hive-highlight">{hive?.hiveName}</span></p>
        </div>
        
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading member applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="member-management">
      <div className="member-management-header">
        <div className="header-content">
          <h2>👥 Member Applications</h2>
          <p>Managing applications for <span className="hive-highlight">{hive?.hiveName}</span></p>
        </div>
        
        {/* Stats Overview */}
        <div className="stats-grid">
          <div className="stat-card total">
            <div className="stat-number">{stats.total}</div>
            <div className="stat-label">Total Applications</div>
          </div>
          <div className="stat-card pending">
            <div className="stat-number">{stats.pending}</div>
            <div className="stat-label">Pending Review</div>
          </div>
          <div className="stat-card approved">
            <div className="stat-number">{stats.approved}</div>
            <div className="stat-label">Approved</div>
          </div>
          <div className="stat-card rejected">
            <div className="stat-number">{stats.rejected}</div>
            <div className="stat-label">Rejected</div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="management-controls">
        <div className="search-container">
          <input
            type="text"
            placeholder="Search by name, email, course, or branch..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <span className="search-icon">🔍</span>
        </div>
        
        <div className="filter-container">
          <label>Filter by:</label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Applications</option>
            <option value="recent">Last 3 Days</option>
            <option value="thisWeek">This Week</option>
            <option value="thisMonth">This Month</option>
          </select>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-banner">
          <span className="error-icon">⚠️</span>
          {error}
          <button 
            onClick={() => setError('')} 
            className="dismiss-btn"
            aria-label="Dismiss error"
          >
            ✕
          </button>
        </div>
      )}

      {/* Applications List */}
      <div className="applications-section">
        <div className="section-header">
          <h3>
            {getFilterLabel(filter)} 
            <span className="count">({filteredApplications.length})</span>
          </h3>
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')} 
              className="clear-search-btn"
            >
              Clear search
            </button>
          )}
        </div>

        {filteredApplications.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h3>
              {applications.length === 0 
                ? 'No member applications yet' 
                : 'No applications match your filters'
              }
            </h3>
            <p>
              {applications.length === 0 
                ? `No one has applied to join ${hive?.hiveName} yet. Applications will appear here when submitted.`
                : 'Try adjusting your search term or date filter to see more applications.'
              }
            </p>
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')} 
                className="secondary-btn"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="applications-grid">
            {filteredApplications.map(application => (
              <MemberApplicationCard
                key={application.id}
                application={application}
                onApprove={handleApprove}
                onReject={handleReject}
                isProcessing={processingId === application.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* Member Credentials Modal */}
      {showCredentialsModal && generatedCredentials && approvedMemberData && (
        <div className="modal-overlay">
          <MemberCredentialsModal
            credentials={generatedCredentials}
            memberData={approvedMemberData}
            onClose={handleCloseCredentialsModal}
          />
        </div>
      )}
    </div>
  );
};

export default MemberManagement;
