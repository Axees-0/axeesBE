import * as React from "react";
import {
  Text,
  StyleSheet,
  View,
  Platform,
  Pressable,
  Alert,
  Switch,
} from "react-native";
import { Image } from "expo-image";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

import Arrowleft023 from "../assets/arrowleft023.svg";
import Vector107 from "../assets/vector-107.svg";
import {
  Color,
  FontFamily,
  FontSize,
  Border,
  Gap,
  Padding,
} from "../GlobalStyles";
import { Redirect, router } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import CustomBackButton from "@/components/CustomBackButton";
import ProfileInfo from "@/components/ProfileInfo";
import Navbar from "@/components/web/navbar";
import WebBottomTabs from "@/components/WebBottomTabs";
const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL + "/api/account";
const UAM003NotificationSettings = () => {
  const isWeb = Platform.OS === "web";
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch current settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ["notificationSettings", user?._id],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/profile/${user?._id}`);
      return (
        response.data?.user?.settings?.notifications || {
          push: true,
          email: true,
          sms: true,
        }
      );
    },
    enabled: !!user?._id,
  });

  // Update settings mutation with optimistic updates
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: {
      type: "push" | "email" | "sms";
      value: boolean;
    }) => {
      const response = await axios.patch(
        `${API_URL}/notification-settings/${user?._id}`,
        { [data.type]: data.value }
      );
      return response.data;
    },
    onMutate: async ({ type, value }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: ["notificationSettings", user?._id],
      });

      // Snapshot the previous value
      const previousSettings = queryClient.getQueryData([
        "notificationSettings",
        user?._id,
      ]);

      // Optimistically update to the new value
      queryClient.setQueryData(
        ["notificationSettings", user?._id],
        (old: any) => ({
          ...old,
          [type]: value,
        })
      );

      // Return context with the previous value
      return { previousSettings };
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      queryClient.setQueryData(
        ["notificationSettings", user?._id],
        context?.previousSettings
      );
      Alert.alert("Error", "Failed to update setting");
    },
    onSettled: () => {
      // Always refetch after error or success to make sure our optimistic update matches the server state
      queryClient.invalidateQueries(["notificationSettings", user?._id]);
    },
  });

  const toggleSetting = async (type: "push" | "email" | "sms") => {
    const newValue = !settings?.[type];
    try {
      await updateSettingsMutation.mutateAsync({
        type,
        value: newValue,
      });
    } catch (error) {
      console.error("Failed to toggle setting:", error);
    }
  };

  if (!user?._id) {
    return <Redirect href="/UAM001Login" />;
  }

  return (
    <>
      <View
        style={[styles.uam003notificationsettings, styles.frameChildLayout]}
      >
        <Navbar pageTitle="Notification Settings" />

        <View style={[styles.frameParent, styles.frameParentPosition]}>
          <View style={styles.frameGroup}>
            <View style={[styles.frameContainer, styles.frameContainerFlexBox]}>
              <Text style={styles.pushNotifications}>Push Notifications</Text>
              <Switch
                value={settings?.push}
                onValueChange={() => toggleSetting("push")}
                trackColor={{ false: "#E2D0FB", true: "#430B92" }}
                thumbColor={settings?.push ? "#FFFFFF" : "#FFFFFF"}
              />
            </View>
            <Vector107
              style={[styles.frameChild, styles.frameChildLayout]}
              width={isWeb ? 1280 : "100%"}
            />
          </View>

          <View style={styles.frameGroup}>
            <View style={[styles.frameContainer, styles.frameContainerFlexBox]}>
              <Text style={styles.pushNotifications}>Email Notifications</Text>
              <Switch
                value={settings?.email}
                onValueChange={() => toggleSetting("email")}
                trackColor={{ false: "#E2D0FB", true: "#430B92" }}
                thumbColor={settings?.email ? "#FFFFFF" : "#FFFFFF"}
              />
            </View>
            <Vector107
              style={[styles.frameChild, styles.frameChildLayout]}
              width={isWeb ? 1280 : "100%"}
            />
          </View>

          <View style={styles.frameGroup}>
            <View style={[styles.frameContainer, styles.frameContainerFlexBox]}>
              <Text style={styles.pushNotifications}>SMS Notifications</Text>
              <Switch
                value={settings?.sms}
                onValueChange={() => toggleSetting("sms")}
                trackColor={{ false: "#E2D0FB", true: "#430B92" }}
                thumbColor={settings?.sms ? "#FFFFFF" : "#FFFFFF"}
              />
            </View>
            <Vector107
              style={[styles.frameChild, styles.frameChildLayout]}
              width={isWeb ? 1280 : "100%"}
            />
          </View>
        </View>
      </View>
      {/* <WebBottomTabs /> */}
    </>
  );
};

const styles = StyleSheet.create({
  frameChildLayout: {
    overflow: "hidden",
    width: "100%",
  },
  timePosition: {
    top: "50%",
    width: "35.75%",
    marginTop: -25.8,
    height: 52,
    position: "absolute",
  },
  time1Typo: {
    textAlign: "center",
    fontWeight: "600",
    color: Color.cSK430B92950,
    fontFamily: FontFamily.inter,
  },
  iconPosition: {
    left: "50%",
    position: "absolute",
  },
  borderLayout: {
    width: 24,
    position: "absolute",
  },
  capacityPosition: {
    backgroundColor: Color.cSK430B92950,
    left: "50%",
    position: "absolute",
  },
  borderPosition: {
    marginLeft: -13.05,
    left: "50%",
  },
  frameParentPosition: {
    width: "100%",
  },
  frameContainerFlexBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  time1: {
    top: "33.98%",
    left: "38.84%",
    fontSize: FontSize.size_base_2,
    lineHeight: 21,
    position: "absolute",
  },
  time: {
    right: "64.25%",
    left: "0%",
  },
  border: {
    height: "100%",
    top: "0%",
    bottom: "0%",
    borderRadius: Border.br_8xs_1,
    borderStyle: "solid",
    borderColor: Color.cSK430B92950,
    borderWidth: 1,
    opacity: 0.35,
    marginLeft: -13.05,
    left: "50%",
  },
  capIcon: {
    marginLeft: 11.75,
    top: "37.1%",
    bottom: "31.45%",
    maxHeight: "100%",
  },
  capacity: {
    height: "69.35%",
    marginLeft: -11.15,
    top: "15.32%",
    bottom: "15.32%",
    borderRadius: Border.br_10xs_4,
    width: 20,
  },
  battery: {
    height: "24.08%",
    marginLeft: 10.05,
    top: "42.52%",
    bottom: "33.4%",
    width: 26,
  },
  wifiIcon: {
    top: "43.88%",
    bottom: "33.2%",
    maxHeight: "100%",
    position: "absolute",
  },
  cellularConnectionIcon: {
    marginLeft: -38.55,
    top: "43.69%",
    bottom: "33.59%",
    maxHeight: "100%",
  },
  levels: {
    right: "0%",
    left: "64.25%",
  },
  statusBarIphone: {
    top: 0,
    left: 0,
    height: 52,
    width: "100%",
    position: "absolute",
    backgroundColor: Color.backgroundsPrimary,
  },
  homeIndicator1: {
    marginLeft: 72,
    bottom: 8,
    borderRadius: Border.br_81xl,
    width: 144,
    height: 5,
    transform: [
      {
        rotate: "180deg",
      },
    ],
  },
  homeIndicator: {
    bottom: 0,
    height: 34,
    backgroundColor: Color.backgroundsPrimary,
  },
  notificationSettings: {
    fontSize: FontSize.size_5xl,
    textAlign: "center",
    fontWeight: "600",
    color: Color.cSK430B92950,
    fontFamily: FontFamily.inter,
  },
  header: {
    padding: 16,
    marginHorizontal: "5%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  arrowLeft02Icon: {
    top: 82,
    left: 20,
  },
  pushNotifications: {
    fontSize: FontSize.size_sm,
    lineHeight: 14,
    color: Color.cSK430B92950,
    fontFamily: FontFamily.inter,
  },
  frameContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  frameChild: {
    maxWidth: "100%",
    alignSelf: "stretch",
    maxHeight: "100%",
  },
  frameGroup: {
    gap: Gap.gap_2xs,
    alignSelf: "stretch",
    maxWidth: 1280,
    marginHorizontal: "auto",
    width: "100%",
  },
  frameChild1: {
    height: 0,
    alignSelf: "stretch",
  },
  frameParent: {
    paddingHorizontal: Padding.p_xl,
    paddingVertical: 0,
    gap: Gap.gap_3xs,
    marginTop: "5%",
  },
  uam003notificationsettings: {
    flex: 1,
    height: 956,
    backgroundColor: Color.backgroundsPrimary,
    marginHorizontal: "auto",
    width: "100%",
  },
});

export default UAM003NotificationSettings;
