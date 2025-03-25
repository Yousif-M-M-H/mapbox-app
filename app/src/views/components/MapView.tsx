// src/views/components/MapView.tsx
import React, { useEffect, useRef } from 'react';
import { View } from 'react-native';
import MapboxGL from '@rnmapbox/maps';
import { observer } from 'mobx-react-lite';
import { mapStyles } from '../../styles/mapStyles';
import { MapViewModel } from '../../viewModel/MapViewModel';

interface MapViewProps {
  viewModel: MapViewModel;
}

export const MapViewComponent: React.FC<MapViewProps> = observer(({ viewModel }) => {
  const mapRef = useRef<MapboxGL.MapView>(null);
  const cameraRef = useRef<MapboxGL.Camera>(null);
  
  // Effect to fit the route on the screen when route changes
  useEffect(() => {
    if (viewModel.showRoute && 
        viewModel.routeGeometry.geometry.coordinates.length > 0 && 
        !viewModel.isNavigating) {
      // Delay to ensure map is ready before fitting bounds
      setTimeout(() => fitToRoute(), 500);
    }
  }, [viewModel.showRoute, viewModel.routeGeometry, viewModel.isNavigating]);
  
  // Function to make camera fit the entire route
  const fitToRoute = () => {
    if (!mapRef.current || !cameraRef.current) return;
    
    const coordinates = viewModel.routeGeometry.geometry.coordinates;
    
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
    const zoomLevel = viewModel.isNavigating ? 18 : 16;
    const pitch = viewModel.isNavigating ? 45 : 0;
    
    return {
      zoomLevel,
      centerCoordinate: viewModel.userLocationCoordinate,
      pitch,
      animationDuration: 1000
    };
  };

  return (
    <MapboxGL.MapView 
      ref={mapRef}
      style={mapStyles.map} 
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
        coordinate={viewModel.userLocationCoordinate}
        anchor={{x: 0.5, y: 0.5}}
      >
        <View style={viewModel.isNavigating ? mapStyles.navigatingMarker : mapStyles.userMarker}>
          <View style={mapStyles.markerInner} />
          {viewModel.isNavigating && (
            <View style={mapStyles.directionIndicator} />
          )}
        </View>
      </MapboxGL.PointAnnotation>

      {/* Destination marker */}
      {viewModel.destinationLocationCoordinate && (
        <MapboxGL.PointAnnotation
          id="destinationLocation"
          coordinate={viewModel.destinationLocationCoordinate}
          anchor={{x: 0.5, y: 0.5}}
        >
          <View style={mapStyles.destinationMarker}>
            <View style={mapStyles.markerInner} />
          </View>
        </MapboxGL.PointAnnotation>
      )}

      {/* Route line */}
      {viewModel.showRoute && viewModel.routeGeometry.geometry.coordinates.length > 0 && (
        <MapboxGL.ShapeSource id="routeSource" shape={viewModel.routeGeometry}>
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
    </MapboxGL.MapView>
  );
});