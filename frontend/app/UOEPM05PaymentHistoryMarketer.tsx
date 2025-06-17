import Mobile from "@/components/mobile/UOEPM05PaymentHistoryMarketer";

import Web from "@/components/web/UOEPM05PaymentHistoryMarketer";
import { useWindowDimensions } from "react-native";

const BREAKPOINTS = {
  mobile: 768,
};

const UOEPM05PaymentHistoryMarketer = () => {
  const window = useWindowDimensions();

  const isMobileScreen = window.width <= BREAKPOINTS.mobile;

  if (isMobileScreen) {
    return <Mobile />;
  }

  return <Web />;
};

export default UOEPM05PaymentHistoryMarketer;
