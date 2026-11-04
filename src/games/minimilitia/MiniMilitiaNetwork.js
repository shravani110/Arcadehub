// MiniMilitiaNetwork.js - Real-Time WebRTC Peer-to-Peer Multiplayer for Mini Militia
import PeerPkg from 'peerjs';

const Peer = PeerPkg.Peer || PeerPkg;

export class MiniMilitiaNetwork {
  constructor() {
    this.peer = null;
    this.conn = null;
    this.isHost = false;
    this.isConnected = false;
    this.roomCode = null;
    this.playerName = 'Soldier';
    this.opponentName = 'Opponent';

    // Callbacks
    this.onConnected = null;
    this.onOpponentState = null;
    this.onOpponentShoot = null;
    this.onOpponentHit = null;
    this.onMatchEvent = null;
    this.onDisconnect = null;
    this.onError = null;

    this.lastSentStateTime = 0;
  }

  generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  cleanCode(code) {
    if (!code) return '';
    return code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  }

  getPeerIdForRoom(roomCode) {
    return `arcadehub-mm-${this.cleanCode(roomCode)}`;
  }

  createRoom(playerName, onSuccess, onError) {
    this.destroy();
    this.isHost = true;
    this.roomCode = this.generateRoomCode();
    this.playerName = playerName || 'Host';

    const peerId = this.getPeerIdForRoom(this.roomCode);

    try {
      this.peer = new Peer(peerId, {
        debug: 1,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:global.stun.twilio.com:3478' }
          ]
        }
      });

      this.peer.on('open', (id) => {
        if (onSuccess) onSuccess(this.roomCode);
      });

      this.peer.on('connection', (connection) => {
        // If already connected, close duplicate
        if (this.conn && this.conn.open) {
          connection.close();
          return;
        }

        this.conn = connection;
        this.setupConnection();
      });

      this.peer.on('error', (err) => {
        console.warn('MiniMilitia Host Peer error:', err);
        if (err.type === 'unavailable-id') {
          // Retry with new room code
          this.createRoom(playerName, onSuccess, onError);
          return;
        }
        if (onError) onError(err);
        else if (this.onError) this.onError(err);
      });
    } catch (e) {
      if (onError) onError(e);
      else if (this.onError) this.onError(e);
    }
  }

  joinRoom(roomCode, playerName, onSuccess, onError) {
    this.destroy();
    this.isHost = false;
    this.roomCode = this.cleanCode(roomCode);
    this.playerName = playerName || 'Guest';

    if (!this.roomCode || this.roomCode.length < 3) {
      if (onError) onError(new Error('Invalid room code'));
      return;
    }

    const hostPeerId = this.getPeerIdForRoom(this.roomCode);
    const guestPeerId = `ahub-mm-g-${Math.random().toString(36).substring(2, 8)}`;

    try {
      this.peer = new Peer(guestPeerId, {
        debug: 1,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:global.stun.twilio.com:3478' }
          ]
        }
      });

      this.peer.on('open', () => {
        const connection = this.peer.connect(hostPeerId, {
          reliable: true
        });

        this.conn = connection;
        this.setupConnection(() => {
          if (onSuccess) onSuccess();
        });
      });

      this.peer.on('error', (err) => {
        console.warn('MiniMilitia Guest Peer error:', err);
        if (onError) onError(err);
        else if (this.onError) this.onError(err);
      });
    } catch (e) {
      if (onError) onError(e);
      else if (this.onError) this.onError(e);
    }
  }

  setupConnection(onOpenCallback) {
    if (!this.conn) return;

    this.conn.on('open', () => {
      this.isConnected = true;

      // Exchange handshake
      this.send({
        type: 'handshake',
        name: this.playerName,
        isHost: this.isHost
      });

      if (onOpenCallback) onOpenCallback();
      if (this.onConnected) {
        this.onConnected({
          isHost: this.isHost,
          roomCode: this.roomCode
        });
      }
    });

    this.conn.on('data', (data) => {
      this.handleIncomingData(data);
    });

    this.conn.on('close', () => {
      this.isConnected = false;
      if (this.onDisconnect) this.onDisconnect();
    });

    this.conn.on('error', (err) => {
      console.warn('Connection data error:', err);
      if (this.onError) this.onError(err);
    });
  }

  handleIncomingData(data) {
    if (!data || !data.type) return;

    switch (data.type) {
      case 'handshake':
        this.opponentName = data.name || (this.isHost ? 'Guest' : 'Host');
        break;

      case 'state':
        if (this.onOpponentState) {
          this.onOpponentState(data.state);
        }
        break;

      case 'shoot':
        if (this.onOpponentShoot) {
          this.onOpponentShoot(data.bullet);
        }
        break;

      case 'hit':
        if (this.onOpponentHit) {
          this.onOpponentHit(data);
        }
        break;

      case 'matchEvent':
        if (this.onMatchEvent) {
          this.onMatchEvent(data.event, data.payload);
        }
        break;
    }
  }

  send(data) {
    if (this.conn && this.conn.open) {
      try {
        this.conn.send(data);
      } catch (err) {
        console.warn('Error sending packet:', err);
      }
    }
  }

  sendState(playerState) {
    const now = Date.now();
    // Throttle state updates to ~33Hz (every 30ms) for optimal bandwidth & smooth gameplay
    if (now - this.lastSentStateTime < 30) return;
    this.lastSentStateTime = now;

    this.send({
      type: 'state',
      state: {
        x: Math.round(playerState.x * 10) / 10,
        y: Math.round(playerState.y * 10) / 10,
        vx: Math.round(playerState.velocityX * 10) / 10,
        vy: Math.round(playerState.velocityY * 10) / 10,
        gunAngle: Math.round(playerState.gunAngle * 100) / 100,
        isUsingJetpack: !!playerState.isUsingJetpack,
        isCrouching: !!playerState.isCrouching,
        walkFrame: playerState.walkFrame || 0,
        health: playerState.health,
        isDead: !!playerState.isDead,
        respawnTimer: playerState.respawnTimer || 0,
        lastShotTime: playerState.lastShotTime || 0
      }
    });
  }

  sendShoot(bullet) {
    this.send({
      type: 'shoot',
      bullet: {
        id: bullet.id,
        x: bullet.x,
        y: bullet.y,
        angle: bullet.angle,
        speed: bullet.speed,
        damage: bullet.damage,
        ownerId: 'opponent'
      }
    });
  }

  sendHit(damage, attackerId) {
    this.send({
      type: 'hit',
      damage,
      attackerId
    });
  }

  sendMatchEvent(event, payload = {}) {
    this.send({
      type: 'matchEvent',
      event,
      payload
    });
  }

  destroy() {
    this.isConnected = false;
    if (this.conn) {
      try {
        this.conn.close();
      } catch (_) {}
      this.conn = null;
    }
    if (this.peer) {
      try {
        this.peer.destroy();
      } catch (_) {}
      this.peer = null;
    }
  }
}
