import React from 'react';
import { useNavigate } from 'react-router-dom';

const IncomingCallPopup = ({ sipConfig }) => {
  const { invitation } = sipConfig;
  const navigate = useNavigate();

  const handleAnswer = async () => {
    await invitation.accept();
    navigate('/call');
  };

  const handleReject = async () => {
    await invitation.reject();
    navigate('/call');
  };

  return (
    <div className="incoming-call-popup">
      <h3>Incoming Call</h3>
      <p>From: {invitation.remoteIdentity.uri.user}</p>
      <button onClick={handleAnswer}>Answer</button>
      <button onClick={handleReject}>Reject</button>
    </div>
  );
};

export default IncomingCallPopup;