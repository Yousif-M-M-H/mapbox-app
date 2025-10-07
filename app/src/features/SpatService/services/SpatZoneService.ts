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
[-85.30822866308598, 35.04578799943617],
 [-85.30777034396975, 35.04563747921736],
 [-85.30780358802147, 35.045582423831505],
  [-85.30824999702538, 35.04573630454266],
  [-85.30822866308598, 35.04578799943617],
    ],
    laneIds: [4, 5],
    signalGroup: 2,
    intersection: 'georgia'
  },
  {
    id: 'georgia_lane_1',
    name: 'Georgia Lane 1',
    polygon: [
      [-85.3082933826169, 35.045825151868314],
      [-85.30823118032862, 35.045936553466916],
      [-85.30819391488009, 35.04592815421519],
      [-85.30825664636524, 35.045812968966914],
      [-85.3082933826169, 35.045825151868314]
    ],
    laneIds: [1],
    signalGroup: 4,
    intersection: 'georgia'
  },
  {
    id: 'georgia_lane_8',
    name: 'Georgia Lane 8',
    polygon: [
[-85.30830603363057, 35.0457325778459],
 [-85.30825962612626, 35.04570716847175],
 [-85.30837420778691, 35.04546912527478],
 [-85.3084372283724, 35.045487373650616],
[-85.30830603363057, 35.0457325778459],
    ],
    laneIds: [8],
    signalGroup: 4,
    intersection: 'georgia'
  }
];

export class SpatZoneService {
  
  static isPointInZone(
    userPosition: [number, number],
    zone: SpatZone
  ): boolean {
    return this.isPointInPolygon(userPosition, zone.polygon);
  }

  static findZoneForPosition(
    userPosition: [number, number]
  ): SpatZone | null {
    for (const zone of SPAT_ZONES) {
      if (this.isPointInZone(userPosition, zone)) {
        return zone;
      }
    }
    return null;
  }

  private static isPointInPolygon(
    point: [number, number],
    polygon: [number, number][]
  ): boolean {
    const [lat, lng] = point;
    let inside = false;

    const vertices: [number, number][] = polygon.map(([pLng, pLat]) => [pLat, pLng]);
    
    const cleanVertices = this.ensureOpenPolygon(vertices);

    for (let i = 0, j = cleanVertices.length - 1; i < cleanVertices.length; j = i++) {
      const [latI, lngI] = cleanVertices[i];
      const [latJ, lngJ] = cleanVertices[j];

      if (((latI > lat) !== (latJ > lat)) &&
        (lng < (lngJ - lngI) * (lat - latI) / (latJ - latI) + lngI)) {
        inside = !inside;
      }
    }

    return inside;
  }

  private static ensureOpenPolygon(vertices: [number, number][]): [number, number][] {
    if (vertices.length > 0 &&
      vertices[0][0] === vertices[vertices.length - 1][0] &&
      vertices[0][1] === vertices[vertices.length - 1][1]) {
      return vertices.slice(0, -1);
    }
    return vertices;
  }
}