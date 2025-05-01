// app/src/features/lanes/utils/LaneErrorHandler.ts

/**
 * Error types specific to lane data operations
 */
export enum LaneErrorType {
    FETCH_ERROR = 'FETCH_ERROR',
    PARSING_ERROR = 'PARSING_ERROR',
    CONNECTION_ERROR = 'CONNECTION_ERROR',
    INVALID_DATA_ERROR = 'INVALID_DATA_ERROR',
    UNKNOWN_ERROR = 'UNKNOWN_ERROR'
  }
  
  /**
   * Structured error object for lane operations
   */
  export interface LaneError {
    type: LaneErrorType;
    message: string;
    details?: any;
    timestamp: Date;
  }
  
  /**
   * Class to handle errors for lane data operations
   */
  export class LaneErrorHandler {
    
    /**
     * Create a structured error object from an error
     * @param error The error to process
     * @param type Specific error type
     * @returns Structured LaneError object
     */
    static createError(error: any, type?: LaneErrorType): LaneError {
      // Determine error type based on error message or instance if not specified
      let errorType = type || LaneErrorType.UNKNOWN_ERROR;
      
      if (!type) {
        if (error instanceof TypeError && error.message.includes('fetch')) {
          errorType = LaneErrorType.CONNECTION_ERROR;
        } else if (error instanceof SyntaxError || 
                  (error.message && error.message.includes('JSON'))) {
          errorType = LaneErrorType.PARSING_ERROR;
        } else if (error.message && error.message.includes('API error')) {
          errorType = LaneErrorType.FETCH_ERROR;
        }
      }
      
      // Create structured error object
      return {
        type: errorType,
        message: error.message || 'An unknown error occurred',
        details: error,
        timestamp: new Date()
      };
    }
    
    /**
     * Log an error with appropriate formatting and details
     * @param error The error to log
     */
    static logError(error: LaneError): void {
      console.error(`[LANE ERROR][${error.type}] ${error.message}`);
      
      // Log additional details if available
      if (error.details) {
        console.error('Error details:', error.details);
      }
      
      // Log error timestamp
      console.error(`Timestamp: ${error.timestamp.toISOString()}`);
    }
    
    /**
     * Get user-friendly message for an error
     * @param error The error to get a message for
     * @returns User-friendly error message
     */
    static getUserMessage(error: LaneError): string {
      switch (error.type) {
        case LaneErrorType.CONNECTION_ERROR:
          return 'Unable to connect to the server. Please check your internet connection.';
        
        case LaneErrorType.FETCH_ERROR:
          return 'Failed to fetch lane data from server. Please try again later.';
        
        case LaneErrorType.PARSING_ERROR:
          return 'There was a problem processing the lane data.';
        
        case LaneErrorType.INVALID_DATA_ERROR:
          return 'The lane data received is invalid or incomplete.';
        
        case LaneErrorType.UNKNOWN_ERROR:
        default:
          return 'An unexpected error occurred. Please try again later.';
      }
    }
    
    /**
     * Determine if an error should trigger a retry
     * @param error The error to check
     * @returns Boolean indicating if retry should be attempted
     */
    static shouldRetry(error: LaneError): boolean {
      // Retry for connection errors and fetch errors, but not for parsing or invalid data
      return error.type === LaneErrorType.CONNECTION_ERROR || 
             error.type === LaneErrorType.FETCH_ERROR;
    }
    
    /**
     * Calculate delay for retry with exponential backoff
     * @param retryCount Current retry attempt number
     * @param baseDelay Base delay in milliseconds
     * @returns Delay in milliseconds for next retry
     */
    static getRetryDelay(retryCount: number, baseDelay: number = 1000): number {
      return Math.min(
        Math.pow(2, retryCount) * baseDelay, // Exponential increase
        30000 // Maximum 30-second delay
      );
    }
  }