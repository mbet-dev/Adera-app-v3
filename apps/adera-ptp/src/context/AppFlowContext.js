import React, { createContext, useContext } from 'react';

const AppFlowContext = createContext({
  openAppSelector: () => {},
});

export const AppFlowProvider = ({ value, children }) => (
  <AppFlowContext.Provider value={value}>
    {children}
  </AppFlowContext.Provider>
);

export const useAppFlow = () => useContext(AppFlowContext);
