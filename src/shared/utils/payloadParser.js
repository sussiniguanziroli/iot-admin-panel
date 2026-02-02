export const parsePayload = (payload, config) => {
    const {
      payloadParsingMode = 'simple',
      dataKey = 'value',
      jsonPath = '',
      jsParserFunction = '',
      fallbackValue = '--'
    } = config;
  
    try {
      if (payloadParsingMode === 'simple') {
        const parsed = JSON.parse(payload);
        
        if (dataKey.includes('.')) {
          const keys = dataKey.split('.');
          let value = parsed;
          for (const key of keys) {
            if (value && value[key] !== undefined) {
              value = value[key];
            } else {
              return fallbackValue;
            }
          }
          return value;
        }
        
        return parsed[dataKey] !== undefined ? parsed[dataKey] : fallbackValue;
      }
  
      if (payloadParsingMode === 'jsonpath' || payloadParsingMode === 'json-path') {
        const parsed = JSON.parse(payload);
        const path = jsonPath || dataKey;
        
        if (path.includes('.')) {
          const keys = path.split('.');
          let value = parsed;
          for (const key of keys) {
            if (value && value[key] !== undefined) {
              value = value[key];
            } else {
              return fallbackValue;
            }
          }
          return value;
        }
        
        return parsed[path] !== undefined ? parsed[path] : fallbackValue;
      }
  
      if (payloadParsingMode === 'js' || payloadParsingMode === 'javascript') {
        if (!jsParserFunction) {
          return fallbackValue;
        }
        
        try {
          const func = new Function('payload', jsParserFunction);
          const parsedPayload = JSON.parse(payload);
          return func(parsedPayload);
        } catch (e) {
          console.error('[payloadParser] JS execution error:', e);
          return fallbackValue;
        }
      }
  
      return fallbackValue;
  
    } catch (error) {
      console.error('[payloadParser] Error:', error);
      
      const raw = payload.toString().trim();
      if (!isNaN(raw) && raw !== '') {
        return parseFloat(raw);
      }
      
      return fallbackValue;
    }
  };
  
  export const validateJsParser = (jsCode) => {
    if (!jsCode || typeof jsCode !== 'string') {
      return { valid: false, error: 'Code is required' };
    }
  
    try {
      new Function('payload', jsCode);
      return { valid: true, error: null };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  };