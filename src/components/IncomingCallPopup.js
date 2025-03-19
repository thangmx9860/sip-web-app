import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const IncomingCallPopup = ({ sipConfig }) => {
  const navigate = useNavigate();

  useEffect(() => {
    if (!sipConfig || !sipConfig.session) return;

    const session = sipConfig.session;

    const handleCallFailed = (e) => {
      console.log('Incoming call failed:', e.cause);
      navigate('/call');
    };

    const handleCallEnded = () => {
      console.log('Incoming call ended');
      navigate('/call');
    };

    const handleCallAccepted = () => {
      console.log('Incoming call accepted, 200 OK sent');
      navigate('/active-call'); // Navigate to new call screen
    };

    session.on('failed', handleCallFailed);
    session.on('ended', handleCallEnded);
    session.on('accepted', handleCallAccepted);

    return () => {
      session.off('failed', handleCallFailed);
      session.off('ended', handleCallEnded);
      session.off('accepted', handleCallAccepted);
    };
  }, [sipConfig, navigate]);

  const handleAccept = () => {
    if (sipConfig.session) {
      console.log('Attempting to answer incoming call...');
      sipConfig.session.answer({
        mediaConstraints: { audio: true, video: false },
        rtcOfferConstraints: { offerToReceiveAudio: true, offerToReceiveVideo: false },
        pcConfig: {
          iceServers: [{ urls: ['stun:stun.l.google.com:19302'] }],
        },
      });
      console.log('Call accepted, audio transmission started');
      const remoteAudio = document.querySelector('audio');
      if (remoteAudio) {
        remoteAudio.volume = 1.0;
        console.log('Incoming call volume set to maximum');
      }
      // Navigation moved to 'accepted' event
    }
  };

  const handleReject = () => {
    if (sipConfig.session) {
      sipConfig.session.terminate({
        status_code: 604, // Updated to 604 as per your earlier request
        reason_phrase: 'Does Not Exist Anywhere',
      });
      console.log('Call rejected with 604 Does Not Exist Anywhere');
      navigate('/call');
    }
  };

  if (!sipConfig || !sipConfig.session) {
    return null;
  }

  return (
    <div className="incoming-call-popup">
      <h3>Incoming Call</h3>
      <p>Caller: {sipConfig.session.remote_identity.uri.toString()}</p>
      <p>Callee: {sipConfig.session.local_identity.uri.toString()}</p>
      <button onClick={handleAccept}>Accept</button>
      <button onClick={handleReject}>Reject</button>
    </div>
  );
};

export default IncomingCallPopup;