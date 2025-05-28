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
  // Don't show if not within 40 meters or no data
  if (!directionGuideViewModel.showTurnGuide || !directionGuideViewModel.intersectionData) {
    return null;
  }

  const allowedTurns = directionGuideViewModel.allowedTurns;

  // Get full turn words
  const getTurnWord = (turnType: TurnType): string => {
    switch (turnType) {
      case TurnType.LEFT: return 'LEFT';
      case TurnType.RIGHT: return 'RIGHT';
      case TurnType.STRAIGHT: return 'STRAIGHT';
      case TurnType.U_TURN: return 'U-TURN';
      default: return 'UNKNOWN';
    }
  };

  // Filter only allowed turns and create text
  const allowedTurnsList = allowedTurns.filter(turn => turn.allowed);
  const turnsText = allowedTurnsList.map(turn => getTurnWord(turn.type)).join(' • ');

  if (allowedTurnsList.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>ALLOWED TURNS</Text>
      <Text style={styles.turnsText}>{turnsText}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 120,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    borderWidth: 2,
    borderColor: '#4285F4',
    alignItems: 'center',
    maxWidth: 200,
  },
  label: {
    fontSize: 10,
    color: '#666',
    fontWeight: 'bold',
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  turnsText: {
    fontSize: 12,
    color: '#4285F4',
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 14,
  },
});