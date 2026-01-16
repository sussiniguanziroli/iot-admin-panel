import { useState, useCallback } from 'react';

export const useTopicMessages = (activeTopic) => {
  const [isPaused, setIsPaused] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);

  const togglePause = useCallback(() => {
    setIsPaused(prev => !prev);
  }, []);

  const toggleAutoScroll = useCallback(() => {
    setAutoScroll(prev => !prev);
  }, []);

  const messages = isPaused 
    ? activeTopic?.messages.slice() 
    : activeTopic?.messages || [];

  return {
    messages,
    isPaused,
    autoScroll,
    togglePause,
    toggleAutoScroll
  };
};