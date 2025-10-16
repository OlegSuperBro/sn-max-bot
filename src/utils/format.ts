export default function format(template: string, replacements?: Record<string, any>): string {
  if (!replacements) {
    return template;
  }

  const seen = new WeakSet();
  
  function safeStringify(value: any): string {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';

    if (typeof value === 'function') return '[function]';
    
    // Handle primitive types
    if (typeof value !== 'object') {
      return String(value);
    }
    
    // Handle Date
    if (value instanceof Date) {
      return value.toISOString();
    }
    
    // Handle circular references
    if (seen.has(value)) {
      return '[Circular]';
    }
    
    seen.add(value);
    
    try {
      if (Array.isArray(value)) {
        const items = value.map(item => safeStringify(item));
        seen.delete(value); // Clean up after processing
        return `[${items.join(', ')}]`;
      } else {
        // Handle regular objects
        const entries = Object.entries(value)
          .map(([key, val]) => `"${key}": ${safeStringify(val)}`)
          .join(', ');
        seen.delete(value); // Clean up after processing
        return `{${entries}}`;
      }
    } catch (error) {
      seen.delete(value);
      return '[Object]';
    }
  }
  
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    if (replacements[key] === undefined) {
      return match; // Keep original placeholder if not found
    }
    
    return safeStringify(replacements[key]);
  });
}