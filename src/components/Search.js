import React, { useState, useEffect } from 'react';
import { search } from '../services/api';
import { Search as SearchIcon, X, User, FileText } from 'lucide-react';

const Search = ({ isOpen, onClose, onCardClick, onBoardClick }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ cards: [], boards: [] });
  const [loading, setLoading] = useState(false);
  const [searchType, setSearchType] = useState('all'); // 'all', 'cards', 'boards'

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults({ cards: [], boards: [] });
    }
  }, [isOpen]);

  const handleSearch = async (searchQuery) => {
    if (!searchQuery.trim()) {
      setResults({ cards: [], boards: [] });
      return;
    }

    setLoading(true);
    try {
      const data = await search(searchQuery, searchType === 'all' ? undefined : searchType);
      setResults(data);
    } catch (error) {
      console.error('Search error:', error);
      setResults({ cards: [], boards: [] });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    
    // Debounce search
    const timeoutId = setTimeout(() => {
      handleSearch(value);
    }, 300);

    return () => clearTimeout(timeoutId);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'To Do':
        return 'bg-gray-100 text-gray-800';
      case 'In Progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'Done':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center pt-20">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-96 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Search</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </div>
          
          {/* Search Input */}
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={query}
              onChange={handleInputChange}
              placeholder="Search cards, boards..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>
          
          {/* Search Type Filter */}
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => setSearchType('all')}
              className={`px-3 py-1 rounded text-sm ${
                searchType === 'all' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSearchType('cards')}
              className={`px-3 py-1 rounded text-sm ${
                searchType === 'cards' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Cards
            </button>
            <button
              onClick={() => setSearchType('boards')}
              className={`px-3 py-1 rounded text-sm ${
                searchType === 'boards' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Boards
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="p-4 max-h-64 overflow-y-auto">
          {loading && (
            <div className="text-center py-4 text-gray-500">
              Searching...
            </div>
          )}

          {!loading && query && results.cards.length === 0 && results.boards.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No results found for "{query}"
            </div>
          )}

          {!loading && !query && (
            <div className="text-center py-8 text-gray-500">
              Start typing to search...
            </div>
          )}

          {/* Cards Results */}
          {!loading && results.cards.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                <FileText size={16} className="mr-1" />
                Cards ({results.cards.length})
              </h3>
              <div className="space-y-2">
                {results.cards.map((card) => (
                  <div
                    key={card.id}
                    onClick={() => {
                      onCardClick(card);
                      onClose();
                    }}
                    className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-medium text-gray-800 text-sm">{card.title}</h4>
                      <span className={`px-2 py-0.5 rounded text-xs ${getStatusColor(card.status)}`}>
                        {card.status}
                      </span>
                    </div>
                    {card.description && (
                      <p className="text-xs text-gray-600 mb-2 line-clamp-2">{card.description}</p>
                    )}
                    <div className="flex items-center text-xs text-gray-500">
                      <span className="mr-3">📋 {card.list_title}</span>
                      <span className="mr-3">📊 {card.board_title}</span>
                      {card.assigned_username && (
                        <span className="flex items-center">
                          <User size={12} className="mr-1" />
                          {card.assigned_username}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      Updated: {formatDate(card.updated_at)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Boards Results */}
          {!loading && results.boards.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                <FileText size={16} className="mr-1" />
                Boards ({results.boards.length})
              </h3>
              <div className="space-y-2">
                {results.boards.map((board) => (
                  <div
                    key={board.id}
                    onClick={() => {
                      onBoardClick(board);
                      onClose();
                    }}
                    className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <h4 className="font-medium text-gray-800 text-sm mb-1">{board.title}</h4>
                    {board.description && (
                      <p className="text-xs text-gray-600 mb-2">{board.description}</p>
                    )}
                    <div className="text-xs text-gray-400">
                      Updated: {formatDate(board.updated_at)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Search;
