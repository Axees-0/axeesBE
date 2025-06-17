import Mobile from "@/components/mobile/UOM12CreatorDealDetails";

import Web from "@/components/web/UOM12CreatorDealDetails";
import { useWindowDimensions } from "react-native";

const BREAKPOINTS = {
  mobile: 768,
};

const UOM12CreatorDealDetails = () => {
  const window = useWindowDimensions();

  const isMobileScreen = window.width <= BREAKPOINTS.mobile;

  if (isMobileScreen) {
    return <Mobile />;
  }

  return <Web />;
};

export default UOM12CreatorDealDetails;
