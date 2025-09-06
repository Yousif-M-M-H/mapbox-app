import { SDSMResponse } from "../models/SDSMTypes";

// ONLY handles HTTP requests - no business logic
export class SDSMApiClient {
  private static readonly BASE_URL = 'http://roadaware.cuip.research.utc.edu/cv2x/latest/sdsm_events';
  private static readonly TIMEOUT = 3000;

  static async fetchData(): Promise<SDSMResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT);
    
    try {
      const response = await fetch(this.BASE_URL, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: controller.signal,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      return await response.json();
    } finally {
      clearTimeout(timeoutId);
    }
  }
}