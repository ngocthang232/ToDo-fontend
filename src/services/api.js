import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const register = async (username, email, password) => {
  const response = await api.post('/auth/register', { username, email, password });
  return response.data;
};

export const login = async (username, password) => {
  const response = await api.post('/auth/login', { username, password });
  return response.data;
};

// Boards API
export const getBoards = async () => {
  const response = await api.get('/boards');
  return response.data;
};

export const createBoard = async (title, description) => {
  const response = await api.post('/boards', { title, description });
  return response.data;
};

export const updateBoard = async (id, title, description) => {
  const response = await api.put(`/boards/${id}`, { title, description });
  return response.data;
};

export const deleteBoard = async (id) => {
  const response = await api.delete(`/boards/${id}`);
  return response.data;
};

// Lists API
export const getLists = async (boardId) => {
  const response = await api.get(`/boards/${boardId}/lists`);
  return response.data;
};

export const createList = async (boardId, title) => {
  const response = await api.post(`/boards/${boardId}/lists`, { title });
  return response.data;
};

export const updateList = async (id, title, position) => {
  const response = await api.put(`/lists/${id}`, { title, position });
  return response.data;
};

export const deleteList = async (id) => {
  const response = await api.delete(`/lists/${id}`);
  return response.data;
};

// Cards API
export const getCards = async (listId) => {
  const response = await api.get(`/lists/${listId}/cards`);
  return response.data;
};

export const createCard = async (listId, title, description, status, assigned_to, due_date) => {
  const response = await api.post(`/lists/${listId}/cards`, { title, description, status, assigned_to, due_date });
  return response.data;
};

export const updateCard = async (id, title, description, status, assigned_to, position, list_id, due_date) => {
  const response = await api.put(`/cards/${id}`, { title, description, status, assigned_to, position, list_id, due_date });
  return response.data;
};

// Users API
export const getUsers = async () => {
  const response = await api.get('/users');
  return response.data;
};

export const updateUserProfile = async (email, currentPassword, newPassword) => {
  const response = await api.put('/users/profile', { email, currentPassword, newPassword });
  return response.data;
};

// Board members API
export const getBoardMembers = async (boardId) => {
  const response = await api.get(`/boards/${boardId}/members`);
  return response.data;
};

export const addBoardMember = async (boardId, userId) => {
  const response = await api.post(`/boards/${boardId}/members`, { userId });
  return response.data;
};

export const removeBoardMember = async (boardId, userId) => {
  const response = await api.delete(`/boards/${boardId}/members/${userId}`);
  return response.data;
};

export const deleteCard = async (id) => {
  const response = await api.delete(`/cards/${id}`);
  return response.data;
};

// Drag and Drop API
export const updateCardPositions = async (cards) => {
  const response = await api.put('/cards/positions', { cards });
  return response.data;
};

export const updateListPositions = async (lists) => {
  const response = await api.put('/lists/positions', { lists });
  return response.data;
};

// Card labels API
export const getCardLabels = async (cardId) => {
  const response = await api.get(`/cards/${cardId}/labels`);
  return response.data;
};

export const createCardLabel = async (cardId, label, color) => {
  const response = await api.post(`/cards/${cardId}/labels`, { label, color });
  return response.data;
};

export const deleteCardLabel = async (labelId) => {
  const response = await api.delete(`/card-labels/${labelId}`);
  return response.data;
};

// Search API
export const search = async (query, type) => {
  const response = await api.get('/search', { 
    params: { q: query, type: type || undefined } 
  });
  return response.data;
};

// Card attachments API
export const getCardAttachments = async (cardId) => {
  const response = await api.get(`/cards/${cardId}/attachments`);
  return response.data;
};

export const uploadCardAttachment = async (cardId, file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await api.post(`/cards/${cardId}/attachments`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const deleteCardAttachment = async (attachmentId) => {
  const response = await api.delete(`/card-attachments/${attachmentId}`);
  return response.data;
};
