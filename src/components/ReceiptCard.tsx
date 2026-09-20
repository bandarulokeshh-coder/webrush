import React from 'react';

// Import the receipt types from our utils
import { Receipt } from '../utils/data';

interface ReceiptCardProps {
  receipt: Receipt;
  onClick?: () => void;
}

const ReceiptCard: React.FC<ReceiptCardProps> = ({ receipt, onClick }) => {
  // Determine icon and color based on receipt type
  const getIconAndColor = (type: Receipt['type']) => {
    switch (type) {
      case 'music':
        return { icon: '🎵', color: 'from-indigo-400 to-purple-500' };
      case 'movie':
        return { icon: '🎬', color: 'from-red-500 to-orange-400' };
      case 'place':
        return { icon: '📍', color: 'from-green-400 to-emerald-500' };
      case 'purchase':
        return { icon: '🛒', color: 'from-blue-500 to-indigo-400' };
      case 'photo':
        return { icon: '📸', color: 'from-pink-400 to-rose-500' };
      case 'message':
        return { icon: '💬', color: 'from-yellow-400 to-amber-500' };
      case 'search':
        return { icon: '🔍', color: 'from-gray-400 to-slate-500' };
      case 'event':
        return { icon: '📅', color: 'from-teal-400 to-cyan-500' };
      case 'note':
        return { icon: '📝', color: 'from-violet-400 to-purple-500' };
      default:
        return { icon: '❓', color: 'from-gray-400 to-slate-500' };
    }
  };

  const { icon, color } = getIconAndColor(receipt.type);
  
  // Format timestamp for display
  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div
      className={`group cursor-pointer hover:shadow-lg transition-shadow duration-200 ${
        onClick ? 'hover:scale-[1.02]' : ''
      }`}
      onClick={onClick}
    >
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-4 py-3">
          <div className="flex items-start space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg text-lg">
              {icon}
            </div>
            <div className="flex-1 space-y-1">
              <div className="text-sm font-medium text-gray-800">
                {receipt.type.charAt(0).toUpperCase() + receipt.type.slice(1)}
              </div>
              <div className="text-xs text-gray-500">
                {formatTimestamp(receipt.timestamp)}
              </div>
            </div>
          </div>
        </div>
        
        {/* Type-specific content */}
        <div className="px-4 py-3">
          {(() => {
            switch (receipt.type) {
              case 'music':
                return (
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-gray-700">
                      {(receipt as MusicReceipt).track}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(receipt as MusicReceipt).artist}
                    </p>
                  </div>
                );
              case 'movie':
                return (
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-gray-700">
                      {(receipt as MovieReceipt).title}
                    </p>
                    {(receipt as MovieReceipt).genre && (
                      <p className="text-xs text-gray-500">
                        {(receipt as MovieReceipt).genre?.join(', ')}
                      </p>
                    )}
                  </div>
                );
              case 'place':
                return (
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-gray-700">
                      {(receipt as PlaceReceipt).name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(receipt as PlaceReceipt).category}
                    </p>
                  </div>
                );
              case 'purchase':
                return (
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-gray-700">
                      {(receipt as PurchaseReceipt).item}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(receipt as PurchaseReceipt).price} 
                      {(receipt as PurchaseReceipt).currency}
                    </p>
                  </div>
                );
              case 'photo':
                return (
                  <div className="space-y-1">
                    {(receipt as PhotoReceipt).caption && (
                      <p className="text-sm font-semibold text-gray-700">
                        {(receipt as PhotoReceipt).caption}
                      </p>
                    )}
                    <p className="text-xs text-gray-500">
                      Photo
                    </p>
                  </div>
                );
              case 'message':
                return (
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-gray-700">
                      From: {(receipt as MessageReceipt).sender}
                    </p>
                    <p className="text-xs text-gray-500 line-clamp-2">
                      {(receipt as MessageReceipt).content}
                    </p>
                  </div>
                );
              case 'search':
                return (
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-gray-700">
                      "{(receipt as SearchReceipt).query}"
                    </p>
                    <p className="text-xs text-gray-500">
                      Search
                    </p>
                  </div>
                );
              case 'event':
                return (
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-gray-700">
                      {(receipt as EventReceipt).title}
                    </p>
                    <p className="text-xs text-gray-500">
                      Event
                    </p>
                  </div>
                );
              case 'note':
                return (
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-gray-700 line-clamp-2">
                      {(receipt as NoteReceipt).content}
                    </p>
                    <p className="text-xs text-gray-500">
                      Note
                    </p>
                  </div>
                );
              default:
                return null;
            }
          })()}
        </div>
      </div>
    </div>
  );
};

export default ReceiptCard;
