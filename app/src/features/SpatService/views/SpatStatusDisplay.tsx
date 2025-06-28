// app/src/features/SpatService/views/SpatStatusDisplay.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { observer } from 'mobx-react-lite';
import { DirectionGuideViewModel } from '../../DirectionGuide/viewModels/DirectionGuideViewModel';
import { SignalState } from '../models/SpatModels';

interface SpatStatusDisplayProps {
  directionGuideViewModel: DirectionGuideViewModel;
}

export const SpatStatusDisplay: React.FC<SpatStatusDisplayProps> = observer(({ 
  directionGuideViewModel 
}) => {
  // Only show when car is in a lane with SPaT data
  const isInLane = directionGuideViewModel.detectedLaneIds.length > 0;
  const hasSpatData = directionGuideViewModel.hasSpatData;
  const spatStatus = directionGuideViewModel.spatStatus;
  
  const shouldShow = isInLane && hasSpatData;
  
  if (!shouldShow) {
    return null;
  }

  const getSignalColor = (state: SignalState): string => {
    switch (state) {
      case SignalState.GREEN: return '#22c55e';
      case SignalState.YELLOW: return '#eab308';
      case SignalState.RED: return '#ef4444';
      default: return '#9ca3af';
    }
  };

  const getSignalText = (state: SignalState): string => {
    switch (state) {
      case SignalState.GREEN: return 'GO';
      case SignalState.YELLOW: return 'CAUTION';
      case SignalState.RED: return 'STOP';
      default: return 'NO SIGNAL';
    }
  };

  const signalColor = getSignalColor(spatStatus.state);
  const signalText = getSignalText(spatStatus.state);

  return (
    <View style={styles.container}>
      <View style={[styles.signalIndicator, { backgroundColor: signalColor }]} />
      <Text style={[styles.signalText, { color: signalColor }]}>
        {signalText}
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100, // Position above turn guide
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    borderWidth: 0.5,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    zIndex: 999,
  },
  warningContainer: {
    borderWidth: 2,
    borderColor: '#f59e0b',
    backgroundColor: 'rgba(255, 237, 213, 0.95)',
  },
  signalIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  warningIndicator: {
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  signalText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  warningIcon: {
    fontSize: 12,
    marginLeft: 4,
  },
});