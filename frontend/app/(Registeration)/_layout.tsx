import { View, StyleSheet } from "react-native";
import React from "react";
import { Slot, usePathname } from "expo-router";
import Header from "@/components/Header";

const _layout = () => {
  const pathname = usePathname();

  return (
    <>
      <Header title={pathname.split("/").pop() || ""} />

      <View style={styles.container}>
        <View style={styles.content}>
          <Slot />
        </View>
      </View>
    </>
  );
};

export default _layout;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginHorizontal: "5%",
    marginTop: "2%",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    width: "100%",
    maxWidth: 550,
    marginHorizontal: "5%",
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
  },
});
