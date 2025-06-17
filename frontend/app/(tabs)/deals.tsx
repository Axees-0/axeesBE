import Mobile from "@/components/mobile/UOM08MarketerDealHistoryList";
import Web from "@/components/web/UOM08MarketerDealHistoryList";
import WebBottomTabs from "@/components/WebBottomTabs";
import { Fragment } from "react";
import { Platform, useWindowDimensions } from "react-native";

const BREAKPOINTS = {
  mobile: 768,
};

const UOM08MarketerDealHistoryList = () => {
  const window = useWindowDimensions();
  const isWeb = Platform.OS === "web";
  const isMobileScreen = window.width <= BREAKPOINTS.mobile;

  if (isMobileScreen) {
    return <Mobile />;
  }

  return (
    <>
      <Web />
      {/* {isWeb && <WebBottomTabs activeIndex={1} />} */}
    </>
  );
};

export default UOM08MarketerDealHistoryList;
