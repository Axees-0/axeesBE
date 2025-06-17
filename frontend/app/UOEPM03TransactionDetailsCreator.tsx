import Mobile from "@/components/mobile/UOEPM03TransactionDetailsCreator";

import Web from "@/components/web/UOEPM03TransactionDetailsCreator";
import { useWindowDimensions } from "react-native";
import { Redirect } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";

const BREAKPOINTS = {
  mobile: 768,
};

const UOEPM03TransactionDetailsCreator = () => {
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

export default UOEPM03TransactionDetailsCreator;
