import React, { createContext, useContext, ReactNode } from "react";
import { useSharedValue, SharedValue } from "react-native-reanimated";

interface ScrollContextType {
  scrollOffset: SharedValue<number>;
}

const ScrollContext = createContext<ScrollContextType | null>(null);

export const ScrollProvider = ({ children }: { children: ReactNode }): JSX.Element => {
  const scrollOffset = useSharedValue(0);
  
  return (
    <ScrollContext.Provider value={{ scrollOffset }}>
      {children}
    </ScrollContext.Provider>
  );
};

export function useSharedScroll() {
  const context = useContext(ScrollContext);
  if (!context) {
    throw new Error("useSharedScroll must be used within a ScrollProvider");
  }
  return context.scrollOffset;
}
