// app/src/features/SpatService/services/SpatZoneService.ts

export interface SpatZone {
  id: string;
  name: string;
  polygon: [number, number][];
  laneIds: number[];
  signalGroup: number;
  intersection: 'georgia' | 'houston';
}

export const SPAT_ZONES: SpatZone[] = [
  {
    id: 'georgia_lanes_4_5',
    name: 'Georgia Lanes 4 & 5',
    polygon: [
    [-85.30818819724583, 35.04581087515382],
      [-85.3078772725392, 35.045701327254704],
      [-85.30798530743753, 35.04564597038842],
      [-85.30821557668192, 35.04573220847037],
      [-85.30818819724583, 35.04581087515382],
    ],
    laneIds: [4, 5],
    signalGroup: 2,
    intersection: 'georgia'
  },
  {
    id: 'georgia_lane_1',
    name: 'Georgia Lane 1',
    polygon: [
   [-85.30824541727874, 35.045894301661576],
      [-85.30823118032862, 35.045936553466916],
      [-85.30819391488009, 35.04592815421519],
      [-85.30821501066924, 35.04588245772791],
      [-85.30824541727874, 35.045894301661576],
    ],
    laneIds: [1],
    signalGroup: 4,
    intersection: 'georgia'
  },
  {
    id: 'georgia_lane_8',
    name: 'Georgia Lane 8',
    polygon: [
     [-85.30831157935737, 35.04571115061532],
      [-85.30825834640959, 35.04569492583184],
      [-85.30833500284682, 35.04552041109105],
      [-85.30839359610162, 35.0455372659322],
      [-85.30831157935737, 35.04571115061532],
    ],
    laneIds: [8],
    signalGroup: 4,
    intersection: 'georgia'
  },
  {
    id: 'georgia_lanes_10_11',
    name: 'Georgia Lanes 10 & 11',
    polygon: [
      [-85.30829194058872, 35.04587339197049],
      [-85.30890288513018, 35.04586380929149], 
      [-85.30887736136788, 35.04566781438929],
      [-85.30843958685064, 35.045593068732515],
      [-85.30829194058872, 35.04587339197049],
    ],
    laneIds: [10, 11],
    signalGroup: 2,
    intersection: 'georgia'
  }
];

export class SpatZoneService {
  private static zoneCache: Map<string, boolean> = new Map();
  
  static findZoneForPosition(userPosition: [number, number]): SpatZone | null {
    if (!userPosition || userPosition[0] === 0 || userPosition[1] === 0) {
      return null;
    }

    for (const zone of SPAT_ZONES) {
      if (this.isPointInZone(userPosition, zone)) {
        return zone;
      }
    }
    
    return null;
  }

  static isPointInZone(userPosition: [number, number], zone: SpatZone): boolean {
    return this.isPointInPolygon(userPosition, zone.polygon);
  }

  private static isPointInPolygon(point: [number, number], polygon: [number, number][]): boolean {
    const [lat, lng] = point;
    
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return false;
    }

    let inside = false;
    const n = polygon.length;

    for (let i = 0, j = n - 1; i < n; j = i++) {
      const [lngI, latI] = polygon[i];
      const [lngJ, latJ] = polygon[j];

      if (((latI > lat) !== (latJ > lat)) &&
          (lng < (lngJ - lngI) * (lat - latI) / (latJ - latI) + lngI)) {
        inside = !inside;
      }
    }

    return inside;
  }
}