// app/src/features/SpatService/views/SpatStatusDisplay.tsx

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { observer } from 'mobx-react-lite';
import { SpatViewModel } from '../viewModels/SpatViewModel';

interface SpatStatusDisplayProps {
  userPosition: [number, number]; // [lat, lng]
  spatViewModel?: SpatViewModel;
}

export const SpatStatusDisplay: React.FC<SpatStatusDisplayProps> = observer(({ userPosition, spatViewModel }) => {
  const viewModelRef = useRef<SpatViewModel>(new SpatViewModel());
  const viewModel = spatViewModel || viewModelRef.current;

  useEffect(() => {
    // Update user position in view model
    viewModel.setUserPosition(userPosition);

    // Start monitoring when component mounts (only if using internal view model)
    if (!spatViewModel) {
      viewModel.startMonitoring();
    }

    return () => {
      // Cleanup when component unmounts (only if using internal view model)
      if (!spatViewModel) {
        viewModel.cleanup();
      }
    };
  }, [viewModel, spatViewModel]);

  // Update position when it changes
  useEffect(() => {
    viewModel.setUserPosition(userPosition);
  }, [userPosition, viewModel]);

  // CRITICAL: Never display for Georgia lanes 6 and 7 (no signal groups)
  if (viewModel.currentLaneId === 6 || viewModel.currentLaneId === 7) {
    return null;
  }

  // Don't show if no signal data available
  if (!viewModel.shouldShowDisplay) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Signal indicator */}
      <View style={[styles.signalIndicator, { backgroundColor: viewModel.signalColor }]} />

      {/* Signal text */}
      <Text style={[styles.signalText, { color: viewModel.signalColor }]}>
        {viewModel.signalStatusText}
      </Text>

      {/* Lane and signal group indicator */}
      <Text style={styles.laneText}>
        {viewModel.laneDisplayText}
      </Text>

      {/* Loading indicator (optional) */}
      {viewModel.isLoading && (
        <Text style={styles.loadingText}>...</Text>
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
  laneText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#6b7280',
    marginLeft: 8,
  },
  loadingText: {
    fontSize: 10,
    color: '#6b7280',
    marginLeft: 4,
  },
});