// app/src/features/Map/views/components/MapView.tsx
import React, { useEffect, useRef } from 'react';
import { View } from 'react-native';
import MapboxGL from '@rnmapbox/maps';
import { observer } from 'mobx-react-lite';
import { StyleSheet } from 'react-native';
import { MapViewModel } from '../../viewmodels/MapViewModel';
import { DriverViewModel } from '../../../DriverView/models/DriverViewModel';
import { PedestrianDetectorViewModel } from '../../../PedestrianDetector/viewmodels/PedestrianDetectorViewModel';
import { 
  CROSSWALK_CENTER, 
  CROSSWALK_POLYGON_COORDS 
} from '../../../Crosswalk/constants/CrosswalkCoordinates';

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
      cameraRef.current.setCamera({
        centerCoordinate: CROSSWALK_CENTER,
        zoomLevel: 21,
        pitch: 0,
        animationDuration: 1000
      });
    }
  }, []);

  // Get positions from the viewModel
  const pedestrianPosition = pedestrianDetectorViewModel.pedestrianPosition;
  const vehiclePosition = pedestrianDetectorViewModel.vehiclePosition;
  
  // Convert for MapboxGL (which uses [lon, lat])
  const vehiclePositionMapbox: [number, number] = [vehiclePosition[1], vehiclePosition[0]];
  const pedestrianPositionMapbox: [number, number] = [pedestrianPosition[1], pedestrianPosition[0]];

  // Create GeoJSON for crosswalk polygon - with proper typing
  const crosswalkPolygon = {
    type: "Feature" as const,
    properties: {},
    geometry: {
      type: "Polygon" as const,
      coordinates: [CROSSWALK_POLYGON_COORDS]
    }
  };

  return (
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
        zoomLevel={21}
        centerCoordinate={CROSSWALK_CENTER}
      />

      {/* Draw the crosswalk polygon */}
      <MapboxGL.ShapeSource id="crosswalk-polygon-source" shape={crosswalkPolygon}>
        <MapboxGL.FillLayer 
          id="crosswalk-polygon-fill" 
          style={{
            fillColor: 'rgba(255, 255, 0, 0.4)',
            fillOutlineColor: '#FFCC00'
          }} 
        />
        <MapboxGL.LineLayer 
          id="crosswalk-polygon-outline" 
          style={{
            lineColor: '#FFCC00',
            lineWidth: 2
          }} 
        />
      </MapboxGL.ShapeSource>

      {/* Display vehicle position */}
      <MapboxGL.PointAnnotation
        id="vehicle-position"
        coordinate={vehiclePositionMapbox}
        anchor={{x: 0.5, y: 0.5}}
      >
        <View style={styles.vehicleMarker} />
      </MapboxGL.PointAnnotation>
      
      {/* Display fixed pedestrian */}
      <MapboxGL.PointAnnotation
        id="pedestrian-fixed"
        coordinate={pedestrianPositionMapbox}
        anchor={{x: 0.5, y: 0.5}}
      >
        <View style={styles.pedestrianMarker}>
          <View style={styles.markerInner} />
        </View>
      </MapboxGL.PointAnnotation>
      
      {children}
    </MapboxGL.MapView>
  );
});

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
  vehicleMarker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#4285F4', // Blue
    borderWidth: 2,
    borderColor: 'white',
  },
  pedestrianMarker: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FF9800', // Orange
    borderWidth: 2,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  markerInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'white',
  }
});