/**
 * Request logger middleware
 * Logs information about incoming requests and outgoing responses
 */
const requestLogger = (req, res, next) => {
    const start = Date.now();
    
    // Log request details
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    
    // Track response time
    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
      
      // Flag slow requests for optimization
      if (duration > 500) {
        console.warn(`⚠️ Slow request detected: ${req.method} ${req.originalUrl} took ${duration}ms`);
      }
    });
    
    next();
  };
  
  module.exports = requestLogger;