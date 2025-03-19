import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const ActiveCallScreen = ({ sipConfig }) => {
  const navigate = useNavigate();
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const session = sipConfig?.session;

  useEffect(() => {
    if (!session) {
      navigate('/call'); // Redirect if no session
      return;
    }

    // Start timer when call is accepted
    const timer = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);

    // Handle call end
    const handleCallEnded = () => {
      console.log('Call ended');
      clearInterval(timer);
      navigate('/call');
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
      if (isMuted) {
        session.unmute({ audio: true });
        console.log('Unmuted call');
      } else {
        session.mute({ audio: true });
        console.log('Muted call');
      }
      setIsMuted(!isMuted);
    }
  };

  const handleHangup = () => {
    if (session) {
      session.terminate();
      console.log('Call terminated by user');
    }
  };

  if (!session) {
    return null;
  }

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' + secs : secs}`;
  };

  return (
    <div className="active-call-screen">
      <h2>Active Call</h2>
      <p>Caller: {session.remote_identity.uri.toString()}</p>
      <p>Callee: {session.local_identity.uri.toString()}</p>
      <p>Duration: {formatDuration(callDuration)}</p>
      <button onClick={toggleMute}>{isMuted ? 'Unmute' : 'Mute'}</button>
      <button onClick={handleHangup}>Hang Up</button>
    </div>
  );
};

export default ActiveCallScreen;