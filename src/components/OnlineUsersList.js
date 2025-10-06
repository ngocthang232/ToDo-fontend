import React, { useState, useEffect } from 'react';
import { Users, Wifi, WifiOff, X } from 'lucide-react';
import socketService from '../services/socketService';

const OnlineUsersList = ({ boardId, isOpen, onClose }) => {
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isConnected, setIsConnected] = useState(socketService.isConnected);
  const currentUser = (() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
  })();

  useEffect(() => {
    if (!isOpen || !boardId) return;

    // Reflect current connection immediately (in case we subscribed after connect)
    setIsConnected(socketService.isConnected);

    // Join board room (server will emit initial online list)
    socketService.joinBoard(boardId);

    const handleUserJoined = (user) => {
      if (user.userId === currentUser.id) return; // ignore self
      setOnlineUsers(prev => {
        const exists = prev.find(u => u.userId === user.userId);
        if (!exists) return [...prev, user];
        return prev;
      });
    };

    const handleUserLeft = (user) => {
      setOnlineUsers(prev => prev.filter(u => u.userId !== user.userId));
    };

    const handleOnlineUsers = (payload) => {
      if (!payload || payload.boardId !== boardId) return;
      const others = (payload.users || []).filter(u => u.userId !== currentUser.id);
      setOnlineUsers(others);
    };

    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => { setIsConnected(false); setOnlineUsers([]); };

    // Set up listeners via service API
    socketService.onUserJoined(handleUserJoined);
    socketService.onUserLeft(handleUserLeft);
    socketService.onOnlineUsers(handleOnlineUsers);
    socketService.onConnect(handleConnect);
    socketService.onDisconnect(handleDisconnect);

    return () => {
      socketService.offUserJoined(handleUserJoined);
      socketService.offUserLeft(handleUserLeft);
      socketService.offOnlineUsers(handleOnlineUsers);
      socketService.leaveBoard(boardId);
    };
  }, [isOpen, boardId, currentUser.id]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md mx-4">
        <div className="flex justify-between items-center border-b px-6 py-4">
          <h2 className="text-lg font-semibold flex items-center">
            <Users size={20} className="mr-2" />
            Online Users
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 p-1 rounded-full">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6">
          {!isConnected ? (
            <div className="flex items-center justify-center py-8">
              <WifiOff size={24} className="text-gray-400 mr-2" />
              <span className="text-gray-500">Offline</span>
            </div>
          ) : (
            <>
              <div className="flex items-center mb-4">
                <Wifi size={16} className="text-green-500 mr-2" />
                <span className="text-sm text-gray-600">
                  {onlineUsers.length + 1} user(s) online
                </span>
              </div>
              
              <div className="space-y-3">
                {/* Current user */}
                <div className="flex items-center p-3 bg-blue-50 rounded-lg">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium mr-3">
                    You
                  </div>
                  <div>
                    <div className="font-medium text-gray-800">You</div>
                    <div className="text-xs text-gray-500">Current user</div>
                  </div>
                  <div className="ml-auto">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  </div>
                </div>
                
                {/* Other online users */}
                {onlineUsers.map((user) => (
                  <div key={user.userId} className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center text-white text-sm font-medium mr-3">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium text-gray-800">{user.username}</div>
                      <div className="text-xs text-gray-500">Online</div>
                    </div>
                    <div className="ml-auto">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    </div>
                  </div>
                ))}
                
                {onlineUsers.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Users size={32} className="mx-auto mb-2 text-gray-300" />
                    <p>No other users online</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnlineUsersList;
