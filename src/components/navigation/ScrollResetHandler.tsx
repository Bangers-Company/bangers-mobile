import { usePathname } from "expo-router";
import { useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../store/redux/store";
import { setScrollOffset } from "../../store/redux/uiSlice";

/**
 * Component that resets the scroll offset in Redux whenever the path changes.
 * This ensures that the BottomNav and other scroll-dependent UI elements reset
 * to their initial state on navigation.
 */
export const ScrollResetHandler = () => {
  const pathname = usePathname();
  const dispatch = useDispatch<AppDispatch>();
  const lastPathname = useRef(pathname);

  useEffect(() => {
    // Only reset if the actual path changed (ignoring params if needed, but pathname handles that)
    if (pathname !== lastPathname.current) {
      dispatch(setScrollOffset(0));
      lastPathname.current = pathname;
    }
  }, [pathname, dispatch]);

  return null;
};
