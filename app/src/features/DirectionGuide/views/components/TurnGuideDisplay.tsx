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

// Hardcoded allowed turns for each lane
const LANE_ALLOWED_TURNS: Record<number, { 
  left: boolean; 
  straight: boolean;
  right: boolean;
  label: string;
}> = {
  // Georgia lanes
  4: { left: false, straight: true, right: true, label: 'Left Lane' },
  5: { left: true, straight: false, right: false, label: 'Turning Lane' },
  8: { left: false, straight: true, right: true, label: 'Lane 8' },
  
  // Houston lanes
  103: { left: false, straight: true, right: true, label: 'Left Lane' },
  104: { left: true, straight: false, right: false, label: 'Turning Lane' },
  106: { left: false, straight: true, right: true, label: 'Lane 106' },
  108: { left: false, straight: true, right: true, label: 'Right Lane' },
  109: { left: true, straight: false, right: false, label: 'Middle Lane' },
};

/**
 * Convert SPaT SignalState to TurnSignalState
 */
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
  // Get current lane
  const currentLane = spatViewModel.currentLaneId;
  const currentIntersection = spatViewModel.currentIntersection;
  
  // Check if we should display anything
  const isGeorgiaLanes = currentLane === 4 || currentLane === 5;
  const isGeorgiaLane8 = currentLane === 8;
  const isHoustonLanes103_104 = currentLane === 103 || currentLane === 104;
  const isHoustonLanes108_109 = currentLane === 108 || currentLane === 109;
  const isHoustonLane106 = currentLane === 106;
  
  if (!isGeorgiaLanes && !isGeorgiaLane8 && !isHoustonLanes103_104 && !isHoustonLane106 && !isHoustonLanes108_109) {
    return null;
  }

  // Get the signal state and convert it to turn state
  const turnState = mapSignalStateToTurnState(spatViewModel.signalState);

  // Lane 8 (Georgia) - Show ONLY straight + right icon (NO LEFT)
  if (isGeorgiaLane8) {
    const lane8Config = LANE_ALLOWED_TURNS[8];
    
    return (
      <View style={styles.container}>
        <View style={styles.laneContainer}>
          <View style={styles.iconWrapper}>
            <Text style={styles.laneLabel}>{lane8Config.label}</Text>
            <View style={styles.iconContainer}>
              <TurnIcon 
                leftTurn={TurnSignalState.PROHIBITED}
                straightTurn={turnState}
                rightTurn={turnState}
                showLeft={false}
                size={55}
              />
            </View>
          </View>
          <View style={styles.statusDot} />
        </View>
      </View>
    );
  }

  // Lane 106 (Houston) - Show ONLY straight + right icon (NO LEFT)
  if (isHoustonLane106) {
    const lane106Config = LANE_ALLOWED_TURNS[106];
    
    return (
      <View style={styles.container}>
        <View style={styles.laneContainer}>
          <View style={styles.iconWrapper}>
            <Text style={styles.laneLabel}>{lane106Config.label}</Text>
            <View style={styles.iconContainer}>
              <TurnIcon 
                leftTurn={TurnSignalState.PROHIBITED}
                straightTurn={turnState}
                rightTurn={turnState}
                showLeft={false}
                size={55}
              />
            </View>
          </View>
          <View style={styles.statusDot} />
        </View>
      </View>
    );
  }

  // Houston Lanes 108 & 109 - REVERSED ORDER
  if (isHoustonLanes108_109) {
    const lane108Config = LANE_ALLOWED_TURNS[108];
    const lane109Config = LANE_ALLOWED_TURNS[109];

    return (
      <View style={styles.container}>
        {/* Lane 109 - Middle Lane (Left ONLY) - NOW FIRST */}
        <View style={styles.laneContainer}>
          <View style={styles.iconWrapper}>
            <Text style={styles.laneLabel}>{lane109Config.label}</Text>
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

        {/* Lane 108 - Right Lane (Straight + Right) - NOW SECOND */}
        <View style={styles.laneContainer}>
          <View style={styles.iconWrapper}>
            <Text style={styles.laneLabel}>{lane108Config.label}</Text>
            <View style={styles.iconContainer}>
              <TurnIcon 
                leftTurn={TurnSignalState.PROHIBITED}
                straightTurn={turnState}
                rightTurn={turnState}
                showLeft={false}
                size={55}
              />
            </View>
          </View>
          <View style={styles.statusDot} />
        </View>
      </View>
    );
  }

  // Houston Lanes 103 & 104 - REVERSED ORDER
  if (isHoustonLanes103_104) {
    const lane103Config = LANE_ALLOWED_TURNS[103];
    const lane104Config = LANE_ALLOWED_TURNS[104];

    return (
      <View style={styles.container}>
        {/* Lane 104 - Turning Lane (Left ONLY) - NOW FIRST */}
        <View style={styles.laneContainer}>
          <View style={styles.iconWrapper}>
            <Text style={styles.laneLabel}>{lane104Config.label}</Text>
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

        {/* Lane 103 - Left Lane (Straight + Right) - NOW SECOND */}
        <View style={styles.laneContainer}>
          <View style={styles.iconWrapper}>
            <Text style={styles.laneLabel}>{lane103Config.label}</Text>
            <View style={styles.iconContainer}>
              <TurnIcon 
                leftTurn={TurnSignalState.PROHIBITED}
                straightTurn={turnState}
                rightTurn={turnState}
                showLeft={false}
                size={55}
              />
            </View>
          </View>
          <View style={styles.statusDot} />
        </View>
      </View>
    );
  }

  // Georgia Lanes 4 & 5 - REVERSED ORDER
  const lane4Config = LANE_ALLOWED_TURNS[4];
  const lane5Config = LANE_ALLOWED_TURNS[5];

  return (
    <View style={styles.container}>
      {/* Lane 5 - Turning Lane (Left ONLY) - NOW FIRST */}
      <View style={styles.laneContainer}>
        <View style={styles.iconWrapper}>
          <Text style={styles.laneLabel}>{lane5Config.label}</Text>
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

      {/* Lane 4 - Left Lane (Straight + Right) - NOW SECOND */}
      <View style={styles.laneContainer}>
        <View style={styles.iconWrapper}>
          <Text style={styles.laneLabel}>{lane4Config.label}</Text>
          <View style={styles.iconContainer}>
            <TurnIcon 
              leftTurn={TurnSignalState.PROHIBITED}
              straightTurn={turnState}
              rightTurn={turnState}
              showLeft={false}
              size={55}
            />
          </View>
        </View>
        <View style={styles.statusDot} />
      </View>
    </View>
  );
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