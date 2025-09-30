import React from 'react';
import './Navbar.css';

const Navbar = ({ onLoginClick, isAuthenticated, currentUser, userType, onLogout }) => {
  return (
    <nav className="navbar">
      <div className="navbar-content">
        <div className="navbar-title">
          <h1>{
            isAuthenticated && currentUser 
              ? userType === 'hive'
                ? `🏠 ${currentUser.hiveName}` 
                : `👥 ${currentUser.hiveName}`
              : 'Pivot'
          }</h1>
          {isAuthenticated && currentUser && (
            <span className="navbar-subtitle">
              {userType === 'hive' ? 'Hive Dashboard' : 'Member Dashboard'}
            </span>
          )}
        </div>
        <div className="navbar-actions">
          {isAuthenticated && currentUser ? (
            <div className="user-menu">
              <span className="user-info">
                {userType === 'hive' 
                  ? `👨‍💼 ${currentUser.creatorName}`
                  : `👥 ${currentUser.memberName}`
                }
              </span>
              <button className="logout-button" onClick={onLogout}>
                🚪 Logout
              </button>
            </div>
          ) : (
            <button className="login-button" onClick={onLoginClick}>
              🔐 Join Community
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
