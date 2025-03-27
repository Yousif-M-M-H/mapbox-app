// src/core/utils/debugTool.ts
import { Alert, Platform } from 'react-native';

export const showDebugAlert = (title: string, message: string) => {
  console.log(`DEBUG ALERT - ${title}: ${message}`);
  Alert.alert(
    `DEBUG: ${title}`,
    message,
    [{ text: 'OK' }],
    { cancelable: false }
  );
};

export const checkServerConnection = async (url: string): Promise<boolean> => {
  try {
    console.log(`Checking server connectivity at: ${url}`);
    
    // Set a timeout for the fetch request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(url, { 
      signal: controller.signal,
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    clearTimeout(timeoutId);
    
    console.log(`Server response status: ${response.status}`);
    return response.ok;
  } catch (error) {
    console.error(`Server connection check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return false;
  }
};

// Test MongoDB server connectivity directly from app
export const testMongoDBServer = async (baseUrl: string) => {
  console.log('Testing MongoDB server connectivity...');
  console.log(`Base URL: ${baseUrl}`);
  console.log(`Platform: ${Platform.OS}`);
  
  try {
    // First try the root endpoint to see if server is running
    const serverAlive = await checkServerConnection(baseUrl);
    if (!serverAlive) {
      showDebugAlert('Server Connection', `Server is not responding at ${baseUrl}. Make sure your server is running.`);
      return;
    }
    
    // Now check the status endpoint
    const statusUrl = `${baseUrl}/status`;
    console.log(`Checking status endpoint: ${statusUrl}`);
    
    const response = await fetch(statusUrl);
    console.log(`Status response code: ${response.status}`);
    
    if (!response.ok) {
      showDebugAlert('MongoDB Status', `Server responded with error: ${response.status} ${response.statusText}`);
      return;
    }
    
    const data = await response.json();
    console.log('MongoDB status data:', data);
    
    showDebugAlert(
      'MongoDB Connection', 
      data.connected 
        ? 'Successfully connected to MongoDB!' 
        : 'Failed to connect to MongoDB. Check server logs.'
    );
  } catch (error) {
    console.error('Error testing MongoDB connection:', error);
    showDebugAlert(
      'Connection Error', 
      `Error checking MongoDB connection: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};