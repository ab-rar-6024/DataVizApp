import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Button, Text, ActivityIndicator, Surface } from 'react-native-paper';
import * as DocumentPicker from 'expo-document-picker';

import { parseFile } from '../utils/fileParser';

const FileUploader = ({ onFileParsed, onError }) => {
  const [loading, setLoading] = useState(false);
  const [progressText, setProgressText] = useState('');

  const handleFilePick = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'text/csv',
          'text/comma-separated-values',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/octet-stream', // fallback for some Android pickers
          '*/*',
        ],
        copyToCacheDirectory: true,
        multiple: false,
      });

      // expo-document-picker v12+ returns { canceled, assets }
      if (result.canceled) {
        return;
      }

      const file = result.assets ? result.assets[0] : result;
      const fileName = file.name || 'unknown';
      const fileUri = file.uri;

      // Validate extension
      const lower = fileName.toLowerCase();
      if (
        !lower.endsWith('.csv') &&
        !lower.endsWith('.xlsx') &&
        !lower.endsWith('.xls')
      ) {
        const msg = 'Please select a .csv, .xlsx, or .xls file.';
        onError && onError(msg);
        Alert.alert('Invalid File', msg);
        return;
      }

      setLoading(true);
      setProgressText('Reading file...');

      // Small delay so the spinner actually renders before heavy parsing blocks the JS thread
      await new Promise((r) => setTimeout(r, 50));

      setProgressText('Parsing data...');
      const parsed = await parseFile(fileUri, fileName);

      setLoading(false);
      setProgressText('');

      if (!parsed.data || parsed.data.length === 0) {
        const msg = 'The file does not contain any data rows.';
        onError && onError(msg);
        Alert.alert('Empty File', msg);
        return;
      }

      onFileParsed && onFileParsed({
        fileName,
        headers: parsed.headers,
        data: parsed.data,
      });
    } catch (err) {
      setLoading(false);
      setProgressText('');
      const msg = err.message || 'An unknown error occurred while reading the file.';
      onError && onError(msg);
      Alert.alert('Upload Failed', msg);
    }
  };

  return (
    <Surface style={styles.container} elevation={2}>
      <View style={styles.iconWrapper}>
        <Text style={styles.icon}>📁</Text>
      </View>
      <Text variant="titleLarge" style={styles.title}>
        Upload Your Data
      </Text>
      <Text variant="bodyMedium" style={styles.subtitle}>
        Select an Excel (.xlsx) or CSV (.csv) file from your device to begin.
      </Text>

      {loading ? (
        <View style={styles.loadingWrapper}>
          <ActivityIndicator animating size="large" color="#6200ee" />
          <Text style={styles.loadingText}>{progressText}</Text>
        </View>
      ) : (
        <Button
          mode="contained"
          onPress={handleFilePick}
          style={styles.button}
          labelStyle={styles.buttonLabel}
          icon="upload"
        >
          Choose File
        </Button>
      )}

      <Text variant="bodySmall" style={styles.hint}>
        Supported formats: .xlsx, .xls, .csv
      </Text>
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 28,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  iconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f3e5ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  icon: {
    fontSize: 40,
  },
  title: {
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  button: {
    width: '100%',
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#6200ee',
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  hint: {
    marginTop: 16,
    color: '#999',
    fontStyle: 'italic',
  },
  loadingWrapper: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginTop: 12,
    color: '#6200ee',
    fontWeight: '500',
  },
});

export default FileUploader;
