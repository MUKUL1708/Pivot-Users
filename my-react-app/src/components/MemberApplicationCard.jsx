import React, { useState } from 'react';
import './MemberApplicationCard.css';

const MemberApplicationCard = ({ 
  application, 
  onApprove, 
  onReject, 
  isProcessing 
}) => {
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      await onApprove(application.id, application);
    } catch (error) {
      console.error('Error approving member:', error);
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    setIsRejecting(true);
    try {
      await onReject(application.id, application);
    } catch (error) {
      console.error('Error rejecting member:', error);
    } finally {
      setIsRejecting(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const isActionDisabled = isProcessing || isApproving || isRejecting;

  return (
    <div className="member-application-card">
      <div className="card-header">
        <div className="member-avatar">
          {getInitials(application.name)}
        </div>
        <div className="member-info">
          <h3 className="member-name">{application.name || 'Unknown Name'}</h3>
          <p className="member-email">{application.email}</p>
          <div className="application-meta">
            <span className="application-date">
              📅 Applied: {formatDate(application.createdAt)}
            </span>
          </div>
        </div>
        <div className="application-status">
          <span className="status-badge pending">
            ⏳ Pending
          </span>
        </div>
      </div>

      <div className="card-content">
        <div className="info-grid">
          <div className="info-item">
            <label>Selected Hive:</label>
            <span className="info-value hive-name">
              🏠 {application.selectedHiveName}
            </span>
          </div>
          
          {application.mobile && (
            <div className="info-item">
              <label>Mobile Number:</label>
              <span className="info-value">
                📱 {application.mobile}
              </span>
            </div>
          )}
          
          {application.course && (
            <div className="info-item">
              <label>Course:</label>
              <span className="info-value">
                📚 {application.course}
              </span>
            </div>
          )}
          
          {application.branch && (
            <div className="info-item">
              <label>Branch:</label>
              <span className="info-value">
                🌱 {application.branch}
              </span>
            </div>
          )}
          
          {application.year && (
            <div className="info-item">
              <label>Year:</label>
              <span className="info-value">
                🏅 {application.year}
              </span>
            </div>
          )}
          
          {application.cgpa && (
            <div className="info-item">
              <label>CGPA:</label>
              <span className="info-value">
                📊 {application.cgpa}
              </span>
            </div>
          )}
        </div>

        {application.mainGoal && (
          <div className="motivation-section">
            <label>Main Goal:</label>
            <p className="motivation-text">"{application.mainGoal}"</p>
          </div>
        )}

        {application.priorProjects && (
          <div className="additional-info-section">
            <label>Prior Projects:</label>
            <p className="additional-info-text">{application.priorProjects}</p>
          </div>
        )}

        {application.skills && application.skills.length > 0 && (
          <div className="additional-info-section">
            <label>Technical Skills:</label>
            <p className="additional-info-text">{application.skills.join(', ')}</p>
          </div>
        )}
      </div>

      <div className="card-actions">
        <button
          className="reject-btn"
          onClick={handleReject}
          disabled={isActionDisabled}
        >
          {isRejecting ? (
            <>
              <div className="spinner"></div>
              Rejecting...
            </>
          ) : (
            <>
              ❌ Reject
            </>
          )}
        </button>
        
        <button
          className="approve-btn"
          onClick={handleApprove}
          disabled={isActionDisabled}
        >
          {isApproving ? (
            <>
              <div className="spinner"></div>
              Approving...
            </>
          ) : (
            <>
              ✅ Approve & Generate Credentials
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default MemberApplicationCard;
