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