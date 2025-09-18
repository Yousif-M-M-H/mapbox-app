// app/src/features/Lanes/views/components/LaneOverlay.tsx

import React from 'react';
import MapboxGL from '@rnmapbox/maps';
import { observer } from 'mobx-react-lite';
import { LanesViewModel } from '../../viewmodels/LanesViewModel';
import { LaneRenderingService } from '../../services/LaneRenderingService';

interface LaneOverlayProps {
  lanesViewModel: LanesViewModel;
}

export const LaneOverlay: React.FC<LaneOverlayProps> = observer(({ lanesViewModel }) => {
  // Don't render anything if lanes are not globally visible or no visible lanes
  if (!lanesViewModel.hasVisibleLanes) {
    return null;
  }

  const visibleLanes = lanesViewModel.visibleLanes;

  return (
    <>
      {visibleLanes.map((lane) => {
        const feature = LaneRenderingService.createLaneFeature(lane);
        const lineStyle = LaneRenderingService.createLineLayerStyle();

        return (
          <MapboxGL.ShapeSource
            key={lane.id}
            id={`${lane.id}-source`}
            shape={feature}
          >
            <MapboxGL.LineLayer
              id={`${lane.id}-layer`}
              style={lineStyle}
            />
          </MapboxGL.ShapeSource>
        );
      })}
    </>
  );
});

LaneOverlay.displayName = 'LaneOverlay';