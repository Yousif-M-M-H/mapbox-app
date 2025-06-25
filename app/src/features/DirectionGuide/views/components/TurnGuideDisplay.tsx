// app/src/features/DirectionGuide/views/components/TurnGuideDisplay.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { observer } from 'mobx-react-lite';
import { DirectionGuideViewModel } from '../../viewModels/DirectionGuideViewModel';
import { TurnType } from '../../models/DirectionTypes';

interface TurnGuideDisplayProps {
  directionGuideViewModel: DirectionGuideViewModel;
}

export const TurnGuideDisplay: React.FC<TurnGuideDisplayProps> = observer(({ 
  directionGuideViewModel 
}) => {
  // VERY precise conditions: only show when car is actually inside a lane with available turns
  const isInLane = directionGuideViewModel.detectedLaneIds.length > 0;
  const hasTurnData = directionGuideViewModel.intersectionData !== null;
  const hasAllowedTurns = directionGuideViewModel.turnsAvailable > 0;
  
  const shouldShow = isInLane && hasTurnData && hasAllowedTurns;
  
  if (!shouldShow) {
    return null;
  }

  const allowedTurns = directionGuideViewModel.allowedTurns.filter(turn => turn.allowed);

  const getTurnIcon = (turnType: TurnType): string => {
    switch (turnType) {
      case TurnType.LEFT: return '⬅';
      case TurnType.RIGHT: return '➡';
      case TurnType.STRAIGHT: return '⬆';
      case TurnType.U_TURN: return '🔄';
      default: return '?';
    }
  };

  const getTurnColor = (turnType: TurnType): string => {
    switch (turnType) {
      case TurnType.LEFT: return '#1a73e8';      // Blue
      case TurnType.RIGHT: return '#137333';     // Green
      case TurnType.STRAIGHT: return '#d93025';  // Red
      case TurnType.U_TURN: return '#f9ab00';    // Yellow
      default: return '#5f6368';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.indicator}>
        {/* Lane indicator */}
  
        
        {/* Turn icons */}
        <View style={styles.iconsContainer}>
          {allowedTurns.map((turn, index) => (
            <View 
              key={turn.type} 
              style={[
                styles.turnCircle,
                { backgroundColor: getTurnColor(turn.type) },
                index > 0 && styles.turnCircleSpacing
              ]}
            >
              <View style={styles.innerCircle}>
                <Text style={styles.turnIcon}>{getTurnIcon(turn.type)}</Text>
              </View>
            </View>
          ))}
        </View>
        
        <View style={styles.statusDot} />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 30,
    right: 16,
    zIndex: 1000,
  },
  indicator: {
    alignItems: 'center',
  },
  laneIndicator: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 8,
  },
  laneText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  iconsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: 26,
    paddingVertical: 8,
    paddingHorizontal: 10,
    elevation: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    borderWidth: 0.5,
    borderColor: 'rgba(0, 0, 0, 0.06)',
  },
  turnCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  innerCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  turnCircleSpacing: {
    marginLeft: 8,
  },
  turnIcon: {
    fontSize: 20,
    color: 'white',
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
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