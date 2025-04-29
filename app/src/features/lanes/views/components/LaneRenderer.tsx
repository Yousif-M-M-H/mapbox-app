import React from 'react';
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
  // Skip rendering if no lanes
  if (!lanes || lanes.length === 0) return null;

  return (
    <>
      {lanes.map(lane => {
        // Create a GeoJSON feature for the lane
        const feature = {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: lane.location.coordinates
          },
          properties: {
            laneId: lane.laneId,
            laneType: Array.isArray(lane.laneAttributes.laneType) ? lane.laneAttributes.laneType[0] : 'unknown',
          }
        };

        // Determine lane color based on laneType
        const isVehicleLane = 
          lane.laneAttributes.laneType && 
          Array.isArray(lane.laneAttributes.laneType) && 
          lane.laneAttributes.laneType[0] === 'vehicle';

        const laneColor = isVehicleLane ? '#3B82F6' : '#F59E0B';
        const laneWidth = lane.laneAttributes.sharedWidth ? 
          (lane.laneAttributes.sharedWidth[1] || 2) / 2 : 2;

        return (
          <MapboxGL.ShapeSource 
            key={`lane-${lane._id}`}
            id={`lane-source-${lane._id}`}
            shape={feature as any}
          >
            <MapboxGL.LineLayer
              id={`lane-layer-${lane._id}`}
              style={{
                lineColor: laneColor,
                lineWidth: Math.max(1, Math.min(5, laneWidth)),
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
          </MapboxGL.ShapeSource>
        );
      })}
    </>
  );
};