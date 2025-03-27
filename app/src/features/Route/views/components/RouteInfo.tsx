// src/features/Route/views/components/RouteInfo.tsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { observer } from 'mobx-react-lite';
import { styles } from '../../styles';
import { RouteViewModel } from '../../viewmodels/RouteViewModel';
import { NavigationViewModel } from '../../../Navigation/viewmodels/NavigationViewModel';

interface RouteInfoProps {
  routeViewModel: RouteViewModel;
  navigationViewModel: NavigationViewModel;
  destinationTitle: string;
}

export const RouteInfo: React.FC<RouteInfoProps> = observer(({ 
  routeViewModel, 
  navigationViewModel,
  destinationTitle
}) => {
  if (!routeViewModel.showRoute || navigationViewModel.isNavigating) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{destinationTitle}</Text>
      <View style={styles.infoRow}>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Distance</Text>
          <Text style={styles.infoValue}>{routeViewModel.formattedDistance}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Duration</Text>
          <Text style={styles.infoValue}>{routeViewModel.formattedDuration}</Text>
        </View>
      </View>
      
      <TouchableOpacity 
        style={styles.startButton}
        onPress={() => navigationViewModel.startNavigation()}
      >
        <Text style={styles.startButtonText}>Start Navigation</Text>
      </TouchableOpacity>
    </View>
  );
});