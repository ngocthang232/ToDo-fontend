import React, { useState, useEffect, useCallback } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import SortableCard from './SortableCard';
import ListExpanded from './ListExpanded';
import { getCards, createCard, deleteList, updateCardPositions } from '../services/api';
import { MoreVertical, Trash2, X } from 'lucide-react';
import socketService from '../services/socketService';

const List = ({ list, onDelete, dragListeners }) => {
  const [cards, setCards] = useState([]);
  const [showAddCard, setShowAddCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [newCardDescription, setNewCardDescription] = useState('');
  const [newCardDueDate, setNewCardDueDate] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [showExpanded, setShowExpanded] = useState(false);
  const [cardErrors, setCardErrors] = useState({});

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fetchCards = useCallback(async () => {
    try {
      const data = await getCards(list.id);
      setCards(data);
    } catch (error) {
      console.error('Error fetching cards:', error);
    }
  }, [list.id]);

  useEffect(() => {
    fetchCards();
    
    // Set up WebSocket listeners for real-time card updates
    const handleCardCreated = (data) => {
      if (data.listId === list.id) {
        setCards(prev => [...prev, data.card]);
      }
    };

    const handleCardUpdated = (data) => {
      if (data.listId === list.id) {
        setCards(prev => prev.map(card => 
          card.id === data.card.id ? { ...card, ...data.card } : card
        ));
      }
    };

    const handleCardDeleted = (data) => {
      if (data.listId === list.id) {
        setCards(prev => prev.filter(card => card.id !== data.cardId));
      }
    };

    // Set up listeners
    socketService.onCardCreated(handleCardCreated);
    socketService.onCardUpdated(handleCardUpdated);
    socketService.onCardDeleted(handleCardDeleted);

    // Cleanup
    return () => {
      socketService.offCardCreated(handleCardCreated);
      socketService.offCardUpdated(handleCardUpdated);
      socketService.offCardDeleted(handleCardDeleted);
    };
  }, [list.id, fetchCards]);

  const validateCardForm = () => {
    const newErrors = {};
    if (!newCardTitle.trim()) {
      newErrors.title = 'Card title is required';
    } else if (newCardTitle.length > 100) {
      newErrors.title = 'Card title must be less than 100 characters';
    }

    if (newCardDescription && newCardDescription.length > 500) {
      newErrors.description = 'Card description must be less than 500 characters';
    }

    setCardErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateCard = async (e) => {
    e.preventDefault();
    if (!validateCardForm()) return;

    try {
      const newCard = await createCard(
        list.id,
        newCardTitle.trim(),
        newCardDescription.trim(),
        'To Do',
        null,
        newCardDueDate || null
      );
      setCards([...cards, newCard]);
      setNewCardTitle('');
      setNewCardDescription('');
      setNewCardDueDate('');
      setCardErrors({});
      setShowAddCard(false);
      
      // Emit WebSocket event for real-time collaboration
      socketService.emitCardCreated({
        boardId: list.board_id,
        listId: list.id,
        card: newCard
      });
    } catch (error) {
      console.error('Error creating card:', error);
      setCardErrors({
        general: 'Error creating card: ' + (error.response?.data?.error || 'Unknown error'),
      });
    }
  };

  const handleDeleteCard = (cardId) => {
    setCards(cards.filter((card) => card.id !== cardId));
  };

  const handleCardUpdate = () => {
    fetchCards(); // refresh cards
  };

  const handleDeleteList = async () => {
    if (window.confirm('Are you sure you want to delete this list and all its cards?')) {
      try {
        await deleteList(list.id);
        onDelete(list.id);
      } catch (error) {
        console.error('Error deleting list:', error);
      }
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = cards.findIndex(card => card.id === active.id);
      const newIndex = cards.findIndex(card => card.id === over.id);

      const newCards = arrayMove(cards, oldIndex, newIndex);
      setCards(newCards);

      // Update positions in database
      try {
        const updatedCards = newCards.map((card, index) => ({
          id: card.id,
          position: index,
          list_id: list.id
        }));
        await updateCardPositions(updatedCards);
      } catch (error) {
        console.error('Error updating card positions:', error);
        // Revert on error
        setCards(cards);
      }
    }
  };

  return (
    <div className="flex-shrink-0 w-72 bg-gray-100 rounded-lg p-3 relative group">
      {/* Drag Handle for List */}
      {dragListeners && (
        <div 
          className="absolute top-2 left-1 w-1 h-6 bg-gray-400 rounded cursor-grab hover:bg-gray-500 opacity-0 group-hover:opacity-100 transition-opacity"
          {...dragListeners}
          title="Drag to reorder list"
        />
      )}
      
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-gray-800">{list.title}</h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowExpanded(true)}
            className="text-blue-600 hover:text-blue-800 text-xs px-2 py-1 rounded hover:bg-blue-50 transition"
            title="Expand to 3-column view"
          >
            Expand
          </button>
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="text-gray-500 hover:text-gray-700 p-1"
            >
              <MoreVertical size={18} />
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-2 w-36 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                <button
                  onClick={handleDeleteList}
                  className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                >
                  <Trash2 size={16} /> Delete List
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cards */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="space-y-2 mb-3 max-h-96 overflow-y-auto">
          <SortableContext items={cards.map(card => card.id)} strategy={verticalListSortingStrategy}>
            {cards.map((card) => (
              <SortableCard
                key={card.id}
                card={card}
                onDelete={() => handleDeleteCard(card.id)}
                onUpdate={handleCardUpdate}
              />
            ))}
          </SortableContext>
        </div>
      </DndContext>

      {/* Add Card Form */}
      {showAddCard ? (
        <form onSubmit={handleCreateCard} className="space-y-2">
          <textarea
            value={newCardTitle}
            onChange={(e) => setNewCardTitle(e.target.value)}
            placeholder="Enter a title for this card..."
            className={`w-full p-2 border rounded resize-none focus:outline-none focus:ring-2 ${
              cardErrors.title
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:ring-blue-500'
            }`}
            rows="2"
            autoFocus
          />
          {cardErrors.title && <p className="text-sm text-red-600">{cardErrors.title}</p>}

          <textarea
            value={newCardDescription}
            onChange={(e) => setNewCardDescription(e.target.value)}
            placeholder="Enter description (optional)..."
            className={`w-full p-2 border rounded resize-none focus:outline-none focus:ring-2 ${
              cardErrors.description
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:ring-blue-500'
            }`}
            rows="1"
          />
          {cardErrors.description && <p className="text-sm text-red-600">{cardErrors.description}</p>}

          <input
            type="datetime-local"
            value={newCardDueDate}
            onChange={(e) => setNewCardDueDate(e.target.value)}
            placeholder="Due date (optional)"
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {cardErrors.general && <p className="text-sm text-red-600">{cardErrors.general}</p>}

          <div className="flex space-x-2">
            <button
              type="submit"
              className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
            >
              Add Card
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAddCard(false);
                setNewCardTitle('');
                setNewCardDescription('');
                setNewCardDueDate('');
                setCardErrors({});
              }}
              className="flex items-center gap-1 text-gray-600 hover:text-gray-800"
            >
              <X size={16} /> Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setShowAddCard(true)}
          className="w-full text-left text-gray-600 hover:text-gray-800 py-2 px-3 rounded hover:bg-gray-200 transition"
        >
          + Add a card
        </button>
      )}

      {/* Expanded View */}
      {showExpanded && (
        <ListExpanded list={list} onClose={() => setShowExpanded(false)} onDelete={onDelete} />
      )}
    </div>
  );
};

export default List;
