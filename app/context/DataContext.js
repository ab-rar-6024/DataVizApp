import React, { createContext, useState } from 'react';

export const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const [data, setData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [fileName, setFileName] = useState('');
  const [xKey, setXKey] = useState(null);
  const [yKey, setYKey] = useState(null);

  return (
    <DataContext.Provider
      value={{
        data, setData,
        headers, setHeaders,
        fileName, setFileName,
        xKey, setXKey,
        yKey, setYKey,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};