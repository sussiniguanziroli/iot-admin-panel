export const parsePayload = (rawPayload, config) => {
    const { 
      payloadParsingMode = 'simple', 
      dataKey = 'value', 
      jsonPath = '', 
      jsParserFunction = '', 
      fallbackValue = '--' 
    } = config;
  
    try {
      let payload;
      
      if (typeof rawPayload === 'string') {
        try {
          payload = JSON.parse(rawPayload);
        } catch (e) {
          payload = rawPayload;
        }
      } else {
        payload = rawPayload;
      }
  
      switch (payloadParsingMode) {
        case 'simple':
          if (typeof payload === 'object' && payload !== null) {
            const value = payload[dataKey];
            return value !== undefined ? value : fallbackValue;
          }
          return payload;
  
        case 'json-path':
          if (!jsonPath) return fallbackValue;
          return extractJsonPath(payload, jsonPath) ?? fallbackValue;
  
        case 'javascript':
          if (!jsParserFunction) return fallbackValue;
          return executeJsParser(payload, jsParserFunction) ?? fallbackValue;
  
        default:
          return fallbackValue;
      }
    } catch (error) {
      console.error('[PayloadParser] Error:', error);
      return fallbackValue;
    }
  };
  
  const extractJsonPath = (obj, path) => {
    if (!path || typeof obj !== 'object' || obj === null) return null;
    
    const segments = path.split('.');
    let current = obj;
  
    for (const segment of segments) {
      const arrayMatch = segment.match(/^(.+)\[(\d+)\]$/);
      
      if (arrayMatch) {
        const [, key, index] = arrayMatch;
        current = current?.[key]?.[parseInt(index)];
      } else {
        current = current?.[segment];
      }
  
      if (current === undefined || current === null) {
        return null;
      }
    }
  
    return current;
  };
  
  const executeJsParser = (payload, functionBody) => {
    try {
      const func = new Function('payload', functionBody);
      const result = func(payload);
      return result;
    } catch (error) {
      console.error('[PayloadParser] JS execution error:', error);
      return null;
    }
  };
  
  export const validateJsParser = (functionBody) => {
    try {
      new Function('payload', functionBody);
      return { valid: true, error: null };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  };