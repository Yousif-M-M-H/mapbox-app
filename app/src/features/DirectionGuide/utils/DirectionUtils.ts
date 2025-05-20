import { ApproachDirection } from '../models/DirectionTypes';

/**
 * Calculates the heading (bearing) between two lat/lng points in degrees
 * @param startLat Starting latitude
 * @param startLng Starting longitude
 * @param endLat Ending latitude
 * @param endLng Ending longitude
 * @returns Heading in degrees (0-360, where 0 is North)
 */
export const calculateHeading = (
  startLat: number, 
  startLng: number, 
  endLat: number, 
  endLng: number
): number => {
  // Convert to radians
  const startLatRad = startLat * Math.PI / 180;
  const startLngRad = startLng * Math.PI / 180;
  const endLatRad = endLat * Math.PI / 180;
  const endLngRad = endLng * Math.PI / 180;

  // Calculate y and x components
  const y = Math.sin(endLngRad - startLngRad) * Math.cos(endLatRad);
  const x = Math.cos(startLatRad) * Math.sin(endLatRad) -
            Math.sin(startLatRad) * Math.cos(endLatRad) * Math.cos(endLngRad - startLngRad);

  // Calculate bearing and convert to degrees
  const bearingRad = Math.atan2(y, x);
  const bearingDeg = (bearingRad * 180 / Math.PI + 360) % 360;
  
  return bearingDeg;
};

/**
 * Converts a heading in degrees to a cardinal direction
 * @param heading Heading in degrees (0-360)
 * @returns Cardinal direction (NORTH, EAST, SOUTH, WEST)
 */
export const headingToDirection = (heading: number): ApproachDirection => {
  // Normalize heading to 0-360 range
  const normalizedHeading = ((heading % 360) + 360) % 360;
  
  // Convert to cardinal direction
  // North: 315-45, East: 45-135, South: 135-225, West: 225-315
  if (normalizedHeading >= 315 || normalizedHeading < 45) {
    return ApproachDirection.NORTH;
  } else if (normalizedHeading >= 45 && normalizedHeading < 135) {
    return ApproachDirection.EAST;
  } else if (normalizedHeading >= 135 && normalizedHeading < 225) {
    return ApproachDirection.SOUTH;
  } else {
    return ApproachDirection.WEST;
  }
};

/**
 * Calculate the approach direction to an intersection
 * @param carPosition Car's position as [lat, lng]
 * @param intersectionPosition Intersection position as [lat, lng]
 * @returns The direction from which the car is approaching the intersection
 */
export const determineApproachDirection = (
  carPosition: [number, number],
  intersectionPosition: [number, number]
): ApproachDirection => {
  // Calculate heading from car to intersection
  const heading = calculateHeading(
    carPosition[0], carPosition[1], 
    intersectionPosition[0], intersectionPosition[1]
  );
  
  // The approach direction is the opposite of the heading to the intersection
  // For example, if heading to intersection is NORTH, then we're approaching from SOUTH
  const headingDirection = headingToDirection(heading);
  
  // Convert heading direction to approach direction (opposite)
  switch (headingDirection) {
    case ApproachDirection.NORTH: return ApproachDirection.SOUTH;
    case ApproachDirection.SOUTH: return ApproachDirection.NORTH;
    case ApproachDirection.EAST: return ApproachDirection.WEST;
    case ApproachDirection.WEST: return ApproachDirection.EAST;
    default: return ApproachDirection.UNKNOWN;
  }
};

/**
 * Logs the direction calculation details for debugging
 */
export const logDirectionDetails = (
  carPosition: [number, number],
  intersectionPosition: [number, number]
): void => {
  const heading = calculateHeading(
    carPosition[0], carPosition[1], 
    intersectionPosition[0], intersectionPosition[1]
  );
  
  const headingDirection = headingToDirection(heading);
  const approachDirection = determineApproachDirection(carPosition, intersectionPosition);
  
  console.log('Direction Calculation:');
  console.log(`Car Position: [${carPosition[0]}, ${carPosition[1]}]`);
  console.log(`Intersection Position: [${intersectionPosition[0]}, ${intersectionPosition[1]}]`);
  console.log(`Heading: ${heading.toFixed(2)}°`);
  console.log(`Heading Direction: ${headingDirection}`);
  console.log(`Approach Direction: ${approachDirection}`);
};