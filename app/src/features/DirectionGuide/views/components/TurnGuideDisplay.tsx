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
  yieldMode?: boolean;
}> = {
  // Georgia lanes
  1: { left: false, straight: true, right: true, label: 'Right Lane', yieldMode: true },
  2: { left: true, straight: false, right: false, label: 'Turning Lane' },
  4: { left: false, straight: true, right: true, label: 'Left Lane', yieldMode: true },
  5: { left: true, straight: false, right: false, label: 'Turning Lane' },
  8: { left: false, straight: true, right: true, label: 'Right Lane', yieldMode: true }, // UPDATED
  
  // Houston lanes
  103: { left: false, straight: true, right: true, label: 'Left Lane' },
  104: { left: true, straight: false, right: false, label: 'Turning Lane' },
  106: { left: false, straight: true, right: true, label: 'Right Lane' },
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
  
  // CRITICAL: Never display for Georgia lanes 6 and 7 (no signal groups)
  if (currentLane === 6 || currentLane === 7) {
    return null;
  }
  
  // Check if we should display anything
  const isGeorgiaLanes1_2 = currentLane === 1 || currentLane === 2;
  const isGeorgiaLanes4_5 = currentLane === 4 || currentLane === 5;
  const isGeorgiaLane8 = currentLane === 8;
  const isHoustonLanes103_104 = currentLane === 103 || currentLane === 104;
  const isHoustonLanes108_109 = currentLane === 108 || currentLane === 109;
  const isHoustonLane106 = currentLane === 106;
  
  if (!isGeorgiaLanes1_2 && 
      !isGeorgiaLanes4_5 && 
      !isGeorgiaLane8 && 
      !isHoustonLanes103_104 && 
      !isHoustonLane106 && 
      !isHoustonLanes108_109) {
    return null;
  }

  // Get the signal state and convert it to turn state
  const turnState = mapSignalStateToTurnState(spatViewModel.signalState);

  // ========================================
  // Georgia Lanes 1 & 2 (WITH YIELD MODE)
  // ========================================
  if (isGeorgiaLanes1_2) {
    const lane2Config = LANE_ALLOWED_TURNS[2];
    const lane1Config = LANE_ALLOWED_TURNS[1];
    
    return (
      <View style={styles.container}>
        {/* Lane 2 - Turning Lane (Left ONLY) - Signal Based */}
        <View style={styles.laneContainer}>
          <View style={styles.iconWrapper}>
            <Text style={styles.laneLabel}>{lane2Config.label}</Text>
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

        {/* Lane 1 - Right Lane (Straight + Right) - YIELD MODE */}
        <View style={styles.laneContainer}>
          <View style={styles.iconWrapper}>
            <Text style={styles.laneLabel}>{lane1Config.label}</Text>
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

  // ========================================
  // Georgia Lane 8 - Right Lane (WITH YIELD MODE)
  // ========================================
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
                rightTurn={TurnSignalState.ALLOWED} // Always green for right turn
                showLeft={false}
                size={55}
              />
            </View>
            {/* Yield Warning for Right Turn */}
            <Text style={styles.yieldWarning}>⚠️ YIELD</Text>
          </View>
          <View style={[styles.statusDot, styles.yieldDot]} />
        </View>
      </View>
    );
  }

  // ========================================
  // Houston Lane 106
  // ========================================
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

  // ========================================
  // Houston Lanes 108 & 109 - REVERSED ORDER
  // ========================================
  if (isHoustonLanes108_109) {
    const lane108Config = LANE_ALLOWED_TURNS[108];
    const lane109Config = LANE_ALLOWED_TURNS[109];

    return (
      <View style={styles.container}>
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

  // ========================================
  // Houston Lanes 103 & 104 - REVERSED ORDER
  // ========================================
  if (isHoustonLanes103_104) {
    const lane103Config = LANE_ALLOWED_TURNS[103];
    const lane104Config = LANE_ALLOWED_TURNS[104];

    return (
      <View style={styles.container}>
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

  // ========================================
  // Georgia Lanes 4 & 5 - REVERSED ORDER (WITH YIELD MODE)
  // ========================================
  const lane4Config = LANE_ALLOWED_TURNS[4];
  const lane5Config = LANE_ALLOWED_TURNS[5];

  return (
    <View style={styles.container}>
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

      <View style={styles.laneContainer}>
        <View style={styles.iconWrapper}>
          <Text style={styles.laneLabel}>{lane4Config.label}</Text>
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