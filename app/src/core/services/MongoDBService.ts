// src/core/services/MongoDBService.ts
import { API_CONFIG } from '../api/config';

export class MongoDBService {
  /**
   * Check if the MongoDB connection is active via the API server
   * @returns Promise with connection status
   */
  static async checkConnection(): Promise<{ connected: boolean; message: string }> {
    try {
      console.log('Checking MongoDB connection at:', `${API_CONFIG.API_URL}/status`);
      
      const response = await fetch(`${API_CONFIG.API_URL}/status`);
      
      if (!response.ok) {
        throw new Error(`Failed to check connection status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('MongoDB connection status:', data.connected ? 'Connected' : 'Not connected');
      
      return data;
    } catch (error) {
      console.error('Error checking MongoDB connection:', error);
      return { 
        connected: false, 
        message: 'Error connecting to server' 
      };
    }
  }
}