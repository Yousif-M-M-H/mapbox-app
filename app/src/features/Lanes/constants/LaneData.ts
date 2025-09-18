// app/src/features/Lanes/constants/LaneData.ts

import { Lane, LaneStyle, LaneConfiguration } from '../models/LaneTypes';

// Default lane styling
export const DEFAULT_LANE_STYLE: LaneStyle = {
  color: '#0066FF',
  width: 3,
  opacity: 1.0,
  lineCap: 'round',
  lineJoin: 'round'
};

// Lane coordinate data extracted from MapView
export const LANE_COORDINATES = {
  LANE_4: [
    [-85.3082228825378, 35.045758400746536],
    [-85.30808198885602, 35.045705490572416]
  ] as [number, number][],

  LANE_5: [
    [-85.30823278205297, 35.045747747854335],
    [-85.30808944380614, 35.04569249636451]
  ] as [number, number][],

  LANE_6: [
    [-85.30823869222141, 35.04573090520772],
    [-85.30809488188754, 35.045682489370606]
  ] as [number, number][]
};

// Predefined lanes configuration
export const INTERSECTION_LANES: Lane[] = [
  {
    id: 'lane-4',
    name: 'Lane 4',
    coordinates: LANE_COORDINATES.LANE_4,
    visible: true
  },
  {
    id: 'lane-5',
    name: 'Lane 5',
    coordinates: LANE_COORDINATES.LANE_5,
    visible: true
  },
  {
    id: 'lane-6',
    name: 'Lane 6',
    coordinates: LANE_COORDINATES.LANE_6,
    visible: true
  }
];

// Main lane configuration
export const LANE_CONFIG: LaneConfiguration = {
  lanes: INTERSECTION_LANES,
  defaultStyle: DEFAULT_LANE_STYLE,
  visible: true
};