import {
  View,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  Platform,
  StyleSheet,
} from "react-native";
import React from "react";
import CustomBackButton from "./CustomBackButton";
import ProfileInfo from "./ProfileInfo";
import { router } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/hooks/useNotifications";
import Navbar from "./web/navbar";

const BREAKPOINTS = {
  MOBILE: 550,
  TABLET: 768,
  DESKTOP: 1280,
};

const getHeaderTitle = (title: string) => {
  if (title === "UAM04ChangePassword") {
    return "Reset Password";
  }
  if (title === "UAM03ForgotPassword") {
    return "Forgot Password";
  }
  if (title === "UAM02Signup") {
    return "Signup";
  }
  if (title === "UAM001Login") {
    return "Login";
  }
  if (title === "UAM002Signup") {
    return "Signup";
  }
  if (title === "ULM02ForgotPassword") {
    return "Forgot Password";
  }
  if (title === "UAM004ChangePassword") {
    return "Change Password";
  }
  if (title === "UAM005ResetPassword") {
    return "Reset Password";
  }
  if (title === "UAM006VerifyEmail") {
    return "Verify Email";
  }

  if (title === "URM01CreateAccount") {
    return "Create Account";
  }

  if (title === "URM01Phone") {
    return "Phone";
  }

  if (title === "ULM3OTP") {
    return "Verify OTP";
  }

  if (title === "URM02Name") {
    return "";
  }

  if (title === "URM05SetEmail") {
    return "";
  }

  if (title === "URM03Username") {
    return "";
  }

  if (title === "URM06SetPassword") {
    return "";
  }

  return title;
};

const Header = ({ title }: { title: string }) => {
  const window = useWindowDimensions();
  const isWeb = Platform.OS === "web";
  const isWideScreen = window.width >= BREAKPOINTS.TABLET;
  const { user } = useAuth();
  const { requestNotificationPermission } = useNotifications();
  return (
    <View style={styles.header}>
      <Navbar pageTitle= {getHeaderTitle(title)}/>
      {/* {user?._id ? (
        <TouchableOpacity
          style={{
            borderWidth: 1,
            borderColor: "#430B92",
            paddingHorizontal: 20,
            paddingVertical: 8,
            borderRadius: 12,
          }}
          onPress={() => {
            requestNotificationPermission();
            if (title === "URM01CreateAccount") {
              router.push("/UAM001Login");
            } else {
              router.push("/URM01CreateAccount");
            }
          }}
        >
          <Text style={styles.headerText}>
            {title !== "URM01CreateAccount" ? "Sign up" : "Sign in"}
          </Text>
        </TouchableOpacity>
      ):null} */}
    </View>
  );
};

export default Header;

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    // marginHorizontal: "5%",
    // marginTop: "2%",
  },
  headerText: {
    fontSize: 20,
    fontFamily: "sFPro",
    color: "#430B92",
    textAlign: "center",
  },

  webHeaderText: {
    fontSize: 20,
  },
});
