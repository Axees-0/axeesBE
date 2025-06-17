import Mobile from "@/components/mobile/UOEPM01PaymentHistoryCreator";

import Web from "@/components/web/UOEPM01PaymentHistoryCreator";
import { useWindowDimensions } from "react-native";
import { Redirect } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";

const BREAKPOINTS = {
  mobile: 768,
};

const UOEPM01PaymentHistoryCreator = () => {
  const window = useWindowDimensions();

  const isMobileScreen = window.width <= BREAKPOINTS.mobile;

  const { user } = useAuth();

  if (!user?._id) {
    return <Redirect href="/UAM001Login" />;
  }

  if (isMobileScreen) {
    return <Mobile />;
  }

  return <Web />;
};

export default UOEPM01PaymentHistoryCreator;
