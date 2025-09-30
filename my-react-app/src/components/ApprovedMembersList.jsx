import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import './ApprovedMembersList.css';

const ApprovedMembersList = ({ hive }) => {
  const [approvedMembers, setApprovedMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name'); // name, date, course
  const [error, setError] = useState('');

  // Fetch approved members for this hive
  useEffect(() => {
    if (!hive?.hiveName) return;

    setLoading(true);
    setError('');

    // Query for approved members for this hive
    const approvedQuery = query(
      collection(db, 'members_approved'),
      where('selectedHiveName', '==', hive.hiveName)
    );

    // Subscribe to real-time updates
    const unsubscribe = onSnapshot(approvedQuery, (snapshot) => {
      const membersList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setApprovedMembers(membersList);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching approved members:', error);
      setError('Failed to load approved members. Please try again.');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [hive?.hiveName]);

  // Filter and sort members
  const filteredAndSortedMembers = approvedMembers
    .filter(member => {
      if (!searchTerm) return true;
      const searchLower = searchTerm.toLowerCase();
      return (
        member.name?.toLowerCase().includes(searchLower) ||
        member.email?.toLowerCase().includes(searchLower) ||
        member.course?.toLowerCase().includes(searchLower) ||
        member.branch?.toLowerCase().includes(searchLower)
      );
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        case 'date':
          return new Date(b.approvedAt || 0) - new Date(a.approvedAt || 0);
        case 'course':
          return (a.course || '').localeCompare(b.course || '');
        case 'year':
          return (a.year || '').localeCompare(b.year || '');
        default:
          return 0;
      }
    });

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="approved-members-list">
        <div className="approved-members-header">
          <h2>👥 Approved Members</h2>
          <p>Active members in <span className="hive-highlight">{hive?.hiveName}</span></p>
        </div>
        
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading approved members...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="approved-members-list">
      <div className="approved-members-header">
        <div className="header-content">
          <h2>👥 Approved Members</h2>
          <p>Active members in <span className="hive-highlight">{hive?.hiveName}</span></p>
        </div>
        
        {/* Member Count Statistics */}
        <div className="member-stats-summary">
          <div className="stat-item">
            <div className="stat-number">{approvedMembers.length}</div>
            <div className="stat-label">Active Members</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">{filteredAndSortedMembers.length}</div>
            <div className="stat-label">Displayed</div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="members-controls">
        <div className="search-container">
          <input
            type="text"
            placeholder="Search members by name, email, course, or branch..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <span className="search-icon">🔍</span>
        </div>
        
        <div className="sort-container">
          <label>Sort by:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-select"
          >
            <option value="name">Name</option>
            <option value="date">Join Date</option>
            <option value="course">Course</option>
            <option value="year">Year</option>
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

      {/* Members List */}
      <div className="members-section">
        <div className="section-header">
          <h3>
            Active Members
            <span className="count">({filteredAndSortedMembers.length})</span>
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

        {filteredAndSortedMembers.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <h3>
              {approvedMembers.length === 0 
                ? 'No approved members yet' 
                : 'No members match your search'
              }
            </h3>
            <p>
              {approvedMembers.length === 0 
                ? `No members have been approved for ${hive?.hiveName} yet. Approved members will appear here.`
                : 'Try adjusting your search term to see more members.'
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
          <div className="members-grid">
            {filteredAndSortedMembers.map(member => (
              <div key={member.id} className="member-card">
                <div className="member-header">
                  <div className="member-avatar">
                    {getInitials(member.name)}
                  </div>
                  <div className="member-basic-info">
                    <h3 className="member-name">{member.name}</h3>
                    <p className="member-email">{member.email}</p>
                    <div className="member-meta">
                      <span className="join-date">
                        📅 Joined: {formatDate(member.approvedAt)}
                      </span>
                    </div>
                  </div>
                  <div className="member-status">
                    <span className="status-badge active">
                      ✅ Active
                    </span>
                  </div>
                </div>

                <div className="member-details">
                  <div className="details-grid">
                    {member.course && (
                      <div className="detail-item">
                        <label>Course:</label>
                        <span>📚 {member.course}</span>
                      </div>
                    )}
                    
                    {member.branch && (
                      <div className="detail-item">
                        <label>Branch:</label>
                        <span>🌱 {member.branch}</span>
                      </div>
                    )}
                    
                    {member.year && (
                      <div className="detail-item">
                        <label>Year:</label>
                        <span>🏅 {member.year}</span>
                      </div>
                    )}
                    
                    {member.cgpa && (
                      <div className="detail-item">
                        <label>CGPA:</label>
                        <span>📊 {member.cgpa}</span>
                      </div>
                    )}
                    
                    {member.mobile && (
                      <div className="detail-item">
                        <label>Mobile:</label>
                        <span>📱 {member.mobile}</span>
                      </div>
                    )}
                  </div>

                  {member.skills && member.skills.length > 0 && (
                    <div className="skills-section">
                      <label>Technical Skills:</label>
                      <div className="skills-tags">
                        {member.skills.map((skill, index) => (
                          <span key={index} className="skill-tag">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {member.mainGoal && (
                    <div className="goal-section">
                      <label>Main Goal:</label>
                      <p className="goal-text">"{member.mainGoal}"</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ApprovedMembersList;
