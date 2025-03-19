import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const CallScreen = ({ sipConfig }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [callStatus, setCallStatus] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  const handleCall = () => {
    if (!sipConfig || !sipConfig.client) {
      console.error('SIP client not initialized');
      return;
    }

    const newSession = sipConfig.client.makeCall(phoneNumber);
    setCallStatus('ringing');

    newSession.on('progress', () => {
      setCallStatus('ringing');
      console.log('Call is ringing...');
    });

    newSession.on('accepted', () => {
      console.log('Call accepted');
      setCallStatus('');
      sipConfig.session = newSession;
      navigate('/active-call');
    });

    newSession.on('failed', (e) => {
      console.error('Call failed:', e.cause);
      setCallStatus('failed');
      setErrorMessage(`Call failed: ${e.cause}`);
      setTimeout(() => {
        setCallStatus('');
        setErrorMessage('');
      }, 1000);
    });

    newSession.on('ended', () => {
      setCallStatus('');
    });
  };

  const handleLogout = async () => {
    if (sipConfig && sipConfig.client) {
      await sipConfig.client.unregister();
      sipConfig.client.stop();
      localStorage.removeItem('sipCredentials');
      navigate('/');
    }
  };

  if (!sipConfig || !sipConfig.client) return <div>Please log in to make calls.</div>;

  return (
    <div className="call-container">
      <img src={process.env.REACT_APP_LOGO_URL || '/default-logo.png'} alt="Company Logo" className="logo" />
      <h2>Make a Call</h2>
      <input
        type="text"
        placeholder="Enter phone number"
        value={phoneNumber}
        onChange={(e) => setPhoneNumber(e.target.value)}
      />
      <div className="dialpad">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((digit) => (
          <button key={digit} onClick={() => setPhoneNumber(phoneNumber + digit)}>
            {digit}
          </button>
        ))}
      </div>
      <button onClick={handleCall} disabled={callStatus === 'ringing'}>
        Call
      </button>
      {callStatus === 'ringing' && <p className="status">Ringing...</p>}
      {callStatus === 'failed' && <div className="error-popup">{errorMessage}</div>}
      <button onClick={handleLogout} className="logout-btn">Logout</button>
    </div>
  );
};

export default CallScreen;