import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { observer } from 'mobx-react-lite';
import { styles } from '../../styles';
import { RouteViewModel } from '../../viewmodels/RouteViewModel';

interface RouteInfoProps {
  viewModel: RouteViewModel;
}

export const RouteInfo: React.FC<RouteInfoProps> = observer(({ viewModel }) => {
  if (!viewModel.showRoute || viewModel.isNavigating) return null;

  return (
    <View style={styles.container}>
      <View style={styles.infoRow}>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Distance</Text>
          <Text style={styles.infoValue}>{viewModel.formattedDistance}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Duration</Text>
          <Text style={styles.infoValue}>{viewModel.formattedDuration}</Text>
        </View>
      </View>
      
      <TouchableOpacity 
        style={styles.startButton}
        onPress={() => viewModel.startNavigation()}
      >
        <Text style={styles.startButtonText}>Start Navigation</Text>
      </TouchableOpacity>
    </View>
  );
});