import React, { useState, useEffect } from 'react';
import { eventService } from '../services/eventService';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import './EventsManagement.css';

const EventsManagement = ({ hive, onCreateEvent }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [eventStats, setEventStats] = useState({
    total: 0,
    draft: 0,
    active: 0,
    completed: 0,
    cancelled: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  });

  // Set up real-time listener for events for the current hive
  useEffect(() => {
    if (!hive?.hiveName) {
      setLoading(false);
      return;
    }

    console.log('📋 Setting up real-time listener for hive events:', hive.hiveName);
    setLoading(true);

    // Create query for events belonging to this hive
    const eventsQuery = query(
      collection(db, 'events'),
      where('hiveName', '==', hive.hiveName)
    );

    // Set up real-time listener
    const unsubscribe = onSnapshot(eventsQuery, 
      (snapshot) => {
        try {
          const hiveEvents = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            // Ensure approvalStatus defaults to pending for backward compatibility
            approvalStatus: doc.data().approvalStatus || 'pending'
          }));

          console.log(`✅ Real-time update: ${hiveEvents.length} events for ${hive.hiveName}`);
          setEvents(hiveEvents);
          
          // Calculate statistics
          const stats = {
            total: hiveEvents.length,
            draft: hiveEvents.filter(e => e.status === 'draft').length,
            active: hiveEvents.filter(e => e.status === 'active').length,
            completed: hiveEvents.filter(e => e.status === 'completed').length,
            cancelled: hiveEvents.filter(e => e.status === 'cancelled').length,
            pending: hiveEvents.filter(e => (e.approvalStatus || 'pending') === 'pending').length,
            approved: hiveEvents.filter(e => e.approvalStatus === 'approved').length,
            rejected: hiveEvents.filter(e => e.approvalStatus === 'rejected').length
          };
          setEventStats(stats);
          
          console.log('📊 Event statistics updated:', stats);
          setError(''); // Clear any previous errors
          setLoading(false);
        } catch (error) {
          console.error('💥 Error processing events snapshot:', error);
          setError('Failed to load events. Please try again.');
          setLoading(false);
        }
      },
      (error) => {
        console.error('💥 Error with events listener:', error);
        setError('Failed to load events. Please check your connection.');
        setLoading(false);
      }
    );

    // Cleanup listener on component unmount or hive change
    return () => {
      console.log('🔌 Cleaning up events listener for:', hive.hiveName);
      unsubscribe();
    };
  }, [hive?.hiveName]);

  // Filter events based on status
  const filteredEvents = events.filter(event => {
    if (statusFilter === 'all') return true;
    return event.status === statusFilter;
  });

  const handleStatusUpdate = async (eventId, newStatus) => {
    try {
      console.log('🔄 Updating event status:', eventId, 'to', newStatus);
      await eventService.updateEventStatus(eventId, newStatus);
      
      // Update local state
      setEvents(prevEvents => 
        prevEvents.map(event => 
          event.id === eventId 
            ? { ...event, status: newStatus } 
            : event
        )
      );
      
      // Recalculate stats
      const updatedEvents = events.map(event => 
        event.id === eventId 
          ? { ...event, status: newStatus } 
          : event
      );
      
      const stats = {
        total: updatedEvents.length,
        draft: updatedEvents.filter(e => e.status === 'draft').length,
        active: updatedEvents.filter(e => e.status === 'active').length,
        completed: updatedEvents.filter(e => e.status === 'completed').length,
        cancelled: updatedEvents.filter(e => e.status === 'cancelled').length,
        pending: updatedEvents.filter(e => e.approvalStatus === 'pending').length,
        approved: updatedEvents.filter(e => e.approvalStatus === 'approved').length,
        rejected: updatedEvents.filter(e => e.approvalStatus === 'rejected').length
      };
      setEventStats(stats);
      
    } catch (error) {
      console.error('💥 Error updating event status:', error);
      alert('Failed to update event status. Please try again.');
    }
  };

  const handleDeleteEvent = async (eventId, eventName) => {
    if (!window.confirm(`Are you sure you want to delete "${eventName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      console.log('🗑️ Deleting event:', eventId);
      await eventService.deleteEvent(eventId);
      
      // Remove from local state
      setEvents(prevEvents => prevEvents.filter(event => event.id !== eventId));
      
      // Update stats
      const remainingEvents = events.filter(event => event.id !== eventId);
      const stats = {
        total: remainingEvents.length,
        draft: remainingEvents.filter(e => e.status === 'draft').length,
        active: remainingEvents.filter(e => e.status === 'active').length,
        completed: remainingEvents.filter(e => e.status === 'completed').length,
        cancelled: remainingEvents.filter(e => e.status === 'cancelled').length,
        pending: remainingEvents.filter(e => e.approvalStatus === 'pending').length,
        approved: remainingEvents.filter(e => e.approvalStatus === 'approved').length,
        rejected: remainingEvents.filter(e => e.approvalStatus === 'rejected').length
      };
      setEventStats(stats);
      
    } catch (error) {
      console.error('💥 Error deleting event:', error);
      alert('Failed to delete event. Please try again.');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft': return '#94a3b8';
      case 'active': return '#10b981';
      case 'completed': return '#3b82f6';
      case 'cancelled': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'draft': return '📝';
      case 'active': return '🔴';
      case 'completed': return '✅';
      case 'cancelled': return '❌';
      default: return '⚪';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  if (loading) {
    return (
      <div className="events-management">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading events...</p>
        </div>
      </div>
    );
  }

  // Debug logging
  console.log('🔍 EventsManagement render - Hive:', hive?.hiveName, 'Events count:', events.length, 'Loading:', loading);
  
  return (
    <div className="events-management">
      <div className="events-header">
        <div className="header-content">
          <h2>📅 Events Management</h2>
          <p>Manage your hive's events and activities</p>
          <small style={{color: '#94a3b8', fontSize: '0.8rem'}}>
            Showing real-time events for: {hive?.hiveName || 'No hive selected'}
          </small>
        </div>
        <button className="create-event-btn" onClick={onCreateEvent}>
          🎉 Create New Event
        </button>
      </div>

      {error && (
        <div className="error-banner">
          <span>⚠️ {error}</span>
          <button className="close-error" onClick={() => setError('')}>×</button>
        </div>
      )}

      {/* Statistics */}
      <div className="event-stats-grid">
        <div className="stat-card total">
          <div className="stat-number">{eventStats.total}</div>
          <div className="stat-label">Total Events</div>
        </div>
        <div className="stat-card draft">
          <div className="stat-number">{eventStats.draft}</div>
          <div className="stat-label">Draft Events</div>
        </div>
        <div className="stat-card active">
          <div className="stat-number">{eventStats.active}</div>
          <div className="stat-label">Active Events</div>
        </div>
        <div className="stat-card completed">
          <div className="stat-number">{eventStats.completed}</div>
          <div className="stat-label">Completed</div>
        </div>
        <div className="stat-card cancelled">
          <div className="stat-number">{eventStats.cancelled}</div>
          <div className="stat-label">Cancelled</div>
        </div>
      </div>

      {/* Approval Statistics */}
      <div className="approval-stats-grid">
        <div className="approval-stat-card pending">
          <div className="stat-number">{eventStats.pending}</div>
          <div className="stat-label">Pending Approval</div>
        </div>
        <div className="approval-stat-card approved">
          <div className="stat-number">{eventStats.approved}</div>
          <div className="stat-label">Approved by Admin</div>
        </div>
        <div className="approval-stat-card rejected">
          <div className="stat-number">{eventStats.rejected}</div>
          <div className="stat-label">Rejected by Admin</div>
        </div>
      </div>

      {/* Controls */}
      <div className="events-controls">
        <div className="filter-container">
          <label htmlFor="statusFilter">Filter by Status:</label>
          <select
            id="statusFilter"
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status ({eventStats.total})</option>
            <option value="draft">Draft ({eventStats.draft})</option>
            <option value="active">Active ({eventStats.active})</option>
            <option value="completed">Completed ({eventStats.completed})</option>
            <option value="cancelled">Cancelled ({eventStats.cancelled})</option>
          </select>
        </div>
      </div>

      {/* Events List */}
      <div className="events-section">
        <div className="section-header">
          <h3>Events <span className="count">({filteredEvents.length})</span></h3>
        </div>

        {filteredEvents.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🎪</div>
            <h3>No events found</h3>
            <p>
              {events.length === 0 
                ? `No events found for ${hive?.hiveName || 'this hive'}. Click 'Create New Event' to get started!`
                : "No events match your current filter criteria."
              }
            </p>
            {events.length === 0 && (
              <div style={{marginTop: '16px', padding: '12px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '8px'}}>
                <small style={{color: '#93c5fd', fontSize: '0.8rem'}}>
                  📝 Debug: Listening for events in Firebase collection 'events' where hiveName = '{hive?.hiveName}'
                </small>
              </div>
            )}
            {events.length === 0 && (
              <button className="create-first-event-btn" onClick={onCreateEvent}>
                🎉 Create Your First Event
              </button>
            )}
          </div>
        ) : (
          <div className="events-grid">
            {filteredEvents.map(event => (
              <div key={event.id} className="event-card">
                <div className="event-header">
                  <div className="event-title">
                    <h4>{event.eventName}</h4>
                    <div className="event-type">{event.eventType}</div>
                  </div>
                  <div className="event-status">
                    <span 
                      className={`status-badge ${event.status}`}
                      style={{ borderColor: getStatusColor(event.status) }}
                    >
                      {getStatusIcon(event.status)} {event.status}
                    </span>
                    <span 
                      className={`approval-badge ${event.approvalStatus || 'pending'}`}
                    >
                      {event.approvalStatus === 'approved' && '✅ Approved'}
                      {event.approvalStatus === 'rejected' && '❌ Rejected'}
                      {(!event.approvalStatus || event.approvalStatus === 'pending') && '⏳ Pending Approval'}
                    </span>
                  </div>
                </div>

                <div className="event-details">
                  <div className="detail-row">
                    <span className="detail-label">📍 Location:</span>
                    <span className="detail-value">{event.campus}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">📅 Date:</span>
                    <span className="detail-value">
                      {formatDate(event.startDate)}
                      {event.startTime && ` at ${formatTime(event.startTime)}`}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">👥 Participants:</span>
                    <span className="detail-value">{event.maxParticipants || 'Unlimited'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">💰 Budget:</span>
                    <span className="detail-value">₹{event.estimatedBudget || 0}</span>
                  </div>
                </div>

                {event.eventDescription && (
                  <div className="event-description">
                    <p>{event.eventDescription}</p>
                  </div>
                )}

                {/* Admin Comments Section */}
                {event.adminComments && (
                  <div className="admin-comments">
                    <h5>Admin Comments:</h5>
                    <p>{event.adminComments}</p>
                    {event.approvedAt && (
                      <small>Updated: {formatDate(event.approvedAt)} by {event.approvedBy || 'Admin'}</small>
                    )}
                  </div>
                )}

                <div className="event-actions">
                  <div className="status-actions">
                    <select
                      value={event.status}
                      onChange={(e) => handleStatusUpdate(event.id, e.target.value)}
                      className="status-select"
                    >
                      <option value="draft">📝 Draft</option>
                      <option value="active">🔴 Active</option>
                      <option value="completed">✅ Completed</option>
                      <option value="cancelled">❌ Cancelled</option>
                    </select>
                  </div>
                  
                  <div className="action-buttons">
                    <button className="action-btn edit-btn" title="Edit Event">
                      ✏️ Edit
                    </button>
                    <button 
                      className="action-btn delete-btn" 
                      title="Delete Event"
                      onClick={() => handleDeleteEvent(event.id, event.eventName)}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>

                <div className="event-meta">
                  <small>
                    Created: {formatDate(event.createdAt?.seconds ? 
                      new Date(event.createdAt.seconds * 1000).toISOString().split('T')[0] : 
                      event.createdAt
                    )}
                  </small>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EventsManagement;
