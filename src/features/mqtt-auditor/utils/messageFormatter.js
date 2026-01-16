export const formatPayload = (payload) => {
    if (typeof payload === 'object') {
      return JSON.stringify(payload, null, 2);
    }
  
    try {
      const parsed = JSON.parse(payload);
      return JSON.stringify(parsed, null, 2);
    } catch (e) {
      return String(payload);
    }
  };
  
  export const getPayloadType = (payload) => {
    if (typeof payload === 'object') return 'json';
    
    try {
      JSON.parse(payload);
      return 'json';
    } catch (e) {
      if (!isNaN(payload)) return 'number';
      if (payload === 'true' || payload === 'false') return 'boolean';
      return 'text';
    }
  };
  
  export const formatBytes = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };
  
  export const getTopicColor = (topic) => {
    const hash = topic.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    
    const colors = [
      'text-blue-600',
      'text-emerald-600',
      'text-purple-600',
      'text-orange-600',
      'text-pink-600',
      'text-cyan-600'
    ];
    
    return colors[Math.abs(hash) % colors.length];
  };