import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, DataTable, Surface } from 'react-native-paper';

/**
 * Displays the first N rows of the parsed dataset in a horizontally
 * scrollable table. Auto-detects and uses the provided headers.
 */
const DataPreview = ({ headers = [], data = [], rowLimit = 10 }) => {
  if (!headers.length || !data.length) {
    return (
      <Surface style={styles.empty} elevation={1}>
        <Text style={styles.emptyText}>No data to preview</Text>
      </Surface>
    );
  }

  const previewRows = data.slice(0, rowLimit);

  // Helper to format values for display
  const formatCell = (val) => {
    if (val === null || val === undefined) return '—';
    if (typeof val === 'number') {
      // Limit decimals to keep table tidy
      return Number.isInteger(val) ? String(val) : val.toFixed(2);
    }
    const str = String(val);
    return str.length > 20 ? str.slice(0, 20) + '…' : str;
  };

  return (
    <Surface style={styles.container} elevation={2}>
      <View style={styles.header}>
        <Text variant="titleMedium" style={styles.title}>
          Data Preview
        </Text>
        <Text variant="bodySmall" style={styles.subtitle}>
          Showing first {previewRows.length} of {data.length} rows · {headers.length} columns
        </Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator>
        <DataTable style={styles.table}>
          <DataTable.Header style={styles.tableHeader}>
            {headers.map((header, idx) => (
              <DataTable.Title
                key={`${header}-${idx}`}
                style={styles.cell}
                textStyle={styles.headerText}
              >
                {header}
              </DataTable.Title>
            ))}
          </DataTable.Header>

          {previewRows.map((row, rIdx) => (
            <DataTable.Row
              key={`row-${rIdx}`}
              style={[
                styles.tableRow,
                rIdx % 2 === 0 ? styles.evenRow : styles.oddRow,
              ]}
            >
              {headers.map((header, cIdx) => (
                <DataTable.Cell
                  key={`cell-${rIdx}-${cIdx}`}
                  style={styles.cell}
                  textStyle={styles.cellText}
                >
                  {formatCell(row[header])}
                </DataTable.Cell>
              ))}
            </DataTable.Row>
          ))}
        </DataTable>
      </ScrollView>
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    marginVertical: 8,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontWeight: '700',
    color: '#1a1a1a',
  },
  subtitle: {
    color: '#666',
    marginTop: 4,
  },
  table: {
    minWidth: '100%',
  },
  tableHeader: {
    backgroundColor: '#f3e5ff',
  },
  tableRow: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  evenRow: {
    backgroundColor: '#fff',
  },
  oddRow: {
    backgroundColor: '#fafafa',
  },
  cell: {
    minWidth: 120,
    paddingHorizontal: 8,
  },
  headerText: {
    fontWeight: '700',
    color: '#6200ee',
    fontSize: 13,
  },
  cellText: {
    color: '#333',
    fontSize: 13,
  },
  empty: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
  },
  emptyText: {
    color: '#999',
  },
});

export default DataPreview;
