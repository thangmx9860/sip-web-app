import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import LoginScreen from './components/LoginScreen';
import CallScreen from './components/CallScreen';
import IncomingCallPopup from './components/IncomingCallPopup';
import './styles.css';

const App = () => {
  const [sipConfig, setSipConfig] = useState(null);

  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/" element={<LoginScreen setSipConfig={setSipConfig} />} />
          <Route
            path="/call"
            element={
              sipConfig ? (
                <CallScreen sipConfig={sipConfig} />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route
            path="/incoming-call"
            element={
              sipConfig ? (
                <IncomingCallPopup sipConfig={sipConfig} />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
        </Routes>
      </div>
    </Router>
  );
};

export default App;