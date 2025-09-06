// Generic polling service - can be reused
export class PollingService {
  private interval: NodeJS.Timeout | null = null;
  private isRunning = false;

  start(callback: () => Promise<void>, intervalMs: number): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.interval = setInterval(async () => {
      try {
        await callback();
      } catch (error) {
        // Errors handled by callback
      }
    }, intervalMs);
    
    // Initial call
    callback();
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.isRunning = false;
  }

  get active(): boolean {
    return this.isRunning;
  }
}