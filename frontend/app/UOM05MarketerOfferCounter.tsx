import Mobile from "@/components/mobile/UOM05MarketerOfferCounter";
import Web from "@/components/web/UOM05MarketerOfferCounter";
import { useWindowDimensions } from "react-native";

const BREAKPOINTS = {
  mobile: 768,
};

const UOM05MarketerOfferCounter = () => {
  const window = useWindowDimensions();

  const isMobileScreen = window.width <= BREAKPOINTS.mobile;

  if (isMobileScreen) {
    return <Mobile />;
  }

  return <Web />;
};

export default UOM05MarketerOfferCounter;