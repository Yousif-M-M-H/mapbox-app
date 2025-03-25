// src/views/components/RouteInfo.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { observer } from 'mobx-react-lite';
import { MapViewModel } from '../../viewModel/MapViewModel';
import { routeInfoStyles } from '../../styles/routeInfoStyles';

interface RouteInfoProps {
  viewModel: MapViewModel;
}

export const RouteInfo: React.FC<RouteInfoProps> = observer(({ viewModel }) => {
  if (!viewModel.showRoute || viewModel.isNavigating) return null;

  return (
    <View style={routeInfoStyles.container}>
      <View style={routeInfoStyles.infoRow}>
        <View style={routeInfoStyles.infoItem}>
          <Text style={routeInfoStyles.infoLabel}>Distance</Text>
          <Text style={routeInfoStyles.infoValue}>{viewModel.formattedDistance}</Text>
        </View>
        <View style={routeInfoStyles.divider} />
        <View style={routeInfoStyles.infoItem}>
          <Text style={routeInfoStyles.infoLabel}>Duration</Text>
          <Text style={routeInfoStyles.infoValue}>{viewModel.formattedDuration}</Text>
        </View>
      </View>
      
      <TouchableOpacity 
        style={routeInfoStyles.startButton}
        onPress={() => viewModel.startNavigation()}
      >
        <Text style={routeInfoStyles.startButtonText}>Start Navigation</Text>
      </TouchableOpacity>
    </View>
  );
});