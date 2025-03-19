import JsSIP from 'jssip';

export class SipClient {
  constructor(username, password, domain) {
    this.username = username;
    this.password = password;
    this.domain = domain;
    this.ua = null;
    this.session = null;
  }

  start(onIncomingCall) {
    const socket = new JsSIP.WebSocketInterface('wss://portal.voip.namisense.ai:7443');
    const configuration = {
      sockets: [socket],
      uri: `sip:${this.username}@${this.domain}`,
      password: this.password,
      display_name: this.username,
      register: true,
      stun_servers: ['stun:stun.l.google.com:19302'],
    };

    console.log('Starting JsSIP client with:', {
      uri: configuration.uri,
      domain: this.domain,
      username: this.username,
    });

    this.ua = new JsSIP.UA(configuration);

    this.ua.on('connected', () => console.log('WebSocket connected'));
    this.ua.on('disconnected', (e) => console.error('WebSocket disconnected:', e));
    this.ua.on('registered', () => console.log('Registered successfully'));
    this.ua.on('registrationFailed', (e) => console.error('Registration failed:', e.cause));
    this.ua.on('newRTCSession', (data) => {
      if (data.originator === 'remote') {
        console.log('Incoming call from:', data.session.remote_identity.uri);
        this.session = data.session;
        onIncomingCall(this.session);
      }
    });

    this.ua.start();
  }

  register() {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Registration timed out after 15 seconds'));
      }, 15000);

      this.ua.on('registered', () => {
        console.log('Registration promise resolving...');
        clearTimeout(timeout);
        resolve('Registration successful');
      });

      this.ua.on('registrationFailed', (e) => {
        console.log('Registration promise rejecting...');
        clearTimeout(timeout);
        reject(new Error(`Registration failed: ${e.cause}`));
      });
    });
  }

  makeCall(target) {
    if (!this.ua || !this.ua.isRegistered()) {
      throw new Error('Not registered');
    }
    const targetUri = `sip:${target}@${this.domain}`;
    console.log('Making call to:', targetUri);
    this.session = this.ua.call(targetUri, {
      mediaConstraints: { audio: true, video: false },
    });
    return this.session;
  }

  stop() {
    if (this.ua) {
      this.ua.stop();
      console.log('JsSIP client stopped');
    }
  }
}

export async function testSipClient(username, password, domain) {
  const client = new SipClient(username, password, domain);
  try {
    client.start(() => console.log('Incoming call handler set'));
    await client.register();
    console.log('JsSIP registration completed successfully');
    return client;
  } catch (err) {
    console.error('JsSIP registration failed:', err);
    client.stop();
    throw err;
  }
}