import { observer } from "mobx-react-lite";
import { MapViewModel } from "../../viewModel/MapViewModel";
import React from "react";
import { View, Text } from "react-native";
import { routeInfoStyles } from '../../styles/routeInfoStyles'
interface RouteInfoProps {
  viewModel: MapViewModel;
}

export const RouteInfo: React.FC<RouteInfoProps> = observer(({ viewModel }) => {
  if (!viewModel.showRoute) return null;

  return (
    <View style={routeInfoStyles.container}>
      <View style={routeInfoStyles.infoRow}>
        <View style={routeInfoStyles.infoItem}>
          <Text style={routeInfoStyles.infoLabel}>Distance</Text>
          <Text style={routeInfoStyles.infoValue}>{viewModel.formattedDistance}</Text>
        </View>
        <View style={routeInfoStyles.divider} />
        <View style={routeInfoStyles.infoItem}>
          <Text style={routeInfoStyles.infoLabel}>Duration</Text>
          <Text style={routeInfoStyles.infoValue}>{viewModel.formattedDuration}</Text>
        </View>
      </View>
    </View>
  );
});