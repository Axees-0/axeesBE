import Mobile from "@/components/mobile/UOM06MarketerOfferCounterEdit";

import Web from "@/components/web/UOM06MarketerOfferCounterEdit";
import { useWindowDimensions } from "react-native";

const BREAKPOINTS = {
  mobile: 768,
};

const UOM06MarketerOfferCounterEdit = () => {
  const window = useWindowDimensions();

  const isMobileScreen = window.width <= BREAKPOINTS.mobile;

  if (isMobileScreen) {
    return <Mobile />;
  }

  return <Web />;
};

export default UOM06MarketerOfferCounterEdit;
