// MiniMilitiaNetwork.js - Real-Time WebRTC Peer-to-Peer 4-Player Multiplayer
import PeerPkg from 'peerjs';

const Peer = PeerPkg.Peer || PeerPkg;

export class MiniMilitiaNetwork {
  constructor() {
    this.peer = null;
    this.isHost = false;
    this.isConnected = false;
    this.roomCode = null;
    this.playerName = 'Soldier';
    this.playerSlot = 1; // 1 = Host, 2/3/4 = Guests
    this.maxPlayers = 4;

    // Connections Map (Host: peerId -> conn; Guest: hostPeerId -> conn)
    this.connections = new Map();
    this.players = new Map(); // slot -> { name, color, peerId }

    // Color theme per slot
    this.slotColors = {
      1: '#3b82f6', // Player 1 (Blue)
      2: '#ef4444', // Player 2 (Red)
      3: '#22c55e', // Player 3 (Green)
      4: '#eab308'  // Player 4 (Gold)
    };

    // Callbacks
    this.onConnected = null;
    this.onPlayerListChange = null;
    this.onRemotePlayerState = null;
    this.onRemotePlayerShoot = null;
    this.onRemotePlayerHit = null;
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

  createRoom(playerName, maxPlayers = 4, onSuccess, onError) {
    this.destroy();
    this.isHost = true;
    this.roomCode = this.generateRoomCode();
    this.playerName = playerName || 'Commander';
    this.playerSlot = 1;
    this.maxPlayers = Math.max(2, Math.min(4, maxPlayers));

    this.players.set(1, {
      slot: 1,
      name: this.playerName,
      color: this.slotColors[1],
      isHost: true
    });

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

      this.peer.on('open', () => {
        if (onSuccess) onSuccess(this.roomCode);
        if (this.onPlayerListChange) this.onPlayerListChange(this.getPlayersArray());
      });

      this.peer.on('connection', (conn) => {
        // Enforce max players
        if (this.connections.size >= this.maxPlayers - 1) {
          conn.on('open', () => {
            conn.send({ type: 'error', message: 'Room is full (max 4 players)' });
            conn.close();
          });
          return;
        }

        // Find next available slot
        let assignedSlot = 2;
        while (this.players.has(assignedSlot) && assignedSlot <= this.maxPlayers) {
          assignedSlot++;
        }

        this.setupHostConnection(conn, assignedSlot);
      });

      this.peer.on('error', (err) => {
        console.warn('MiniMilitia Host Peer error:', err);
        if (err.type === 'unavailable-id') {
          this.createRoom(playerName, maxPlayers, onSuccess, onError);
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

  setupHostConnection(conn, slot) {
    conn.on('open', () => {
      this.connections.set(conn.peer, conn);
      this.isConnected = true;

      // Welcome handshake with assigned slot and player list
      conn.send({
        type: 'welcome',
        slot: slot,
        color: this.slotColors[slot],
        maxPlayers: this.maxPlayers,
        players: this.getPlayersArray()
      });
    });

    conn.on('data', (data) => {
      if (!data || !data.type) return;

      if (data.type === 'handshake') {
        const guestName = data.name || `Player ${slot}`;
        this.players.set(slot, {
          slot: slot,
          name: guestName,
          color: this.slotColors[slot],
          peerId: conn.peer
        });

        // Broadcast playerJoined to all clients
        this.broadcast({
          type: 'playerJoined',
          slot: slot,
          name: guestName,
          color: this.slotColors[slot],
          players: this.getPlayersArray()
        });

        if (this.onPlayerListChange) this.onPlayerListChange(this.getPlayersArray());
        if (this.onConnected) this.onConnected({ isHost: true, roomCode: this.roomCode, slot });
      } else if (data.type === 'state') {
        data.slot = slot;
        if (this.onRemotePlayerState) this.onRemotePlayerState(slot, data.state);
        // Relay to other guests
        this.broadcast(data, conn.peer);
      } else if (data.type === 'shoot') {
        data.slot = slot;
        if (this.onRemotePlayerShoot) this.onRemotePlayerShoot(slot, data.bullet);
        this.broadcast(data, conn.peer);
      } else if (data.type === 'hit') {
        if (this.onRemotePlayerHit) this.onRemotePlayerHit(data);
        this.broadcast(data, conn.peer);
      } else if (data.type === 'matchEvent') {
        if (this.onMatchEvent) this.onMatchEvent(data.event, data.payload);
        this.broadcast(data, conn.peer);
      }
    });

    conn.on('close', () => {
      this.connections.delete(conn.peer);
      this.players.delete(slot);
      this.broadcast({
        type: 'playerLeft',
        slot: slot,
        players: this.getPlayersArray()
      });

      if (this.onPlayerListChange) this.onPlayerListChange(this.getPlayersArray());
      if (this.connections.size === 0) {
        this.isConnected = false;
      }
    });

    conn.on('error', (err) => {
      console.warn(`Host conn error [slot ${slot}]:`, err);
    });
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
        const conn = this.peer.connect(hostPeerId, { reliable: true });
        this.setupGuestConnection(conn, onSuccess, onError);
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

  setupGuestConnection(conn, onSuccess, onError) {
    this.connections.set('host', conn);

    conn.on('open', () => {
      this.isConnected = true;
      // Send handshake
      conn.send({
        type: 'handshake',
        name: this.playerName
      });
      if (onSuccess) onSuccess();
    });

    conn.on('data', (data) => {
      if (!data || !data.type) return;

      switch (data.type) {
        case 'welcome':
          this.playerSlot = data.slot;
          this.maxPlayers = data.maxPlayers || 4;
          if (data.players) {
            this.players.clear();
            for (const p of data.players) this.players.set(p.slot, p);
            if (this.onPlayerListChange) this.onPlayerListChange(this.getPlayersArray());
          }
          if (this.onConnected) {
            this.onConnected({
              isHost: false,
              roomCode: this.roomCode,
              slot: this.playerSlot
            });
          }
          break;

        case 'playerJoined':
          if (data.players) {
            this.players.clear();
            for (const p of data.players) this.players.set(p.slot, p);
            if (this.onPlayerListChange) this.onPlayerListChange(this.getPlayersArray());
          }
          break;

        case 'playerLeft':
          this.players.delete(data.slot);
          if (data.players) {
            this.players.clear();
            for (const p of data.players) this.players.set(p.slot, p);
          }
          if (this.onPlayerListChange) this.onPlayerListChange(this.getPlayersArray());
          break;

        case 'state':
          if (this.onRemotePlayerState && data.slot !== this.playerSlot) {
            this.onRemotePlayerState(data.slot, data.state);
          }
          break;

        case 'shoot':
          if (this.onRemotePlayerShoot && data.slot !== this.playerSlot) {
            this.onRemotePlayerShoot(data.slot, data.bullet);
          }
          break;

        case 'hit':
          if (this.onRemotePlayerHit) {
            this.onRemotePlayerHit(data);
          }
          break;

        case 'matchEvent':
          if (this.onMatchEvent) {
            this.onMatchEvent(data.event, data.payload);
          }
          break;

        case 'error':
          if (onError) onError(new Error(data.message));
          else if (this.onError) this.onError(new Error(data.message));
          break;
      }
    });

    conn.on('close', () => {
      this.isConnected = false;
      if (this.onDisconnect) this.onDisconnect();
    });

    conn.on('error', (err) => {
      console.warn('Guest conn error:', err);
      if (this.onError) this.onError(err);
    });
  }

  getPlayersArray() {
    return Array.from(this.players.values());
  }

  broadcast(data, excludePeerId = null) {
    for (const [peerId, conn] of this.connections.entries()) {
      if (peerId !== excludePeerId && conn.open) {
        try {
          conn.send(data);
        } catch (_) {}
      }
    }
  }

  send(data) {
    if (this.isHost) {
      this.broadcast(data);
    } else {
      const hostConn = this.connections.get('host');
      if (hostConn && hostConn.open) {
        try {
          hostConn.send(data);
        } catch (_) {}
      }
    }
  }

  sendState(playerState) {
    const now = Date.now();
    if (now - this.lastSentStateTime < 30) return;
    this.lastSentStateTime = now;

    this.send({
      type: 'state',
      slot: this.playerSlot,
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
      slot: this.playerSlot,
      bullet: {
        id: bullet.id,
        x: bullet.x,
        y: bullet.y,
        angle: bullet.angle,
        speed: bullet.speed,
        damage: bullet.damage,
        ownerId: `player_${this.playerSlot}`
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
    for (const conn of this.connections.values()) {
      try { conn.close(); } catch (_) {}
    }
    this.connections.clear();
    this.players.clear();

    if (this.peer) {
      try { this.peer.destroy(); } catch (_) {}
      this.peer = null;
    }
  }
}
