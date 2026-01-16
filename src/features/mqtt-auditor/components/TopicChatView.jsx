import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Send, Copy, Pause, Play, Trash2, Download, ArrowDown, Check, ChevronDown } from 'lucide-react';
import { formatPayload, getPayloadType } from '../utils/messageFormatter';
import { toast } from 'react-toastify';

const TopicChatView = ({ activeTopic, onPublish, isPaused, onTogglePause, onClearMessages, allSubscriptions }) => {
  const [messageInput, setMessageInput] = useState('');
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [publishFormat, setPublishFormat] = useState('plaintext');
  const [publishToTopic, setPublishToTopic] = useState('');
  const [showTopicDropdown, setShowTopicDropdown] = useState(false);
  const [copiedTopic, setCopiedTopic] = useState(false);
  const [renderKey, setRenderKey] = useState(0);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const dropdownRef = useRef(null);

  const reversedMessages = useMemo(() => {
    if (!activeTopic?.messages) return [];
    console.log('[TopicChatView] Recalculating reversed messages:', activeTopic.messages.length);
    return [...activeTopic.messages].reverse();
  }, [activeTopic?.messages, activeTopic?.messageCount]);

  useEffect(() => {
    if (activeTopic) {
      console.log('[TopicChatView] activeTopic updated:', {
        topic: activeTopic.topic,
        messageCount: activeTopic.messageCount,
        messagesLength: activeTopic.messages.length,
        latestMessage: activeTopic.messages[0],
        reversedMessagesLength: reversedMessages.length
      });
      setRenderKey(prev => prev + 1);
    }
  }, [activeTopic?.messageCount]);

  useEffect(() => {
    if (activeTopic) {
      setPublishToTopic(activeTopic.topic);
    }
  }, [activeTopic?.topic]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowTopicDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!isPaused && reversedMessages.length > 0) {
      scrollToBottom();
    }
  }, [reversedMessages.length, isPaused]);

  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShowScrollButton(!isNearBottom);
  };

  const handleCopyTopic = async () => {
    if (!activeTopic) return;
    try {
      await navigator.clipboard.writeText(activeTopic.topic);
      setCopiedTopic(true);
      toast.success('Topic copied to clipboard', { position: 'bottom-right', autoClose: 1500 });
      setTimeout(() => setCopiedTopic(false), 2000);
    } catch (err) {
      toast.error('Failed to copy topic', { position: 'top-right' });
    }
  };

  const validateAndFormatPayload = (input, format) => {
    switch (format) {
      case 'json':
        try {
          const parsed = JSON.parse(input);
          return { valid: true, payload: JSON.stringify(parsed) };
        } catch (e) {
          return { valid: false, error: 'Invalid JSON format' };
        }

      case 'hex':
        const hexRegex = /^[0-9A-Fa-f\s]+$/;
        if (!hexRegex.test(input.trim())) {
          return { valid: false, error: 'Invalid hex format. Use only 0-9, A-F characters' };
        }
        return { valid: true, payload: input.trim().replace(/\s/g, '') };

      case 'base64':
        try {
          atob(input.trim());
          return { valid: true, payload: input.trim() };
        } catch (e) {
          return { valid: false, error: 'Invalid Base64 format' };
        }

      case 'plaintext':
      default:
        return { valid: true, payload: input };
    }
  };

  const handleSend = () => {
    if (!messageInput.trim() || !publishToTopic.trim()) {
      toast.error('Topic and message are required', { position: 'top-right', autoClose: 2000 });
      return;
    }
  
    const validation = validateAndFormatPayload(messageInput, publishFormat);
    
    if (!validation.valid) {
      toast.error(validation.error, { position: 'top-right', autoClose: 3000 });
      return;
    }
  
    try {
      onPublish(publishToTopic, validation.payload);
      setMessageInput('');
      toast.success(`Message sent to ${publishToTopic}`, { position: 'bottom-right', autoClose: 1500 });
    } catch (error) {
      toast.error('Failed to send message', { position: 'top-right' });
      console.error('Send error:', error);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopy = async (payload) => {
    try {
      await navigator.clipboard.writeText(formatPayload(payload));
      toast.success('Copied to clipboard', { position: 'bottom-right', autoClose: 1500 });
    } catch (err) {
      toast.error('Failed to copy', { position: 'top-right' });
    }
  };

  const handleExport = () => {
    if (!activeTopic) return;

    try {
      const exportData = activeTopic.messages.map(msg => ({
        timestamp: msg.timestamp.toISOString(),
        topic: msg.topic,
        payload: msg.payload,
        qos: msg.qos
      }));

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${activeTopic.topic.replace(/\//g, '-')}-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success('Messages exported', { position: 'bottom-right', autoClose: 2000 });
    } catch (error) {
      toast.error('Failed to export', { position: 'top-right' });
    }
  };

  const isMessageSentByMe = (msg) => {
    return msg.isSentByMe === true;
  };

  if (!activeTopic) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-400 dark:text-slate-500">
        <div className="text-center">
          <p className="text-base font-bold">No Topic Selected</p>
          <p className="text-xs mt-2">Subscribe to a topic to start monitoring</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full min-w-0">
      
      <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0 flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900 dark:text-white font-mono truncate">
              {activeTopic.topic}
            </h3>
            <button
              onClick={handleCopyTopic}
              className="p-1 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 rounded transition-colors"
              title="Copy Topic"
            >
              {copiedTopic ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
            </button>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              {activeTopic.messageCount} messages • QoS {activeTopic.qos}
            </p>
          </div>
          
          <div className="flex items-center gap-1.5">
            <button
              onClick={onTogglePause}
              className={`p-1.5 rounded-lg transition-colors ${
                isPaused 
                  ? 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' 
                  : 'bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400'
              }`}
              title={isPaused ? 'Resume' : 'Pause'}
            >
              {isPaused ? <Play size={16} /> : <Pause size={16} />}
            </button>

            <button
              onClick={handleExport}
              className="p-1.5 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
              title="Export Messages"
            >
              <Download size={16} />
            </button>

            <button
              onClick={() => onClearMessages(activeTopic.id)}
              className="p-1.5 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/30 rounded-lg transition-colors"
              title="Clear Messages"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>

      <div 
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-3 bg-slate-50 dark:bg-slate-900 space-y-2 relative"
      >
        {reversedMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-400 dark:text-slate-500">
            <p className="text-xs">Waiting for messages...</p>
          </div>
        ) : (
          <div key={`container-${renderKey}`} className="space-y-2">
            {reversedMessages.map((msg, index) => {
              const payloadStr = formatPayload(msg.payload);
              const payloadType = getPayloadType(msg.payload);
              const isJson = payloadType === 'json';
              const isSentByMe = isMessageSentByMe(msg);

              return (
                <div 
                  key={`${msg.id}-${index}`}
                  className={`rounded-lg p-3 shadow-sm border transition-shadow group ${
                    isSentByMe 
                      ? 'bg-cyan-50 dark:bg-cyan-900/20 border-cyan-300 dark:border-cyan-700 ml-12'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 mr-12'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {isSentByMe && (
                        <span className="text-[10px] font-bold text-cyan-700 dark:text-cyan-300 bg-cyan-200 dark:bg-cyan-800/50 px-2 py-0.5 rounded">
                          YOU
                        </span>
                      )}
                      <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                        {msg.timestamp.toLocaleTimeString()}
                      </span>
                      {msg.topic !== activeTopic.topic && (
                        <span className="text-[10px] font-mono text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-1.5 py-0.5 rounded">
                          {msg.topic}
                        </span>
                      )}
                      <span className="text-[9px] px-1 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded font-bold uppercase">
                        {payloadType}
                      </span>
                    </div>
                    
                    <button
                      onClick={() => handleCopy(msg.payload)}
                      className="p-1 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 rounded transition-colors opacity-0 group-hover:opacity-100"
                      title="Copy Payload"
                    >
                      <Copy size={12} />
                    </button>
                  </div>

                  <div className={`${isJson ? 'bg-slate-900 dark:bg-slate-950 text-slate-100 p-2 rounded-lg overflow-x-auto' : ''}`}>
                    <pre className={`text-[11px] font-mono whitespace-pre-wrap break-all ${isJson ? '' : 'text-slate-700 dark:text-slate-300'}`}>
                      {payloadStr}
                    </pre>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div ref={messagesEndRef} />

        {showScrollButton && (
          <button
            onClick={scrollToBottom}
            className="fixed bottom-20 right-6 p-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-full shadow-lg transition-all animate-in fade-in z-10"
          >
            <ArrowDown size={18} />
          </button>
        )}
      </div>

      <div className="p-3 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 space-y-2">
        
        <div className="flex items-center gap-2">
          <div className="flex-1 relative" ref={dropdownRef}>
            <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">
              Publish to
            </label>
            <div className="relative">
              <input
                type="text"
                value={publishToTopic}
                onChange={(e) => setPublishToTopic(e.target.value)}
                placeholder="Topic..."
                className="w-full px-3 py-1.5 pr-8 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none text-xs font-mono"
              />
              <button
                onClick={() => setShowTopicDropdown(!showTopicDropdown)}
                className="absolute right-2 top-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <ChevronDown size={14} />
              </button>
            </div>

            {showTopicDropdown && allSubscriptions.length > 0 && (
              <div className="absolute bottom-full left-0 right-0 mb-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl max-h-40 overflow-y-auto z-10">
                {allSubscriptions.map(sub => (
                  <button
                    key={sub.id}
                    onClick={() => {
                      setPublishToTopic(sub.topic);
                      setShowTopicDropdown(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    <p className="text-xs font-mono text-slate-900 dark:text-white truncate">
                      {sub.topic}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">
              Format
            </label>
            <select
              value={publishFormat}
              onChange={(e) => setPublishFormat(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none text-xs font-bold cursor-pointer"
            >
              <option value="plaintext">Plaintext</option>
              <option value="json">JSON</option>
              <option value="hex">Hex</option>
              <option value="base64">Base64</option>
            </select>
          </div>
        </div>

        <div className="flex items-end gap-2">
          <div className="flex-1">
            <textarea
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Type ${publishFormat} message...`}
              rows={2}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none text-xs font-mono resize-none"
            />
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
              <kbd className="px-1 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-[9px] font-bold">Enter</kbd> to send
            </p>
          </div>
          <button
            onClick={handleSend}
            disabled={!messageInput.trim() || !publishToTopic.trim()}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg text-sm font-bold shadow-md transition-all flex items-center gap-1.5"
          >
            <Send size={16} />
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default TopicChatView;