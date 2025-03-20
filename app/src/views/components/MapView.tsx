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
    if (viewModel.showRoute && viewModel.routeGeometry.geometry.coordinates.length > 0) {
      fitToRoute();
    }
  }, [viewModel.showRoute, viewModel.routeGeometry]);
  
  // Function to make camera fit the entire route
  const fitToRoute = () => {
    if (!mapRef.current || !cameraRef.current) return;
    
    const coordinates = viewModel.routeGeometry.geometry.coordinates;
    
    if (coordinates.length < 2) return;
    
    // Find the bounding box of the route
    let minLon = coordinates[0][0];
    let maxLon = coordinates[0][0];
    let minLat = coordinates[0][1];
    let maxLat = coordinates[0][1];
    
    coordinates.forEach(coord => {
      minLon = Math.min(minLon, coord[0]);
      maxLon = Math.max(maxLon, coord[0]);
      minLat = Math.min(minLat, coord[1]);
      maxLat = Math.max(maxLat, coord[1]);
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
  };

  return (
    <MapboxGL.MapView 
      ref={mapRef}
      style={mapStyles.map} 
      styleURL="mapbox://styles/mapbox/streets-v12"
    >
      <MapboxGL.Camera 
        ref={cameraRef}
        zoomLevel={16}
        centerCoordinate={viewModel.centerCoordinate}
        animationDuration={1000}
      />

      {/* User location marker */}
      <MapboxGL.PointAnnotation
        id="userLocation"
        coordinate={viewModel.userLocationCoordinate}
      >
        <View style={mapStyles.userMarker}>
          <View style={mapStyles.markerInner} />
        </View>
        <MapboxGL.Callout title="Your Location" />
      </MapboxGL.PointAnnotation>

      {/* Destination marker */}
      {viewModel.destinationLocationCoordinate && (
        <MapboxGL.PointAnnotation
          id="destinationLocation"
          coordinate={viewModel.destinationLocationCoordinate}
        >
          <View style={mapStyles.destinationMarker}>
            <View style={mapStyles.markerInner} />
          </View>
          <MapboxGL.Callout title={viewModel.selectedDestination?.placeName || 'Destination'} />
        </MapboxGL.PointAnnotation>
      )}

      {/* Route line */}
      {viewModel.showRoute && (
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