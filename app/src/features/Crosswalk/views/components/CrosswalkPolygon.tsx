// app/src/features/Crosswalk/views/components/CrosswalkPolygon.tsx
import React from 'react';
import MapboxGL from '@rnmapbox/maps';
import { CROSSWALK_POLYGON } from '../../models/CrosswalkModel';
import { styles } from '../../styles';

interface CrosswalkPolygonProps {
  isHighlighted?: boolean;
}

export const CrosswalkPolygon: React.FC<CrosswalkPolygonProps> = ({ 
  isHighlighted = false 
}) => {
  return (
    <MapboxGL.ShapeSource id="crosswalkSource" shape={CROSSWALK_POLYGON as any}>
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
};