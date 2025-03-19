import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, useNavigate } from 'react-router-dom';
import LoginScreen from './components/LoginScreen';
import CallScreen from './components/CallScreen';
import IncomingCallPopup from './components/IncomingCallPopup';
import ActiveCallScreen from './components/ActiveCallScreen'; // Import the new component
import { SipClient } from './sipClient';
import './styles.css';

const App = () => {
  const [sipConfig, setSipConfig] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const savedCredentials = localStorage.getItem('sipCredentials');
    if (savedCredentials && !sipConfig) {
      const { username, password, domain } = JSON.parse(savedCredentials);
      const client = new SipClient(username, password, domain);
      console.log('Restoring SIP session from saved credentials...');
      client.start((session) => {
        console.log('Incoming call detected after reload');
        setSipConfig({ client, session });
        navigate('/incoming-call');
      });
      client.register()
        .then(() => {
          setSipConfig({ client });
          navigate('/call');
        })
        .catch((err) => {
          console.error('Failed to restore session:', err);
          localStorage.removeItem('sipCredentials');
          navigate('/');
        });
    }
  }, [sipConfig, navigate]);

  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<LoginScreen setSipConfig={setSipConfig} />} />
        <Route
          path="/call"
          element={
            sipConfig ? (
              <CallScreen sipConfig={sipConfig} />
            ) : (
              <LoginScreen setSipConfig={setSipConfig} />
            )
          }
        />
        <Route
          path="/incoming-call"
          element={
            sipConfig ? (
              <IncomingCallPopup sipConfig={sipConfig} />
            ) : (
              <LoginScreen setSipConfig={setSipConfig} />
            )
          }
        />
        <Route
          path="/active-call"
          element={
            sipConfig ? (
              <ActiveCallScreen sipConfig={sipConfig} />
            ) : (
              <LoginScreen setSipConfig={setSipConfig} />
            )
          }
        />
      </Routes>
    </div>
  );
};

const AppWrapper = () => (
  <Router>
    <App />
  </Router>
);

export default AppWrapper;