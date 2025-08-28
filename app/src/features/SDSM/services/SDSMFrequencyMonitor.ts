// app/src/features/SDSM/services/SDSMFrequencyMonitor.ts

interface SecondlyCount {
  timestamp: string;
  second: number;
  sdsmObjectsReceived: number;
  vehiclesReceived: number;
  vrusReceived: number;
  vehiclesDisplayed: number;
}

interface FrequencyStats {
  totalSDSMObjects: number;
  totalVehiclesReceived: number;
  totalVRUsReceived: number;
  totalVehiclesDisplayed: number;
  averageSDSMPerSecond: number;
  averageVehiclesReceivedPerSecond: number;
  averageVehiclesDisplayedPerSecond: number;
  peakSDSMSecond: SecondlyCount;
  peakVehicleSecond: SecondlyCount;
  secondlyBreakdown: SecondlyCount[];
}

export class SDSMFrequencyMonitor {
  private static instance: SDSMFrequencyMonitor | null = null;
  private isMonitoring: boolean = false;
  private monitoringStartTime: number;
  private currentSecond: number = 0;
  
  // Per-second tracking arrays (60 seconds)
  private secondlyData: SecondlyCount[] = [];
  private currentSecondSDSMCount: number = 0;
  private currentSecondVehicleAPICount: number = 0;
  private currentSecondVRUAPICount: number = 0;
  private currentSecondVehicleDisplayCount: number = 0;
  
  // Timers
  private secondTimer: NodeJS.Timeout | null = null;
  private minuteTimer: NodeJS.Timeout | null = null;

  private constructor() {
    this.monitoringStartTime = performance.now();
    this.initializeSecondlyData();
  }

  public static getInstance(): SDSMFrequencyMonitor {
    if (!SDSMFrequencyMonitor.instance) {
      SDSMFrequencyMonitor.instance = new SDSMFrequencyMonitor();
    }
    return SDSMFrequencyMonitor.instance;
  }

  /**
   * Initialize 60 seconds worth of data slots
   */
  private initializeSecondlyData(): void {
    this.secondlyData = [];
    for (let i = 0; i < 60; i++) {
      this.secondlyData.push({
        timestamp: new Date().toISOString(),
        second: i,
        sdsmObjectsReceived: 0,
        vehiclesDisplayed: 0
      });
    }
  }

  /**
   * Start frequency monitoring with automatic timers
   */
  public startMonitoring(): void {
    if (this.isMonitoring) {
      return;
    }

    this.isMonitoring = true;
    this.monitoringStartTime = performance.now();
    this.currentSecond = 0;
    this.currentSecondSDSMCount = 0;
    this.currentSecondVehicleCount = 0;

    // Removed startup logs to reduce noise
    
    // Set up per-second counter reset
    this.secondTimer = setInterval(() => {
      this.processSecondComplete();
    }, 1000);

    // Set up one-minute analysis timer
    this.minuteTimer = setTimeout(() => {
      this.logFrequencyAnalysis();
      this.resetMonitoring();
    }, 60000);
  }

  /**
   * Record an SDSM object being received
   */
  public recordSDSMObjectReceived(objectId: number, objectType: 'vru' | 'vehicle'): void {
    if (!this.isMonitoring) return;
    
    this.currentSecondSDSMCount++;
    
    // Track vehicles and VRUs separately  
    if (objectType === 'vehicle') {
      this.currentSecondVehicleAPICount++;
    } else if (objectType === 'vru') {
      this.currentSecondVRUAPICount++;
    }
    
    // Log for verification
  }

  /**
   * Record a vehicle being displayed on the UI
   */
  public recordVehicleDisplayed(vehicleId: number): void {
    if (!this.isMonitoring) return;
    
    this.currentSecondVehicleDisplayCount++;
    
    // Log for verification
  }

  /**
   * Process completion of current second and move to next
   */
  private processSecondComplete(): void {
    if (!this.isMonitoring || this.currentSecond >= 60) return;

    // Update the current second's data
    this.secondlyData[this.currentSecond] = {
      timestamp: new Date().toISOString(),
      second: this.currentSecond + 1,
      sdsmObjectsReceived: this.currentSecondSDSMCount,
      vehiclesDisplayed: this.currentSecondVehicleCount
    };

    // Removed per-second progress logs to reduce noise

    // Reset counters for next second
    this.currentSecondSDSMCount = 0;
    this.currentSecondVehicleCount = 0;
    this.currentSecond++;
  }

  /**
   * Calculate comprehensive frequency statistics
   */
  private calculateFrequencyStats(): FrequencyStats {
    const totalSDSM = this.secondlyData.reduce((sum, data) => sum + data.sdsmObjectsReceived, 0);
    const totalVehicles = this.secondlyData.reduce((sum, data) => sum + data.vehiclesDisplayed, 0);
    
    const peakSDSMSecond = this.secondlyData.reduce((peak, current) => 
      current.sdsmObjectsReceived > peak.sdsmObjectsReceived ? current : peak
    );
    
    const peakVehicleSecond = this.secondlyData.reduce((peak, current) => 
      current.vehiclesDisplayed > peak.vehiclesDisplayed ? current : peak
    );

    return {
      totalSDSMObjects: totalSDSM,
      totalVehiclesDisplayed: totalVehicles,
      averageSDSMPerSecond: totalSDSM / 60,
      averageVehiclesPerSecond: totalVehicles / 60,
      peakSDSMSecond,
      peakVehicleSecond,
      secondlyBreakdown: [...this.secondlyData]
    };
  }

  /**
   * Log comprehensive frequency analysis after one minute
   */
  private logFrequencyAnalysis(): void {
    const stats = this.calculateFrequencyStats();
    


    
  }

  /**
   * Reset monitoring for potential restart
   */
  private resetMonitoring(): void {
    this.isMonitoring = false;
    this.currentSecond = 0;
    this.currentSecondSDSMCount = 0;
    this.currentSecondVehicleCount = 0;
    
    if (this.secondTimer) {
      clearInterval(this.secondTimer);
      this.secondTimer = null;
    }
    
    if (this.minuteTimer) {
      clearTimeout(this.minuteTimer);
      this.minuteTimer = null;
    }

    this.initializeSecondlyData();
    
    // Removed reset log to reduce noise
  }

  /**
   * Stop monitoring manually if needed
   */
  public stopMonitoring(): void {
    if (!this.isMonitoring) return;
    
    // Removed manual stop log to reduce noise
    
    this.logFrequencyAnalysis();
    this.resetMonitoring();
  }

  /**
   * Get current monitoring status
   */
  public isCurrentlyMonitoring(): boolean {
    return this.isMonitoring;
  }

  /**
   * Get current monitoring progress
   */
  public getMonitoringProgress(): { currentSecond: number; isActive: boolean } {
    return {
      currentSecond: this.currentSecond + 1,
      isActive: this.isMonitoring
    };
  }
}