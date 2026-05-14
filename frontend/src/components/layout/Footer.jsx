import React, { useState, useEffect } from 'react';
import client from '../../api';

const Footer = () => {
  const [systemStatus, setSystemStatus] = useState('checking');

  useEffect(() => {
    client.get('/health')
      .then(() => setSystemStatus('online'))
      .catch(() => setSystemStatus('offline'));
  }, []);

  return (
    <footer className="footer">
      <div className="footer-main">
        {/* Col 1: Brand */}
        <div>
          <div className="footer-brand-name">
            <div className="footer-logo-icon">🐞</div>
            <span className="footer-logo-text">Structural Bug Detection AI</span>
          </div>
          <p className="footer-tagline">
            Smart AI-based structural bug detection and prevention system for modern software teams.
          </p>
          <div className="footer-socials">
            <a className="footer-social-btn" href="https://github.com" target="_blank" rel="noopener noreferrer" title="GitHub">⌂</a>
            <a className="footer-social-btn" href="https://linkedin.com" target="_blank" rel="noopener noreferrer" title="LinkedIn">in</a>
            <a className="footer-social-btn" href="https://twitter.com" target="_blank" rel="noopener noreferrer" title="Twitter">𝕏</a>
          </div>
        </div>

        {/* Col 2: Resources */}
        <div>
          <div className="footer-col-title">Resources & Support</div>
          <div className="footer-links">
            <a className="footer-link" href="http://localhost:8000/docs" target="_blank" rel="noopener noreferrer">
              Documentation (Swagger)
            </a>
            <a className="footer-link" href="http://localhost:8000/redoc" target="_blank" rel="noopener noreferrer">
              API Reference (ReDoc)
            </a>
            <span className="footer-link">Pricing — Free & Pro (Razorpay)</span>
            <span className="footer-link">GitHub Integration (OAuth)</span>
            <span className="footer-link">Privacy Policy</span>
            <span className="footer-link">Terms of Service</span>
          </div>
        </div>

        {/* Col 3: Contact */}
        <div>
          <div className="footer-col-title">Contact</div>
          <div className="footer-contact-item">
            <span>✉</span>
            <a href="mailto:hello@bugscan.ai" className="footer-link">hello@bugscan.ai</a>
          </div>
          <div className="footer-contact-item">
            <span>📍</span>
            <span>Available globally</span>
          </div>
          <div className="footer-contact-item">
            <span>🕐</span>
            <span>24/7 AI-powered analysis</span>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <span>© 2026 Smart AI Bug Detection. All rights reserved.</span>
        <div className="footer-status">
          <div className="status-dot" style={{ background: systemStatus === 'online' ? '#22c55e' : '#ef4444' }}></div>
          System Status: {systemStatus === 'online' ? 'Online' : systemStatus === 'offline' ? 'Offline' : 'Checking...'}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
