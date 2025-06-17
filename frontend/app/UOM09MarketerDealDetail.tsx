import Mobile from "@/components/mobile/UOM09MarketerDealDetail";

import Web from "@/components/web/UOM09MarketerDealDetail";
import { useWindowDimensions } from "react-native";

const BREAKPOINTS = {
  mobile: 768,
};

const UOM09MarketerDealDetail = () => {
  const window = useWindowDimensions();

  const isMobileScreen = window.width <= BREAKPOINTS.mobile;

  if (isMobileScreen) {
    return <Mobile />;
  }

  return <Web />;
};

export default UOM09MarketerDealDetail;
