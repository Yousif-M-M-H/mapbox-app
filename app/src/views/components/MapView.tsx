import React from 'react';
import { View } from 'react-native';
import MapboxGL from '@rnmapbox/maps';
import { observer } from 'mobx-react-lite';
import { mapStyles } from '../../styles/mapStyles';
import { MapViewModel } from '../../viewModel/MapViewModel';

interface MapViewProps {
  viewModel: MapViewModel;
}

export const MapViewComponent: React.FC<MapViewProps> = observer(({ viewModel }) => {
  return (
    <MapboxGL.MapView 
      style={mapStyles.map} 
      styleURL="mapbox://styles/mapbox/streets-v12"
    >
      <MapboxGL.Camera 
        zoomLevel={13}
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
      <MapboxGL.PointAnnotation
        id="destinationLocation"
        coordinate={viewModel.destinationLocationCoordinate}
      >
        <View style={mapStyles.destinationMarker}>
          <View style={mapStyles.markerInner} />
        </View>
        <MapboxGL.Callout title="University of Tennessee at Chattanooga" />
      </MapboxGL.PointAnnotation>

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