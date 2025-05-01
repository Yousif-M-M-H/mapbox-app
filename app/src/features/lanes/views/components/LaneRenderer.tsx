import React from 'react';
import { View, StyleSheet } from 'react-native';
import MapboxGL from '@rnmapbox/maps';
import { Lane } from '../../models/Lane';

interface LaneRendererProps {
  lanes: Lane[];
  intersectionId: number;
}

export const LaneRenderer: React.FC<LaneRendererProps> = ({ 
  lanes, 
  intersectionId 
}) => {
  if (!lanes || lanes.length === 0) {
    console.log(`Rendering 0 lanes`);
    return null;
  }
  
  console.log(`Rendering ${lanes.length} lanes`);

  return (
    <>
      {lanes.map(lane => {
        console.log(`Rendering lane ${lane.laneId} with coordinates:`, JSON.stringify(lane.location.coordinates));
        
        // For debugging: Render points at each coordinate
        return (
          <>
            {/* Render lane points as markers for debugging */}
            {lane.location.coordinates.map((coord, index) => (
              <MapboxGL.PointAnnotation
                key={`lane-point-${lane.laneId}-${index}`}
                id={`lane-point-${lane.laneId}-${index}`}
                coordinate={coord}
              >
                <View style={{
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: 'red',
                  borderColor: 'white',
                  borderWidth: 2,
                }} />
              </MapboxGL.PointAnnotation>
            ))}
            
            {/* Render the lane as a line */}
            <MapboxGL.ShapeSource 
              key={`lane-${lane.laneId}`}
              id={`lane-source-${lane.laneId}`}
              shape={{
                type: 'Feature',
                geometry: {
                  type: 'LineString',
                  coordinates: lane.location.coordinates
                },
                properties: {
                  laneId: lane.laneId
                }
              }}
            >
              <MapboxGL.LineLayer
                id={`lane-layer-${lane.laneId}`}
                style={{
                  lineColor: '#FF0000', // Bright red for visibility
                  lineWidth: 5,         // Make it thicker
                  lineCap: 'round',
                  lineJoin: 'round',
                }}
              />
            </MapboxGL.ShapeSource>
          </>
        );
      })}
    </>
  );
};