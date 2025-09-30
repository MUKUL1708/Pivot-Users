import React, { useState, useEffect, useMemo } from 'react';
import './Programs.css';

const Programs = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [timeFrame, setTimeFrame] = useState('upcoming');

  // Mock programs data
  const programs = [
    {
      id: 1,
      title: "Tech Bootcamps",
      description: "Intensive hands-on learning sessions covering the latest technologies and frameworks.",
      image: "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=400&h=250&fit=crop",
      duration: "2-4 weeks",
      level: "All Levels"
    },
    {
      id: 2,
      title: "Hackathons",
      description: "48-hour coding competitions where teams solve real-world problems with innovative solutions.",
      image: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=400&h=250&fit=crop",
      duration: "48 hours",
      level: "Intermediate+"
    },
    {
      id: 3,
      title: "Workshop Series",
      description: "Weekly workshops on emerging technologies, career development, and technical skills.",
      image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=250&fit=crop",
      duration: "2-3 hours",
      level: "Beginner"
    }
  ];

  // Mock events data
  const mockEvents = [
    {
      id: 1,
      title: "Web Development Workshop",
      description: "Learn the fundamentals of modern web development with hands-on exercises and projects.",
      eventDate: new Date(Date.now() + 86400000 * 5).toISOString(), // 5 days from now
      startTime: "10:00 AM",
      endTime: "2:00 PM",
      location: "Tech Hub, Downtown",
      capacity: 50,
      eventType: "Workshop",
      requestingHiveName: "Frontend Developers"
    },
    {
      id: 2,
      title: "AI & Machine Learning Conference",
      description: "Explore the latest trends and applications in artificial intelligence and machine learning.",
      eventDate: new Date(Date.now() + 86400000 * 15).toISOString(), // 15 days from now
      startTime: "9:00 AM",
      endTime: "5:00 PM",
      location: "Innovation Center",
      capacity: 100,
      eventType: "Conference",
      requestingHiveName: "AI Research Group"
    },
    {
      id: 3,
      title: "Past Hackathon",
      description: "A 48-hour coding competition focused on solving environmental challenges.",
      eventDate: new Date(Date.now() - 86400000 * 10).toISOString(), // 10 days ago
      startTime: "9:00 AM",
      endTime: "9:00 AM",
      location: "Tech Campus",
      capacity: 75,
      eventType: "Hackathon",
      requestingHiveName: "Green Tech Alliance"
    }
  ];

  const [approvedEvents, setApprovedEvents] = useState(mockEvents);
  const [filteredEvents, setFilteredEvents] = useState(mockEvents);

  // Apply filters whenever filter criteria change
  useEffect(() => {
    if (!approvedEvents.length) return;
    
    let filtered = [...approvedEvents];
    
    // Filter by event type
    if (filterType !== 'all') {
      filtered = filtered.filter(event => event.eventType === filterType);
    }
    
    // Filter by time frame
    const today = new Date();
    if (timeFrame === 'upcoming') {
      filtered = filtered.filter(event => new Date(event.eventDate) >= today);
    } else if (timeFrame === 'past') {
      filtered = filtered.filter(event => new Date(event.eventDate) < today);
    } else if (timeFrame === 'thisMonth') {
      const thisMonth = today.getMonth();
      const thisYear = today.getFullYear();
      filtered = filtered.filter(event => {
        const eventDate = new Date(event.eventDate);
        return eventDate.getMonth() === thisMonth && eventDate.getFullYear() === thisYear;
      });
    }
    
    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(event => 
        event.title?.toLowerCase().includes(term) || 
        event.description?.toLowerCase().includes(term) ||
        event.location?.toLowerCase().includes(term) ||
        event.requestingHiveName?.toLowerCase().includes(term)
      );
    }
    
    // Sort by event date
    if (timeFrame === 'past') {
      filtered.sort((a, b) => new Date(b.eventDate) - new Date(a.eventDate));
    } else {
      filtered.sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate));
    }
    
    setFilteredEvents(filtered);
  }, [approvedEvents, filterType, timeFrame, searchTerm]);
  
  // Get unique event types for filter options
  const eventTypes = useMemo(() => {
    if (!approvedEvents.length) return [];
    
    const types = new Set();
    approvedEvents.forEach(event => {
      if (event.eventType) types.add(event.eventType);
    });
    
    return Array.from(types);
  }, [approvedEvents]);

  // Format date for display
  const formatEventDate = (eventDate) => {
    const date = new Date(eventDate);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  // Format time for display
  const formatEventTime = (startTime, endTime) => {
    if (startTime && endTime) {
      return `${startTime} - ${endTime}`;
    } else if (startTime) {
      return startTime;
    }
    return 'Time TBD';
  };

  // Extract day and month for event date display
  const getDateParts = (eventDate) => {
    const date = new Date(eventDate);
    const day = date.getDate();
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    return { day, month };
  };

  return (
    <section className="programs-section">
      <div className="programs-container">
        <div className="programs-content">
          <h2 className="programs-heading">Programs & Events</h2>
          <p className="programs-description">
            Join our diverse range of programs designed to enhance your skills, expand your network, 
            and accelerate your journey in technology and innovation.
          </p>
          
          {/* Event Filters */}
          <div className="events-filter">
            <div className="filter-row">
              <div className="filter-group">
                <label htmlFor="eventTimeFrame">Time Frame</label>
                <select 
                  id="eventTimeFrame" 
                  value={timeFrame} 
                  onChange={(e) => setTimeFrame(e.target.value)}
                  className="filter-select"
                >
                  <option value="upcoming">Upcoming Events</option>
                  <option value="thisMonth">This Month</option>
                  <option value="past">Past Events</option>
                  <option value="all">All Events</option>
                </select>
              </div>
              
              <div className="filter-group">
                <label htmlFor="eventType">Event Type</label>
                <select 
                  id="eventType" 
                  value={filterType} 
                  onChange={(e) => setFilterType(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">All Types</option>
                  {eventTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              
              <div className="filter-group search-group">
                <label htmlFor="eventSearch">Search</label>
                <input
                  id="eventSearch"
                  type="text"
                  placeholder="Search events..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="filter-input"
                />
              </div>
            </div>
            
            {searchTerm || filterType !== 'all' || timeFrame !== 'upcoming' ? (
              <div className="active-filters">
                <span>Active filters:</span>
                {timeFrame !== 'upcoming' && (
                  <span className="filter-tag">
                    {timeFrame === 'past' ? 'Past Events' : timeFrame === 'thisMonth' ? 'This Month' : 'All Dates'}
                  </span>
                )}
                {filterType !== 'all' && (
                  <span className="filter-tag">{filterType}</span>
                )}
                {searchTerm && (
                  <span className="filter-tag">Search: "{searchTerm}"</span>
                )}
                <button 
                  className="clear-filters" 
                  onClick={() => {
                    setFilterType('all');
                    setTimeFrame('upcoming');
                    setSearchTerm('');
                  }}
                >
                  Clear All
                </button>
              </div>
            ) : null}
          </div>
          
          <div className="programs-grid">
            {programs.map(program => (
              <div key={program.id} className="program-card">
                <div className="program-image">
                  <img src={program.image} alt={program.title} />
                  <div className="program-overlay">
                    <span className="program-level">{program.level}</span>
                  </div>
                </div>
                <div className="program-info">
                  <h3>{program.title}</h3>
                  <p>{program.description}</p>
                  <div className="program-meta">
                    <span className="program-duration">📅 {program.duration}</span>
                  </div>
                  <button className="program-btn">Learn More</button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="events-section">
            <h3 className="events-heading">
              {timeFrame === 'upcoming' ? 'Upcoming Events' :
               timeFrame === 'past' ? 'Past Events' :
               timeFrame === 'thisMonth' ? 'Events This Month' : 'All Events'}
              {filteredEvents.length > 0 && <span className="event-count">({filteredEvents.length})</span>}
            </h3>
            {loading ? (
              <div className="events-loading">
                <p>Loading events...</p>
              </div>
            ) : error ? (
              <div className="events-error">
                <p>Error loading events: {error}</p>
              </div>
            ) : approvedEvents.length === 0 ? (
              <div className="events-empty">
                <p>No events available at this time. Check back soon!</p>
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="events-empty">
                <p>No events match your current filters. Try adjusting your search criteria.</p>
              </div>
            ) : (
              <div className="events-list">
                {filteredEvents.map(event => {
                  const dateParts = getDateParts(event.eventDate);
                  return (
                    <div key={event.id} className="event-item">
                      <div className="event-date">
                        <span className="event-day">{dateParts.day}</span>
                        <span className="event-month">{dateParts.month}</span>
                        {event.eventType && (
                          <span className="event-type-badge">{event.eventType}</span>
                        )}
                      </div>
                      <div className="event-details">
                        <h4>{event.title}</h4>
                        <div className="event-info">
                          <span className="event-time">🕐 {formatEventTime(event.startTime, event.endTime)}</span>
                          <span className="event-location">📍 {event.location || 'Location TBD'}</span>
                          <span className="event-capacity">👥 {event.capacity ? `${event.capacity} spots` : 'Open registration'}</span>
                          {timeFrame === 'past' && (
                            <span className="event-past-label">Completed</span>
                          )}
                        </div>
                        {event.description && (
                          <p className="event-description">{event.description.substring(0, 150)}...
                            <button className="read-more-btn">Read More</button>
                          </p>
                        )}
                        {event.requestingHiveName && (
                          <div className="event-organizer">
                            <span>📋 Organized by: <strong>{event.requestingHiveName}</strong></span>
                          </div>
                        )}
                      </div>
                      <div className="event-action">
                        {new Date(event.eventDate) >= new Date() ? (
                          <button className="event-register-btn">Register</button>
                        ) : (
                          <button className="event-view-btn">View Details</button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Programs;