// app/src/features/SDSM/SDSMObjectTracker.ts

import RNFS from 'react-native-fs';

/**
 * SDSM Object Tracker
 * Tracks CV2X objects from the API for 1 minute and generates a CSV log
 */

interface SDSMObject {
  objectID: number;
  type: 'vehicle' | 'vru';
  timestamp: string;
  location: {
    type: string;
    coordinates: [number, number];
  };
}

interface SDSMResponse {
  intersectionID: string;
  intersection: string;
  timestamp: string;
  objects: SDSMObject[];
}

interface TrackedObject {
  objectId: number;
  firstSeenTimestamp: string;
  overlayTimestamp?: string;
}

class SDSMObjectTracker {
  private readonly API_URL = 'http://roadaware.cuip.research.utc.edu/cv2x/latest/sdsm_events/MLK_Georgia';
  private readonly TRACKING_DURATION_MS = 60000; // 1 minute
  private readonly POLL_INTERVAL_MS = 1000; // Poll every second
  
  private trackedObjects: Map<number, TrackedObject> = new Map();
  private isTracking = false;
  private pollIntervalId: NodeJS.Timeout | null = null;
  
  /**
   * Start the 1-minute tracking session
   */
  public startTracking(): void {
    if (this.isTracking) {
      console.log('[SDSMTracker] Already tracking');
      return;
    }
    
    console.log('[SDSMTracker] Starting 60-second tracking session');
    this.isTracking = true;
    this.trackedObjects.clear();
    
    // Start polling the API every second
    this.pollIntervalId = setInterval(() => {
      this.pollAPI();
    }, this.POLL_INTERVAL_MS);
    
    // End tracking after 1 minute
    setTimeout(() => {
      this.endTracking();
    }, this.TRACKING_DURATION_MS);
  }
  
  /**
   * Record when an object is overlaid in the UI
   * Call this from your UI layer when displaying an object
   */
  public recordOverlayEvent(objectId: number): void {
    const tracked = this.trackedObjects.get(objectId);
    
    if (!tracked) {
      console.log(`[SDSMTracker] ⚠️ Overlay event for unknown object ${objectId}`);
      return;
    }
    
    // Only record first overlay
    if (!tracked.overlayTimestamp) {
      tracked.overlayTimestamp = this.formatTimestamp(new Date());
      console.log(`[SDSMTracker] 🎨 Overlay recorded for object ${objectId}`);
    }
  }
  
  /**
   * Poll the API and track new objects
   */
  private async pollAPI(): Promise<void> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      
      const response = await fetch(this.API_URL, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        console.log(`[SDSMTracker]  API error: ${response.status}`);
        return;
      }
      
      const data: SDSMResponse = await response.json();
      this.processAPIResponse(data);
      
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.log('[SDSMTracker]  Poll error:', error.message);
      }
    }
  }
  
  /**
   * Process API response and track new objects
   */
  private processAPIResponse(data: SDSMResponse): void {
    if (!data?.objects || !Array.isArray(data.objects)) {
      return;
    }
    
    const currentTimestamp = this.formatTimestamp(new Date());
    
    for (const obj of data.objects) {
      const objectId = obj.objectID;
      
      // Skip already tracked objects
      if (this.trackedObjects.has(objectId)) {
        continue;
      }
      
      // Track new object
      this.trackedObjects.set(objectId, {
        objectId,
        firstSeenTimestamp: currentTimestamp,
      });
      
      console.log(`[SDSMTracker]  New object: ${objectId} at ${currentTimestamp}`);
    }
  }
  
  /**
   * End tracking and generate CSV
   */
  private async endTracking(): Promise<void> {
    console.log('[SDSMTracker]  Session ended, generating CSV...');
    
    // Stop polling
    if (this.pollIntervalId) {
      clearInterval(this.pollIntervalId);
      this.pollIntervalId = null;
    }
    
    this.isTracking = false;
    
    // Generate and save CSV
    await this.generateCSV();
  }
  
  /**
   * Generate CSV file from tracked data
   */
  private async generateCSV(): Promise<void> {
    try {
      const csvRows: string[] = [];
      
      // CSV Header
      csvRows.push('object_id,first_seen_api_timestamp,overlay_timestamp');
      
      // Data rows
      for (const tracked of this.trackedObjects.values()) {
        const overlayTime = tracked.overlayTimestamp || '';
        csvRows.push(`${tracked.objectId},${tracked.firstSeenTimestamp},${overlayTime}`);
      }
      
      const csvContent = csvRows.join('\n');
      const filePath = `${RNFS.DocumentDirectoryPath}/sdsms_log.csv`;
      
      await RNFS.writeFile(filePath, csvContent, 'utf8');
      
      // Summary
      const overlaidCount = Array.from(this.trackedObjects.values())
        .filter(obj => obj.overlayTimestamp).length;
      
      console.log('[SDSMTracker] CSV saved to:', filePath);
      console.log(`[SDSMTracker]  Stats: ${this.trackedObjects.size} objects tracked, ${overlaidCount} overlaid`);
      
    } catch (error) {
      console.error('[SDSMTracker]  CSV generation failed:', error);
    }
  }
  
  /**
   * Format timestamp as YYYY-MM-DD HH:mm:ss
   */
  private formatTimestamp(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }
  
  /**
   * Get tracking status
   */
  public isCurrentlyTracking(): boolean {
    return this.isTracking;
  }
  
  /**
   * Get tracked object count
   */
  public getTrackedCount(): number {
    return this.trackedObjects.size;
  }
}

// Singleton instance
const tracker = new SDSMObjectTracker();

/**
 * Start the SDSM tracking session (runs for 1 minute)
 * Call this once when you want to begin tracking
 */
export const startTracking = (): void => {
  tracker.startTracking();
};

/**
 * Record when an object is overlaid/displayed in the UI
 * Call this whenever an SDSM object appears on the map
 * 
 * @param objectId - The objectID from the SDSM API response
 */
export const recordOverlayEvent = (objectId: number): void => {
  tracker.recordOverlayEvent(objectId);
};

/**
 * Check if tracking is currently active
 */
export const isTracking = (): boolean => {
  return tracker.isCurrentlyTracking();
};

/**
 * Get the current count of tracked objects
 */
export const getTrackedObjectCount = (): number => {
  return tracker.getTrackedCount();
};