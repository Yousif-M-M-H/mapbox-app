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


// Predefined lanes configuration
export const INTERSECTION_LANES: Lane[] = [
  {
    "laneID": 4,
    "laneAttributes": {
      "directionalUse": [2, 2],
      "sharedWith": [0, 10],
      "laneType": ["vehicle", [0, 8]]
    },
    "maneuvers": [0, 12],
    "geometry": {
      "type": "LineString",
      "coordinates": [
        [-85.3082228825378, 35.045758400746536],
        [-85.30808198885602, 35.045705490572416]
      ]
    },
    "connectsTo": [
      {
        "connectingLane": { "lane": 14 },
        "signalGroup": 4
      }
    ]
  },
  {
    "laneID": 5,
    "laneAttributes": {
      "directionalUse": [2, 2],
      "sharedWith": [0, 10],
      "laneType": ["vehicle", [0, 8]]
    },
    "maneuvers": [0, 12],
    "geometry": {
      "type": "LineString",
      "coordinates": [
        [-85.30823278205297, 35.045747747854335],
        [-85.30808944380614, 35.04569249636451]
      ]
    },
    "connectsTo": [
      {
        "connectingLane": { "lane": 13 },
        "signalGroup": 2
      },
      {
        "connectingLane": { "lane": 9 },
        "signalGroup": 2
      }
    ]
  },
  {
    "laneID": 8,
    "laneAttributes": {
      "directionalUse": [2, 2],
      "sharedWith": [0, 10],
      "laneType": ["vehicle", [0, 8]]
    },
    "maneuvers": [0, 12],
    "geometry": {
      "type": "LineString",
      "coordinates": [
        [-85.3083182, 35.0456629],
        [-85.3086953, 35.0449801]
      ]
    },
    "connectsTo": [
      {
        "connectingLane": { "lane": 7 },
        "signalGroup": 4
      },
      {
        "connectingLane": { "lane": 3 },
        "signalGroup": 4
      },
      {
        "connectingLane": { "lane": 13 },
        "signalGroup": 4
      }
    ]
  }
];


// Main lane configuration
export const LANE_CONFIG: LaneConfiguration = {
  lanes: INTERSECTION_LANES,
  defaultStyle: DEFAULT_LANE_STYLE,
  visible: true
};