/**
 * Utility to sanitize Redis URLs for logging
 * Removes passwords and sensitive information from Redis connection strings
 */

/**
 * Sanitize a Redis URL by masking the password
 * Example: redis://user:password@host:port -> redis://user:***@host:port
 */
export function sanitizeRedisUrl(url: string | undefined | null): string {
  if (!url) {
    return "***";
  }

  try {
    // Try to parse the URL
    const urlObj = new URL(url);
    
    // If there's a password, mask it
    if (urlObj.password) {
      urlObj.password = "***";
    }
    
    // If there's a username with password, mask password
    // Reconstruct the URL with masked password
    const protocol = urlObj.protocol;
    const hostname = urlObj.hostname;
    const port = urlObj.port;
    const username = urlObj.username;
    
    if (username && urlObj.password) {
      return `${protocol}//${username}:***@${hostname}${port ? `:${port}` : ""}`;
    } else if (username) {
      return `${protocol}//${username}@${hostname}${port ? `:${port}` : ""}`;
    } else {
      return `${protocol}//${hostname}${port ? `:${port}` : ""}`;
    }
  } catch (error) {
    // If URL parsing fails (e.g., due to special characters), 
    // try to mask password using regex
    // Pattern: redis://username:password@host:port
    const masked = url.replace(
      /(redis:\/\/[^:]+:)([^@]+)(@.+)/,
      (match, prefix, password, suffix) => {
        return `${prefix}***${suffix}`;
      }
    );
    
    // If regex didn't match, return a generic masked version
    if (masked === url) {
      // Just show protocol and host if we can't parse it
      const protocolMatch = url.match(/^(rediss?:\/\/)/);
      if (protocolMatch) {
        return `${protocolMatch[1]}***`;
      }
      return "***";
    }
    
    return masked;
  }
}

/**
 * Sanitize connection object for logging
 */
export function sanitizeRedisConnection(connection: any): any {
  if (!connection) {
    return connection;
  }

  const sanitized = { ...connection };
  
  if (sanitized.password) {
    sanitized.password = "***";
  }
  
  if (sanitized.url) {
    sanitized.url = sanitizeRedisUrl(sanitized.url);
  }
  
  return sanitized;
}

