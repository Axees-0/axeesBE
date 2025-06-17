import Mobile from "@/components/mobile/UOM07MarketerOfferHistoryList";

import Web from "@/components/web/UOM07MarketerOfferHistoryList";
import { useWindowDimensions } from "react-native";

const BREAKPOINTS = {
  mobile: 768,
};

const UOM07MarketerOfferHistoryList = () => {
  const window = useWindowDimensions();

  const isMobileScreen = window.width <= BREAKPOINTS.mobile;

  if (isMobileScreen) {
    return <Mobile />;
  }

  return <Web />;
};

export default UOM07MarketerOfferHistoryList;
