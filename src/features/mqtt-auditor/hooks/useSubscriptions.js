import { useState, useEffect, useCallback, useRef } from 'react';
import { useMqtt } from '../../mqtt/context/MqttContext';

export const useSubscriptions = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [activeTopicId, setActiveTopicId] = useState(null);
  const { subscribeToTopic, unsubscribeFromTopic, lastMessage } = useMqtt();
  const subscribedTopicsRef = useRef(new Set());

  const addSubscription = useCallback((topic, qos = 0, setAsActive = true) => {
    if (!topic.trim()) {
      return { success: false, error: 'Topic cannot be empty' };
    }

    if (topic === '#') {
      return { success: false, error: 'Universal wildcard "#" alone is not allowed by most public brokers' };
    }

    if (subscribedTopicsRef.current.has(topic)) {
      return { success: false, error: 'Already subscribed to this topic' };
    }

    const newSub = {
      id: `sub-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      topic,
      qos,
      messageCount: 0,
      messages: [],
      subscribedAt: new Date(),
      lastMessageAt: null
    };

    try {
      subscribeToTopic(topic);
      subscribedTopicsRef.current.add(topic);
      setSubscriptions(prev => [...prev, newSub]);
      
      if (setAsActive) {
        setActiveTopicId(newSub.id);
      }
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, [subscribeToTopic]);

  const removeSubscription = useCallback((id) => {
    const sub = subscriptions.find(s => s.id === id);
    if (sub) {
      try {
        unsubscribeFromTopic(sub.topic);
        subscribedTopicsRef.current.delete(sub.topic);
        setSubscriptions(prev => prev.filter(s => s.id !== id));
        if (activeTopicId === id) {
          setActiveTopicId(null);
        }
      } catch (error) {
        console.error('Error unsubscribing:', error);
      }
    }
  }, [subscriptions, activeTopicId, unsubscribeFromTopic]);

  const clearMessages = useCallback((id) => {
    setSubscriptions(prev => prev.map(sub => 
      sub.id === id ? { ...sub, messages: [], messageCount: 0 } : sub
    ));
  }, []);

  const addLocalMessage = useCallback((topic, payload, isSentByMe = false) => {
    const newMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      topic,
      payload,
      timestamp: new Date(),
      qos: 0,
      isSentByMe
    };

    setSubscriptions(prev => prev.map(sub => {
      if (sub.topic === topic) {
        const updatedMessages = [newMessage, ...sub.messages].slice(0, 100);
        return {
          ...sub,
          messages: updatedMessages,
          messageCount: sub.messageCount + 1,
          lastMessageAt: new Date()
        };
      }
      return sub;
    }));

    return newMessage;
  }, []);

  const matchesMqttPattern = (pattern, topic) => {
    if (pattern === topic) return true;

    const patternParts = pattern.split('/');
    const topicParts = topic.split('/');

    if (pattern.includes('#')) {
      for (let i = 0; i < patternParts.length; i++) {
        if (patternParts[i] === '#') {
          return true;
        }
        if (patternParts[i] === '+') {
          continue;
        }
        if (patternParts[i] !== topicParts[i]) {
          return false;
        }
      }
      return true;
    }

    if (patternParts.length !== topicParts.length) {
      return false;
    }

    for (let i = 0; i < patternParts.length; i++) {
      if (patternParts[i] === '+') {
        continue;
      }
      if (patternParts[i] !== topicParts[i]) {
        return false;
      }
    }

    return true;
  };

  useEffect(() => {
    if (!lastMessage) return;

    console.log('[MQTT Auditor] Message received:', {
      topic: lastMessage.topic,
      payload: lastMessage.payload,
      timestamp: lastMessage.timestamp
    });

    let messageProcessed = false;

    setSubscriptions(prev => {
      const updated = prev.map(sub => {
        if (matchesMqttPattern(sub.topic, lastMessage.topic)) {
          console.log(`[MQTT Auditor] Matched subscription: ${sub.topic}`);
          messageProcessed = true;

          const newMessage = {
            id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            topic: lastMessage.topic,
            payload: lastMessage.payload,
            timestamp: lastMessage.timestamp || new Date(),
            qos: lastMessage.qos || 0,
            isSentByMe: false
          };

          const updatedMessages = [newMessage, ...sub.messages].slice(0, 100);

          return {
            ...sub,
            messages: updatedMessages,
            messageCount: sub.messageCount + 1,
            lastMessageAt: new Date()
          };
        }
        return sub;
      });

      if (!messageProcessed) {
        console.log('[MQTT Auditor] No matching subscription for:', lastMessage.topic);
      }

      return updated;
    });
  }, [lastMessage]);

  const activeTopic = subscriptions.find(s => s.id === activeTopicId);

  return {
    subscriptions,
    activeTopic,
    activeTopicId,
    setActiveTopicId,
    addSubscription,
    removeSubscription,
    clearMessages,
    addLocalMessage
  };
};