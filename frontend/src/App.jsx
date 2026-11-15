import React, { useState } from 'react';
import './App.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001';

function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // Handle Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    // Basic frontend validation
    if (!email.trim() || !password) {
      setIsSuccess(false);
      setMessage('Please fill in both email and password.');
      return;
    }

    if (password.length < 6) {
      setIsSuccess(false);
      setMessage('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      // Connect to Express REST API
      const response = await fetch(`${API_BASE}/api/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setIsSuccess(true);
        setMessage(data.message || 'Account created successfully!');
        // Clear input fields on success
        setEmail('');
        setPassword('');
      } else {
        setIsSuccess(false);
        setMessage(data.message || 'Sign up failed. Please try again.');
      }
    } catch (error) {
      console.error('Network error during signup:', error);
      setIsSuccess(false);
      setMessage('Unable to connect to backend server. Make sure it is running on port 5000.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-page">
      <div className="signup-card">
        {/* Header */}
        <div className="signup-header">
          <h1>Sign Up</h1>
          <p>Create an account to get started</p>
        </div>

        {/* Success or Error Alert Message */}
        {message && (
          <div
            className={`alert-message ${
              isSuccess ? 'alert-success' : 'alert-error'
            }`}
          >
            <span className="alert-icon">{isSuccess ? '✓' : '⚠️'}</span>
            <span>{message}</span>
          </div>
        )}

        {/* Sign Up Form */}
        <form className="signup-form" onSubmit={handleSubmit}>
          {/* Email input field */}
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          {/* Password input field */}
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          {/* Light Blue Sign Up Button */}
          <button
            type="submit"
            className="signup-btn"
            disabled={loading}
          >
            {loading ? 'Signing Up...' : 'Sign Up'}
          </button>
        </form>

        {/* Already a member? Log In Link */}
        <div className="login-footer">
          <span>Already a member?</span>
          <a
            href="#login"
            className="login-link"
            onClick={(e) => {
              e.preventDefault();
              alert('Log In feature: Already registered users can log in here.');
            }}
          >
            Log In
          </a>
        </div>
      </div>
    </div>
  );
}

export default App;
