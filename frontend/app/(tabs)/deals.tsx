import Mobile from "@/components/mobile/UOM08MarketerDealHistoryList";
import Web from "@/components/web/UOM08MarketerDealHistoryList";
import WebBottomTabs from "@/components/WebBottomTabs";
import { Fragment } from "react";
import { Platform, useWindowDimensions } from "react-native";
import { WebSEO } from "../web-seo";

const BREAKPOINTS = {
  mobile: 768,
};

const UOM08MarketerDealHistoryList = () => {
  const window = useWindowDimensions();
  const isWeb = Platform.OS === "web";
  const isMobileScreen = window.width <= BREAKPOINTS.mobile;

  if (isMobileScreen) {
    return (
      <>
        <WebSEO 
          title="Deals & Offers"
          description="Browse active deals and offers between creators and brands. Manage your campaigns and partnerships on Axees."
          keywords="deals, offers, brand deals, influencer marketing, partnerships"
        />
        <Mobile />
      </>
    );
  }

  return (
    <>
      <WebSEO 
        title="Deals & Offers"
        description="Browse active deals and offers between creators and brands. Manage your campaigns and partnerships on Axees."
        keywords="deals, offers, brand deals, influencer marketing, partnerships"
      />
      <Web />
      {/* {isWeb && <WebBottomTabs activeIndex={1} />} */}
    </>
  );
};

export default UOM08MarketerDealHistoryList;
