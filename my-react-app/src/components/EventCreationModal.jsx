import React, { useState } from 'react';
import './EventCreationModal.css';

const EventCreationModal = ({ isOpen, onClose, onSubmit, hive }) => {
  const [formData, setFormData] = useState({
    // Event Information
    eventName: '',
    eventType: '',
    eventDescription: '',
    timeline: '',
    
    // Venue & Schedule
    campus: '',
    venue: '',
    duration: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    
    // Participation
    maxParticipants: '',
    registrationFees: '',
    numberOfVolunteers: '',
    prerequisites: '',
    
    // Budget & Planning
    estimatedBudget: '',
    budgetBreakdown: '',
    sponsorshipNeeded: false,
    additionalNotes: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Required fields validation
    if (!formData.eventName.trim()) newErrors.eventName = 'Event name is required';
    if (!formData.eventType) newErrors.eventType = 'Event type is required';
    if (!formData.campus.trim()) newErrors.campus = 'Campus location is required';
    if (!formData.startDate) newErrors.startDate = 'Start date is required';
    if (!formData.startTime) newErrors.startTime = 'Start time is required';
    if (!formData.duration) newErrors.duration = 'Duration is required';
    if (!formData.maxParticipants || formData.maxParticipants <= 0) {
      newErrors.maxParticipants = 'Valid number of participants is required';
    }
    if (!formData.estimatedBudget || formData.estimatedBudget < 0) {
      newErrors.estimatedBudget = 'Valid budget estimate is required';
    }

    // Date validation
    if (formData.startDate && formData.endDate && formData.endDate < formData.startDate) {
      newErrors.endDate = 'End date cannot be before start date';
    }

    // Time validation for same day events
    if (formData.startDate && formData.endDate && formData.startDate === formData.endDate) {
      if (formData.startTime && formData.endTime && formData.endTime <= formData.startTime) {
        newErrors.endTime = 'End time must be after start time';
      }
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    
    try {
      const eventData = {
        ...formData,
        hiveName: hive.hiveName,
        hiveId: hive.id || hive.hiveName, // Use id if available, otherwise use name
        creatorName: hive.creatorName,
        creatorEmail: hive.email,
        status: 'draft', // Events start as draft
        approvalStatus: 'pending', // Events need admin approval
        adminComments: '', // Admin comments for approval/rejection
        approvedAt: null,
        approvedBy: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await onSubmit(eventData);
      onClose();
      
      // Reset form
      setFormData({
        eventName: '', eventType: '', eventDescription: '', timeline: '',
        campus: '', venue: '', duration: '', startDate: '', startTime: '', endDate: '', endTime: '',
        maxParticipants: '', registrationFees: '', numberOfVolunteers: '', prerequisites: '',
        estimatedBudget: '', budgetBreakdown: '', sponsorshipNeeded: false, additionalNotes: ''
      });
      setErrors({});
    } catch (error) {
      console.error('Error creating event:', error);
      alert('Failed to create event. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="event-modal-overlay" onClick={onClose}>
      <div className="event-modal" onClick={(e) => e.stopPropagation()}>
        <div className="event-modal-header">
          <h2>🎉 Create New Event</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <form className="event-form" onSubmit={handleSubmit}>
          {/* Section 1: Event Information */}
          <div className="form-section">
            <h3>📋 Event Information</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="eventName">Event Name *</label>
                <input
                  type="text"
                  id="eventName"
                  name="eventName"
                  value={formData.eventName}
                  onChange={handleInputChange}
                  placeholder="Enter event name"
                  className={errors.eventName ? 'error' : ''}
                />
                {errors.eventName && <span className="error-text">{errors.eventName}</span>}
              </div>
              
              <div className="form-group">
                <label htmlFor="eventType">Event Type *</label>
                <select
                  id="eventType"
                  name="eventType"
                  value={formData.eventType}
                  onChange={handleInputChange}
                  className={errors.eventType ? 'error' : ''}
                >
                  <option value="">Select event type</option>
                  <option value="workshop">Workshop</option>
                  <option value="seminar">Seminar</option>
                  <option value="hackathon">Hackathon</option>
                  <option value="networking">Networking Event</option>
                  <option value="competition">Competition</option>
                  <option value="conference">Conference</option>
                  <option value="social">Social Gathering</option>
                  <option value="training">Training Session</option>
                  <option value="other">Other</option>
                </select>
                {errors.eventType && <span className="error-text">{errors.eventType}</span>}
              </div>
            </div>
            
            <div className="form-group full-width">
              <label htmlFor="eventDescription">Event Description</label>
              <textarea
                id="eventDescription"
                name="eventDescription"
                value={formData.eventDescription}
                onChange={handleInputChange}
                placeholder="Describe your event, its objectives, and what participants can expect..."
                rows="3"
              />
            </div>
            
            <div className="form-group full-width">
              <label htmlFor="timeline">Event Timeline/Agenda</label>
              <textarea
                id="timeline"
                name="timeline"
                value={formData.timeline}
                onChange={handleInputChange}
                placeholder="Provide a detailed schedule or timeline for the event..."
                rows="3"
              />
            </div>
          </div>

          {/* Section 2: Venue & Schedule */}
          <div className="form-section">
            <h3>📍 Venue & Schedule</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="campus">Campus/Location *</label>
                <input
                  type="text"
                  id="campus"
                  name="campus"
                  value={formData.campus}
                  onChange={handleInputChange}
                  placeholder="Which campus or location?"
                  className={errors.campus ? 'error' : ''}
                />
                {errors.campus && <span className="error-text">{errors.campus}</span>}
              </div>
              
              <div className="form-group">
                <label htmlFor="venue">Specific Venue</label>
                <input
                  type="text"
                  id="venue"
                  name="venue"
                  value={formData.venue}
                  onChange={handleInputChange}
                  placeholder="Room/Hall/Building name"
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="duration">Duration *</label>
                <select
                  id="duration"
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                  className={errors.duration ? 'error' : ''}
                >
                  <option value="">Select duration</option>
                  <option value="1 hour">1 hour</option>
                  <option value="2 hours">2 hours</option>
                  <option value="3 hours">3 hours</option>
                  <option value="Half day (4 hours)">Half day (4 hours)</option>
                  <option value="Full day (8 hours)">Full day (8 hours)</option>
                  <option value="2 days">2 days</option>
                  <option value="3 days">3 days</option>
                  <option value="1 week">1 week</option>
                  <option value="Custom">Custom</option>
                </select>
                {errors.duration && <span className="error-text">{errors.duration}</span>}
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="startDate">Start Date *</label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  min={new Date().toISOString().split('T')[0]}
                  className={errors.startDate ? 'error' : ''}
                />
                {errors.startDate && <span className="error-text">{errors.startDate}</span>}
              </div>
              
              <div className="form-group">
                <label htmlFor="startTime">Start Time *</label>
                <input
                  type="time"
                  id="startTime"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleInputChange}
                  className={errors.startTime ? 'error' : ''}
                />
                {errors.startTime && <span className="error-text">{errors.startTime}</span>}
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="endDate">End Date</label>
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  min={formData.startDate || new Date().toISOString().split('T')[0]}
                  className={errors.endDate ? 'error' : ''}
                />
                {errors.endDate && <span className="error-text">{errors.endDate}</span>}
              </div>
              
              <div className="form-group">
                <label htmlFor="endTime">End Time</label>
                <input
                  type="time"
                  id="endTime"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleInputChange}
                  className={errors.endTime ? 'error' : ''}
                />
                {errors.endTime && <span className="error-text">{errors.endTime}</span>}
              </div>
            </div>
          </div>

          {/* Section 3: Participation */}
          <div className="form-section">
            <h3>👥 Participation Details</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="maxParticipants">Maximum Participants *</label>
                <input
                  type="number"
                  id="maxParticipants"
                  name="maxParticipants"
                  value={formData.maxParticipants}
                  onChange={handleInputChange}
                  placeholder="Enter maximum number"
                  min="1"
                  className={errors.maxParticipants ? 'error' : ''}
                />
                {errors.maxParticipants && <span className="error-text">{errors.maxParticipants}</span>}
              </div>
              
              <div className="form-group">
                <label htmlFor="registrationFees">Registration Fees (₹)</label>
                <input
                  type="number"
                  id="registrationFees"
                  name="registrationFees"
                  value={formData.registrationFees}
                  onChange={handleInputChange}
                  placeholder="Enter amount (0 for free)"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="numberOfVolunteers">Number of Volunteers Needed</label>
                <input
                  type="number"
                  id="numberOfVolunteers"
                  name="numberOfVolunteers"
                  value={formData.numberOfVolunteers}
                  onChange={handleInputChange}
                  placeholder="Enter number needed"
                  min="0"
                />
              </div>
            </div>
            
            <div className="form-group full-width">
              <label htmlFor="prerequisites">Prerequisites/Requirements</label>
              <textarea
                id="prerequisites"
                name="prerequisites"
                value={formData.prerequisites}
                onChange={handleInputChange}
                placeholder="Any specific skills, equipment, or requirements for participants..."
                rows="2"
              />
            </div>
          </div>

          {/* Section 4: Budget & Planning */}
          <div className="form-section">
            <h3>💰 Budget & Planning</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="estimatedBudget">Estimated Budget (₹) *</label>
                <input
                  type="number"
                  id="estimatedBudget"
                  name="estimatedBudget"
                  value={formData.estimatedBudget}
                  onChange={handleInputChange}
                  placeholder="Total estimated cost"
                  min="0"
                  step="0.01"
                  className={errors.estimatedBudget ? 'error' : ''}
                />
                {errors.estimatedBudget && <span className="error-text">{errors.estimatedBudget}</span>}
              </div>
            </div>
            
            <div className="form-group full-width">
              <label htmlFor="budgetBreakdown">Budget Breakdown</label>
              <textarea
                id="budgetBreakdown"
                name="budgetBreakdown"
                value={formData.budgetBreakdown}
                onChange={handleInputChange}
                placeholder="Break down the budget: venue costs, refreshments, materials, speaker fees, etc."
                rows="3"
              />
            </div>
            
            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="sponsorshipNeeded"
                  checked={formData.sponsorshipNeeded}
                  onChange={handleInputChange}
                />
                <span className="checkmark"></span>
                Sponsorship or external funding needed
              </label>
            </div>
            
            <div className="form-group full-width">
              <label htmlFor="additionalNotes">Additional Notes</label>
              <textarea
                id="additionalNotes"
                name="additionalNotes"
                value={formData.additionalNotes}
                onChange={handleInputChange}
                placeholder="Any additional information, special requirements, or notes..."
                rows="2"
              />
            </div>
          </div>

          <div className="form-actions">
            <button 
              type="button" 
              className="cancel-btn"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating Event...' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventCreationModal;
