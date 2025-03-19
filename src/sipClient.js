import JsSIP from 'jssip';

// Global audio element for remote stream
const remoteAudio = new window.Audio();
remoteAudio.autoplay = true;
remoteAudio.crossOrigin = "anonymous";

export class SipClient {
  constructor(username, password, domain) {
    this.username = username;
    this.password = password;
    this.domain = domain;
    this.ua = null;
    this.session = null;
  }

  start(onIncomingCall) {
    const socket = new JsSIP.WebSocketInterface('wss://softswitch.vbmiddleware.namisense.ai:7443');
    const configuration = {
      sockets: [socket],
      uri: `sip:${this.username}@${this.domain}`,
      password: this.password,
      display_name: this.username,
      register: true,
      contact_uri: new JsSIP.URI("sip", this.username, this.domain, null, { transport: "wss" }).toString(),
      stun_servers: ['stun:softswitch.vbmiddleware.namisense.ai:3478'], // Match working version
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
    this.ua.on('registrationExpiring', () => {
      console.log('Registration expiring, re-registering...');
      this.ua.register();
    });
    this.ua.on('newRTCSession', (data) => {
      if (data.originator === 'remote') {
        console.log('Incoming call from:', data.session.remote_identity.uri);
        this.session = data.session;
        this.setupAudio(this.session);
        onIncomingCall(this.session);
      }
    });

    this.ua.start();
  }

  register() {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Registration timed out')), 15000);
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
    if (!this.ua || !this.ua.isRegistered()) throw new Error('Not registered');
    const targetUri = `sip:${target}@${this.domain}`;
    console.log('Making call to:', targetUri);
    this.session = this.ua.call(targetUri, {
      mediaConstraints: { audio: true, video: false },
      rtcOfferConstraints: { offerToReceiveAudio: true, offerToReceiveVideo: false },
    });
    this.setupAudio(this.session);
    return this.session;
  }

  setupAudio(session) {
    session.on('peerconnection', (data) => {
      const pc = data.peerconnection;
      pc.onaddstream = (e) => {
        console.log('Received remote audio stream:', e.stream);
        remoteAudio.srcObject = e.stream;
        console.log('Remote audio attached to audio element');
      };
      pc.ontrack = (event) => {
        console.log('Received remote audio track:', event.track);
        remoteAudio.srcObject = event.streams[0];
      };
      pc.getSenders().forEach((sender) => {
        if (sender.track && sender.track.kind === 'audio') {
          console.log('Local audio stream active, sending to PBX');
        }
      });
      pc.getReceivers().forEach((receiver) => {
        if (receiver.track && receiver.track.kind === 'audio') {
          console.log('Remote audio receiver active:', receiver.track);
        }
      });
    });

    session.connection?.addEventListener('addstream', (e) => {
      console.log('Fallback: Attached remote stream via connection.addstream');
      remoteAudio.srcObject = e.stream;
    });
  }

  unregister() {
    if (this.ua && this.ua.isRegistered()) {
      console.log('Sending UNREGISTER request to PBX');
      this.ua.unregister();
      return new Promise((resolve) => this.ua.on('unregistered', () => {
        console.log('Successfully unregistered from PBX');
        resolve();
      }));
    }
    console.log('Not registered, no UNREGISTER needed');
    return Promise.resolve();
  }

  stop() {
    if (this.ua) {
      this.ua.stop();
      console.log('JsSIP client stopped');
      remoteAudio.srcObject = null;
    }
  }

  getSession() {
    return this.session; // Keep for ActiveCallScreen compatibility
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