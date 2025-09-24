// app/src/features/DirectionGuide/views/components/TurnGuideDisplay.tsx

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { observer } from 'mobx-react-lite';
import { DirectionGuideViewModel } from '../../viewModels/DirectionGuideViewModel';
import { TurnType } from '../../models/DirectionTypes';
import { CombinedTurnIcon } from './CombinedTurnIcon';

interface TurnGuideDisplayProps {
  directionGuideViewModel: DirectionGuideViewModel;
}

/**
 * Pure UI component for displaying turn guidance with combined turn icon
 */
export const TurnGuideDisplay: React.FC<TurnGuideDisplayProps> = observer(({ 
  directionGuideViewModel 
}) => {
  // Determine if we should show the turn guide
  const shouldShowGuide = shouldShowTurnGuide(directionGuideViewModel);
  
  if (!shouldShowGuide) {
    return null;
  }

 
  
  const allowLeft = directionGuideViewModel.isTurnAllowed(TurnType.LEFT);
  const allowStraight = directionGuideViewModel.isTurnAllowed(TurnType.STRAIGHT);

  return (
    <View style={styles.container}>
      <View style={styles.indicator}>
        {/* Combined Turn Icon */}
        <View style={styles.iconContainer}>
          <CombinedTurnIcon 
            allowLeft={allowLeft}
            allowStraight={allowStraight}
            size={60}
          />
        </View>
        
        <View style={styles.statusDot} />
      </View>
    </View>
  );
});

// ========================================
// Helper Functions
// ========================================

/**
 * Determine if turn guide should be shown
 */
function shouldShowTurnGuide(viewModel: DirectionGuideViewModel): boolean {
  const isInLane = viewModel.detectedLaneIds.length > 0;
  const hasTurnData = viewModel.allowedTurns.length > 0;
  
  return isInLane && hasTurnData;
}

// ========================================
// Styles
// ========================================

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 150,
    right: 16,
    zIndex: 1000,
  },
  indicator: {
    alignItems: 'center',
  },
  iconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: 35,
    padding: 10,
    elevation: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    borderWidth: 0.5,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
   statusDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#1a73e8',
    marginTop: 6,  
    opacity: 0.8,
    elevation: 2,
    shadowColor: '#1a73e8',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.4,
    shadowRadius: 2,
  },
});