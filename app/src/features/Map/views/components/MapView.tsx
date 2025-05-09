// app/src/features/Map/views/components/MapView.tsx
import React, { useEffect, useRef } from 'react';
import { View } from 'react-native';
import MapboxGL from '@rnmapbox/maps';
import { observer } from 'mobx-react-lite';
import { styles } from '../../styles';
import { MapViewModel } from '../../viewmodels/MapViewModel';
import { DriverViewModel } from '../../../DriverView/models/DriverViewModel';
import { CrosswalkPolygon } from '../../../Crosswalk/views/components/CrosswalkPolygon';
import { INTERSECTION_CENTER_LNGLAT } from '../../../Crosswalk/constants/CrosswalkCoordinates';
import { PedestrianDetectorViewModel } from '../../../PedestrianDetector/viewmodels/PedestrianDetectorViewModel';

interface MapViewProps {
  mapViewModel: MapViewModel;
  driverViewModel: DriverViewModel;
  pedestrianDetectorViewModel: PedestrianDetectorViewModel;
  children?: React.ReactNode;
}

export const MapViewComponent: React.FC<MapViewProps> = observer(({ 
  mapViewModel,
  driverViewModel,
  pedestrianDetectorViewModel,
  children 
}) => {
  const mapRef = useRef<MapboxGL.MapView>(null);
  const cameraRef = useRef<MapboxGL.Camera>(null);
  
  // Update camera when heading changes in driver perspective mode
  useEffect(() => {
    if (driverViewModel.isDriverPerspective && cameraRef.current) {
      cameraRef.current.setCamera({
        centerCoordinate: mapViewModel.userLocationCoordinate,
        heading: mapViewModel.getUserHeading(),
        pitch: 60,
        zoomLevel: 19,
        animationDuration: 300
      });
    }
  }, [mapViewModel.userHeading, driverViewModel.isDriverPerspective]);

  // Initial camera setup to focus on the intersection
  useEffect(() => {
    if (cameraRef.current) {
      cameraRef.current.setCamera({
        centerCoordinate: INTERSECTION_CENTER_LNGLAT,
        zoomLevel: 19,
        pitch: 0,
        animationDuration: 1000
      });
    }
  }, []);

  return (
    <>
      <MapboxGL.MapView 
        ref={mapRef}
        style={styles.map} 
        styleURL="mapbox://styles/mapbox/streets-v12"
        logoEnabled={false}
        attributionEnabled={false}
        compassEnabled={true}
      >
        <MapboxGL.Camera 
          ref={cameraRef}
          zoomLevel={19}
          centerCoordinate={INTERSECTION_CENTER_LNGLAT}
        />

        {/* Add the CrosswalkPolygon component */}
        <CrosswalkPolygon isHighlighted={pedestrianDetectorViewModel.pedestriansInCrosswalk > 0} />

        {/* Custom user location marker */}
        <MapboxGL.PointAnnotation
          id="userLocation"
          coordinate={mapViewModel.userLocationCoordinate}
          anchor={{x: 0.5, y: 0.5}}
        >
          <View style={styles.userMarker}>
            <View style={styles.markerInner} />
          </View>
        </MapboxGL.PointAnnotation>
        
        {children}
      </MapboxGL.MapView>
    </>
  );
});