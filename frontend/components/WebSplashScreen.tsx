import * as React from "react";
import { Image } from "expo-image";
import { StyleSheet, Text, View } from "react-native";
import { FontFamily, Color } from "../GlobalStyles";
import { Dimensions } from "react-native";

const WebSplashScreen = () => {
  return (
    <View style={styles.container}>
      <Image
        style={styles.frameChild}
        contentFit={"contain"}
        source={require("../assets/logo.png")}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  frameChild: {
    width: "80%",
    height: "15%",
  },
  container: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Color.cSK430B92500,
  },
  automatedInfluencerMarketing: {
    alignSelf: "stretch",
    fontSize: 24,
    fontWeight: "500",
    fontFamily: FontFamily.clashDisplaySemibold,
    color: "#fff",
    textAlign: "center",
  },
  frameParent: {
    position: "absolute",
    marginTop: -89,
    marginLeft: -409,
    top: "50%",
    left: "50%",
    width: 817,
    alignItems: "center",
    justifyContent: "center",
    gap: 32,
  },
  axeesTitle2: {
    backgroundColor: Color.cSK430B92500,
    flex: 1,
    width: "100%",
    height: 832,
    overflow: "hidden",
  },
});

export default WebSplashScreen;
