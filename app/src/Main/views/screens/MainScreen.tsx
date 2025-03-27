// src/Main/views/screens/MainScreen.tsx
import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { observer } from 'mobx-react-lite';
import { MapViewComponent } from '../../../features/Map/views/components/MapView';
import { SearchBar } from '../../../features/Search/views/components/SearchBar';
import { RouteInfo } from '../../../features/Route/views/components/RouteInfo';
import { NavigationOverlay } from '../../../features/Navigation/views/components/NavigationOverlay';
import { LoadingScreen } from '../components/LoadingScreen';
import { MainViewModel } from '../../viewmodels/MainViewModel';

interface MainScreenProps {
  viewModel: MainViewModel;
}

export const MainScreen: React.FC<MainScreenProps> = observer(({ viewModel }) => {
  // Debug output for troubleshooting
  useEffect(() => {
    // Log key state variables when they change
    console.log("MainScreen: isInitialized =", viewModel.isInitialized);
    console.log("MainScreen: isNavigating =", viewModel.isNavigating);
    console.log("MainScreen: Search has destination =", viewModel.searchViewModel.hasSelectedDestination);
    console.log("MainScreen: Route is showing =", viewModel.routeViewModel.showRoute);
    
    // Debug route calculation
    if (viewModel.searchViewModel.hasSelectedDestination && !viewModel.routeViewModel.showRoute) {
      console.log("WARNING: Has destination but route is not showing!");
      viewModel.routeViewModel.debugShowRoute();
    }
  }, [
    viewModel.isInitialized, 
    viewModel.isNavigating,
    viewModel.searchViewModel.hasSelectedDestination,
    viewModel.routeViewModel.showRoute
  ]);

  if (!viewModel.isInitialized) {
    return <LoadingScreen />;
  }

  return (
    <View style={styles.container}>
      <MapViewComponent 
        mapViewModel={viewModel.mapViewModel} 
        routeViewModel={viewModel.routeViewModel}
        navigationViewModel={viewModel.navigationViewModel}
      />
      
      {!viewModel.isNavigating && (
        <SearchBar searchViewModel={viewModel.searchViewModel} />
      )}
      
      <RouteInfo 
        routeViewModel={viewModel.routeViewModel} 
        navigationViewModel={viewModel.navigationViewModel}
        destinationTitle={viewModel.destinationTitle}
      />
      
      <NavigationOverlay navigationViewModel={viewModel.navigationViewModel} />
      
      {/* Debug overlay - uncomment to help troubleshoot UI issues */}
      {/*
      <View style={styles.debugOverlay}>
        <Text style={styles.debugText}>
          Init: {viewModel.isInitialized ? 'Yes' : 'No'}{'\n'}
          Has Dest: {viewModel.searchViewModel.hasSelectedDestination ? 'Yes' : 'No'}{'\n'}
          Show Route: {viewModel.routeViewModel.showRoute ? 'Yes' : 'No'}{'\n'}
          Is Nav: {viewModel.isNavigating ? 'Yes' : 'No'}{'\n'}
          Route Steps: {viewModel.navigationViewModel.navigationSteps.length}
        </Text>
      </View>
      */}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  debugOverlay: {
    position: 'absolute',
    top: 100,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 10,
    borderRadius: 5,
  },
  debugText: {
    color: 'white',
    fontSize: 10,
  }
});