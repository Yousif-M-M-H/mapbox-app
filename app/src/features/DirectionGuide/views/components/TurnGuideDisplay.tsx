// app/src/features/DirectionGuide/views/components/TurnGuideDisplay.tsx

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { observer } from 'mobx-react-lite';
import { TurnIcon, TurnSignalState } from './TurnIcon';
import { SpatViewModel } from '../../../SpatService/viewModels/SpatViewModel';
import { SignalState } from '../../../SpatService/models/SpatModels';

interface TurnGuideDisplayProps {
  spatViewModel: SpatViewModel;
}

function mapSignalStateToTurnState(signalState: SignalState): TurnSignalState {
  switch (signalState) {
    case SignalState.GREEN:
      return TurnSignalState.ALLOWED;
    case SignalState.YELLOW:
      return TurnSignalState.WARNING;
    case SignalState.RED:
      return TurnSignalState.PROHIBITED;
    default:
      return TurnSignalState.PROHIBITED;
  }
}

export const TurnGuideDisplay: React.FC<TurnGuideDisplayProps> = observer(({ 
  spatViewModel 
}) => {
  if (!spatViewModel.shouldShowDisplay) {
    return null;
  }

  const currentLaneId = spatViewModel.currentLaneId;
  
  if (!currentLaneId) {
    return null;
  }

  const turnState = mapSignalStateToTurnState(spatViewModel.signalState);

  const isGeorgiaLanes4_5 = currentLaneId === 4 || currentLaneId === 5;
  const isGeorgiaLane1 = currentLaneId === 1;
  const isGeorgiaLane8 = currentLaneId === 8;

  if (isGeorgiaLane1) {
    return (
      <View style={styles.container}>
        <View style={styles.laneContainer}>
          <View style={styles.iconWrapper}>
            <Text style={styles.laneLabel}>Right Lane</Text>
            <View style={styles.iconContainer}>
              <TurnIcon 
                leftTurn={TurnSignalState.PROHIBITED}
                straightTurn={turnState}
                rightTurn={TurnSignalState.ALLOWED}
                showLeft={false}
                size={55}
              />
            </View>
            <Text style={styles.yieldWarning}>⚠️ YIELD</Text>
          </View>
          <View style={[styles.statusDot, styles.yieldDot]} />
        </View>
      </View>
    );
  }

  if (isGeorgiaLane8) {
    return (
      <View style={styles.container}>
        <View style={styles.laneContainer}>
          <View style={styles.iconWrapper}>
            <Text style={styles.laneLabel}>Right Lane</Text>
            <View style={styles.iconContainer}>
              <TurnIcon 
                leftTurn={TurnSignalState.PROHIBITED}
                straightTurn={turnState}
                rightTurn={TurnSignalState.ALLOWED}
                showLeft={false}
                size={55}
              />
            </View>
            <Text style={styles.yieldWarning}>⚠️ YIELD</Text>
          </View>
          <View style={[styles.statusDot, styles.yieldDot]} />
        </View>
      </View>
    );
  }

  if (isGeorgiaLanes4_5) {
    return (
      <View style={styles.container}>
        <View style={styles.laneContainer}>
          <View style={styles.iconWrapper}>
            <Text style={styles.laneLabel}>Turning Lane</Text>
            <View style={styles.iconContainer}>
              <TurnIcon 
                leftTurn={turnState}
                straightTurn={TurnSignalState.PROHIBITED}
                rightTurn={TurnSignalState.PROHIBITED}
                showStraight={false}
                showRight={false}
                size={55}
              />
            </View>
          </View>
          <View style={styles.statusDot} />
        </View>

        <View style={styles.laneContainer}>
          <View style={styles.iconWrapper}>
            <Text style={styles.laneLabel}>Left Lane</Text>
            <View style={styles.iconContainer}>
              <TurnIcon 
                leftTurn={TurnSignalState.PROHIBITED}
                straightTurn={turnState}
                rightTurn={TurnSignalState.ALLOWED}
                showLeft={false}
                size={55}
              />
            </View>
            <Text style={styles.yieldWarning}>⚠️ YIELD</Text>
          </View>
          <View style={[styles.statusDot, styles.yieldDot]} />
        </View>
      </View>
    );
  }

  return null;
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 150,
    right: 16,
    flexDirection: 'row',
    gap: 10,
    zIndex: 1000,
  },
  laneContainer: {
    alignItems: 'center',
  },
  iconWrapper: {
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: 20,
    padding: 12,
    paddingTop: 8,
    elevation: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    borderWidth: 0.5,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    alignItems: 'center',
    minWidth: 85,
  },
  laneLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#4b5563',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
    textAlign: 'center',
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  yieldWarning: {
    fontSize: 8,
    fontWeight: '900',
    color: '#f59e0b',
    marginTop: 4,
    textAlign: 'center',
    letterSpacing: 0.3,
    textShadowColor: 'rgba(245, 158, 11, 0.3)',
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
  yieldDot: {
    backgroundColor: '#f59e0b',
    shadowColor: '#f59e0b',
  },
});