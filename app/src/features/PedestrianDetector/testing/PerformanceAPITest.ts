// // app/src/features/PedestrianDetector/testing/PerformanceAPITest.ts

// import { NetworkLatencyMeasurer } from '../services/NetworkLatencyMeasurer';
// import { PerformanceStats } from '../models/PerformanceModels';

// export class PerformanceAPITest {
//   private measurer: NetworkLatencyMeasurer;
  
//   constructor() {
//     this.measurer = new NetworkLatencyMeasurer();
//   }
  
//   /**
//    * Run basic Performance API test
//    */
//   async runBasicTest(): Promise<void> {
//     console.log('🧪 Starting Performance API Network Test...');
    
//     const apiUrl = 'http://10.199.1.11:9095/latest/sdsm_events';
    
//     try {
//       // Single measurement
//       const { data, metrics } = await this.measurer.measureAPICall(apiUrl);
      
//       console.log('\n✅ Basic Test Complete');
//       console.log(`📊 Result: ${metrics.totalRequestTime.toFixed(2)}ms total`);
      
//       // Check if we have pedestrian data
//       const pedestrianCount = data?.objects?.filter((obj: any) => obj.type === 'vru').length || 0;
//       console.log(`🚶 Pedestrians detected: ${pedestrianCount}`);
      
//     } catch (error) {
//       console.error('❌ Basic test failed:', error);
//     }
//   }
  
//   /**
//    * Run multiple measurements for statistical analysis
//    */
//   async runStatisticalTest(measurementCount: number = 10): Promise<void> {
//     console.log(`🧪 Running ${measurementCount} measurements for statistical analysis...`);
    
//     const apiUrl = 'http://10.199.1.11:9095/latest/sdsm_events';
    
//     for (let i = 0; i < measurementCount; i++) {
//       try {
//         await this.measurer.measureAPICall(apiUrl);
//         console.log(`   Measurement ${i + 1}/${measurementCount} complete`);
        
//         // Wait between measurements
//         await new Promise(resolve => setTimeout(resolve, 1000));
        
//       } catch (error) {
//         console.warn(`   Measurement ${i + 1} failed:`, error);
//       }
//     }
    
//     // Generate statistics
//     const stats = this.measurer.getPerformanceStats();
//     this.logStatistics(stats);
//   }
  
//   /**
//    * Log statistical results
//    */
//   private logStatistics(stats: PerformanceStats): void {
//     console.log('\n📈 STATISTICAL RESULTS:');
//     console.log('┌─────────────────────────────────────────┐');
//     console.log(`│ Total Measurements: ${stats.totalMeasurements}`.padEnd(40) + '│');
//     console.log(`│ Average Total Time: ${stats.averages.totalTime.toFixed(2)}ms`.padEnd(40) + '│');
//     console.log(`│ Average TTFB: ${stats.averages.timeToFirstByte.toFixed(2)}ms`.padEnd(40) + '│');
//     console.log(`│ Average Download: ${stats.averages.downloadTime.toFixed(2)}ms`.padEnd(40) + '│');
//     console.log(`│ Average Parse: ${stats.averages.parseTime.toFixed(2)}ms`.padEnd(40) + '│');
//     console.log('├─────────────────────────────────────────┤');
//     console.log(`│ 50th Percentile: ${stats.percentiles.p50.toFixed(2)}ms`.padEnd(40) + '│');
//     console.log(`│ 95th Percentile: ${stats.percentiles.p95.toFixed(2)}ms`.padEnd(40) + '│');
//     console.log(`│ 99th Percentile: ${stats.percentiles.p99.toFixed(2)}ms`.padEnd(40) + '│');
//     console.log('└─────────────────────────────────────────┘');
//   }
  
//   /**
//    * Export data for TRB paper
//    */
//   exportResults(): string {
//     return this.measurer.exportToCSV();
//   }
  
//   /**
//    * Get current statistics
//    */
//   getStats(): PerformanceStats {
//     return this.measurer.getPerformanceStats();
//   }
  
//   /**
//    * Clear all measurements
//    */
//   clearResults(): void {
//     this.measurer.clearMeasurements();
//   }
// }