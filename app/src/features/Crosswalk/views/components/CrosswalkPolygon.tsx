// app/src/features/Crosswalk/views/components/CrosswalkPolygon.tsx
import React from 'react';
import MapboxGL from '@rnmapbox/maps';
import { CROSSWALK_CIRCLE } from '../../models/CrosswalkModel';
import { styles } from '../../styles';
import { observer } from 'mobx-react-lite';

interface CrosswalkCircleProps {
  isHighlighted?: boolean;
}

export const CrosswalkPolygon: React.FC<CrosswalkCircleProps> = observer(({ 
  isHighlighted = false 
}) => {
  return (
    <MapboxGL.ShapeSource
      id="crosswalkSource"
      shape={CROSSWALK_CIRCLE}
    >
      <MapboxGL.FillLayer
        id="crosswalkFill"
        style={{
          fillColor: isHighlighted ? styles.highlightColor : styles.normalColor,
          fillOpacity: isHighlighted ? styles.highlightOpacity : styles.normalOpacity,
        }}
      />
      <MapboxGL.LineLayer
        id="crosswalkOutline"
        style={{
          lineColor: isHighlighted ? styles.highlightBorderColor : styles.normalBorderColor,
          lineWidth: isHighlighted ? styles.highlightBorderWidth : styles.normalBorderWidth,
        }}
      />
    </MapboxGL.ShapeSource>
  );
});