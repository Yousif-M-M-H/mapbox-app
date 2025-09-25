// app/src/features/DirectionGuide/views/components/TurnGuideDisplay.tsx

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { observer } from 'mobx-react-lite';
import { DirectionGuideViewModel } from '../../viewModels/DirectionGuideViewModel';
import { TurnType } from '../../models/DirectionTypes';
import { 
  TurnIcon, 
  TurnSignalState, 
  TURN_ICON_VARIANTS,
  createTurnConfigFromSignals,
  // All available convenience components
  BothAllowedTurnIcon,
  BothProhibitedTurnIcon,
  BothWarningTurnIcon,
  LeftOnlyTurnIcon,
  StraightOnlyTurnIcon,
  LeftWarningTurnIcon,
  StraightWarningTurnIcon,
  LeftWarningOnlyTurnIcon,
  StraightWarningOnlyTurnIcon
} from './TurnIcon';

interface TurnGuideDisplayProps {
  directionGuideViewModel: DirectionGuideViewModel;
}

/**
 * Pure UI component for displaying turn guidance with traffic signal-aware turn icons
 */
export const TurnGuideDisplay: React.FC<TurnGuideDisplayProps> = observer(({ 
  directionGuideViewModel 
}) => {
  // Determine if we should show the turn guide
  const shouldShowGuide = shouldShowTurnGuide(directionGuideViewModel);
  
  if (!shouldShowGuide) {
    return null;
  }

  // Get turn permissions from view model (when implemented)
  // const allowLeft = directionGuideViewModel.isTurnAllowed(TurnType.LEFT);
  // const allowStraight = directionGuideViewModel.isTurnAllowed(TurnType.STRAIGHT);

  // For demonstration - you can easily switch between different states
  const allowLeft = true;
  const allowStraight = false;
  const leftWarning = false;
  const straightWarning = true; // Demo: showing straight as warning (yellow)

  return (
    <View style={styles.container}>
      <View style={styles.indicator}>
        {/* Method 1: Using the flexible TurnIcon with custom config */}
        <View style={styles.iconContainer}>
          <TurnIcon 
            leftTurn={leftWarning ? TurnSignalState.WARNING : 
                     (allowLeft ? TurnSignalState.ALLOWED : TurnSignalState.PROHIBITED)}
            straightTurn={straightWarning ? TurnSignalState.WARNING : 
                         (allowStraight ? TurnSignalState.ALLOWED : TurnSignalState.PROHIBITED)}
            size={60}
          />
        </View>
        
        {/* Method 2: Using enhanced helper function with warning support */}
        {/* 
        <View style={styles.iconContainer}>
          <TurnIcon 
            {...createTurnConfigFromSignals(
              allowLeft, 
              allowStraight, 
              leftWarning, 
              straightWarning
            )}
            size={60}
          />
        </View>
        */}
        
        {/* Method 3: Using predefined convenience components (including yellow variants) */}
        {/* 
        <View style={styles.iconContainer}>
          <BothWarningTurnIcon size={60} />
          <LeftWarningTurnIcon size={60} />
          <StraightWarningTurnIcon size={60} />
          <LeftWarningOnlyTurnIcon size={60} />
          <StraightWarningOnlyTurnIcon size={60} />
        </View>
        */}
        
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

/**
 * Example function to demonstrate how you might determine turn states
 * based on traffic signal data (to be implemented when you have real data)
 */
function getTurnStateFromTrafficSignal(
  viewModel: DirectionGuideViewModel,
  turnType: TurnType
): TurnSignalState {
  // This is where you'd integrate with actual traffic signal data
  // For now, returning based on allowed turns
  const isAllowed = viewModel.allowedTurns.includes(turnType as any as typeof viewModel.allowedTurns[number]);
  return isAllowed ? TurnSignalState.ALLOWED : TurnSignalState.PROHIBITED;
}

// ========================================
// Alternative Implementation Examples
// ========================================

/**
 * Example of how you might implement dynamic icon selection
 * based on different traffic scenarios including yellow/warning states
 */
export const DynamicTurnGuideDisplay: React.FC<TurnGuideDisplayProps> = observer(({ 
  directionGuideViewModel 
}) => {
  const shouldShowGuide = shouldShowTurnGuide(directionGuideViewModel);
  
  if (!shouldShowGuide) {
    return null;
  }

  // Example: Different logic for different scenarios including yellow/warning states
  const getIconForCurrentState = () => {
    const leftAllowed = true;
    const straightAllowed = false;
    const leftWarning = false;
    const straightWarning = true; // Demo: straight turn in warning state

    // Handle warning states first
    if (leftWarning && straightWarning) {
      return <BothWarningTurnIcon size={60} />;
    } else if (leftWarning && straightAllowed) {
      return <LeftWarningTurnIcon size={60} />;
    } else if (leftWarning && !straightAllowed) {
      return <LeftWarningOnlyTurnIcon size={60} />;
    } else if (straightWarning && leftAllowed) {
      return <StraightWarningTurnIcon size={60} />;
    } else if (straightWarning && !leftAllowed) {
      return <StraightWarningOnlyTurnIcon size={60} />;
    }
    
    // Handle normal allowed/prohibited states
    if (leftAllowed && straightAllowed) {
      return <BothAllowedTurnIcon size={60} />;
    } else if (leftAllowed && !straightAllowed) {
      return <LeftOnlyTurnIcon size={60} />;
    } else if (!leftAllowed && straightAllowed) {
      return <StraightOnlyTurnIcon size={60} />;
    } else {
      return <BothProhibitedTurnIcon size={60} />;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.indicator}>
        <View style={styles.iconContainer}>
          {getIconForCurrentState()}
        </View>
        <View style={styles.statusDot} />
      </View>
    </View>
  );
});

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