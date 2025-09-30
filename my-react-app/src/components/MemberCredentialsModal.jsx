import React, { useState } from 'react';
import './MemberCredentialsModal.css';

const MemberCredentialsModal = ({ credentials, memberData, onClose }) => {
  const [copiedField, setCopiedField] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const copyToClipboard = async (text, field) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const copyAllCredentials = async () => {
    const credentialsText = `
Member Login Credentials for ${memberData.fullName || memberData.name}
==========================================
Hive: ${memberData.selectedHive || memberData.selectedHiveName}
Email: ${credentials.email}
Password: ${credentials.password}
Generated: ${new Date(credentials.generatedAt).toLocaleString()}

Please share these credentials securely with the member.
The member can use these to access their dashboard.
    `.trim();

    try {
      await navigator.clipboard.writeText(credentialsText);
      setCopiedField('all');
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy credentials: ', err);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="member-credentials-modal">
        <div className="modal-header">
          <h2>🎉 Member Approved Successfully!</h2>
          <button onClick={onClose} className="close-btn">
            ✕
          </button>
        </div>

        <div className="modal-content">
          <div className="success-message">
            <div className="member-info">
              <div className="member-avatar">
                👥
              </div>
              <div className="member-details">
                <h3>{memberData.fullName || memberData.name}</h3>
                <p className="hive-name">
                  🏠 Approved to join {memberData.selectedHive || memberData.selectedHiveName}
                </p>
              </div>
            </div>
            <p className="instructions">
              Member login credentials have been generated and stored securely. 
              Please share these credentials with the new member:
            </p>
          </div>

          <div className="credentials-container">
            <div className="credential-field">
              <label>Email Address</label>
              <div className="input-with-copy">
                <input 
                  type="text" 
                  value={credentials.email} 
                  readOnly 
                  className="credential-input"
                />
                <button 
                  onClick={() => copyToClipboard(credentials.email, 'email')}
                  className="copy-btn"
                  title="Copy email"
                >
                  {copiedField === 'email' ? '✓' : '📋'}
                </button>
              </div>
            </div>

            <div className="credential-field">
              <label>Password</label>
              <div className="input-with-copy">
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={credentials.password} 
                  readOnly 
                  className="credential-input"
                />
                <div className="input-actions">
                  <button 
                    onClick={() => setShowPassword(!showPassword)}
                    className="toggle-password-btn"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                  <button 
                    onClick={() => copyToClipboard(credentials.password, 'password')}
                    className="copy-btn"
                    title="Copy password"
                  >
                    {copiedField === 'password' ? '✓' : '📋'}
                  </button>
                </div>
              </div>
            </div>

            <div className="credential-field">
              <label>Generated</label>
              <div className="generated-date">
                {new Date(credentials.generatedAt).toLocaleString()}
              </div>
            </div>
          </div>

          <div className="modal-actions">
            <button 
              onClick={copyAllCredentials}
              className="copy-all-btn"
            >
              {copiedField === 'all' ? (
                <>
                  ✓ All Credentials Copied!
                </>
              ) : (
                <>
                  📋 Copy All Credentials
                </>
              )}
            </button>
          </div>

          <div className="member-notice">
            <p><strong>📧 Next Steps:</strong></p>
            <ul>
              <li>Share these credentials securely with {memberData.fullName || memberData.name}</li>
              <li>The member can now log in using these credentials</li>
              <li>Member will have access to the hive dashboard and activities</li>
              <li>Credentials are stored securely in the database for reference</li>
              <li>Consider sending a welcome message to introduce them to the hive</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemberCredentialsModal;
