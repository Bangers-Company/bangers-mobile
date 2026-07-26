import React, { createContext, useContext, ReactNode } from "react";
import { useSharedValue, SharedValue } from "react-native-reanimated";

interface ScrollContextType {
  scrollOffset: SharedValue<number>;
}

const ScrollContext = createContext<ScrollContextType | null>(null);

export const ScrollProvider = ({ children }: { children: ReactNode }): React.JSX.Element => {
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
  // Return the SharedValue directly to match existing usage
  return context.scrollOffset;
}
