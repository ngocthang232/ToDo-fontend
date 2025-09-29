import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Board from './components/Board';
import Login from './components/Login';
import Register from './components/Register';
import { getBoards, createBoard } from './services/api';
import socketService from './services/socketService';

function App() {
  const [user, setUser] = useState(null);
  const [boards, setBoards] = useState([]);
  const [currentBoard, setCurrentBoard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRegister, setShowRegister] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      setUser(userData);
      
      // Connect to WebSocket
      const token = localStorage.getItem('token');
      if (token) {
        socketService.connect(token);
      }
      
      fetchBoards();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchBoards = async () => {
    try {
      const data = await getBoards();
      setBoards(data);
      if (data.length > 0 && !currentBoard) {
        setCurrentBoard(data[0]);
      }
    } catch (error) {
      console.error('Error fetching boards:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (userData) => {
    setUser(userData);
    fetchBoards();
  };

  const handleRegister = (userData) => {
    setUser(userData);
    fetchBoards();
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    socketService.disconnect();
    setUser(null);
    setBoards([]);
    setCurrentBoard(null);
  };

  const handleUserUpdate = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const handleCardClick = (card) => {
    // Find the board that contains this card
    const board = boards.find(b => b.id === card.board_id);
    if (board) {
      setCurrentBoard(board);
    }
  };

  const handleBoardClick = (board) => {
    setCurrentBoard(board);
  };

  const handleCreateBoard = async (title, description) => {
    try {
      const newBoard = await createBoard(title, description);
      setBoards([newBoard, ...boards]);
      setCurrentBoard(newBoard);
    } catch (error) {
      console.error('Error creating board:', error);
      alert('Error creating board: ' + (error.response?.data?.error || 'Unknown error'));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  // Show auth forms if not logged in
  if (!user) {
    return showRegister ? (
      <Register 
        onRegister={handleRegister}
        onSwitchToLogin={() => setShowRegister(false)}
      />
    ) : (
      <Login 
        onLogin={handleLogin}
        onSwitchToRegister={() => setShowRegister(true)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        user={user}
        boards={boards}
        currentBoard={currentBoard}
        onBoardChange={setCurrentBoard}
        onCreateBoard={handleCreateBoard}
        onLogout={handleLogout}
        onUserUpdate={handleUserUpdate}
        onCardClick={handleCardClick}
        onBoardClick={handleBoardClick}
      />
      {currentBoard ? (
        <Board boardId={currentBoard.id} />
      ) : (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">
              Welcome to ToDo App, {user.username}!
            </h2>
            <p className="text-gray-500 mb-6">
              Create your first board to get started
            </p>
            <button
              onClick={() => handleCreateBoard('My First Board', 'Start organizing your tasks')}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Create Board
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
