import React, { useContext, useMemo, useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import {
  Text,
  Button,
  Menu,
  Surface,
  IconButton,
  Divider,
} from 'react-native-paper';

import DataPreview from '../components/DataPreview';
import { DataContext } from '../context/DataContext';
import { detectNumericColumns } from '../utils/fileParser';

const PreviewScreen = ({ navigation }) => {
  const { data, headers, fileName } = useContext(DataContext);

  const [xColumn, setXColumn] = useState(null);
  const [yColumn, setYColumn] = useState(null);
  const [xMenuVisible, setXMenuVisible] = useState(false);
  const [yMenuVisible, setYMenuVisible] = useState(false);

  // Identify numeric columns (only these are valid for Y-axis)
  const numericColumns = useMemo(
    () => detectNumericColumns(data || [], headers || []),
    [data, headers]
  );

  // Default selections once headers are available
  useEffect(() => {
    if (headers && headers.length > 0 && !xColumn) {
      setXColumn(headers[0]);
    }
    if (numericColumns.length > 0 && !yColumn) {
      setYColumn(numericColumns[0]);
    }
  }, [headers, numericColumns]);

  const handleContinue = () => {
    if (!xColumn || !yColumn) {
      Alert.alert(
        'Selection Required',
        'Please select both an X-axis and a Y-axis column before continuing.'
      );
      return;
    }
    navigation.navigate('Dashboard', { xColumn, yColumn });
  };

  // Empty state - if user navigated here without data
  if (!data || !headers || headers.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text variant="titleMedium" style={styles.emptyTitle}>
          No data loaded
        </Text>
        <Text variant="bodyMedium" style={styles.emptyText}>
          Please go back and upload a file to continue.
        </Text>
        <Button
          mode="contained"
          onPress={() => navigation.navigate('Upload')}
          style={styles.emptyButton}
        >
          Back to Upload
        </Button>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* File info banner */}
      <Surface style={styles.fileBanner} elevation={1}>
        <View style={styles.fileBannerLeft}>
          <Text variant="labelSmall" style={styles.fileLabel}>
            LOADED FILE
          </Text>
          <Text variant="titleMedium" style={styles.fileName} numberOfLines={1}>
            {fileName || 'untitled'}
          </Text>
          <Text variant="bodySmall" style={styles.fileStats}>
            {data.length.toLocaleString()} rows · {headers.length} columns · {numericColumns.length} numeric
          </Text>
        </View>
        <IconButton
          icon="refresh"
          iconColor="#6200ee"
          size={24}
          onPress={() => navigation.navigate('Upload')}
        />
      </Surface>

      {/* Data preview table */}
      <DataPreview headers={headers} data={data} rowLimit={10} />

      {/* Column selection section */}
      <Surface style={styles.selectorCard} elevation={2}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Configure Chart Axes
        </Text>
        <Text variant="bodySmall" style={styles.sectionSubtitle}>
          Choose which columns to plot. The Y-axis requires a numeric column.
        </Text>

        <Divider style={styles.divider} />

        {/* X-axis selector */}
        <View style={styles.selectorRow}>
          <Text variant="labelLarge" style={styles.selectorLabel}>
            X-Axis
          </Text>
          <Menu
            visible={xMenuVisible}
            onDismiss={() => setXMenuVisible(false)}
            anchor={
              <Button
                mode="outlined"
                onPress={() => setXMenuVisible(true)}
                style={styles.dropdown}
                contentStyle={styles.dropdownContent}
                icon="chevron-down"
              >
                {xColumn || 'Select column'}
              </Button>
            }
            contentStyle={styles.menuContent}
          >
            {headers.map((col) => (
              <Menu.Item
                key={col}
                onPress={() => {
                  setXColumn(col);
                  setXMenuVisible(false);
                }}
                title={col}
                leadingIcon={xColumn === col ? 'check' : undefined}
              />
            ))}
          </Menu>
        </View>

        {/* Y-axis selector - numeric columns only */}
        <View style={styles.selectorRow}>
          <Text variant="labelLarge" style={styles.selectorLabel}>
            Y-Axis <Text style={styles.numericHint}>(numeric)</Text>
          </Text>
          <Menu
            visible={yMenuVisible}
            onDismiss={() => setYMenuVisible(false)}
            anchor={
              <Button
                mode="outlined"
                onPress={() => setYMenuVisible(true)}
                style={styles.dropdown}
                contentStyle={styles.dropdownContent}
                icon="chevron-down"
                disabled={numericColumns.length === 0}
              >
                {yColumn || 'Select column'}
              </Button>
            }
            contentStyle={styles.menuContent}
          >
            {numericColumns.length === 0 ? (
              <Menu.Item title="No numeric columns found" disabled />
            ) : (
              numericColumns.map((col) => (
                <Menu.Item
                  key={col}
                  onPress={() => {
                    setYColumn(col);
                    setYMenuVisible(false);
                  }}
                  title={col}
                  leadingIcon={yColumn === col ? 'check' : undefined}
                />
              ))
            )}
          </Menu>
        </View>

        {numericColumns.length === 0 && (
          <View style={styles.warning}>
            <Text variant="bodySmall" style={styles.warningText}>
              ⚠️ No numeric columns detected. Please upload a file that contains
              at least one numeric column for visualization.
            </Text>
          </View>
        )}
      </Surface>

      {/* Continue button */}
      <Button
        mode="contained"
        onPress={handleContinue}
        style={styles.continueButton}
        labelStyle={styles.continueLabel}
        icon="chart-line"
        disabled={!xColumn || !yColumn}
      >
        Visualize Data
      </Button>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f7',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  fileBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  fileBannerLeft: {
    flex: 1,
  },
  fileLabel: {
    color: '#6200ee',
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  fileName: {
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  fileStats: {
    color: '#666',
  },
  selectorCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontWeight: '700',
    color: '#1a1a1a',
  },
  sectionSubtitle: {
    color: '#666',
    marginTop: 4,
  },
  divider: {
    marginVertical: 16,
  },
  selectorRow: {
    marginBottom: 16,
  },
  selectorLabel: {
    color: '#333',
    marginBottom: 8,
    fontWeight: '600',
  },
  numericHint: {
    color: '#03dac6',
    fontWeight: '400',
    fontSize: 12,
  },
  dropdown: {
    borderColor: '#6200ee',
    borderRadius: 10,
  },
  dropdownContent: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  menuContent: {
    backgroundColor: '#fff',
    maxHeight: 300,
  },
  warning: {
    backgroundColor: '#fff3cd',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#ffa502',
  },
  warningText: {
    color: '#664d03',
    lineHeight: 18,
  },
  continueButton: {
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#6200ee',
  },
  continueLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: '#f5f5f7',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyTitle: {
    color: '#1a1a1a',
    fontWeight: '700',
    marginBottom: 8,
  },
  emptyText: {
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#6200ee',
  },
});

export default PreviewScreen;
