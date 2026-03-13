import { usePathname } from "expo-router";
import { useEffect, useRef } from "react";
import { useUIStore } from "../../store/useUIStore";

/**
 * Component that resets the scroll offset in useUIStore whenever the path changes.
 * This ensures that the BottomNav and other scroll-dependent UI elements reset
 * to their initial state on navigation.
 */
export const ScrollResetHandler = () => {
  const pathname = usePathname();
  const setScrollOffset = useUIStore((state) => state.setScrollOffset);
  const lastPathname = useRef(pathname);

  useEffect(() => {
    // Only reset if the actual path changed (ignoring params if needed, but pathname handles that)
    if (pathname !== lastPathname.current) {
      setScrollOffset(0);
      lastPathname.current = pathname;
    }
  }, [pathname, setScrollOffset]);

  return null;
};
