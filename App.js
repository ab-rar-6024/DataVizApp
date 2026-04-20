import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Provider as PaperProvider, MD3LightTheme } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';

import UploadScreen from './app/screens/UploadScreen';
import PreviewScreen from './app/screens/PreviewScreen';
import DashboardScreen from './app/screens/DashboardScreen';

import { DataProvider } from './app/context/DataContext';

const Stack = createNativeStackNavigator();

// Theme
const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#6200ee',
    secondary: '#03dac6',
    background: '#f5f5f7',
    surface: '#ffffff',
  },
};

export default function App() {
  return (
    <DataProvider>
      <PaperProvider theme={theme}>
        <StatusBar style="light" />
        <NavigationContainer>
          <Stack.Navigator
            initialRouteName="Upload"
            screenOptions={{
              headerStyle: { backgroundColor: '#6200ee' },
              headerTintColor: '#fff',
              headerTitleStyle: { fontWeight: 'bold' },
              animation: 'slide_from_right',
            }}
          >
            <Stack.Screen
              name="Upload"
              component={UploadScreen}
              options={{ title: '📊 Data Viz' }}
            />
            <Stack.Screen
              name="Preview"
              component={PreviewScreen}
              options={{ title: 'Preview & Configure' }}
            />
            <Stack.Screen
              name="Dashboard"
              component={DashboardScreen}
              options={{ title: 'Dashboard' }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </PaperProvider>
    </DataProvider>
  );
}