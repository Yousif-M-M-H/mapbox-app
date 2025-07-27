// app/src/features/SpatService/views/SpatStatusDisplay.tsx
// Enhanced with countdown display using existing API fields

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

  // NEW: Get countdown from DirectionGuide (we'll need to add this property)
  const countdown = directionGuideViewModel.spatCountdown;
  const hasCountdown = countdown?.hasCountdown || false;
  const formattedTime = countdown?.formattedTime || '';

  const signalColor = getSignalColor(spatStatus.state);
  const signalText = getSignalText(spatStatus.state);

  return (
    <View style={styles.container}>
      {/* Signal indicator */}
      <View style={[styles.signalIndicator, { backgroundColor: signalColor }]} />
      
      {/* Signal text */}
      <Text style={[styles.signalText, { color: signalColor }]}>
        {signalText}
      </Text>
      
      {/* NEW: Countdown display - positioned next to signal */}
      {hasCountdown && formattedTime && (
        <View style={styles.countdownContainer}>
          <Text style={styles.countdownText}>
            {formattedTime}
          </Text>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
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
  signalText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  // NEW: Countdown styles - positioned next to signal text
  countdownContainer: {
    marginLeft: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    borderRadius: 6,
    minWidth: 32,
    alignItems: 'center',
  },
  countdownText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1f2937',
    fontFamily: 'monospace', // Better for numbers
  },
});