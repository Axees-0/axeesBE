import React from "react";
import { useWindowDimensions, Platform } from "react-native";
import Mobile from "@/components/mobile/UAM006MyProfile";
import Web from "@/components/web/UAM006MyProfile";
import { WebSEO } from "../web-seo";

const BREAKPOINTS = {
  mobile: 768,
};

const ProfileScreen = () => {
  const window = useWindowDimensions();
  const isMobileScreen = window.width <= BREAKPOINTS.mobile;
  const isWeb = Platform.OS === "web";

  if (isMobileScreen) {
    return (
      <>
        <WebSEO 
          title="Profile" 
          description="Manage your Axees profile, showcase your work, and track your performance metrics." 
          keywords="profile, creator profile, influencer profile, portfolio, metrics"
        />
        <Mobile />
      </>
    );
  }

  return (
    <>
      <WebSEO 
        title="Profile" 
        description="Manage your Axees profile, showcase your work, and track your performance metrics." 
        keywords="profile, creator profile, influencer profile, portfolio, metrics"
      />
      <Web />
    </>
  );
};

export default ProfileScreen;
