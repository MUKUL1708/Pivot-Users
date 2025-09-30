import React from 'react';
import './Vision.css';

const Vision = () => {
  return (
    <section className="vision-section">
      <div className="vision-container">
        <div className="vision-content">
          <h2 className="vision-heading">Vision & Core Values</h2>
          <p className="vision-description">
            Our vision is to build a global network of communities that drive positive change through technology and collaboration. We believe in creating inclusive spaces where everyone has the opportunity to learn, grow, and contribute.
          </p>
          
          <div className="vision-values">
            <div className="value-item">
              <div className="value-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              </div>
              <h3>Integrity</h3>
              <p>We uphold the highest standards of honesty, transparency, and ethical behavior in all our interactions.</p>
            </div>
            
            <div className="value-item">
              <div className="value-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
              <h3>Inclusivity</h3>
              <p>We celebrate diversity and create welcoming environments where everyone feels valued and respected.</p>
            </div>
            
            <div className="value-item">
              <div className="value-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                  <path d="M2 17l10 5 10-5"></path>
                  <path d="M2 12l10 5 10-5"></path>
                </svg>
              </div>
              <h3>Innovation</h3>
              <p>We foster creativity and encourage experimentation to find new and better ways to solve problems.</p>
            </div>
            
            <div className="value-item">
              <div className="value-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="8.5" cy="7" r="4"></circle>
                  <line x1="20" y1="8" x2="20" y2="14"></line>
                  <line x1="23" y1="11" x2="17" y2="11"></line>
                </svg>
              </div>
              <h3>Community</h3>
              <p>We believe in the power of people coming together to support one another and achieve common goals.</p>
            </div>
          </div>
          
          <div className="vision-impact">
            <div className="impact-content">
              <h3 className="impact-heading">Our Impact</h3>
              <p className="impact-description">
                Through our programs and initiatives, we've helped thousands of individuals develop new skills, connect with like-minded peers, and contribute to projects that make a difference in their communities. We're committed to continuing this work and expanding our reach to create even more opportunities for growth and collaboration.
              </p>
              <button className="impact-btn">Learn About Our Initiatives</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Vision;