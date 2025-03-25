// src/views/screens/MapScreen.tsx
import React from 'react';
import { View } from 'react-native';
import { observer } from 'mobx-react-lite';
import { MapViewModel } from '../../viewModel/MapViewModel';
import { MapViewComponent } from '../components/MapView';
import { SearchBar } from '../components/SearchBar';
import { TitleBar } from '../components/TitleBar';
import { RouteInfo } from '../components/RouteInfo';
import { NavigationOverlay } from '../components/NavigationOverlay';
import { LoadingScreen } from '../components/LoadingScreen';
import { mapStyles } from '../../styles/mapStyles';

export const MapScreen: React.FC = observer(() => {
  // Create and store the ViewModel instance
  const viewModel = React.useMemo(() => new MapViewModel(), []);

  // If not initialized, show loading screen
  if (!viewModel.isInitialized) {
    return <LoadingScreen />;
  }

  return (
    <View style={mapStyles.container}>
      <MapViewComponent viewModel={viewModel} />
      
      {/* Only show search bar when not navigating */}
      {!viewModel.isNavigating && (
        <SearchBar viewModel={viewModel} />
      )}
      
      {/* Only show title bar when not navigating */}
      {!viewModel.isNavigating && (
        <TitleBar viewModel={viewModel} />
      )}
      
      {/* Show route info panel with start button when route is shown but not navigating */}
      <RouteInfo viewModel={viewModel} />
      
      {/* Show navigation overlay during turn-by-turn navigation */}
      <NavigationOverlay viewModel={viewModel} />
    </View>
  );
});