import React, { useState } from 'react';
import { Plus, Trash2, MessageSquare } from 'lucide-react';
import Swal from 'sweetalert2';
import { toast } from 'react-toastify';

const SubscriptionPanel = ({ subscriptions, activeTopicId, onSelectTopic, onRemoveSubscription, onOpenSubscribe }) => {
  
  const handleRemove = async (e, sub) => {
    e.stopPropagation();
    
    const result = await Swal.fire({
      title: 'Unsubscribe?',
      html: `
        <div class="text-left space-y-2">
          <p class="text-slate-600">You will stop receiving messages from this topic.</p>
          <div class="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg mt-3 text-sm">
            <p class="font-mono text-xs"><strong>Topic:</strong> ${sub.topic}</p>
            <p class="text-xs text-slate-500 mt-1">${sub.messageCount} messages received</p>
          </div>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Unsubscribe',
      cancelButtonText: 'Cancel',
      reverseButtons: true
    });

    if (result.isConfirmed) {
      onRemoveSubscription(sub.id);
      toast.success('Unsubscribed successfully', { position: 'bottom-right', autoClose: 2000 });
    }
  };

  return (
    <div className="w-64 border-r border-slate-200 dark:border-slate-700 flex flex-col h-full bg-slate-50 dark:bg-slate-900/50">
      
      <div className="p-3 border-b border-slate-200 dark:border-slate-700">
        <button
          onClick={onOpenSubscribe}
          className="w-full px-3 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2 shadow-md transition-all"
        >
          <Plus size={16} />
          Subscribe
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {subscriptions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500 text-center p-4">
            <MessageSquare size={36} className="mb-2 opacity-50" />
            <p className="text-xs font-bold">No Subscriptions</p>
            <p className="text-[10px] mt-1">Click Subscribe to start</p>
          </div>
        ) : (
          subscriptions.map(sub => (
            <div
              key={sub.id}
              onClick={() => onSelectTopic(sub.id)}
              className={`p-2.5 rounded-lg cursor-pointer transition-all group ${
                activeTopicId === sub.id
                  ? 'bg-cyan-100 dark:bg-cyan-900/30 border-2 border-cyan-500'
                  : 'bg-white dark:bg-slate-800 border-2 border-transparent hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              <div className="flex items-start justify-between gap-1.5">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold font-mono text-slate-900 dark:text-white truncate">
                    {sub.topic}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      {sub.messageCount} msgs
                    </span>
                    {sub.lastMessageAt && (
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">
                        {sub.lastMessageAt.toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={(e) => handleRemove(e, sub)}
                  className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-2 border-t border-slate-200 dark:border-slate-700 text-[10px] text-slate-500 dark:text-slate-400 text-center">
        {subscriptions.length} active
      </div>
    </div>
  );
};

export default SubscriptionPanel;