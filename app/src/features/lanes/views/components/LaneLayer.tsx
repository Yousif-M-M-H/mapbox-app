// app/src/features/lanes/views/components/LaneLayer.tsx
import React, { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import MapboxGL from '@rnmapbox/maps';
import { LanesViewModel } from '../../viewmodels/LanesViewModel';

interface LaneLayerProps {
  viewModel: LanesViewModel;
}

export const LaneLayer: React.FC<LaneLayerProps> = observer(({ viewModel }) => {
  
  useEffect(() => {
    console.log("Lane Layer mounted, fetching lane data from Redis");
    viewModel.fetchLanesData();
    
    return () => {
      console.log("Lane Layer unmounted, cleaning up");
      viewModel.cleanup();
    };
  }, [viewModel]);
  
  console.log(`Rendering ${viewModel.lanes.length} lanes`);
  
  if (viewModel.lanes.length === 0) {
    return null;
  }
  
  // Render each lane as a separate shape source for better control
  return (
    <>
      {viewModel.lanes.map(lane => {
        // Generate a unique ID for each lane
        const laneId = `lane-${lane.laneId}-${Date.now()}`;
        
        // Create the GeoJSON feature for the lane
        const feature = {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: lane.location.coordinates
          },
          properties: {
            id: lane.laneId,
            name: lane.intersectionName
          }
        };
        
        // Log the first lane's coordinates for debugging
        if (lane === viewModel.lanes[0]) {
          console.log(`Rendering lane ${lane.laneId} with coordinates:`, 
            JSON.stringify(lane.location.coordinates));
        }
        
        // Determine lane styling
        const isVehicleLane = 
          lane.laneAttributes.laneType && 
          Array.isArray(lane.laneAttributes.laneType) && 
          lane.laneAttributes.laneType[0] === 'vehicle';
        
        const laneColor = isVehicleLane ? '#3B82F6' : '#F59E0B';
        
        // Use width from lane attributes
        const width = lane.laneAttributes.sharedWith && 
                      Array.isArray(lane.laneAttributes.sharedWith) && 
                      lane.laneAttributes.sharedWith.length > 1 ? 
                      lane.laneAttributes.sharedWith[1] / 2 : 2;
        
        return (
          <MapboxGL.ShapeSource
            key={laneId}
            id={laneId}
            shape={feature as any}
          >
            <MapboxGL.LineLayer
              id={`layer-${laneId}`}
              style={{
                lineColor: laneColor,
                lineWidth: Math.max(1, Math.min(5, width)),
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
          </MapboxGL.ShapeSource>
        );
      })}
    </>
  );
});