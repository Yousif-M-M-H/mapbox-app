// app/src/features/SpatService/services/SpatOfflineService.ts
// Simple offline SPaT data service using SQLite

import * as SQLite from 'expo-sqlite';

export interface OfflineSpatFrame {
  id: number;
  timestamp: string;
  data: string; // JSON string of SPaT data
}

export class SpatOfflineService {
  private static db: SQLite.SQLiteDatabase | null = null;
  private static currentFrameIndex: number = 0;
  private static totalFrames: number = 0;
  
  /**
   * Initialize the offline database
   */
  static async initialize(): Promise<void> {
    try {
      this.db = await SQLite.openDatabaseAsync('spat_offline.db');
      
      // Get total frame count
      const result = await this.db.getFirstAsync('SELECT COUNT(*) as count FROM frames');
      this.totalFrames = (result as any)?.count || 0;
      
      console.log(`📊 SPaT Offline: ${this.totalFrames} frames available`);
    } catch (error) {
      console.error('❌ SPaT Offline: Failed to initialize database:', error);
      throw error;
    }
  }
  
  /**
   * Get next SPaT frame (cycles through available frames)
   */
  static async getNextFrame(): Promise<any> {
    if (!this.db) {
      await this.initialize();
    }
    
    if (this.totalFrames === 0) {
      throw new Error('No offline SPaT frames available');
    }
    
    try {
      // Get frame by cycling through available data
      const frameNumber = (this.currentFrameIndex % this.totalFrames) + 1;
      
      const frame = await this.db!.getFirstAsync(
        'SELECT * FROM frames WHERE id = ? LIMIT 1',
        [frameNumber]
      ) as OfflineSpatFrame | null;
      
      if (!frame) {
        throw new Error(`Frame ${frameNumber} not found`);
      }
      
      // Parse the stored JSON data
      const spatData = JSON.parse(frame.data);
      
      // Update timestamp to current time for realistic simulation
      spatData.timestamp = Date.now();
      
      // Move to next frame for next call
      this.currentFrameIndex = (this.currentFrameIndex + 1) % this.totalFrames;
      
      return spatData;
      
    } catch (error) {
      console.error('❌ SPaT Offline: Failed to get frame:', error);
      throw error;
    }
  }
  
  /**
   * Check if offline data is available
   */
  static async isAvailable(): Promise<boolean> {
    try {
      if (!this.db) {
        await this.initialize();
      }
      return this.totalFrames > 0;
    } catch {
      return false;
    }
  }
  
  /**
   * Reset frame cycling to start from beginning
   */
  static resetCycle(): void {
    this.currentFrameIndex = 0;
  }
}