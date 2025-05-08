// app/src/features/PedestrianDetector/services/PedestrianWarningService.ts

import { PedestrianAlert } from '../models/PedestrianDetection';

export class PedestrianWarningService {
  /**
   * Log a warning about pedestrians in the crosswalk
   */
  static logPedestrianWarning(pedestrianCount: number): void {
    console.warn(`⚠️ WARNING: ${pedestrianCount} pedestrian(s) detected in crosswalk!`);
  }

  /**
   * Log a detailed alert with additional information
   */
  static logDetailedAlert(alert: PedestrianAlert): void {
    console.warn(`
      ⚠️ PEDESTRIAN ALERT
      -------------------------------------
      Time: ${new Date(alert.timestamp).toLocaleTimeString()}
      Pedestrians in crosswalk: ${alert.pedestrianCount}
      Vehicle approaching: ${alert.isVehicleApproaching ? 'YES' : 'NO'}
      -------------------------------------
    `);
  }
}