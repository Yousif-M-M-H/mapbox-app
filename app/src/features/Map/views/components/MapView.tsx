// app/src/features/Map/views/components/MapView.tsx
import React, { useEffect, useRef } from 'react';
import { View } from 'react-native';
import MapboxGL from '@rnmapbox/maps';
import { observer } from 'mobx-react-lite';
import { styles } from '../../styles';
import { MapViewModel } from '../../viewmodels/MapViewModel';
import { DriverViewModel } from '../../../DriverView/models/DriverViewModel';
import { PedestrianDetectorViewModel } from '../../../PedestrianDetector/viewmodels/PedestrianDetectorViewModel';
import { CAR_POSITION } from '../../../Crosswalk/constants/CrosswalkCoordinates';

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
  
  useEffect(() => {
    if (cameraRef.current) {
      // Convert car position from [lat, lon] to [lon, lat] for Mapbox
      const carPositionMapbox: [number, number] = [CAR_POSITION[1], CAR_POSITION[0]];
      
      cameraRef.current.setCamera({
        centerCoordinate: carPositionMapbox,
        zoomLevel: 19,
        pitch: 0,
        animationDuration: 1000
      });
    }
  }, []);

  // Convert coordinates for MapboxGL (which uses [lon, lat])
  const carPositionMapbox: [number, number] = [CAR_POSITION[1], CAR_POSITION[0]];

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
          centerCoordinate={carPositionMapbox}
        />

        {/* Display car position */}
        <MapboxGL.PointAnnotation
          id="car-position"
          coordinate={carPositionMapbox}
          anchor={{x: 0.5, y: 0.5}}
        >
          <View style={{
            width: 20,
            height: 20,
            borderRadius: 10,
            backgroundColor: '#4285F4',
            borderWidth: 2,
            borderColor: 'white',
          }} />
        </MapboxGL.PointAnnotation>
        
        {children}
      </MapboxGL.MapView>
    </>
  );
});