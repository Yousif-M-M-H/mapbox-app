// src/views/components/SearchBar.tsx
import React from 'react';
import { View, TextInput, ActivityIndicator, FlatList, Text, TouchableOpacity } from 'react-native';
import { observer } from 'mobx-react-lite';
import { MapViewModel } from "../../viewModel/MapViewModel";
import { searchStyles } from '../../styles/searchStyles';

interface SearchBarProps {
    viewModel: MapViewModel;
  }
  
  export const SearchBar: React.FC<SearchBarProps> = observer(({ viewModel }) => {
    const formatDistance = (distance?: number) => {
      if (!distance) return '';
      
      if (distance < 1) {
        return ` (${Math.round(distance * 1000)} m)`;
      } else {
        return ` (${distance.toFixed(1)} km)`;
      }
    };
  
    return (
      <View style={searchStyles.container}>
        <View style={searchStyles.inputContainer}>
          <TextInput 
            style={searchStyles.input}
            placeholder="Enter destination address"
            value={viewModel.searchQuery}
            onChangeText={(text) => viewModel.setSearchQuery(text)}
            placeholderTextColor="#888"
          />
          
          {viewModel.searchQuery.length > 0 && (
            <TouchableOpacity 
              style={searchStyles.clearButton} 
              onPress={() => viewModel.clearSearch()}
            >
              <Text style={searchStyles.clearButtonText}>✕</Text>
            </TouchableOpacity>
          )}
          
          {viewModel.isSearching && (
            <ActivityIndicator 
              style={searchStyles.spinner} 
              size="small" 
              color="#3B82F6" 
            />
          )}
        </View>
        
        {viewModel.searchResults.length > 0 && (
          <FlatList
            data={viewModel.searchResults}
            keyExtractor={(item, index) => `result-${index}`}
            style={searchStyles.resultsList}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={searchStyles.resultItem}
                onPress={() => viewModel.selectDestination(item)}
              >
                <Text style={searchStyles.resultText}>
                  {item.placeName}
                  <Text style={searchStyles.distanceText}>
                    {formatDistance(item.distance)}
                  </Text>
                </Text>
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    );
  });