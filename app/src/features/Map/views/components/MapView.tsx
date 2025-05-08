// app/src/features/Map/views/components/MapView.tsx
import React, { useEffect, useRef } from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import MapboxGL from '@rnmapbox/maps';
import { observer } from 'mobx-react-lite';
import { styles } from '../../styles';
import { MapViewModel } from '../../viewmodels/MapViewModel';
import { DriverViewModel } from '../../../DriverView/models/DriverViewModel';
import { DriverViewButton } from '../../../DriverView/views/components/DriverViewButton';
import { CrosswalkPolygon } from '../../../Crosswalk/views/components/CrosswalkPolygon';
import { CROSSWALK_CENTER } from '../../../Crosswalk/constants/CrosswalkCoordinates';

interface MapViewProps {
  mapViewModel: MapViewModel;
  driverViewModel: DriverViewModel;
  children?: React.ReactNode;
}

export const MapViewComponent: React.FC<MapViewProps> = observer(({ 
  mapViewModel,
  driverViewModel,
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
  
  // Handle driver view toggle
  const handleDriverViewToggle = (isDriverView: boolean) => {
    if (cameraRef.current) {
      if (isDriverView) {
        // Switch to driver view
        cameraRef.current.setCamera({
          centerCoordinate: mapViewModel.userLocationCoordinate,
          zoomLevel: 19,
          pitch: 60,
          heading: mapViewModel.getUserHeading(),
          animationDuration: 1000
        });
      } else {
        // Switch back to normal view
        cameraRef.current.setCamera({
          centerCoordinate: mapViewModel.userLocationCoordinate,
          zoomLevel: 18,
          pitch: 0,
          animationDuration: 1000
        });
      }
    }
  };

  // Fly to crosswalk location
  const flyToCrosswalk = () => {
    if (cameraRef.current) {
      cameraRef.current.setCamera({
        centerCoordinate: CROSSWALK_CENTER,
        zoomLevel: 19,
        pitch: driverViewModel.isDriverPerspective ? 60 : 0,
        animationDuration: 1000
      });
    }
  };

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
          {...driverViewModel.getCameraParameters()}
        />

        {/* Add the CrosswalkPolygon component with debug option */}
        <CrosswalkPolygon isHighlighted={false} />

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
      
      {/* Driver View Button */}
      <DriverViewButton 
        viewModel={driverViewModel}
        onToggle={handleDriverViewToggle}
      />

      {/* Button to fly to crosswalk */}
      <View style={{
        position: 'absolute', 
        top: 20, 
        right: 20,
        backgroundColor: 'white',
        padding: 10,
        borderRadius: 5,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
      }}>
        <TouchableOpacity onPress={flyToCrosswalk}>
          <Text style={{ fontWeight: 'bold' }}>Fly to Crosswalk</Text>
        </TouchableOpacity>
      </View>
    </>
  );
});