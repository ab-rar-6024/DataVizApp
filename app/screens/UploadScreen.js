import React, { useContext, useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, Snackbar, Surface, Chip } from 'react-native-paper';

import FileUploader from '../components/FileUploader';
import { DataContext } from '../context/DataContext';

const UploadScreen = ({ navigation }) => {
  const { setData, setHeaders, setFileName } = useContext(DataContext);
  const [errorVisible, setErrorVisible] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleFileParsed = ({ fileName, headers, data }) => {
    setData(data);
    setHeaders(headers);
    setFileName(fileName);
    navigation.navigate('Preview');
  };

  const handleError = (msg) => {
    setErrorMsg(msg);
    setErrorVisible(true);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero banner */}
        <Surface style={styles.hero} elevation={0}>
          <Text variant="headlineMedium" style={styles.heroTitle}>
            Turn your data into insights
          </Text>
          <Text variant="bodyMedium" style={styles.heroSubtitle}>
            Upload a spreadsheet, pick your axes, and instantly visualize trends,
            comparisons, and distributions across five chart types.
          </Text>
        </Surface>

        <View style={styles.uploaderWrapper}>
          <FileUploader
            onFileParsed={handleFileParsed}
            onError={handleError}
          />
        </View>

        {/* Feature highlights */}
        <View style={styles.features}>
          <Text variant="titleMedium" style={styles.featuresTitle}>
            What you can do
          </Text>
          <View style={styles.chipRow}>
            <Chip icon="chart-line" style={styles.chip}>Line</Chip>
            <Chip icon="chart-bar" style={styles.chip}>Bar</Chip>
            <Chip icon="chart-pie" style={styles.chip}>Pie</Chip>
          </View>
          <View style={styles.chipRow}>
            <Chip icon="chart-scatter-plot" style={styles.chip}>Scatter</Chip>
            <Chip icon="chart-areaspline" style={styles.chip}>Area</Chip>
          </View>
        </View>

        <View style={styles.tips}>
          <Text variant="titleSmall" style={styles.tipsTitle}>
            💡 Tips
          </Text>
          <Text variant="bodySmall" style={styles.tipText}>
            • Ensure your file has a header row in the first row
          </Text>
          <Text variant="bodySmall" style={styles.tipText}>
            • Numeric columns will be auto-detected for the Y-axis
          </Text>
          <Text variant="bodySmall" style={styles.tipText}>
            • Large datasets are automatically downsampled for smooth rendering
          </Text>
        </View>
      </ScrollView>

      <Snackbar
        visible={errorVisible}
        onDismiss={() => setErrorVisible(false)}
        duration={4000}
        style={styles.snackbar}
        action={{ label: 'Dismiss', onPress: () => setErrorVisible(false) }}
      >
        {errorMsg}
      </Snackbar>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f7',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  hero: {
    backgroundColor: 'transparent',
    marginBottom: 24,
    marginTop: 8,
  },
  heroTitle: {
    fontWeight: '800',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  heroSubtitle: {
    color: '#555',
    lineHeight: 22,
  },
  uploaderWrapper: {
    marginBottom: 24,
  },
  features: {
    marginBottom: 24,
  },
  featuresTitle: {
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  chip: {
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  tips: {
    backgroundColor: '#fff9e6',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#ffa502',
  },
  tipsTitle: {
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  tipText: {
    color: '#555',
    marginBottom: 4,
    lineHeight: 18,
  },
  snackbar: {
    backgroundColor: '#d32f2f',
  },
});

export default UploadScreen;
