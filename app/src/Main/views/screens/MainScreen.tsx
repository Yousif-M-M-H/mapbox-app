import React from 'react';
import { View, StyleSheet } from 'react-native';
import { observer } from 'mobx-react-lite';
import { MapViewComponent } from '../../../features/Map/views/components/MapView';  
import { SearchBar } from '../../../features/Search/views/components/SearchBar';
import { RouteInfo } from '../../../features/Route/views/components/RouteInfo';
import { NavigationOverlay } from '../../../features/Navigation/views/components/NavigationOverlay';
import { LoadingScreen } from '../components/LoadingScreen';
import { RouteViewModel } from '../../../features/Route/viewmodels/RouteViewModel';

interface MainScreenProps {
  viewModel: RouteViewModel;
}

export const MainScreen: React.FC<MainScreenProps> = observer(({ viewModel }) => {
  if (!viewModel.isInitialized) {
    return <LoadingScreen />;
  }

  return (
    <View style={styles.container}>
      <MapViewComponent viewModel={viewModel} />
      
      {!viewModel.isNavigating && (
        <SearchBar viewModel={viewModel} />
      )}
      
      <RouteInfo viewModel={viewModel} />
      
      <NavigationOverlay viewModel={viewModel} />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});