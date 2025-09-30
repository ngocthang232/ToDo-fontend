import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
  }

  connect(token) {
    if (this.socket && this.isConnected) {
      return this.socket;
    }

    this.socket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000', {
      auth: {
        token: token
      }
    });

    this.socket.on('connect', () => {
      console.log('Connected to WebSocket server');
      this.isConnected = true;
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.isConnected = false;
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  joinBoard(boardId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('join-board', boardId);
    }
  }

  leaveBoard(boardId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('leave-board', boardId);
    }
  }

  // Card events
  emitCardUpdated(cardData) {
    if (this.socket && this.isConnected) {
      this.socket.emit('card-updated', cardData);
    }
  }

  emitCardCreated(cardData) {
    if (this.socket && this.isConnected) {
      this.socket.emit('card-created', cardData);
    }
  }

  emitCardDeleted(cardData) {
    if (this.socket && this.isConnected) {
      this.socket.emit('card-deleted', cardData);
    }
  }

  // List events
  emitListUpdated(listData) {
    if (this.socket && this.isConnected) {
      this.socket.emit('list-updated', listData);
    }
  }

  emitListCreated(listData) {
    if (this.socket && this.isConnected) {
      this.socket.emit('list-created', listData);
    }
  }

  emitListDeleted(listData) {
    if (this.socket && this.isConnected) {
      this.socket.emit('list-deleted', listData);
    }
  }

  // Typing indicator
  emitUserTyping(boardId, cardId, isTyping) {
    if (this.socket && this.isConnected) {
      this.socket.emit('user-typing', {
        boardId,
        cardId,
        isTyping
      });
    }
  }

  // Event listeners
  onConnect(callback) {
    if (this.socket) {
      this.socket.on('connect', callback);
    }
  }

  onDisconnect(callback) {
    if (this.socket) {
      this.socket.on('disconnect', callback);
    }
  }
  onCardUpdated(callback) {
    if (this.socket) {
      this.socket.on('card-updated', callback);
    }
  }

  onCardCreated(callback) {
    if (this.socket) {
      this.socket.on('card-created', callback);
    }
  }

  onCardDeleted(callback) {
    if (this.socket) {
      this.socket.on('card-deleted', callback);
    }
  }

  onListUpdated(callback) {
    if (this.socket) {
      this.socket.on('list-updated', callback);
    }
  }

  onListCreated(callback) {
    if (this.socket) {
      this.socket.on('list-created', callback);
    }
  }

  onListDeleted(callback) {
    if (this.socket) {
      this.socket.on('list-deleted', callback);
    }
  }

  onUserJoined(callback) {
    if (this.socket) {
      this.socket.on('user-joined', callback);
    }
  }

  onUserLeft(callback) {
    if (this.socket) {
      this.socket.on('user-left', callback);
    }
  }

  onOnlineUsers(callback) {
    if (this.socket) {
      this.socket.on('online-users', callback);
    }
  }

  onUserTyping(callback) {
    if (this.socket) {
      this.socket.on('user-typing', callback);
    }
  }

  // Remove event listeners
  offCardUpdated(callback) {
    if (this.socket) {
      this.socket.off('card-updated', callback);
    }
  }

  offCardCreated(callback) {
    if (this.socket) {
      this.socket.off('card-created', callback);
    }
  }

  offCardDeleted(callback) {
    if (this.socket) {
      this.socket.off('card-deleted', callback);
    }
  }

  offListUpdated(callback) {
    if (this.socket) {
      this.socket.off('list-updated', callback);
    }
  }

  offListCreated(callback) {
    if (this.socket) {
      this.socket.off('list-created', callback);
    }
  }

  offListDeleted(callback) {
    if (this.socket) {
      this.socket.off('list-deleted', callback);
    }
  }

  offUserJoined(callback) {
    if (this.socket) {
      this.socket.off('user-joined', callback);
    }
  }

  offUserLeft(callback) {
    if (this.socket) {
      this.socket.off('user-left', callback);
    }
  }

  offOnlineUsers(callback) {
    if (this.socket) {
      this.socket.off('online-users', callback);
    }
  }

  offUserTyping(callback) {
    if (this.socket) {
      this.socket.off('user-typing', callback);
    }
  }
}

// Create a singleton instance
const socketService = new SocketService();
export default socketService;
