// app/AppNavigator.tsx
import React, { useState, useEffect, useRef } from 'react';
import { View, StatusBar, Animated, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SplashScreen } from './src/features/Splash/SplashScreen';
import { OnboardingScreen } from './src/features/Onboarding/OnboardingScreen';
import { MainScreen } from './src/Main/views/screens/MainScreen';
import { MainViewModel } from './src/Main/viewmodels/MainViewModel';
import { initMapbox } from './src/core/api/mapbox';
import HomeScreenContent from './(tabs)/index';
import ExploreScreenContent from './(tabs)/explore';

type TabName = 'map' | 'explore' | 'home';

// Storage key for onboarding completion
const ONBOARDING_COMPLETE_KEY = '@v2x_demo:onboarding_complete';

// Initialize Mapbox
initMapbox();

// Create a singleton instance of the MainViewModel
const mainViewModel = new MainViewModel();

export const AppNavigator: React.FC = () => {
  const [appState, setAppState] = useState<'splash' | 'onboarding' | 'main'>('splash');
  const [isFirstLaunch, setIsFirstLaunch] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showMain, setShowMain] = useState(false);
  const [activeTab, setActiveTab] = useState<TabName>('map');

  // Animation values
  const splashOpacity = useRef(new Animated.Value(1)).current;
  const onboardingOpacity = useRef(new Animated.Value(0)).current;
  const mainOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    checkOnboardingStatus();

    // Cleanup on unmount
    return () => {
      mainViewModel.cleanup();
    };
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const hasCompletedOnboarding = await AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY);
      setIsFirstLaunch(hasCompletedOnboarding !== 'true');
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      setIsFirstLaunch(true);
    }
  };

  const handleSplashComplete = () => {
    // Transition directly to main (onboarding disabled)
    setShowMain(true);

    Animated.parallel([
      Animated.timing(splashOpacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(mainOpacity, {
        toValue: 1,
        duration: 500,
        delay: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setAppState('main');
    });
  };

  const handleOnboardingComplete = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');

      setShowMain(true);

      Animated.parallel([
        Animated.timing(onboardingOpacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(mainOpacity, {
          toValue: 1,
          duration: 400,
          delay: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setAppState('main');
        setShowOnboarding(false);
      });
    } catch (error) {
      console.error('Error saving onboarding status:', error);
      setAppState('main');
    }
  };

  const resetOnboarding = async () => {
    try {
      await AsyncStorage.removeItem(ONBOARDING_COMPLETE_KEY);
      setIsFirstLaunch(true);
      setAppState('splash');
      setShowOnboarding(false);
      setShowMain(false);

      splashOpacity.setValue(1);
      onboardingOpacity.setValue(0);
      mainOpacity.setValue(0);
    } catch (error) {
      console.error('Error resetting onboarding:', error);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
        animated
      />

      {/* Splash Screen */}
      {(appState === 'splash' || appState === 'onboarding') && (
        <Animated.View
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            opacity: splashOpacity,
            zIndex: 3,
          }}
          pointerEvents={appState === 'splash' ? 'auto' : 'none'}
        >
          <SplashScreen onAnimationComplete={handleSplashComplete} />
        </Animated.View>
      )}

      {/* Onboarding Screen */}
      {showOnboarding && (
        <Animated.View
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            opacity: onboardingOpacity,
            zIndex: 2,
          }}
          pointerEvents={appState === 'onboarding' ? 'auto' : 'none'}
        >
          <OnboardingScreen onComplete={handleOnboardingComplete} />
        </Animated.View>
      )}

      {/* Main Screen with Tab Bar */}
      {showMain && (
        <Animated.View
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            opacity: mainOpacity,
            zIndex: 1,
          }}
          pointerEvents={appState === 'main' ? 'auto' : 'none'}
        >
          <View style={{ flex: 1 }}>
            <View style={{ flex: 1 }}>
              {activeTab === 'map'     && <MainScreen viewModel={mainViewModel} />}
              {activeTab === 'explore' && <ExploreScreenContent />}
              {activeTab === 'home'    && <HomeScreenContent />}
            </View>

            <View style={tabStyles.tabBar}>
              {([
                { name: 'map',     label: 'Map',     icon: 'map',      iconOff: 'map-outline'      },
                { name: 'explore', label: 'Explore', icon: 'navigate', iconOff: 'navigate-outline' },
                { name: 'home',    label: 'Home',    icon: 'home',     iconOff: 'home-outline'     },
              ] as const).map(({ name, label, icon, iconOff }) => {
                const active = activeTab === name;
                return (
                  <TouchableOpacity
                    key={name}
                    style={tabStyles.tabItem}
                    onPress={() => setActiveTab(name)}
                    activeOpacity={0.7}
                  >
                    <View style={[tabStyles.pill, active && tabStyles.pillActive]}>
                      <Ionicons
                        name={active ? icon : iconOff}
                        size={22}
                        color={active ? '#FF8C00' : '#7A7A8A'}
                      />
                      <Text style={[tabStyles.tabLabel, active && tabStyles.tabLabelActive]}>
                        {label}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </Animated.View>
      )}
    </View>
  );
};

const tabStyles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#1C1C2E',
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 24,
    paddingVertical: 8,
    paddingHorizontal: 8,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
  },
  pill: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
    gap: 3,
  },
  pillActive: {
    backgroundColor: 'rgba(255, 140, 0, 0.13)',
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#7A7A8A',
    letterSpacing: 0.3,
  },
  tabLabelActive: {
    color: '#FF8C00',
    fontWeight: '700',
  },
});
