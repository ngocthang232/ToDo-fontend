import React, { useState, useEffect, useCallback } from 'react';
import Card from './Card';
import { getCards, createCard, deleteList, updateCard } from '../services/api';
import { X } from "lucide-react";
import { DndContext, useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

const ListExpanded = ({ list, onClose, onDelete }) => {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddCard, setShowAddCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [newCardDescription, setNewCardDescription] = useState('');
  const [newCardStatus, setNewCardStatus] = useState('To Do');

  const fetchCards = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getCards(list.id);
      setCards(data);
    } catch (error) {
      console.error('Error fetching cards:', error);
    } finally {
      setLoading(false);
    }
  }, [list.id]);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  const validateCardForm = () => {
    if (!newCardTitle.trim()) {
      alert('Card title is required');
      return false;
    }
    if (newCardTitle.length > 100) {
      alert('Card title must be less than 100 characters');
      return false;
    }
    if (newCardDescription && newCardDescription.length > 500) {
      alert('Card description must be less than 500 characters');
      return false;
    }
    return true;
  };

  const handleCreateCard = async (e) => {
    e.preventDefault();
    if (validateCardForm()) {
      try {
        const newCard = await createCard(
          list.id,
          newCardTitle.trim(),
          newCardDescription.trim(),
          newCardStatus,
          null, // assigned_to
          null  // due_date
        );
        setCards([...cards, newCard]);
        setNewCardTitle('');
        setNewCardDescription('');
        setNewCardStatus('To Do');
        setShowAddCard(false);
      } catch (error) {
        console.error('Error creating card:', error);
        alert('Error creating card: ' + (error.response?.data?.error || 'Unknown error'));
      }
    }
  };

  const handleDeleteCard = (cardId) => {
    setCards(cards.filter((card) => card.id !== cardId));
  };

  const handleCardUpdate = () => {
    fetchCards();
  };

  const handleDeleteList = async () => {
    if (window.confirm('Are you sure you want to delete this list and all its cards?')) {
      try {
        await deleteList(list.id);
        onDelete(list.id);
        onClose();
      } catch (error) {
        console.error('Error deleting list:', error);
      }
    }
  };

  const getCardsByStatus = (status) => {
    return cards.filter((card) => card.status === status);
  };

  // DnD helpers
  const DroppableColumn = ({ status, className, children }) => {
    const { setNodeRef, isOver } = useDroppable({ id: `col-${status}`, data: { status } });
    return (
      <div ref={setNodeRef} className={className} style={{ outline: isOver ? '2px dashed #3b82f6' : 'none' }}>
        {children}
      </div>
    );
  };

  const DraggableCard = ({ card, children }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: `card-${card.id}`, data: { card } });
    const style = {
      transform: transform ? CSS.Translate.toString(transform) : undefined,
      opacity: isDragging ? 0.6 : 1
    };
    return (
      <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
        {children}
      </div>
    );
  };

  const handleDragEnd = async (event) => {
    const draggedCard = event?.active?.data?.current?.card;
    const overStatus = event?.over?.data?.current?.status;
    if (!draggedCard || !overStatus) return;

    if (draggedCard.status === overStatus) return;

    try {
      // Optimistic update
      setCards(prev => prev.map(c => c.id === draggedCard.id ? { ...c, status: overStatus } : c));

      await updateCard(
        draggedCard.id,
        draggedCard.title,
        draggedCard.description,
        overStatus,
        draggedCard.assigned_to,
        draggedCard.position,
        null,
        draggedCard.due_date
      );
    } catch (e) {
      // Revert on error
      setCards(prev => prev.map(c => c.id === draggedCard.id ? { ...c, status: draggedCard.status } : c));
      console.error('Failed to update card status:', e);
      alert('Failed to update card status');
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 shadow-xl">
          <div className="text-lg text-gray-600 animate-pulse">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-6xl max-h-[95vh] overflow-y-auto animate-fadeIn">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <h2 className="text-2xl font-bold text-gray-900">{list.title}</h2>
          <div className="flex space-x-3">
            <button
              onClick={handleDeleteList}
              className="px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition"
            >
              Delete List
            </button>
            {/* <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-100 transition"
            >
              Close
            </button> */}
            <button
              onClick={onClose}
              className="p-2 bg-gray-500 hover:bg-red-600 text-white rounded-lg"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Columns */}
        <DndContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 min-h-[50vh]">
          {/* To Do */}
          <DroppableColumn status="To Do" className="bg-gray-50 rounded-lg p-4 border-t-4 border-gray-400">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-800">To Do</h3>
              <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-xs">
                {getCardsByStatus('To Do').length}
              </span>
            </div>
            <div className="space-y-3 max-h-[45vh] overflow-y-auto pr-2">
              {getCardsByStatus('To Do').map((card) => (
                <DraggableCard key={card.id} card={card}>
                  <Card
                    card={card}
                    onDelete={() => handleDeleteCard(card.id)}
                    onUpdate={handleCardUpdate}
                  />
                </DraggableCard>
              ))}
            </div>
          </DroppableColumn>

          {/* In Progress */}
          <DroppableColumn status="In Progress" className="bg-yellow-50 rounded-lg p-4 border-t-4 border-yellow-400">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-800">In Progress</h3>
              <span className="bg-yellow-200 text-yellow-800 px-2 py-1 rounded-full text-xs">
                {getCardsByStatus('In Progress').length}
              </span>
            </div>
            <div className="space-y-3 max-h-[45vh] overflow-y-auto pr-2">
              {getCardsByStatus('In Progress').map((card) => (
                <DraggableCard key={card.id} card={card}>
                  <Card
                    card={card}
                    onDelete={() => handleDeleteCard(card.id)}
                    onUpdate={handleCardUpdate}
                  />
                </DraggableCard>
              ))}
            </div>
          </DroppableColumn>

          {/* Done */}
          <DroppableColumn status="Done" className="bg-green-50 rounded-lg p-4 border-t-4 border-green-400">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-800">Done</h3>
              <span className="bg-green-200 text-green-800 px-2 py-1 rounded-full text-xs">
                {getCardsByStatus('Done').length}
              </span>
            </div>
            <div className="space-y-3 max-h-[45vh] overflow-y-auto pr-2">
              {getCardsByStatus('Done').map((card) => (
                <DraggableCard key={card.id} card={card}>
                  <Card
                    card={card}
                    onDelete={() => handleDeleteCard(card.id)}
                    onUpdate={handleCardUpdate}
                  />
                </DraggableCard>
              ))}
            </div>
          </DroppableColumn>
        </div>
        </DndContext>

        {/* Add Card Form */}
        {showAddCard && (
          <div className="mt-6 p-5 bg-gray-50 rounded-lg border shadow-sm">
            <form onSubmit={handleCreateCard} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  type="text"
                  value={newCardTitle}
                  onChange={(e) => setNewCardTitle(e.target.value)}
                  placeholder="Card title..."
                  className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
                <textarea
                  value={newCardDescription}
                  onChange={(e) => setNewCardDescription(e.target.value)}
                  placeholder="Description (optional)..."
                  className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows="1"
                />
                <select
                  value={newCardStatus}
                  onChange={(e) => setNewCardStatus(e.target.value)}
                  className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="To Do">To Do</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Done">Done</option>
                </select>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-5 py-2 rounded-lg hover:bg-blue-600 transition"
                >
                  Add Card
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddCard(false);
                    setNewCardTitle('');
                    setNewCardDescription('');
                    setNewCardStatus('To Do');
                  }}
                  className="px-5 py-2 text-gray-600 rounded-lg hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {!showAddCard && (
          <div className="mt-6 text-center">
            <button
              onClick={() => setShowAddCard(true)}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg shadow hover:bg-blue-600 transition"
            >
              + Add New Card
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ListExpanded;
