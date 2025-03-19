import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const ActiveCallScreen = ({ sipConfig }) => {
  const navigate = useNavigate();
  const session = sipConfig?.client?.getSession();
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    if (!session) {
      navigate('/call');
      return;
    }

    const timer = setInterval(() => setCallDuration((prev) => prev + 1), 1000);

    const handleCallEnded = () => {
      console.log('Call ended');
      clearInterval(timer);
      setTimeout(() => navigate('/call'), 1000);
    };

    session.on('ended', handleCallEnded);
    session.on('failed', handleCallEnded);

    return () => {
      clearInterval(timer);
      session.off('ended', handleCallEnded);
      session.off('failed', handleCallEnded);
    };
  }, [session, navigate]);

  const toggleMute = () => {
    if (session) {
      if (isMuted) session.unmute({ audio: true });
      else session.mute({ audio: true });
      setIsMuted(!isMuted);
    }
  };

  const handleHangup = () => {
    if (session) session.terminate();
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' + secs : secs}`;
  };

  if (!session) return null;

  return (
    <div className="active-call-screen">
      <img src={process.env.REACT_APP_LOGO_URL || '/default-logo.png'} alt="Company Logo" className="logo" />
      <h2>Active Call</h2>
      <p>Calling: {session.remote_identity.uri.toString()}</p>
      <p>Duration: {formatDuration(callDuration)}</p>
      <div className="call-controls">
        <button onClick={toggleMute} className={isMuted ? 'muted' : ''}>
          {isMuted ? 'Unmute' : 'Mute'}
        </button>
        <button onClick={handleHangup} className="hangup-btn">Hang Up</button>
      </div>
      <audio id="remote-audio" autoPlay />
    </div>
  );
};

export default ActiveCallScreen;