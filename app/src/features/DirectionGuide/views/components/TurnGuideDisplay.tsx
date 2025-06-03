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
  // Check display conditions
  const shouldShow = directionGuideViewModel.showTurnGuide && 
                     directionGuideViewModel.intersectionData !== null;
  
  if (!shouldShow) {
    return null;
  }

  const allowedTurns = directionGuideViewModel.allowedTurns;
  const allowedTurnsList = allowedTurns.filter(turn => turn.allowed);
  
  if (allowedTurnsList.length === 0) {
    return null;
  }

  const currentApproachName = directionGuideViewModel.currentApproachName;

  // Turn icon mapping
  const getTurnIcon = (turnType: TurnType): string => {
    switch (turnType) {
      case TurnType.LEFT: return '←';
      case TurnType.RIGHT: return '→';
      case TurnType.STRAIGHT: return '↑';
      case TurnType.U_TURN: return '↺';
      default: return '?';
    }
  };

  // Turn label mapping
  const getTurnLabel = (turnType: TurnType): string => {
    switch (turnType) {
      case TurnType.LEFT: return 'LEFT';
      case TurnType.RIGHT: return 'RIGHT';
      case TurnType.STRAIGHT: return 'STRAIGHT';
      case TurnType.U_TURN: return 'U-TURN';
      default: return 'UNKNOWN';
    }
  };

  console.log(`Showing ${allowedTurnsList.length} turns: ${allowedTurnsList.map(t => t.type).join(', ')}`);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>ALLOWED TURNS</Text>
        <Text style={styles.approachText}>{currentApproachName}</Text>
      </View>

      {/* Turn Icons */}
      <View style={styles.turnsContainer}>
        {allowedTurnsList.map((turn) => (
          <View key={turn.type} style={styles.turnItem}>
            <View style={styles.turnIconContainer}>
              <Text style={styles.turnIcon}>{getTurnIcon(turn.type)}</Text>
            </View>
            <Text style={styles.turnLabel}>{getTurnLabel(turn.type)}</Text>
          </View>
        ))}
      </View>

      {/* Footer */}
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
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: 16,
    padding: 18,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    borderWidth: 3,
    borderColor: '#4285F4',
  },
  header: {
    alignItems: 'center',
    marginBottom: 14,
  },
  headerText: {
    fontSize: 16,
    color: '#4285F4',
    fontWeight: 'bold',
    letterSpacing: 1.2,
  },
  approachText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontWeight: '500',
  },
  turnsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginVertical: 12,
  },
  turnItem: {
    alignItems: 'center',
    flex: 1,
  },
  turnIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#4285F4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    elevation: 3,
    shadowColor: '#4285F4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  turnIcon: {
    fontSize: 26,
    color: 'white',
    fontWeight: 'bold',
  },
  turnLabel: {
    fontSize: 11,
    color: '#4285F4',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  footerText: {
    fontSize: 11,
    color: '#888',
    textAlign: 'center',
    fontWeight: '500',
  },
});