// app/src/features/SpatService/errorHandling/SpatErrorHandler.ts
// Centralized error handling for SPaT operations

export class SpatErrorHandler {
  
  /**
   * Create standardized API error
   */
  public static createApiError(status: number, statusText: string): Error {
    return new Error(`SPaT API Error: ${status} ${statusText}`);
  }
  
  /**
   * Handle API-related errors
   */
  public static handleApiError(error: unknown): Error {
    if (error instanceof Error && error.name === 'AbortError') {
      return new Error('SPaT API request timeout');
    }
    
    if (error instanceof Error) {
      return new Error(`SPaT fetch failed: ${error.message}`);
    }
    
    return new Error('SPaT fetch failed: Unknown error');
  }
  
  /**
   * Handle initialization errors
   */
  public static handleInitializationError(error: unknown): Error {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Error(`SPaT initialization failed: ${message}`);
  }
  
  /**
   * Handle monitoring errors
   */
  public static handleMonitoringError(error: unknown): Error {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Error(`SPaT monitoring failed: ${message}`);
  }
  
  /**
   * Extract error message safely
   */
  public static getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    return 'Unknown error occurred';
  }
  
  /**
   * Log error with context
   */
  public static logError(context: string, error: unknown): void {
    const message = this.getErrorMessage(error);
    console.error(`🚨 SPaT Error [${context}]:`, message);
  }
  
  /**
   * Check if error is timeout related
   */
  public static isTimeoutError(error: unknown): boolean {
    return error instanceof Error && 
           (error.name === 'AbortError' || error.message.includes('timeout'));
  }
  
  /**
   * Check if error is network related
   */
  public static isNetworkError(error: unknown): boolean {
    return error instanceof Error && 
           (error.message.includes('fetch') || 
            error.message.includes('network') ||
            error.message.includes('connection'));
  }
}