import { UserAgent, Registerer, Inviter, URI } from 'sip.js';

export const configureSIP = (username, password, domain, onCallReceived) => {
  const sipUri = new URI('sip', username, domain);
  const wsUri = 'wss://portal.voip.namisense.ai:7443';

  console.log('Configuring SIP with:', {
    uri: sipUri.toString(),
    wsUri,
    username,
    password: password ? '[hidden]' : '[empty]', // Hide password in logs
  });

  const userAgentOptions = {
    uri: sipUri,
    transportOptions: {
      wsServers: [wsUri],
      traceSip: true, // Log SIP messages
    },
    authorizationUser: username, // For digest auth
    password: password,          // For digest auth
    stunServers: ['stun.l.google.com:19302'],
    logLevel: 'debug',          // Detailed logging
    displayName: username,      // Optional, for readability
    delegate: {
      onInvite: (invitation) => {
        console.log('Incoming call received:', invitation);
        onCallReceived(invitation);
      },
    },
  };

  const userAgent = new UserAgent(userAgentOptions);
  const registerer = new Registerer(userAgent);

  // Log transport events
  userAgent.transport.onConnect = () => console.log('WebSocket connected');
  userAgent.transport.onDisconnect = (error) => console.error('WebSocket disconnected:', error);
  userAgent.transport.onMessage = (message) => console.log('WebSocket message:', message);

  return { userAgent, registerer };
};

export const makeCall = (userAgent, target) => {
  const targetUri = new URI('sip', target, 'portal.voip.namisense.ai');
  console.log('Making call to:', targetUri.toString());
  const inviter = new Inviter(userAgent, targetUri);
  inviter.invite();
  return inviter;
};