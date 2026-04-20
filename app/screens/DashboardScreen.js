import React, { useContext, useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import {
  Text,
  Surface,
  SegmentedButtons,
  Menu,
  Button,
  Chip,
  Switch,
  Divider,
  TextInput,
} from 'react-native-paper';

import ChartRenderer from '../components/ChartRenderer';
import { DataContext } from '../context/DataContext';
import { extractChartData } from '../utils/fileParser';

const CHART_TYPES = [
  { value: 'line', label: 'Line', icon: 'chart-line' },
  { value: 'bar', label: 'Bar', icon: 'chart-bar' },
  { value: 'pie', label: 'Pie', icon: 'chart-pie' },
  { value: 'scatter', label: 'Scatter', icon: 'chart-scatter-plot' },
  { value: 'area', label: 'Area', icon: 'chart-areaspline' },
];

const CHART_DESCRIPTIONS = {
  line: 'Visualize trends over a continuous axis',
  bar: 'Compare values across categories',
  pie: 'Show distribution as a whole',
  scatter: 'Examine relationships between variables',
  area: 'Highlight cumulative trends over time',
};

const DashboardScreen = ({ route, navigation }) => {
  const { data, headers } = useContext(DataContext);
  const { xColumn: initialX, yColumn: initialY } = route.params || {};

  const [xColumn, setXColumn] = useState(initialX);
  const [yColumn, setYColumn] = useState(initialY);
  const [activeChart, setActiveChart] = useState('line');
  const [showAllCharts, setShowAllCharts] = useState(true);

  const [xMenuVisible, setXMenuVisible] = useState(false);
  const [yMenuVisible, setYMenuVisible] = useState(false);

  // Range filter (optional)
  const [filterEnabled, setFilterEnabled] = useState(false);
  const [minVal, setMinVal] = useState('');
  const [maxVal, setMaxVal] = useState('');

  // Recompute chart data whenever selections or filter change
  const { xData, yData } = useMemo(() => {
    if (!data || !xColumn || !yColumn) {
      return { xData: [], yData: [] };
    }

    let filterRange = null;
    if (filterEnabled) {
      const min = parseFloat(minVal);
      const max = parseFloat(maxVal);
      if (!isNaN(min) && !isNaN(max) && min <= max) {
        filterRange = { min, max };
      }
    }

    return extractChartData(data, xColumn, yColumn, filterRange);
  }, [data, xColumn, yColumn, filterEnabled, minVal, maxVal]);

  // Numeric columns for Y-axis dropdown
  const numericColumns = useMemo(() => {
    if (!data || data.length === 0) return headers;
    return headers.filter((h) => {
      const val = data.find((r) => r[h] !== null && r[h] !== undefined)?.[h];
      return typeof val === 'number';
    });
  }, [data, headers]);

  // Compute summary stats for the Y data
  const stats = useMemo(() => {
    if (!yData.length) return null;
    const sum = yData.reduce((a, b) => a + b, 0);
    const avg = sum / yData.length;
    const min = Math.min(...yData);
    const max = Math.max(...yData);
    return {
      count: yData.length,
      sum: sum.toFixed(2),
      avg: avg.toFixed(2),
      min: min.toFixed(2),
      max: max.toFixed(2),
    };
  }, [yData]);

  // Empty state
  if (!data || !xColumn || !yColumn) {
    return (
      <View style={styles.emptyContainer}>
        <Text variant="titleMedium" style={styles.emptyTitle}>
          Missing configuration
        </Text>
        <Button
          mode="contained"
          onPress={() => navigation.navigate('Upload')}
          style={styles.emptyButton}
        >
          Start Over
        </Button>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Configuration summary */}
      <Surface style={styles.configCard} elevation={2}>
        <Text variant="titleSmall" style={styles.configTitle}>
          Current Configuration
        </Text>

        <View style={styles.axisRow}>
          <Text variant="labelSmall" style={styles.axisLabel}>X:</Text>
          <Menu
            visible={xMenuVisible}
            onDismiss={() => setXMenuVisible(false)}
            anchor={
              <Chip
                icon="chevron-down"
                onPress={() => setXMenuVisible(true)}
                style={styles.axisChip}
              >
                {xColumn}
              </Chip>
            }
          >
            {headers.map((col) => (
              <Menu.Item
                key={col}
                title={col}
                onPress={() => {
                  setXColumn(col);
                  setXMenuVisible(false);
                }}
                leadingIcon={xColumn === col ? 'check' : undefined}
              />
            ))}
          </Menu>

          <Text variant="labelSmall" style={[styles.axisLabel, { marginLeft: 16 }]}>Y:</Text>
          <Menu
            visible={yMenuVisible}
            onDismiss={() => setYMenuVisible(false)}
            anchor={
              <Chip
                icon="chevron-down"
                onPress={() => setYMenuVisible(true)}
                style={styles.axisChip}
              >
                {yColumn}
              </Chip>
            }
          >
            {numericColumns.map((col) => (
              <Menu.Item
                key={col}
                title={col}
                onPress={() => {
                  setYColumn(col);
                  setYMenuVisible(false);
                }}
                leadingIcon={yColumn === col ? 'check' : undefined}
              />
            ))}
          </Menu>
        </View>
      </Surface>

      {/* Stats summary */}
      {stats && (
        <Surface style={styles.statsCard} elevation={1}>
          <View style={styles.statCell}>
            <Text style={styles.statLabel}>Count</Text>
            <Text style={styles.statValue}>{stats.count}</Text>
          </View>
          <View style={styles.statCell}>
            <Text style={styles.statLabel}>Avg</Text>
            <Text style={styles.statValue}>{stats.avg}</Text>
          </View>
          <View style={styles.statCell}>
            <Text style={styles.statLabel}>Min</Text>
            <Text style={styles.statValue}>{stats.min}</Text>
          </View>
          <View style={styles.statCell}>
            <Text style={styles.statLabel}>Max</Text>
            <Text style={styles.statValue}>{stats.max}</Text>
          </View>
        </Surface>
      )}

      {/* Filter controls */}
      <Surface style={styles.filterCard} elevation={1}>
        <View style={styles.filterHeader}>
          <Text variant="titleSmall" style={styles.filterTitle}>
            📊 Range Filter (Y values)
          </Text>
          <Switch
            value={filterEnabled}
            onValueChange={setFilterEnabled}
            color="#6200ee"
          />
        </View>
        {filterEnabled && (
          <View style={styles.filterRow}>
            <TextInput
              label="Min"
              value={minVal}
              onChangeText={setMinVal}
              keyboardType="numeric"
              mode="outlined"
              style={styles.filterInput}
              dense
            />
            <TextInput
              label="Max"
              value={maxVal}
              onChangeText={setMaxVal}
              keyboardType="numeric"
              mode="outlined"
              style={styles.filterInput}
              dense
            />
          </View>
        )}
      </Surface>

      {/* View mode toggle */}
      <Surface style={styles.viewToggle} elevation={1}>
        <View style={styles.viewToggleRow}>
          <Text variant="titleSmall" style={styles.viewToggleLabel}>
            Show all charts
          </Text>
          <Switch
            value={showAllCharts}
            onValueChange={setShowAllCharts}
            color="#6200ee"
          />
        </View>
        <Text variant="bodySmall" style={styles.viewToggleHint}>
          {showAllCharts
            ? 'Displaying all 5 chart types below'
            : 'Pick a single chart type to focus on'}
        </Text>
      </Surface>

      {/* Single chart mode: show type selector */}
      {!showAllCharts && (
        <>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.chartPickerScroll}
            contentContainerStyle={styles.chartPickerContent}
          >
            {CHART_TYPES.map((ct) => (
              <Chip
                key={ct.value}
                icon={ct.icon}
                selected={activeChart === ct.value}
                onPress={() => setActiveChart(ct.value)}
                style={[
                  styles.chartChip,
                  activeChart === ct.value && styles.chartChipActive,
                ]}
                textStyle={activeChart === ct.value ? styles.chartChipTextActive : undefined}
              >
                {ct.label}
              </Chip>
            ))}
          </ScrollView>

          <Text variant="bodySmall" style={styles.chartDescription}>
            {CHART_DESCRIPTIONS[activeChart]}
          </Text>

          <ChartRenderer
            chartType={activeChart}
            xData={xData}
            yData={yData}
            xLabel={xColumn}
            yLabel={yColumn}
            title={`${CHART_TYPES.find((c) => c.value === activeChart).label} Chart`}
          />
        </>
      )}

      {/* All charts mode: render each one */}
      {showAllCharts && (
        <>
          <Divider style={styles.mainDivider} />

          {CHART_TYPES.map((ct) => (
            <View key={ct.value} style={styles.chartSection}>
              <View style={styles.chartHeader}>
                <Text variant="titleMedium" style={styles.chartHeaderTitle}>
                  {ct.label} Chart
                </Text>
                <Text variant="bodySmall" style={styles.chartHeaderDesc}>
                  {CHART_DESCRIPTIONS[ct.value]}
                </Text>
              </View>
              <ChartRenderer
                chartType={ct.value}
                xData={xData}
                yData={yData}
                xLabel={xColumn}
                yLabel={yColumn}
              />
            </View>
          ))}
        </>
      )}

      <Button
        mode="outlined"
        onPress={() => navigation.navigate('Upload')}
        style={styles.resetButton}
        icon="refresh"
      >
        Upload Different File
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
  configCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  configTitle: {
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  axisRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  axisLabel: {
    fontWeight: '700',
    color: '#6200ee',
    marginRight: 6,
  },
  axisChip: {
    backgroundColor: '#f3e5ff',
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    justifyContent: 'space-around',
  },
  statCell: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 11,
    color: '#888',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 15,
    color: '#1a1a1a',
    fontWeight: '700',
    marginTop: 2,
  },
  filterCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  filterTitle: {
    fontWeight: '700',
    color: '#1a1a1a',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  filterInput: {
    flex: 1,
    backgroundColor: '#fff',
  },
  viewToggle: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  viewToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  viewToggleLabel: {
    fontWeight: '700',
    color: '#1a1a1a',
  },
  viewToggleHint: {
    color: '#666',
    marginTop: 4,
  },
  chartPickerScroll: {
    marginVertical: 8,
  },
  chartPickerContent: {
    paddingHorizontal: 4,
    gap: 8,
  },
  chartChip: {
    marginRight: 8,
    backgroundColor: '#fff',
  },
  chartChipActive: {
    backgroundColor: '#6200ee',
  },
  chartChipTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  chartDescription: {
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 8,
  },
  mainDivider: {
    marginVertical: 12,
    backgroundColor: '#ddd',
    height: 1,
  },
  chartSection: {
    marginBottom: 12,
  },
  chartHeader: {
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  chartHeaderTitle: {
    fontWeight: '700',
    color: '#1a1a1a',
  },
  chartHeaderDesc: {
    color: '#666',
    marginTop: 2,
  },
  resetButton: {
    borderColor: '#6200ee',
    marginTop: 16,
    borderRadius: 12,
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
    marginBottom: 16,
  },
  emptyButton: {
    backgroundColor: '#6200ee',
  },
});

export default DashboardScreen;
