import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SipClient } from '../sipClient';

const LoginScreen = ({ setSipConfig }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  // const [domain, setDomain] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const domain = "voip.namisense.ai";
  const handleLogin = async () => {
    setError('');
    // if (!username || !password || !domain) {
    if (!username || !password) {
      setError('All fields are required.');
      console.log('Validation failed: missing fields');
      return;
    }
    console.log('Starting login process with:', { username, domain });

    const client = new SipClient(username, password, domain);

    try {
      console.log('Starting JsSIP client...');
      await new Promise((resolve, reject) => {
        client.start((session) => {
          console.log('Incoming call detected, navigating to incoming-call screen');
          setSipConfig({ client, session });
          navigate('/incoming-call');
        });
        client.ua.on('registered', () => {
          console.log('Registration completed successfully');
          resolve();
        });
        client.ua.on('registrationFailed', (e) => {
          console.error('Registration failed:', e.cause);
          reject(new Error(`Registration failed: ${e.cause}`));
        });
      });

      console.log('Setting sipConfig and saving credentials...');
      setSipConfig({ client });
      localStorage.setItem('sipCredentials', JSON.stringify({ username, password, domain }));

      console.log('Navigating to call screen...');
      navigate('/call');
    } catch (err) {
      console.error('Login error:', err);
      setError(`Login failed: ${err.message}. Please check your credentials or network.`);
      client.stop();
    }
  };

  return (
    <div className="login-container">
      <h2>Login</h2>
      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      {/* <input
        type="text"
        placeholder="Domain"
        value={domain}
        onChange={(e) => setDomain(e.target.value)}
      /> */}
      <button onClick={handleLogin}>Login</button>
      {error && <p className="error">{error}</p>}
    </div>
  );
};

export default LoginScreen;