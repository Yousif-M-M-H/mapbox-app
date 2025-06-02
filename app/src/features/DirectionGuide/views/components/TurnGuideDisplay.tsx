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
  // Only show when vehicle is in polygon and we have data
  if (!directionGuideViewModel.showTurnGuide || !directionGuideViewModel.intersectionData) {
    return null;
  }

  const allowedTurns = directionGuideViewModel.allowedTurns;
  const currentApproachName = directionGuideViewModel.currentApproachName;

  // Get turn icons
  const getTurnIcon = (turnType: TurnType): string => {
    switch (turnType) {
      case TurnType.LEFT: return '←';
      case TurnType.RIGHT: return '→';
      case TurnType.STRAIGHT: return '↑';
      case TurnType.U_TURN: return '↺';
      default: return '?';
    }
  };

  // Get turn words
  const getTurnWord = (turnType: TurnType): string => {
    switch (turnType) {
      case TurnType.LEFT: return 'LEFT';
      case TurnType.RIGHT: return 'RIGHT';
      case TurnType.STRAIGHT: return 'STRAIGHT';
      case TurnType.U_TURN: return 'U-TURN';
      default: return 'UNKNOWN';
    }
  };

  // Filter only allowed turns
  const allowedTurnsList = allowedTurns.filter(turn => turn.allowed);

  if (allowedTurnsList.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>ALLOWED TURNS</Text>
        <Text style={styles.approachText}>{currentApproachName}</Text>
      </View>

      {/* Turn Icons Row */}
      <View style={styles.turnsContainer}>
        {allowedTurnsList.map((turn) => (
          <View key={turn.type} style={styles.turnItem}>
            <View style={styles.turnIconContainer}>
              <Text style={styles.turnIcon}>{getTurnIcon(turn.type)}</Text>
            </View>
            <Text style={styles.turnLabel}>{getTurnWord(turn.type)}</Text>
          </View>
        ))}
      </View>

      {/* Footer info */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {allowedTurnsList.length} turn{allowedTurnsList.length !== 1 ? 's' : ''} available • 
          Lanes {directionGuideViewModel.currentApproachPolygon?.lanes.join(' & ')}
        </Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderRadius: 16,
    padding: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    borderWidth: 2,
    borderColor: '#4285F4',
  },
  header: {
    alignItems: 'center',
    marginBottom: 12,
  },
  headerText: {
    fontSize: 14,
    color: '#4285F4',
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  approachText: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  turnsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginVertical: 8,
  },
  turnItem: {
    alignItems: 'center',
    flex: 1,
  },
  turnIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#4285F4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#4285F4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  turnIcon: {
    fontSize: 24,
    color: 'white',
    fontWeight: 'bold',
  },
  turnLabel: {
    fontSize: 10,
    color: '#4285F4',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  footerText: {
    fontSize: 10,
    color: '#888',
    textAlign: 'center',
  },
});