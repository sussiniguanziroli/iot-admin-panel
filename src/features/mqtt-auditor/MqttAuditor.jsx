import React, { useState, useEffect } from 'react';
import { X, Activity } from 'lucide-react';
import { useMqtt } from '../mqtt/context/MqttContext';
import { useSubscriptions } from './hooks/useSubscriptions';
import { useTopicMessages } from './hooks/useTopicMessages';
import { usePersistSubscriptions } from './hooks/usePersistSubscriptions';
import SubscriptionPanel from './components/SubscriptionPanel';
import TopicChatView from './components/TopicChatView';
import SubscribeModal from './components/SubscribeModal';

const MqttAuditor = ({ isOpen, onClose }) => {
  const { publishMessage } = useMqtt();
  const [isSubscribeModalOpen, setIsSubscribeModalOpen] = useState(false);
  const [hasLoadedSubscriptions, setHasLoadedSubscriptions] = useState(false);

  const {
    subscriptions,
    activeTopic,
    activeTopicId,
    setActiveTopicId,
    addSubscription,
    removeSubscription,
    clearMessages,
    addLocalMessage
  } = useSubscriptions();

  const {
    messages,
    isPaused,
    togglePause
  } = useTopicMessages(activeTopic);

  const { loadSubscriptions } = usePersistSubscriptions(subscriptions, addSubscription);

  useEffect(() => {
    if (isOpen && !hasLoadedSubscriptions) {
      loadSubscriptions();
      setHasLoadedSubscriptions(true);
    }
  }, [isOpen, hasLoadedSubscriptions, loadSubscriptions]);

  if (!isOpen) return null;

  const handlePublish = (topic, payload) => {
    addLocalMessage(topic, payload, true);
    publishMessage(topic, payload);
  };

  const totalMessages = subscriptions.reduce((sum, sub) => sum + sub.messageCount, 0);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-800 w-full max-w-6xl h-[85vh] rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
        
        <div className="bg-gradient-to-r from-cyan-600 to-blue-600 px-5 py-4 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
              <Activity size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold">MQTT Auditor</h2>
              <p className="text-cyan-100 text-xs mt-0.5">Real-time topic monitoring</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-[10px] text-cyan-100 font-bold uppercase tracking-wide">Total Messages</p>
              <p className="text-xl font-bold">{totalMessages}</p>
            </div>
            <button 
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors p-1.5 hover:bg-white/10 rounded-lg"
            >
              <X size={22} />
            </button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden min-h-0">
          
          <SubscriptionPanel
            subscriptions={subscriptions}
            activeTopicId={activeTopicId}
            onSelectTopic={setActiveTopicId}
            onRemoveSubscription={removeSubscription}
            onOpenSubscribe={() => setIsSubscribeModalOpen(true)}
          />

          <TopicChatView
            activeTopic={activeTopic}
            onPublish={handlePublish}
            isPaused={isPaused}
            onTogglePause={togglePause}
            onClearMessages={clearMessages}
            allSubscriptions={subscriptions}
          />

        </div>

        <SubscribeModal
          isOpen={isSubscribeModalOpen}
          onClose={() => setIsSubscribeModalOpen(false)}
          onSubscribe={addSubscription}
        />

      </div>
    </div>
  );
};

export default MqttAuditor;