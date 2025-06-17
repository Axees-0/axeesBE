import Mobile from "@/components/mobile/UOM04MarketerCustomOffer";

import Web from "@/components/web/UOM04MarketerCustomOffer";
import { useWindowDimensions } from "react-native";

const BREAKPOINTS = {
  mobile: 768,
};

const UOM04MarketerCustomOffer = () => {
  const window = useWindowDimensions();

  const isMobileScreen = window.width <= BREAKPOINTS.mobile;

  if (isMobileScreen) {
    return <Mobile />;
  }

  return <Web />;
};

export default UOM04MarketerCustomOffer;
