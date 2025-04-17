// app/src/Main/views/screens/MainScreen.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
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
  if (!viewModel.isInitialized) {
    return <LoadingScreen />;
  }

  return (
    <View style={styles.container}>
      <MapViewComponent 
        mapViewModel={viewModel.mapViewModel} 
        routeViewModel={viewModel.routeViewModel}
        navigationViewModel={viewModel.navigationViewModel}
        sdsmViewModel={viewModel.sdsmViewModel}
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
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});