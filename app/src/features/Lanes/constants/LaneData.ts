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

// Georgia intersection lanes
export const GEORGIA_INTERSECTION_LANES: Lane[] = [
  {
  "laneID": 1,
  "laneAttributes": {
    "directionalUse": [2, 2],
    "sharedWith": [0, 10],
    "laneType": ["vehicle", [0, 8]]
  },
  "maneuvers": [0, 12],
  "geometry": {
    "type": "LineString",
    "coordinates": [
      [-85.3082691, 35.0458984],
      [-85.3078928, 35.0465756]
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
  "laneID": 2,
  "laneAttributes": {
    "directionalUse": [2, 2],
    "sharedWith": [0, 10],
    "laneType": ["vehicle", [0, 8]]
  },
  "maneuvers": [0, 12],
  "geometry": {
    "type": "LineString",
    "coordinates": [
      [-85.3082207, 35.0459089],
      [-85.3080376, 35.0462122]
    ]
  },
  "connectsTo": [
    {
      "connectingLane": { "lane": 9 },
      "signalGroup": 4
    },
    {
      "connectingLane": { "lane": 6 },
      "signalGroup": 4
    }
  ]
},
{
  "laneID": 3,
  "laneAttributes": {
    "directionalUse": [1, 2],
    "sharedWith": [0, 10],
    "laneType": ["vehicle", [0, 8]]
  },
  "maneuvers": [0, 12],
  "geometry": {
    "type": "LineString",
    "coordinates": [
      [-85.3081865, 35.0458956],
      [-85.3081571, 35.0459450]
    ],
  },
  "connectsTo": []
},
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
        "signalGroup": 2
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
  "laneID": 6,
  "laneAttributes": {
    "directionalUse": [1, 2],
    "sharedWith": [0, 10],
    "laneType": ["vehicle", [0, 8]]
  },
  "maneuvers": [0, 12],
  "geometry": {
    "type": "LineString",
    "coordinates": [
      [-85.3081611, 35.0457243],
      [-85.3080344, 35.0456771]
    ]
  },
  "connectsTo": []
},
{
  "laneID": 7,
  "laneAttributes": {
    "directionalUse": [1, 2],
    "sharedWith": [0, 10],
    "laneType": ["vehicle", [0, 8]]
  },
  "maneuvers": [0, 12],
  "geometry": {
    "type": "LineString",
    "coordinates": [
      [-85.3081739, 35.0457009],
      [-85.3080471, 35.0456536]
    ]
  }, 
  "connectsTo": []
},
{
  "laneID": 9,
  "laneAttributes": {
    "directionalUse": [1, 2],
    "sharedWith": [0, 10],
    "laneType": ["vehicle", [0, 8]]
  },
  "maneuvers": [0, 12],
  "geometry": {
    "type": "LineString",
    "coordinates": [
      [-85.3083565, 35.0456777],
      [-85.3084042, 35.0455942]
    ]
  }, 
  "connectsTo": []
},
{
  "laneID": 10,
  "laneAttributes": {
    "directionalUse": [2, 2],
    "sharedWith": [0, 10],
    "laneType": ["vehicle", [0, 8]]
  },
  "maneuvers": [0, 12],
  "geometry": {
    "type": "LineString",
    "coordinates": [
      [-85.3084702, 35.0457724],
      [-85.3086320, 35.0457746]
    ]
  },
  "connectsTo": [
    {
      "connectingLane": { "lane": 9 },
      "signalGroup": 13
    },
    {
      "connectingLane": { "lane": 7 },
      "signalGroup": 13
    }
  ]
},
{
  "laneID": 11,
  "laneAttributes": {
    "directionalUse": [2, 2],
    "sharedWith": [0, 10],
    "laneType": ["vehicle", [0, 8]]
  },
  "maneuvers": [0, 12],
  "geometry": {
    "type": "LineString",
    "coordinates": [
      [-85.3084628, 35.0457990],
      [-85.3086292, 35.0458000]
    ]
  },
  "connectsTo": [
    {
      "connectingLane": { "lane": 6 },
      "signalGroup": 13
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

export const HOUSTON_INTERSECTION_LANES: Lane[] = [
  {
    "laneID": 101,
    "laneAttributes": {
      "directionalUse": [2, 2],
      "sharedWith": [0, 10],
      "laneType": ["vehicle", [0, 8]]
    },
    "maneuvers": [3584, 12],
    "geometry": {
      "type": "LineString",
      "coordinates": [
        [-85.3055256, 35.0448534],
        [-85.3051493, 35.0455305]
        
      ]
    },
    "connectsTo": [
      {
        "connectingLane": { "lane": 110 },
        "signalGroup": 4
      },
      {
        "connectingLane": { "lane": 107 },
        "signalGroup": 4
      },
      {
        "connectingLane": { "lane": 105 },
        "signalGroup": 4
      }
    ]
  },
  {
    "laneID": 102,
    "laneAttributes": {
      "directionalUse": [1, 2],
      "sharedWith": [0, 10],
      "laneType": ["vehicle", [0, 8]]
    },
    "maneuvers": [0, 12],
    "geometry": {
      "type": "LineString",
      "coordinates": [
        [-85.3054852, 35.0448328],
        [-85.3054572, 35.0448817]
      ]
    },
    "connectsTo": []
  },
  {
    "laneID": 103,
    "laneAttributes": {
      "directionalUse": [2, 2],
      "sharedWith": [0, 10],
      "laneType": ["vehicle", [0, 8]]
    },
    "maneuvers": [2560, 12],
    "geometry": {
      "type": "LineString",
      "coordinates": [
        [-85.3054417, 35.0447392],
        [-85.3049256, 35.0445453]
      ]
    },
    "connectsTo": [
      {
        "connectingLane": { "lane": 102 },
        "signalGroup": 2
      },
      {
        "connectingLane": { "lane": 110 },
        "signalGroup": 2
      }
    ]
  },
  {
    "laneID": 104,
    "laneAttributes": {
      "directionalUse": [2, 2],
      "sharedWith": [0, 10],
      "laneType": ["vehicle", [0, 8]]
    },
    "maneuvers": [1024, 12],
    "geometry": {
      "type": "LineString",
      "coordinates": [
        [-85.3054108, 35.0446962],
        [-85.3049395, 35.0445194]
      ]
    },
    "connectsTo": [
      {
        "connectingLane": { "lane": 107 },
        "signalGroup": 2
      }
    ]
  },
  {
    "laneID": 105,
    "laneAttributes": {
      "directionalUse": [1, 2],
      "sharedWith": [0, 10],
      "laneType": ["vehicle", [0, 8]]
    },
    "maneuvers": [0, 12],
    "geometry": {
      "type": "LineString",
      "coordinates": [
        [-85.3054661, 35.0446858],
        [-85.3054120, 35.0446642]
      ]
    },
    "connectsTo": []  
  },
  {
    "laneID": 106,
    "laneAttributes": {
      "directionalUse": [2, 2],
      "sharedWith": [0, 10],
      "laneType": ["vehicle", [0, 8]]
    },
    "maneuvers": [3584, 12],
    "geometry": {
      "type": "LineString",
      "coordinates": [
        [-85.3055932, 35.0446369],
        [-85.3056243, 35.0445911]
      ]
    },
    "connectsTo": [
      {
        "connectingLane": { "lane": 5 },
        "signalGroup": 4
      },
      {
        "connectingLane": { "lane": 2 },
        "signalGroup": 4
      },
      {
        "connectingLane": { "lane": 10 },
        "signalGroup": 4
      }
    ]
  },
  {
    "laneID": 107,
    "laneAttributes": {
      "directionalUse": [1, 2],
      "sharedWith": [0, 10],
      "laneType": ["vehicle", [0, 8]]
    },
    "maneuvers": [0, 12],
    "geometry": {
      "type": "LineString",
      "coordinates": [
        [-85.3056371, 35.0446554],
        
        [-85.3056660, 35.0446085]
      ]
    },
    "connectsTo": []
  },
  {
    "laneID": 108,
    "laneAttributes": {
      "directionalUse": [2, 2],
      "sharedWith": [0, 10],
      "laneType": ["vehicle", [0, 8]]
    },
    "maneuvers": [1024, 12],
    "geometry": {
      "type": "LineString",
      "coordinates": [
      [-85.305691, 35.044761],
      [-85.306085, 35.044913]
      ]
    },
    "connectsTo": [
      {
        "connectingLane": { "lane": 2 },
        "signalGroup": 2
      }
    ]
  },
  {
    "laneID": 109,
    "laneAttributes": {
      "directionalUse": [2, 2],
      "sharedWith": [0, 10],
      "laneType": ["vehicle", [0, 8]]
    },
    "maneuvers": [2560, 12],
    "geometry": {
      "type": "LineString",
      "coordinates": [
        [-85.30565737732269, 35.044790666305786],
        [-85.3057146240633, 35.0448094616373]
      ]
    },
    "connectsTo": [
      {
        "connectingLane": { "lane": 7 },
        "signalGroup": 2
      },
      {
        "connectingLane": { "lane": 5 },
        "signalGroup": 2
      }
    ]
  },
  {
    "laneID": 100,
    "laneAttributes": {
      "directionalUse": [1, 2],
      "sharedWith": [0, 10],
      "laneType": ["vehicle", [0, 8]]
    },
    "maneuvers": [0, 12],
    "geometry": {
      "type": "LineString",
      "coordinates": [
        [-85.3056341, 35.0448120],
        [-85.3056991, 35.0448372]
      ]
    },
    "connectsTo": []
  }
];

// NEW: Lindsay intersection lanes
export const LINDSAY_INTERSECTION_LANES: Lane[] = [
  {
    "laneID": 201,
    "laneAttributes": {
      "directionalUse": [2, 2],
      "sharedWith": [0, 10],
      "laneType": ["vehicle", [0, 8]]
    },
    "maneuvers": [3584, 12],
    "geometry": {
      "type": "LineString",
      "coordinates": [
        [-85.3068790, 35.0453512],
        [-85.3066849, 35.0457107]
      ]
    },
    "connectsTo": [
      {
        "connectingLane": { "lane": 5 },
        "signalGroup": 4
      },
      {
        "connectingLane": { "lane": 7 },
        "signalGroup": 4
      },
      {
        "connectingLane": { "lane": 10 },
        "signalGroup": 4
      }
    ]
  },
  {
    "laneID": 202,
  "laneAttributes": {
    "directionalUse": [1, 2],
    "sharedWith": [0, 10],
    "laneType": ["vehicle", [0, 8]]
  },
  "maneuvers": [0, 12],
  "geometry": {
    "type": "LineString",
    "coordinates": [
      [-85.3068405, 35.0453373],
      [-85.3068071, 35.0453950]
    ],
  },
  "connectsTo": []
},
{
  "laneID": 203,
  "laneAttributes": {
    "directionalUse": [2, 2],
    "sharedWith": [0, 10],
    "laneType": ["vehicle", [0, 8]]
  },
  "maneuvers": [2560, 12],
  "geometry": {
    "type": "LineString",
    "coordinates": [
      [-85.3068009, 35.0452531],
      [-85.3058514, 35.0448936]
    ]
  },
  "connectsTo": [
    {
      "connectingLane": { "lane": 2 },
      "signalGroup": 2
    },
    {
      "connectingLane": { "lane": 10 },
      "signalGroup": 2
    }
  ]
},
{
  "laneID": 204,
  "laneAttributes": {
    "directionalUse": [2, 2],
    "sharedWith": [0, 10],
    "laneType": ["vehicle", [0, 8]]
  },
  "maneuvers": [1024, 12],
  "geometry": {
    "type": "LineString",
    "coordinates": [
      [-85.3068023, 35.0452213],
      [-85.3062938, 35.0450271]
    ]
  },
  "connectsTo": [
    {
      "connectingLane": { "lane": 7 },
      "signalGroup": 2
    }
  ]
},
{
  "laneID": 205,
  "laneAttributes": {
    "directionalUse": [1, 2],
    "sharedWith": [0, 10],
    "laneType": ["vehicle", [0, 8]]
  },
  "maneuvers": [0, 12],
  "geometry": {
    "type": "LineString",
    "coordinates": [
      [-85.3068178, 35.0451952],
      [-85.3067522, 35.0451703]
    ]
  },
  "connectsTo": []  
},
{
  "laneID": 206,
  "laneAttributes": {
    "directionalUse": [2, 2],
    "sharedWith": [0, 10],
    "laneType": ["vehicle", [0, 8]]
  },
  "maneuvers": [3584, 12],
  "geometry": {
    "type": "LineString",
    "coordinates": [
      [-85.3069459, 35.0451611],
      [-85.3072848, 35.0445437]
    ]
  },
  "connectsTo": [
    {
      "connectingLane": { "lane": 5 },
      "signalGroup": 4
    },
    {
      "connectingLane": { "lane": 2 },
      "signalGroup": 4
    },
    {
      "connectingLane": { "lane": 10 },
      "signalGroup": 4
    }
  ]
},
{
  "laneID": 207,
  "laneAttributes": {
    "directionalUse": [1, 2],
    "sharedWith": [0, 10],
    "laneType": ["vehicle", [0, 8]]
  },
  "maneuvers": [0, 12],
  "geometry": {
    "type": "LineString",
    "coordinates": [
      [-85.3069790, 35.0451756],
      [-85.3070072, 35.0451243]
    ]
  }, 
  "connectsTo": []
},
{
  "laneID": 208,
  "laneAttributes": {
    "directionalUse": [2, 2],
    "sharedWith": [0, 10],
    "laneType": ["vehicle", [0, 8]]
  },
  "maneuvers": [2560, 12],
  "geometry": {
    "type": "LineString",
    "coordinates": [
      [-85.3070316, 35.0452672],
      [-85.3079039, 35.0455973]
    ]
  },
  "connectsTo": [
    {
      "connectingLane": { "lane": 5 },
      "signalGroup": 2
    },
    {
      "connectingLane": { "lane": 7 },
      "signalGroup": 2
    }
  ]
}, 
{
  "laneID": 209,
  "laneAttributes": {
    "directionalUse": [2, 2],
    "sharedWith": [0, 10],
    "laneType": ["vehicle", [0, 8]]
  },
  "maneuvers": [1024, 12],
  "geometry": {
    "type": "LineString",
    "coordinates": [
      [-85.3070257, 35.0452959],
      [-85.3072120, 35.0453663]
    ]
  },
  "connectsTo": [
    {
      "connectingLane": { "lane": 2 },
      "signalGroup": 2
    }
  ]
},
{
  "laneID": 210,
  "laneAttributes": {
    "directionalUse": [1, 2],
    "sharedWith": [0, 10],
    "laneType": ["vehicle", [0, 8]]
  },
  "maneuvers": [0, 12],
  "geometry": {
    "type": "LineString",
    "coordinates": [
      [-85.3069970, 35.0453157],
      [-85.3070740, 35.0453448]
    ]
  },
  "connectsTo": []  
},

];

// Combined lanes from all intersections (UPDATED)
export const ALL_INTERSECTION_LANES: Lane[] = [
  ...GEORGIA_INTERSECTION_LANES,
  ...HOUSTON_INTERSECTION_LANES,
  ...LINDSAY_INTERSECTION_LANES
];

// Backward compatibility - keep the original export
export const INTERSECTION_LANES = GEORGIA_INTERSECTION_LANES;

// Intersection-specific configurations
export const GEORGIA_LANE_CONFIG: LaneConfiguration = {
  lanes: GEORGIA_INTERSECTION_LANES,
  defaultStyle: DEFAULT_LANE_STYLE,
  visible: true
};

export const HOUSTON_LANE_CONFIG: LaneConfiguration = {
  lanes: HOUSTON_INTERSECTION_LANES,
  defaultStyle: DEFAULT_LANE_STYLE,
  visible: true
};

// NEW: Lindsay lane configuration
export const LINDSAY_LANE_CONFIG: LaneConfiguration = {
  lanes: LINDSAY_INTERSECTION_LANES,
  defaultStyle: DEFAULT_LANE_STYLE,
  visible: true
};

export const ALL_INTERSECTIONS_LANE_CONFIG: LaneConfiguration = {
  lanes: ALL_INTERSECTION_LANES,
  defaultStyle: DEFAULT_LANE_STYLE,
  visible: true
};

// Main lane configuration - now includes all three intersections
export const LANE_CONFIG: LaneConfiguration = ALL_INTERSECTIONS_LANE_CONFIG;

// Helper function to get lanes for a specific intersection (UPDATED)
export function getLanesForIntersection(intersection: 'georgia' | 'houston' | 'lindsay' | 'all'): Lane[] {
  switch (intersection) {
    case 'georgia':
      return GEORGIA_INTERSECTION_LANES;
    case 'houston':
      return HOUSTON_INTERSECTION_LANES;
    case 'lindsay':
      return LINDSAY_INTERSECTION_LANES;
    case 'all':
    default:
      return ALL_INTERSECTION_LANES;
  }
}

// Helper function to get lane configuration for a specific intersection (UPDATED)
export function getLaneConfigForIntersection(intersection: 'georgia' | 'houston' | 'lindsay' | 'all'): LaneConfiguration {
  switch (intersection) {
    case 'georgia':
      return GEORGIA_LANE_CONFIG;
    case 'houston':
      return HOUSTON_LANE_CONFIG;
    case 'lindsay':
      return LINDSAY_LANE_CONFIG;
    case 'all':
    default:
      return ALL_INTERSECTIONS_LANE_CONFIG;
  }
}