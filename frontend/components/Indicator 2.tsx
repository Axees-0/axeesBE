"use client";

import React from "react";
import { View, StyleSheet, Animated } from "react-native";
import { Color, Border } from "../GlobalStyles";

interface IndicatorProps {
  activeIndex: number;
  totalTabs: number;
}

export function Indicator({ activeIndex, totalTabs }: IndicatorProps) {
  const indicatorPosition = React.useMemo(() => {
    return new Animated.Value(activeIndex);
  }, [activeIndex]); // Added activeIndex to dependencies

  React.useEffect(() => {
    Animated.spring(indicatorPosition, {
      toValue: activeIndex,
      useNativeDriver: true,
    }).start();
  }, [activeIndex, indicatorPosition]);

  const translateX = indicatorPosition.interpolate({
    inputRange: [0, totalTabs - 1],
    outputRange: [-(totalTabs - 1) * 72, 72], // Adjust based on your layout
  });

  return (
    <View style={styles.homeIndicator}>
      <Animated.View
        style={[styles.indicator, { transform: [{ translateX }] }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  homeIndicator: {
    height: 34,
    backgroundColor: Color.cSK430B92500,
    position: "absolute",
    bottom: 0,
  },
  indicator: {
    width: "100%",
    height: 5,
    backgroundColor: Color.backgroundsPrimary,
    borderRadius: Border.br_81xl,
    position: "absolute",
    bottom: 8,
    left: "50%",
    marginLeft: -72, // Center the indicator
  },
});
