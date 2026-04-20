import * as FileSystem from 'expo-file-system';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

/**
 * Parses an Excel (.xlsx, .xls) file from the given URI.
 * Returns an object with { headers, data } where data is an array of row objects.
 */
export const parseExcelFile = async (uri) => {
  try {
    // Read file as base64 since react-native can't handle ArrayBuffers from FS directly
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Parse workbook with xlsx
    const workbook = XLSX.read(base64, { type: 'base64' });
    const firstSheetName = workbook.SheetNames[0];

    if (!firstSheetName) {
      throw new Error('No sheets found in the Excel file');
    }

    const worksheet = workbook.Sheets[firstSheetName];

    // Convert sheet to JSON - first row is header, rest are data
    const jsonData = XLSX.utils.sheet_to_json(worksheet, {
      defval: null,
      raw: false,
    });

    if (!jsonData || jsonData.length === 0) {
      throw new Error('The Excel file appears to be empty');
    }

    const headers = Object.keys(jsonData[0]);
    return { headers, data: cleanData(jsonData, headers) };
  } catch (error) {
    throw new Error(`Excel parsing failed: ${error.message}`);
  }
};

/**
 * Parses a CSV file from the given URI using Papa Parse.
 * Returns an object with { headers, data }.
 */
export const parseCsvFile = async (uri) => {
  try {
    const content = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    return new Promise((resolve, reject) => {
      Papa.parse(content, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors && results.errors.length > 0) {
            // Non-fatal: we can still work with partial results
            console.warn('CSV parse warnings:', results.errors);
          }

          if (!results.data || results.data.length === 0) {
            reject(new Error('The CSV file appears to be empty'));
            return;
          }

          const headers = results.meta.fields || Object.keys(results.data[0]);
          resolve({ headers, data: cleanData(results.data, headers) });
        },
        error: (err) => reject(new Error(`CSV parsing failed: ${err.message}`)),
      });
    });
  } catch (error) {
    throw new Error(`CSV parsing failed: ${error.message}`);
  }
};

/**
 * Main entry point - routes to the right parser based on file extension.
 */
export const parseFile = async (fileUri, fileName) => {
  const lower = (fileName || '').toLowerCase();

  if (lower.endsWith('.xlsx') || lower.endsWith('.xls')) {
    return parseExcelFile(fileUri);
  } else if (lower.endsWith('.csv')) {
    return parseCsvFile(fileUri);
  } else {
    throw new Error('Unsupported file type. Please upload .xlsx, .xls, or .csv files.');
  }
};

/**
 * Removes rows that are entirely empty and trims string values.
 * Keeps null for individual missing cells so consumers can handle gracefully.
 */
const cleanData = (rows, headers) => {
  return rows
    .map((row) => {
      const cleaned = {};
      headers.forEach((h) => {
        const val = row[h];
        if (val === undefined || val === '' || val === null) {
          cleaned[h] = null;
        } else if (typeof val === 'string') {
          const trimmed = val.trim();
          // Try to coerce numeric strings
          if (trimmed !== '' && !isNaN(Number(trimmed))) {
            cleaned[h] = Number(trimmed);
          } else {
            cleaned[h] = trimmed === '' ? null : trimmed;
          }
        } else {
          cleaned[h] = val;
        }
      });
      return cleaned;
    })
    .filter((row) => {
      // Drop rows where every value is null
      return Object.values(row).some((v) => v !== null);
    });
};

/**
 * Determines which columns contain numeric data by sampling rows.
 * Returns an array of column names that are safe for Y-axis selection.
 */
export const detectNumericColumns = (data, headers) => {
  if (!data || data.length === 0) return [];

  const sampleSize = Math.min(data.length, 50);
  const numericCols = [];

  headers.forEach((header) => {
    let numericCount = 0;
    let totalChecked = 0;

    for (let i = 0; i < sampleSize; i++) {
      const val = data[i][header];
      if (val === null || val === undefined) continue;
      totalChecked++;
      if (typeof val === 'number' && !isNaN(val)) {
        numericCount++;
      } else if (typeof val === 'string' && !isNaN(Number(val)) && val.trim() !== '') {
        numericCount++;
      }
    }

    // A column is numeric if at least 80% of sampled non-null values are numeric
    if (totalChecked > 0 && numericCount / totalChecked >= 0.8) {
      numericCols.push(header);
    }
  });

  return numericCols;
};

/**
 * Extracts a (x, y) pair of arrays from the dataset for charting.
 * Handles missing values, casts numbers safely, and optionally applies a numeric range filter on Y.
 */
export const extractChartData = (data, xColumn, yColumn, filterRange = null) => {
  if (!data || !xColumn || !yColumn) {
    return { xData: [], yData: [] };
  }

  const xData = [];
  const yData = [];

  data.forEach((row) => {
    const xVal = row[xColumn];
    const yVal = row[yColumn];

    // Skip rows missing either value
    if (xVal === null || xVal === undefined) return;
    if (yVal === null || yVal === undefined) return;

    const yNum = typeof yVal === 'number' ? yVal : Number(yVal);
    if (isNaN(yNum)) return;

    // Apply optional range filter
    if (filterRange && (yNum < filterRange.min || yNum > filterRange.max)) {
      return;
    }

    xData.push(String(xVal));
    yData.push(yNum);
  });

  return { xData, yData };
};

/**
 * For large datasets, reduce to a manageable size for rendering without hanging the UI.
 * Uses simple downsampling - pick every Nth point.
 */
export const downsampleData = (xData, yData, maxPoints = 50) => {
  if (xData.length <= maxPoints) {
    return { xData, yData };
  }

  const step = Math.ceil(xData.length / maxPoints);
  const sampledX = [];
  const sampledY = [];

  for (let i = 0; i < xData.length; i += step) {
    sampledX.push(xData[i]);
    sampledY.push(yData[i]);
  }

  return { xData: sampledX, yData: sampledY };
};
