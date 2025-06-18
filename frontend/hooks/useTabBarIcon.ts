"use client";

import { useEffect, useState } from "react";
import { useIsFocused } from "@react-navigation/native";

export function useTabBarIcon(focused: boolean) {
  const [opacity, setOpacity] = useState(focused ? 1 : 0.6);
  const isFocused = useIsFocused();

  useEffect(() => {
    setOpacity(isFocused ? 1 : 0.6);
  }, [isFocused]);

  return {
    style: {
      opacity,
    },
  };
}
