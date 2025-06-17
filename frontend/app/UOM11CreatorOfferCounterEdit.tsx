import Mobile from "@/components/mobile/UOM11CreatorOfferCounterEdit";

import Web from "@/components/web/UOM11CreatorOfferCounterEdit";
import { useWindowDimensions } from "react-native";

const BREAKPOINTS = {
  mobile: 768,
};

const UOM11CreatorOfferCounterEdit = () => {
  const window = useWindowDimensions();

  const isMobileScreen = window.width <= BREAKPOINTS.mobile;

  if (isMobileScreen) {
    return <Mobile />;
  }

  return <Web />;
};

export default UOM11CreatorOfferCounterEdit;
