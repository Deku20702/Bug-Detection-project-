import React, { useState, useEffect } from 'react';
import client, { setAuthToken } from '../../api';
import toast from 'react-hot-toast';

const LoginScreen = ({ onLoginSuccess }) => {
  const [auth, setAuth] = useState({ email: "", password: "" });
  const [authMode, setAuthMode] = useState("login");
  const [showPassword, setShowPassword] = useState(false);

  const handleGoogleResponse = async (response) => {
    try {
      const res = await client.post("/auth/google", { token: response.credential });
      setAuthToken(res.data.access_token);
      onLoginSuccess(res.data.access_token, res.data.email);
      toast.success("Signed in with Google!");
    } catch {
      toast.error("Google authentication failed.");
    }
  };

  useEffect(() => {
    const initializeGoogle = () => {
      if (window.google) {
        google.accounts.id.initialize({
          client_id: "392591290867-vk0864ia1h6k968969jmdsut1jd538dc.apps.googleusercontent.com",
          callback: handleGoogleResponse
        });
        google.accounts.id.renderButton(
          document.getElementById("googleBtn"),
          { theme: "outline", size: "large", width: "100%" }
        );
      }
    };
    if (!document.getElementById("google-jssdk")) {
      const script = document.createElement("script");
      script.id = "google-jssdk";
      script.src = "https://accounts.google.com/gsi/client";
      script.onload = initializeGoogle;
      document.body.appendChild(script);
    } else {
      initializeGoogle();
    }
  }, []);

  const handleAuthSubmit = async () => {
    if (!auth.email || !auth.password) {
      toast.error("Please fill in all fields.");
      return;
    }
    if (auth.password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    try {
      const endpoint = authMode === "register" ? "/auth/register" : "/auth/login";
      const response = await client.post(endpoint, auth);
      setAuthToken(response.data.access_token);
      onLoginSuccess(response.data.access_token, auth.email);
      toast.success(authMode === "register" ? "Account created!" : "Signed in successfully.");
    } catch (error) {
      toast.error(error?.response?.data?.detail || "Authentication failed. Check credentials.");
    }
  };

  const authImage = authMode === "login"
    ? "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=1000"
    : "https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?auto=format&fit=crop&q=80&w=1000";

  return (
    <div className="auth-page">
      <div className="auth-image-side" style={{ backgroundImage: `url(${authImage})` }}>
        <div className="auth-image-overlay">
          <div className="auth-branding">
            <div className="tag">
              <div className="tag-dot"></div>
              AI Architecture Intelligence
            </div>
            <h1>Identify structural rot before it breaks production.</h1>
          </div>
        </div>
      </div>

      <div className="auth-form-side">
        <div className="auth-card">
          <div className="auth-logo">
            <div className="auth-logo-icon">🐞</div>
            <div className="auth-logo-text">Bug<span>Scan</span> AI</div>
          </div>

          <h2>{authMode === "login" ? "Welcome back" : "Create account"}</h2>
          <p className="auth-sub">
            {authMode === "login"
              ? "Sign in to start scanning repositories."
              : "Join to analyze architecture risks."}
          </p>

          <div className="auth-field">
            <label>Email address</label>
            <input
              type="email"
              placeholder="you@company.com"
              value={auth.email}
              onChange={e => setAuth({ ...auth, email: e.target.value })}
              onKeyDown={e => e.key === 'Enter' && handleAuthSubmit()}
            />
          </div>

          <div className="auth-field" style={{ position: 'relative' }}>
            <label>Password</label>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Min 8 characters"
              value={auth.password}
              onChange={e => setAuth({ ...auth, password: e.target.value })}
              onKeyDown={e => e.key === 'Enter' && handleAuthSubmit()}
              style={{ paddingRight: '40px' }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute', right: '12px', bottom: '12px',
                background: 'none', border: 'none', cursor: 'pointer', fontSize: '15px', color: 'var(--text-tertiary)'
              }}
            >
              {showPassword ? "👁" : "🙈"}
            </button>
          </div>

          <button
            className="auth-btn"
            onClick={handleAuthSubmit}
            disabled={!auth.email || auth.password.length < 8}
          >
            {authMode === "login" ? "Sign in" : "Create account"}
          </button>

          <div className="auth-divider">or</div>

          <div id="googleBtn" style={{ marginBottom: '8px' }}></div>

          <div className="auth-toggle-wrap">
            {authMode === "login" ? "No account? " : "Already have an account? "}
            <button
              className="auth-toggle-btn"
              onClick={() => setAuthMode(authMode === "login" ? "register" : "login")}
            >
              {authMode === "login" ? "Create one" : "Sign in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
