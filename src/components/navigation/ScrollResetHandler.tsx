import { usePathname } from "expo-router";
import { useEffect, useRef } from "react";
import { useSharedScroll } from "../../hooks/useSharedScroll";

/**
 * Component that resets the scroll offset in the SharedValue whenever the path changes.
 * This ensures that the BottomNav and other scroll-dependent UI elements reset
 * to their initial state on navigation.
 */
export const ScrollResetHandler = () => {
  const pathname = usePathname();
  const scrollOffset = useSharedScroll();
  const lastPathname = useRef(pathname);

  useEffect(() => {
    if (pathname !== lastPathname.current) {
      scrollOffset.value = 0;
      lastPathname.current = pathname;
    }
  }, [pathname, scrollOffset]);

  return null;
};
