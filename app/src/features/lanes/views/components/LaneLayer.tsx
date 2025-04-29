import React, { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import MapboxGL from '@rnmapbox/maps';
import { LanesViewModel } from '../../viewmodels/LanesViewModel';
import { LaneRenderer } from './LaneRenderer';

interface LaneLayerProps {
  viewModel: LanesViewModel;
}

export const LaneLayer: React.FC<LaneLayerProps> = observer(({ viewModel }) => {
  
  useEffect(() => {
    console.log("Lane Layer mounted, fetching lane data");
    viewModel.fetchLanesData();
    
    return () => {
      console.log("Lane Layer unmounted, cleaning up");
      viewModel.cleanup();
    };
  }, [viewModel]);
  
  // Group lanes by intersectionId for better rendering performance
  const lanesByIntersection: Record<number, any[]> = {};
  
  viewModel.lanes.forEach(lane => {
    if (!lanesByIntersection[lane.intersectionId]) {
      lanesByIntersection[lane.intersectionId] = [];
    }
    lanesByIntersection[lane.intersectionId].push(lane);
  });
  
  return (
    <>
      {Object.entries(lanesByIntersection).map(([intersectionId, lanes]) => (
        <LaneRenderer 
          key={`intersection-${intersectionId}`}
          lanes={lanes}
          intersectionId={parseInt(intersectionId)}
        />
      ))}
    </>
  );
});