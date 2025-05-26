// // app/src/features/PedestrianDetector/tests/FixedCoordinateTest.ts
// import { distanceBetweenPoints } from '../utils/GeoUtils';

// // Fixed test coordinates
// const FIXED_PEDESTRIAN: [number, number] = [35.03979193995403, -85.29215324170788]; // [lat, lon]
// const FIXED_VEHICLE: [number, number] = [35.03974477701662, -85.29200021221868]; // [lat, lon]

// // Warning threshold distance (in coordinate units, approximately 10 meters)
// const WARNING_THRESHOLD = 0.0001;

// /**
//  * Simple function to run the proximity test with fixed coordinates
//  */
// export function runFixedCoordinateTest() {
//   console.log("\n=== FIXED COORDINATE TEST ===");
//   console.log(`🚶 Pedestrian at: [${FIXED_PEDESTRIAN[0]}, ${FIXED_PEDESTRIAN[1]}]`);
//   console.log(`🚗 Vehicle at: [${FIXED_VEHICLE[0]}, ${FIXED_VEHICLE[1]}]`);
  
//   // Calculate distance
//   const distance = distanceBetweenPoints(
//     FIXED_PEDESTRIAN[0], FIXED_PEDESTRIAN[1],
//     FIXED_VEHICLE[0], FIXED_VEHICLE[1]
//   );
  
//   // Convert to approximate meters (very rough approximation)
//   const distanceInMeters = distance * 100000;
  
//   console.log(`📏 Distance: ${distanceInMeters.toFixed(2)} meters`);
  
//   // Check if warning should be triggered
//   const isInWarningRange = distance < WARNING_THRESHOLD;
  
//   if (isInWarningRange) {
//     console.log("🔴 WARNING! Pedestrian and vehicle are within 10 meters of each other!");
//   } else {
//     console.log("✅ No warning needed. Pedestrian and vehicle are separated by more than 10 meters.");
//   }
  
//   console.log("=== TEST COMPLETE ===\n");
  
//   return {
//     distance: distanceInMeters,
//     isInWarningRange
//   };
// }