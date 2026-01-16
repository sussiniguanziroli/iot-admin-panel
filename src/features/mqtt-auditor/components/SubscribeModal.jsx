import React, { useState } from 'react';
import { X, Plus, AlertTriangle } from 'lucide-react';
import { toast } from 'react-toastify';

const SubscribeModal = ({ isOpen, onClose, onSubscribe }) => {
  const [topic, setTopic] = useState('');
  const [qos, setQos] = useState(0);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!topic.trim()) {
      toast.error('Topic is required', { position: 'top-right', autoClose: 2000 });
      return;
    }

    const result = onSubscribe(topic.trim(), qos);
    
    if (result.success) {
      toast.success(`Subscribed to ${topic}`, { position: 'bottom-right', autoClose: 2000 });
      setTopic('');
      onClose();
    } else {
      toast.error(result.error, { position: 'top-right', autoClose: 3000 });
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        <div className="bg-gradient-to-r from-cyan-600 to-blue-600 px-6 py-4 text-white flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Plus size={20} />
            <h3 className="text-lg font-bold">Subscribe to Topic</h3>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
              MQTT Topic *
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., sensor/temperature"
              autoFocus
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-cyan-500 outline-none font-mono text-sm"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              Use <code className="bg-slate-200 dark:bg-slate-700 px-1 rounded">+</code> for single-level wildcard, 
              <code className="bg-slate-200 dark:bg-slate-700 px-1 rounded ml-1">#</code> for multi-level
            </p>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
              QoS Level
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[0, 1, 2].map(level => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setQos(level)}
                  className={`py-2 px-3 text-sm font-bold rounded-lg border-2 transition-all ${
                    qos === level
                      ? 'bg-cyan-50 dark:bg-cyan-900/20 border-cyan-500 text-cyan-700 dark:text-cyan-400'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-cyan-300'
                  }`}
                >
                  QoS {level}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900/30 p-3 rounded-lg">
            <p className="text-xs text-blue-800 dark:text-blue-400">
              💡 <strong>Examples:</strong>
            </p>
            <ul className="text-xs text-blue-700 dark:text-blue-400 mt-1 space-y-1">
              <li>• <code className="bg-white dark:bg-slate-800 px-1 rounded">sensor/+/temperature</code> - All sensors</li>
              <li>• <code className="bg-white dark:bg-slate-800 px-1 rounded">home/#</code> - Everything under home/</li>
            </ul>
          </div>

          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-900/30 p-3 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle size={16} className="text-orange-600 dark:text-orange-400 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-orange-800 dark:text-orange-400">Warning</p>
                <p className="text-xs text-orange-700 dark:text-orange-400 mt-1">
                  Using <code className="bg-white dark:bg-slate-800 px-1 rounded">#</code> alone is blocked by most public brokers for security
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-bold shadow-lg shadow-cyan-500/30 transition-all"
            >
              Subscribe
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default SubscribeModal;