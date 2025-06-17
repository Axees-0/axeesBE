import React from "react";
import { useWindowDimensions, Platform } from "react-native";
import Mobile from "@/components/mobile/UAM006MyProfile";
import Web from "@/components/web/UAM006MyProfile";

const BREAKPOINTS = {
  mobile: 768,
};

const ProfileScreen = () => {
  const window = useWindowDimensions();
  const isMobileScreen = window.width <= BREAKPOINTS.mobile;
  const isWeb = Platform.OS === "web";

  if (isMobileScreen) {
    return <Mobile />;
  }

  return (
    <>
      <Web />
    </>
  );
};

export default ProfileScreen;
