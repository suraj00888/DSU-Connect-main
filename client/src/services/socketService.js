import { io } from 'socket.io-client';
import { getToken } from '../utils/auth';

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.listeners = new Map();
  }

  /**
   * Initialize socket connection
   */
  connect() {
    if (this.socket) return;

    const token = getToken();
    if (!token) {
      console.error('No authentication token found');
      return;
    }

    this.socket = io(import.meta.env.VITE_API_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    this.setupEventListeners();
  }

  /**
   * Setup socket event listeners
   */
  setupEventListeners() {
    this.socket.on('connect', () => {
      console.log('Socket connected');
      this.connected = true;
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
      this.connected = false;
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    // Handle reconnection
    this.socket.on('reconnect', (attemptNumber) => {
      console.log('Socket reconnected after', attemptNumber, 'attempts');
      this.connected = true;
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('Socket reconnection error:', error);
    });
  }

  /**
   * Join a group chat
   * @param {string} groupId - Group ID
   */
  joinGroup(groupId) {
    if (!this.connected) {
      console.error('Socket not connected');
      return;
    }
    this.socket.emit('join_group', { groupId });
  }

  /**
   * Leave a group chat
   * @param {string} groupId - Group ID
   */
  leaveGroup(groupId) {
    if (!this.connected) {
      console.error('Socket not connected');
      return;
    }
    this.socket.emit('leave_group', { groupId });
  }

  /**
   * Send a message to a group
   * @param {string} groupId - Group ID
   * @param {Object} message - Message data
   */
  sendMessage(groupId, message) {
    if (!this.connected) {
      console.error('Socket not connected');
      return;
    }
    this.socket.emit('send_message', { groupId, message });
  }

  /**
   * Send typing indicator
   * @param {string} groupId - Group ID
   * @param {boolean} isTyping - Whether user is typing
   */
  sendTypingIndicator(groupId, isTyping) {
    if (!this.connected) {
      console.error('Socket not connected');
      return;
    }
    this.socket.emit('typing', { groupId, isTyping });
  }

  /**
   * Add event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  on(event, callback) {
    if (!this.socket) {
      console.error('Socket not initialized');
      return;
    }

    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    this.socket.on(event, callback);
  }

  /**
   * Remove event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  off(event, callback) {
    if (!this.socket) {
      console.error('Socket not initialized');
      return;
    }

    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
      this.socket.off(event, callback);
    }
  }

  /**
   * Disconnect socket
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
      this.listeners.clear();
    }
  }
}

// Create a singleton instance
const socketService = new SocketService();
export default socketService; 