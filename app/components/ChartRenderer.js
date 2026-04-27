import React, { useMemo, useRef, useState } from 'react';
import {
  View,
  Dimensions,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Text, Surface } from 'react-native-paper';
import {
  LineChart,
  BarChart,
  PieChart,
} from 'react-native-chart-kit';
import Svg, { Circle, G, Line, Text as SvgText, Rect } from 'react-native-svg';
import ViewShot from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';

import { downsampleData } from '../utils/fileParser';

const screenWidth = Dimensions.get('window').width;

// ─── Chart Config ────────────────────────────────────────────────────────────

const baseChartConfig = {
  backgroundColor: '#ffffff',
  backgroundGradientFrom: '#ffffff',
  backgroundGradientTo: '#f8f5ff',
  decimalPlaces: 1,
  color: (opacity = 1) => `rgba(98, 0, 238, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(60, 60, 60, ${opacity})`,
  style: { borderRadius: 16 },
  propsForDots: {
    r: '5',
    strokeWidth: '2',
    stroke: '#6200ee',
  },
  propsForBackgroundLines: {
    stroke: '#ede8f8',
    strokeDasharray: '5 4',
  },
  propsForLabels: {
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'sans-serif',
  },
};

const PIE_COLORS = [
  '#6200ee', '#03dac6', '#ff6b6b', '#ffa502', '#2ed573',
  '#1e90ff', '#ff4757', '#a29bfe', '#fdcb6e', '#00cec9',
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const truncateLabel = (label, max = 7) => {
  const str = String(label);
  return str.length > max ? str.slice(0, max) + '…' : str;
};

// ─── Axis Label Wrapper ───────────────────────────────────────────────────────

const AxisLabels = ({ xLabel, yLabel, children }) => (
  <View style={axisStyles.container}>
    <View style={axisStyles.yLabelContainer}>
      <Text style={axisStyles.yLabel} numberOfLines={1}>
        {yLabel}
      </Text>
    </View>
    <View style={axisStyles.chartArea}>
      {children}
      <View style={axisStyles.xLabelContainer}>
        <Text style={axisStyles.xLabel} numberOfLines={1}>
          {xLabel}
        </Text>
      </View>
    </View>
  </View>
);

const axisStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  yLabelContainer: {
    width: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 2,
  },
  yLabel: {
    fontSize: 11,
    color: '#6200ee',
    fontWeight: '600',
    transform: [{ rotate: '-90deg' }],
    width: 80,
    textAlign: 'center',
  },
  chartArea: {
    flex: 1,
    alignItems: 'center',
  },
  xLabelContainer: {
    marginTop: 4,
    alignItems: 'center',
    width: '100%',
  },
  xLabel: {
    fontSize: 11,
    color: '#6200ee',
    fontWeight: '600',
    textAlign: 'center',
  },
});

// ─── Download Button ──────────────────────────────────────────────────────────

const DownloadButton = ({ onPress, loading }) => (
  <TouchableOpacity
    style={dlStyles.btn}
    onPress={onPress}
    activeOpacity={0.75}
    disabled={loading}
  >
    {loading ? (
      <ActivityIndicator size={14} color="#fff" />
    ) : (
      <Text style={dlStyles.label}>⬇  Save Chart</Text>
    )}
  </TouchableOpacity>
);

const dlStyles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6200ee',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 7,
    alignSelf: 'flex-end',
    marginTop: 10,
    shadowColor: '#6200ee',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  label: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});

// ─── Main ChartRenderer ───────────────────────────────────────────────────────

const ChartRenderer = ({
  chartType,
  xData,
  yData,
  xLabel = 'X Axis',
  yLabel = 'Y Axis',
  title,
}) => {
  const viewShotRef = useRef(null);
  const [saving, setSaving] = useState(false);

  const { xData: sampledX, yData: sampledY } = useMemo(() => {
    const maxPoints = chartType === 'pie' ? 8 : 15;
    return downsampleData(xData, yData, maxPoints);
  }, [xData, yData, chartType]);

  if (!sampledX || sampledX.length === 0) {
    return (
      <Surface style={styles.emptyChart} elevation={1}>
        <Text style={styles.emptyText}>No data available for this chart</Text>
      </Surface>
    );
  }

  const chartWidth = screenWidth - 72;
  const chartHeight = 220;

  const labels = sampledX.map((l) => truncateLabel(l, 6));

  const lineBarData = {
    labels,
    datasets: [
      {
        data: sampledY,
        color: (opacity = 1) => `rgba(98, 0, 238, ${opacity})`,
        strokeWidth: 2.5,
      },
    ],
    legend: [yLabel],
  };

  // ── Direct Save to Gallery (no share sheet) ──
  const handleSave = async () => {
    try {
      setSaving(true);

      // Request permission
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please allow media access in your device settings to save charts.',
        );
        return;
      }

      // Capture chart as PNG
      const uri = await viewShotRef.current.capture({
        format: 'png',
        quality: 1,
      });

      // Save directly to gallery
      const asset = await MediaLibrary.createAssetAsync(uri);
      await MediaLibrary.createAlbumAsync('DataVizApp', asset, false);

      Alert.alert('✅ Saved!', 'Chart has been saved to your gallery in the "DataVizApp" album.');
    } catch (err) {
      console.error('Save error:', err);
      Alert.alert('Error', 'Could not save the chart. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // ── Render chart body ──
  const renderChart = () => {
    switch (chartType) {
      case 'line':
        return (
          <AxisLabels xLabel={xLabel} yLabel={yLabel}>
            <LineChart
              data={lineBarData}
              width={chartWidth}
              height={chartHeight}
              chartConfig={baseChartConfig}
              bezier
              style={styles.chart}
              verticalLabelRotation={30}
              fromZero
              withShadow={false}
              withInnerLines={true}
              withOuterLines={true}
              segments={5}
            />
          </AxisLabels>
        );

      case 'bar':
        return (
          <AxisLabels xLabel={xLabel} yLabel={yLabel}>
            <BarChart
              data={lineBarData}
              width={chartWidth}
              height={chartHeight}
              chartConfig={{
                ...baseChartConfig,
                barPercentage: sampledX.length > 8 ? 0.4 : 0.6,
              }}
              style={styles.chart}
              verticalLabelRotation={sampledX.length > 6 ? 35 : 0}
              fromZero
              showValuesOnTopOfBars={sampledX.length <= 8}
              withInnerLines={true}
              segments={5}
            />
          </AxisLabels>
        );

      case 'pie': {
        const aggregated = {};
        sampledX.forEach((x, i) => {
          const key = String(x);
          aggregated[key] = (aggregated[key] || 0) + sampledY[i];
        });

        const pieData = Object.entries(aggregated).map(([name, value], idx) => ({
          name: truncateLabel(name, 10),
          population: Math.abs(value),
          color: PIE_COLORS[idx % PIE_COLORS.length],
          legendFontColor: '#444',
          legendFontSize: 11,
        }));

        return (
          <View style={styles.pieCentred}>
            <PieChart
              data={pieData}
              width={chartWidth + 20}
              height={chartHeight}
              chartConfig={baseChartConfig}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="10"
              absolute={false}
              style={styles.chart}
              hasLegend={true}
            />
          </View>
        );
      }

      case 'area':
        return (
          <AxisLabels xLabel={xLabel} yLabel={yLabel}>
            <LineChart
              data={lineBarData}
              width={chartWidth}
              height={chartHeight}
              chartConfig={{
                ...baseChartConfig,
                fillShadowGradient: '#6200ee',
                fillShadowGradientOpacity: 0.35,
              }}
              bezier
              style={styles.chart}
              verticalLabelRotation={30}
              fromZero
              withShadow={false}
              segments={5}
            />
          </AxisLabels>
        );

      case 'scatter':
        return (
          <AxisLabels xLabel={xLabel} yLabel={yLabel}>
            <ScatterPlot
              xData={sampledY.map((_, i) => i)}
              yData={sampledY}
              labels={labels}
              width={chartWidth}
              height={chartHeight}
            />
          </AxisLabels>
        );

      default:
        return (
          <Text style={styles.emptyText}>Unsupported chart type: {chartType}</Text>
        );
    }
  };

  return (
    <Surface style={styles.chartContainer} elevation={2}>
      {/* Title row */}
      <View style={styles.titleRow}>
        {title ? (
          <Text variant="titleMedium" style={styles.chartTitle} numberOfLines={2}>
            {title}
          </Text>
        ) : null}
      </View>

      {/* Chart captured by ViewShot */}
      <ViewShot
        ref={viewShotRef}
        options={{ format: 'png', quality: 1 }}
        style={styles.viewShot}
      >
        <View style={styles.captureBackground}>
          {title ? (
            <Text style={styles.captureTitle}>{title}</Text>
          ) : null}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {renderChart()}
          </ScrollView>
        </View>
      </ViewShot>

      {/* Download button — saves directly, no share sheet */}
      <DownloadButton onPress={handleSave} loading={saving} />
    </Surface>
  );
};

// ─── Custom Scatter Plot ──────────────────────────────────────────────────────

const ScatterPlot = ({ xData, yData, width, height }) => {
  if (!xData.length || !yData.length) return null;

  const padding = { top: 24, right: 20, bottom: 36, left: 48 };
  const plotW = width - padding.left - padding.right;
  const plotH = height - padding.top - padding.bottom;

  const xMin = Math.min(...xData);
  const xMax = Math.max(...xData);
  const yMin = Math.min(...yData);
  const yMax = Math.max(...yData);

  const xRange = xMax - xMin || 1;
  const yRange = yMax - yMin || 1;

  const scaleX = (v) => padding.left + ((v - xMin) / xRange) * plotW;
  const scaleY = (v) => padding.top + plotH - ((v - yMin) / yRange) * plotH;

  const xTicks = [0, 1, 2, 3, 4].map((i) => xMin + (i / 4) * xRange);
  const yTicks = [0, 1, 2, 3, 4].map((i) => yMin + (i / 4) * yRange);

  const fmt = (v) =>
    Math.abs(v) >= 1000
      ? `${(v / 1000).toFixed(1)}k`
      : Number.isInteger(v)
      ? v
      : v.toFixed(1);

  return (
    <Svg width={width} height={height}>
      <G>
        <Rect x={padding.left} y={padding.top} width={plotW} height={plotH} fill="#faf8ff" rx={6} />

        {yTicks.map((t, i) => (
          <Line
            key={`hg-${i}`}
            x1={padding.left}
            y1={scaleY(t)}
            x2={padding.left + plotW}
            y2={scaleY(t)}
            stroke="#ede8f8"
            strokeDasharray="5 4"
            strokeWidth={1}
          />
        ))}

        {xTicks.map((t, i) => (
          <Line
            key={`vg-${i}`}
            x1={scaleX(t)}
            y1={padding.top}
            x2={scaleX(t)}
            y2={padding.top + plotH}
            stroke="#ede8f8"
            strokeDasharray="5 4"
            strokeWidth={1}
          />
        ))}

        <Line x1={padding.left} y1={padding.top} x2={padding.left} y2={padding.top + plotH} stroke="#bbb" strokeWidth={1.5} />
        <Line x1={padding.left} y1={padding.top + plotH} x2={padding.left + plotW} y2={padding.top + plotH} stroke="#bbb" strokeWidth={1.5} />

        {yTicks.map((t, i) => (
          <SvgText key={`yl-${i}`} x={padding.left - 6} y={scaleY(t) + 4} fontSize={9} fill="#777" textAnchor="end">
            {fmt(t)}
          </SvgText>
        ))}

        {xTicks.map((t, i) => (
          <SvgText key={`xl-${i}`} x={scaleX(t)} y={padding.top + plotH + 14} fontSize={9} fill="#777" textAnchor="middle">
            {fmt(t)}
          </SvgText>
        ))}

        {xData.map((x, i) => (
          <G key={`pt-${i}`}>
            <Circle cx={scaleX(x)} cy={scaleY(yData[i])} r={6} fill="#6200ee" opacity={0.15} />
            <Circle cx={scaleX(x)} cy={scaleY(yData[i])} r={4} fill="#6200ee" opacity={0.85} />
          </G>
        ))}
      </G>
    </Svg>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  chartContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginVertical: 10,
    marginHorizontal: 4,
    shadowColor: '#6200ee',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  chartTitle: {
    fontWeight: '700',
    color: '#1a1a1a',
    flex: 1,
    fontSize: 15,
  },
  viewShot: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  captureBackground: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  captureTitle: {
    fontWeight: '700',
    color: '#1a1a1a',
    fontSize: 14,
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  scrollContent: {
    paddingRight: 12,
  },
  chart: {
    borderRadius: 12,
  },
  pieCentred: {
    alignItems: 'center',
  },
  emptyChart: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    marginVertical: 8,
  },
  emptyText: {
    color: '#aaa',
    fontStyle: 'italic',
    fontSize: 13,
  },
});

export default ChartRenderer;