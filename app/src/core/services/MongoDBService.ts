// src/core/services/MongoDBService.ts
import { API_CONFIG } from '../api/config';

export class MongoDBService {
  /**
   * Check if the MongoDB connection is active
   * @returns Promise with connection status
   */
  static async checkConnection(): Promise<{ connected: boolean; message: string }> {
    console.log('Checking MongoDB connection at:', `${API_CONFIG.SERVER_URL}/api/status`);
    
    try {
      const response = await fetch(`${API_CONFIG.API_URL}/status`);
      
      if (!response.ok) {
        console.log('MongoDB connection failed:', response.status, response.statusText);
        throw new Error('Failed to check connection status');
      }
      
      const data = await response.json();
      console.log('MongoDB connection status:', data);
      return data;
    } catch (error) {
      console.error('Error checking MongoDB connection:', error);
      return { 
        connected: false, 
        message: 'Error connecting to MongoDB server' 
      };
    }
  }
}