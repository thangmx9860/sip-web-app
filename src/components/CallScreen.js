import React, { useState, useEffect } from 'react';

const CallScreen = ({ sipConfig }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [callActive, setCallActive] = useState(false);
  const [callTimer, setCallTimer] = useState(0);
  const [muted, setMuted] = useState(false);
  const [session, setSession] = useState(null);

  useEffect(() => {
    let interval;
    if (callActive) {
      interval = setInterval(() => setCallTimer((prev) => prev + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [callActive]);

  const handleCall = () => {
    if (!sipConfig || !sipConfig.client) {
      console.error('SIP client not available');
      return;
    }
    const newSession = sipConfig.client.makeCall(phoneNumber);
    setSession(newSession);
    setCallActive(true);

    newSession.on('accepted', () => console.log('Call accepted'));
    newSession.on('failed', (e) => {
      console.error('Call failed:', e.cause);
      setCallActive(false);
    });
    newSession.on('ended', () => {
      setCallActive(false);
      setCallTimer(0);
    });
  };

  const handleHangup = () => {
    if (session) {
      session.terminate();
      setCallActive(false);
      setCallTimer(0);
    }
  };

  const toggleMute = () => {
    if (session) {
      if (muted) session.unmute({ audio: true });
      else session.mute({ audio: true });
      setMuted(!muted);
    }
  };

  if (!sipConfig || !sipConfig.client) {
    return <div>Please log in to make calls.</div>;
  }

  return (
    <div className="call-container">
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
      <button onClick={handleCall} disabled={callActive}>
        Call
      </button>
      {callActive && (
        <>
          <p>Call Duration: {Math.floor(callTimer / 60)}:{callTimer % 60}</p>
          <button onClick={toggleMute}>{muted ? 'Unmute' : 'Mute'}</button>
          <button onClick={handleHangup}>Hangup</button>
        </>
      )}
    </div>
  );
};

export default CallScreen;