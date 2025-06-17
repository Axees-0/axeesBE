import Mobile from "@/components/mobile/UOM08MarketerDealHistoryList";

import Web from "@/components/web/UOM08MarketerDealHistoryList";
import { useWindowDimensions } from "react-native";

const BREAKPOINTS = {
  mobile: 768,
};

const UOM08MarketerDealHistoryList = () => {
  const window = useWindowDimensions();

  const isMobileScreen = window.width <= BREAKPOINTS.mobile;

  if (isMobileScreen) {
    return <Mobile />;
  }

  return <Web />;
};

export default UOM08MarketerDealHistoryList;
