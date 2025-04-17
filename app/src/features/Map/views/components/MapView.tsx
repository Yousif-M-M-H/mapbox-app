// app/src/features/Map/views/components/MapView.tsx
import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import MapboxGL from '@rnmapbox/maps';
import { observer } from 'mobx-react-lite';
import { styles } from '../../styles';
import { MapViewModel } from '../../viewmodels/MapViewModel';
import { RouteViewModel } from '../../../Route/viewmodels/RouteViewModel';
import { NavigationViewModel } from '../../../Navigation/viewmodels/NavigationViewModel';
import { SDSMLayer } from '../../../SDSM/views/components/SDSMLayer';
import { SDSMViewModel } from '../../../SDSM/viewmodels/SDSMViewModel';
import { SDSMVehicle } from '../../../SDSM/models/SDSMData';

interface MapViewProps {
  mapViewModel: MapViewModel;
  routeViewModel: RouteViewModel;
  navigationViewModel: NavigationViewModel;
  sdsmViewModel: SDSMViewModel;
  children?: React.ReactNode;
}

export const MapViewComponent: React.FC<MapViewProps> = observer(({ 
  mapViewModel, 
  routeViewModel, 
  navigationViewModel,
  sdsmViewModel,
  children 
}) => {
  const mapRef = useRef<MapboxGL.MapView>(null);
  const cameraRef = useRef<MapboxGL.Camera>(null);
  
  // Add a state for selected vehicle
  const [selectedVehicle, setSelectedVehicle] = useState<SDSMVehicle | null>(null);
  
  // Effect to fit the route on the screen when route changes
  useEffect(() => {
    if (routeViewModel.showRoute && 
        routeViewModel.routeGeometry.geometry.coordinates.length > 0 && 
        !navigationViewModel.isNavigating) {
      // Delay to ensure map is ready before fitting bounds
      setTimeout(() => fitToRoute(), 500);
    }
  }, [routeViewModel.showRoute, routeViewModel.routeGeometry, navigationViewModel.isNavigating]);
  
  // Handle vehicle selection
  const handleVehiclePress = (vehicle: SDSMVehicle) => {
    setSelectedVehicle(vehicle);
    // Optionally center the map on the selected vehicle
    if (cameraRef.current) {
      cameraRef.current.setCamera({
        centerCoordinate: vehicle.location.coordinates,
        zoomLevel: 18,
        animationDuration: 500
      });
    }
  };
  
  // Function to make camera fit the entire route
  const fitToRoute = () => {
    if (!mapRef.current || !cameraRef.current) return;
    
    const coordinates = routeViewModel.routeGeometry.geometry.coordinates;
    
    if (!coordinates || coordinates.length < 2) return;
    
    try {
      // Find the bounding box of the route
      let minLon = coordinates[0][0];
      let maxLon = coordinates[0][0];
      let minLat = coordinates[0][1];
      let maxLat = coordinates[0][1];
      
      coordinates.forEach(coord => {
        if (Array.isArray(coord) && coord.length >= 2) {
          minLon = Math.min(minLon, coord[0]);
          maxLon = Math.max(maxLon, coord[0]);
          minLat = Math.min(minLat, coord[1]);
          maxLat = Math.max(maxLat, coord[1]);
        }
      });
      
      // Add some padding
      const lonPadding = (maxLon - minLon) * 0.2;
      const latPadding = (maxLat - minLat) * 0.2;
      
      // Fit the camera to the bounding box
      cameraRef.current.fitBounds(
        [minLon - lonPadding, minLat - latPadding],
        [maxLon + lonPadding, maxLat + latPadding],
        100, // Padding in pixels
        1000 // Animation duration
      );
    } catch (error) {
      console.log('Error fitting bounds:', error);
    }
  };

  // Calculate camera options based on navigation state
  const getCameraOptions = () => {
    const zoomLevel = navigationViewModel.isNavigating ? 18 : 16;
    const pitch = navigationViewModel.isNavigating ? 45 : 0;
    
    // If we have a selected vehicle, center on it
    if (selectedVehicle) {
      return {
        zoomLevel: 18,
        centerCoordinate: selectedVehicle.location.coordinates,
        pitch,
        animationDuration: 1000
      };
    }
    
    return {
      zoomLevel,
      centerCoordinate: mapViewModel.userLocationCoordinate,
      pitch,
      animationDuration: 1000
    };
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
      {/* Use standard camera positioning instead of user tracking modes */}
      <MapboxGL.Camera 
        ref={cameraRef}
        {...getCameraOptions()}
      />

      {/* Custom user location marker */}
      <MapboxGL.PointAnnotation
        id="userLocation"
        coordinate={mapViewModel.userLocationCoordinate}
        anchor={{x: 0.5, y: 0.5}}
      >
        <View style={navigationViewModel.isNavigating ? styles.navigatingMarker : styles.userMarker}>
          <View style={styles.markerInner} />
          {navigationViewModel.isNavigating && (
            <View style={styles.directionIndicator} />
          )}
        </View>
      </MapboxGL.PointAnnotation>

      {/* Destination marker */}
      {routeViewModel.destination && (
        <MapboxGL.PointAnnotation
          id="destinationLocation"
          coordinate={routeViewModel.destination}
          anchor={{x: 0.5, y: 0.5}}
        >
          <View style={styles.destinationMarker}>
            <View style={styles.markerInner} />
          </View>
        </MapboxGL.PointAnnotation>
      )}

      {/* Route line */}
      {routeViewModel.showRoute && routeViewModel.routeGeometry.geometry.coordinates.length > 0 && (
        <MapboxGL.ShapeSource id="routeSource" shape={routeViewModel.routeGeometry}>
          <MapboxGL.LineLayer
            id="routeLayer"
            style={{
              lineColor: '#3B82F6',
              lineWidth: 4,
              lineCap: 'round',
              lineJoin: 'round',
            }}
          />
        </MapboxGL.ShapeSource>
      )}
      
      {/* Add SDSM Layer */}
      <SDSMLayer 
        viewModel={sdsmViewModel}
        onVehiclePress={handleVehiclePress}
      />
      
      {children}
    </MapboxGL.MapView>
  );
});