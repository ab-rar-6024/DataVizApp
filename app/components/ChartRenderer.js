import React, { useMemo } from 'react';
import { View, Dimensions, StyleSheet, ScrollView } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import {
  LineChart,
  BarChart,
  PieChart,
} from 'react-native-chart-kit';
import Svg, { Circle, G, Line, Text as SvgText } from 'react-native-svg';

import { downsampleData } from '../utils/fileParser';

const screenWidth = Dimensions.get('window').width;

// Shared chart configuration for react-native-chart-kit
const baseChartConfig = {
  backgroundColor: '#ffffff',
  backgroundGradientFrom: '#ffffff',
  backgroundGradientTo: '#ffffff',
  decimalPlaces: 2,
  color: (opacity = 1) => `rgba(98, 0, 238, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(60, 60, 60, ${opacity})`,
  style: { borderRadius: 16 },
  propsForDots: {
    r: '4',
    strokeWidth: '2',
    stroke: '#6200ee',
  },
  propsForBackgroundLines: {
    stroke: '#e0e0e0',
    strokeDasharray: '4 4',
  },
};

// Colors used for pie slices
const PIE_COLORS = [
  '#6200ee', '#03dac6', '#ff6b6b', '#ffa502', '#2ed573',
  '#1e90ff', '#ff4757', '#a29bfe', '#fdcb6e', '#00cec9',
];

/**
 * Truncates long labels so the chart axis stays readable.
 */
const truncateLabel = (label, max = 8) => {
  const str = String(label);
  return str.length > max ? str.slice(0, max) + '…' : str;
};

/**
 * Main chart renderer. Takes chart type + x/y data and renders the appropriate chart.
 */
const ChartRenderer = ({
  chartType,
  xData,
  yData,
  xLabel = 'X',
  yLabel = 'Y',
  title,
}) => {
  // Downsample very large datasets for performance and readability
  const { xData: sampledX, yData: sampledY } = useMemo(() => {
    const maxPoints = chartType === 'pie' ? 8 : 20;
    return downsampleData(xData, yData, maxPoints);
  }, [xData, yData, chartType]);

  // Guard against empty data
  if (!sampledX || sampledX.length === 0) {
    return (
      <Surface style={styles.emptyChart} elevation={1}>
        <Text style={styles.emptyText}>No data available for this chart</Text>
      </Surface>
    );
  }

  const chartWidth = screenWidth - 48;
  const chartHeight = 240;

  // Prepare labels - trim them so the X-axis doesn't overflow
  const labels = sampledX.map((l) => truncateLabel(l, 6));

  // Common data shape for line/bar/area
  const lineBarData = {
    labels,
    datasets: [
      {
        data: sampledY,
        color: (opacity = 1) => `rgba(98, 0, 238, ${opacity})`,
        strokeWidth: 2,
      },
    ],
    legend: [yLabel],
  };

  const renderChart = () => {
    switch (chartType) {
      case 'line':
        return (
          <LineChart
            data={lineBarData}
            width={chartWidth}
            height={chartHeight}
            chartConfig={baseChartConfig}
            bezier
            style={styles.chart}
            verticalLabelRotation={30}
            fromZero
          />
        );

      case 'bar':
        return (
          <BarChart
            data={lineBarData}
            width={chartWidth}
            height={chartHeight}
            chartConfig={{
              ...baseChartConfig,
              barPercentage: 0.6,
            }}
            style={styles.chart}
            verticalLabelRotation={30}
            fromZero
            showValuesOnTopOfBars={false}
          />
        );

      case 'pie': {
        // Aggregate y values by x to build pie slices
        const aggregated = {};
        sampledX.forEach((x, i) => {
          const key = String(x);
          aggregated[key] = (aggregated[key] || 0) + sampledY[i];
        });

        const pieData = Object.entries(aggregated).map(([name, value], idx) => ({
          name: truncateLabel(name, 10),
          population: Math.abs(value), // Pie chart requires positive values
          color: PIE_COLORS[idx % PIE_COLORS.length],
          legendFontColor: '#333',
          legendFontSize: 12,
        }));

        return (
          <PieChart
            data={pieData}
            width={chartWidth}
            height={chartHeight}
            chartConfig={baseChartConfig}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute={false}
            style={styles.chart}
          />
        );
      }

      case 'area':
        // Area is a filled line chart in react-native-chart-kit
        return (
          <LineChart
            data={lineBarData}
            width={chartWidth}
            height={chartHeight}
            chartConfig={{
              ...baseChartConfig,
              fillShadowGradient: '#6200ee',
              fillShadowGradientOpacity: 0.4,
            }}
            bezier
            style={styles.chart}
            verticalLabelRotation={30}
            fromZero
          />
        );

      case 'scatter':
        return (
          <ScatterPlot
            xData={sampledY.map((_, i) => i)} // Use index as numeric X for scatter
            yData={sampledY}
            labels={labels}
            width={chartWidth}
            height={chartHeight}
            xLabel={xLabel}
            yLabel={yLabel}
          />
        );

      default:
        return (
          <Text style={styles.emptyText}>Unsupported chart type: {chartType}</Text>
        );
    }
  };

  return (
    <Surface style={styles.chartContainer} elevation={2}>
      {title ? (
        <Text variant="titleMedium" style={styles.chartTitle}>
          {title}
        </Text>
      ) : null}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {renderChart()}
      </ScrollView>
    </Surface>
  );
};

/**
 * Custom scatter plot built with react-native-svg since chart-kit doesn't
 * provide a true scatter. Plots points on a simple coordinate grid.
 */
const ScatterPlot = ({ xData, yData, width, height, xLabel, yLabel }) => {
  if (!xData.length || !yData.length) return null;

  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
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

  // Build grid ticks (4 per axis)
  const xTicks = [0, 1, 2, 3, 4].map((i) => xMin + (i / 4) * xRange);
  const yTicks = [0, 1, 2, 3, 4].map((i) => yMin + (i / 4) * yRange);

  return (
    <Svg width={width} height={height}>
      <G>
        {/* Grid lines */}
        {yTicks.map((t, i) => (
          <Line
            key={`hg-${i}`}
            x1={padding.left}
            y1={scaleY(t)}
            x2={padding.left + plotW}
            y2={scaleY(t)}
            stroke="#e0e0e0"
            strokeDasharray="4 4"
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
            stroke="#e0e0e0"
            strokeDasharray="4 4"
            strokeWidth={1}
          />
        ))}

        {/* Axes */}
        <Line
          x1={padding.left}
          y1={padding.top}
          x2={padding.left}
          y2={padding.top + plotH}
          stroke="#333"
          strokeWidth={1.5}
        />
        <Line
          x1={padding.left}
          y1={padding.top + plotH}
          x2={padding.left + plotW}
          y2={padding.top + plotH}
          stroke="#333"
          strokeWidth={1.5}
        />

        {/* Y-axis tick labels */}
        {yTicks.map((t, i) => (
          <SvgText
            key={`yl-${i}`}
            x={padding.left - 6}
            y={scaleY(t) + 4}
            fontSize={10}
            fill="#555"
            textAnchor="end"
          >
            {Number.isInteger(t) ? t : t.toFixed(1)}
          </SvgText>
        ))}

        {/* X-axis tick labels */}
        {xTicks.map((t, i) => (
          <SvgText
            key={`xl-${i}`}
            x={scaleX(t)}
            y={padding.top + plotH + 16}
            fontSize={10}
            fill="#555"
            textAnchor="middle"
          >
            {Number.isInteger(t) ? t : t.toFixed(1)}
          </SvgText>
        ))}

        {/* Data points */}
        {xData.map((x, i) => (
          <Circle
            key={`pt-${i}`}
            cx={scaleX(x)}
            cy={scaleY(yData[i])}
            r={4}
            fill="#6200ee"
            opacity={0.75}
          />
        ))}
      </G>
    </Svg>
  );
};

const styles = StyleSheet.create({
  chartContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    alignItems: 'center',
  },
  chartTitle: {
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  chart: {
    borderRadius: 12,
  },
  emptyChart: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    marginVertical: 8,
  },
  emptyText: {
    color: '#999',
    fontStyle: 'italic',
  },
});

export default ChartRenderer;
