import * as React from "react";
import {
  Text,
  StyleSheet,
  View,
  Pressable,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { Image } from "expo-image";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import axios from "axios";
import { Redirect, router } from "expo-router";

import Cap3 from "../assets/cap3.svg";
import Wifi1 from "../assets/wifi1.svg";
import Cellularconnection3 from "../assets/cellular-connection3.svg";
import Arrowleft022 from "../assets/arrowleft022.svg";
import {
  Color,
  Padding,
  FontSize,
  FontFamily,
  Border,
  Gap,
} from "../GlobalStyles";
import { useAuth } from "@/contexts/AuthContext";
import NewInviteModal from "@/components/NewInviteModal";
import Toast from "react-native-toast-message";
import CustomBackButton from "@/components/CustomBackButton";
import ProfileInfo from "@/components/ProfileInfo";
import Navbar from "@/components/web/navbar";
import WebBottomTabs from "@/components/WebBottomTabs";
// Example: your back-end URL
const INVITE_API = process.env.EXPO_PUBLIC_BACKEND_URL + "/api/invite";

export default function UAM05InviteList() {
  const [isModalVisible, setModalVisible] = useState(false);
  const [isCreateModalVisible, setCreateModalVisible] = useState(false);
  const [selectedInvite, setSelectedInvite] = useState(null);
  const { user } = useAuth();

  // 1) Fetch invites from backend
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["myInvites"],
    queryFn: async () => {
      // GET /invite/my-invites
      // pass user id in the request
      const resp = await axios.get(`${INVITE_API}/my-invites`, {
        params: {
          userId: user?._id,
        },
        // If you need auth token, pass headers here
        // headers: { Authorization: `Bearer ${token}` }
      });
      return resp.data;
    },
    enabled: !!user?._id,
  });

  const deleteInviteMutation = useMutation({
    mutationFn: async (inviteId: string) => {
      const resp = await axios.delete(`${INVITE_API}/${inviteId}`);
      return resp.data;
    },
  });

  // 2) Handler to open modal
  const handleOpenModal = (invite) => {
    setSelectedInvite(invite);
    setModalVisible(true);
  };

  // 3) Handler to close modal
  const handleCloseModal = () => {
    setSelectedInvite(null);
    setModalVisible(false);
  };

  // 4) Handler to delete invite
  const handleDeleteInvite = async (inviteId: string) => {
    // DELETE /invite/:inviteId
    const resp = await deleteInviteMutation.mutateAsync(inviteId);

    Toast.show({
      type: "success",
      text1: "Success",
      text2: "Invite deleted successfully",
    });

    refetch();
    handleCloseModal();
  };

  // If you want to navigate back
  const handleBack = () => {
    router.back();
  };

  // Data array of invites
  const invites = data?.invites || [];

  if (!user?._id) {
    return <Redirect href="/UAM001Login" />;
  }

  return (
    <>
      <View style={styles.uam05invitelist}>
        <Navbar pageTitle="Invites List" />
        {/* <View style={styles.header}>
        <CustomBackButton />
        <Text style={styles.invitesList}>Invites List</Text>
        <ProfileInfo />
      </View> */}

        {/* Main content area */}
        <View style={[styles.frameParent, styles.frameParentLayout]}>
          <View
            style={{
              maxWidth: 1280,
              marginHorizontal: "auto",
              width: "100%",
            }}
          >
            {/* "Your Invites" row */}
            <View
              style={[styles.yourInvitesParent, styles.frameWrapperFlexBox]}
            >
              <Text style={styles.yourInvites}>Your Invites</Text>
              <View style={styles.groupParentFlexBox}>
                {/* Could open a create screen */}
                <TouchableOpacity onPress={() => setCreateModalVisible(true)}>
                  <Text style={[styles.createNew, styles.createNewTypo]}>
                    Create New
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Invite list */}
            {isLoading ? (
              <ActivityIndicator
                size="large"
                color="#430B92"
                style={{ marginTop: 20 }}
              />
            ) : isError ? (
              <Text style={{ color: "red", marginTop: 20 }}>
                {error?.response?.data?.message || error.message}
              </Text>
            ) : (
              <ScrollView style={styles.frameGroup}>
                {invites.map((invite) => (
                  <Pressable
                    key={invite._id}
                    onPress={() => handleOpenModal(invite)}
                    style={[styles.frameWrapper, styles.frameWrapperFlexBox]}
                  >
                    <View
                      style={[styles.groupParent, styles.groupParentFlexBox]}
                    >
                      {/* Example user avatar or fallback */}
                      <Image
                        style={styles.frameChild}
                        contentFit="cover"
                        source={require("../assets/group-271.png")}
                      />
                      <View style={styles.jordanLeeParent}>
                        <Text style={[styles.jordanLee, styles.createNewTypo]}>
                          {invite.inviteeName}
                        </Text>
                        <Text style={styles.jordanLee123}>
                          {invite.inviteeEmail}
                        </Text>
                      </View>
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            )}
          </View>
        </View>

        {/* Modal for creating a new invite */}
        <NewInviteModal
          visible={isCreateModalVisible}
          onClose={() => setCreateModalVisible(false)}
          onInviteCreated={() => refetch()}
        />

        {/* Modal for invite status */}
        <Modal
          visible={isModalVisible}
          transparent
          animationType="slide"
          onRequestClose={handleCloseModal}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Invite Details</Text>
              {selectedInvite ? (
                <>
                  <Text style={styles.modalLabel}>
                    Name: {selectedInvite.inviteeName}
                  </Text>
                  <Text style={styles.modalLabel}>
                    Email: {selectedInvite.inviteeEmail}
                  </Text>
                  <Text style={styles.modalLabel}>
                    Status: {selectedInvite.status}
                  </Text>
                </>
              ) : (
                <Text>No invite selected</Text>
              )}
              <View style={{ flexDirection: "row", gap: 10 }}>
                <TouchableOpacity
                  style={[styles.closeButton, { backgroundColor: "#430B92" }]}
                  onPress={handleCloseModal}
                >
                  <Text style={styles.closeButtonText}>Close</Text>
                </TouchableOpacity>

                {/* pending then delete button */}
                {selectedInvite?.status === "pending" && (
                  <TouchableOpacity
                    style={[styles.closeButton, { backgroundColor: "#FF0000" }]}
                    onPress={() => handleDeleteInvite(selectedInvite._id)}
                  >
                    <Text style={styles.closeButtonText}>Delete</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </Modal>
      </View>
      {/* <WebBottomTabs /> */}
    </>
  );
}

const styles = StyleSheet.create({
  // Your existing styles, plus some modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    padding: 16,
    marginHorizontal: "5%",

    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    width: "30%",
    marginHorizontal: "auto",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 16,
    marginVertical: 4,
  },
  closeButton: {
    marginTop: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 14,
    textAlign: "center",
  },

  // Original styles from your snippet
  uam05invitelist: {
    flex: 1,
    width: "100%",
    height: 956,
    overflow: "hidden",
    backgroundColor: Color.backgroundsPrimary,
    marginHorizontal: "auto",
  },
  invitesList: {
    fontSize: FontSize.size_5xl,

    textAlign: "center",
    color: Color.cSK430B92950,
    fontFamily: FontFamily.inter,
    fontWeight: "600",
  },
  arrowLeft02Icon: {
    top: 82,
    left: 20,
  },
  borderLayout: {
    width: 24,
    position: "absolute",
  },
  frameParentLayout: {
    width: "100%",
    position: "absolute",
  },
  frameWrapperFlexBox: {
    paddingHorizontal: Padding.p_xl,
    justifyContent: "space-between",
    alignItems: "center",
    flexDirection: "row",
    alignSelf: "stretch",
  },
  createNewTypo: {
    fontSize: FontSize.size_sm,
    fontWeight: "500",
    fontFamily: FontFamily.inter,
  },
  groupParentFlexBox: {
    alignItems: "center",
    flexDirection: "row",
  },
  yourInvitesParent: {
    paddingVertical: 0,
  },
  frameChild: {
    width: 44,
    height: 42,
  },
  jordanLee: {
    textAlign: "center",
    color: Color.cSK430B92950,
  },
  jordanLee123: {
    fontSize: FontSize.size_3xs,
    opacity: 0.5,
    textAlign: "left",
    color: Color.cSK430B92950,
    fontFamily: FontFamily.inter,
  },
  jordanLeeParent: {
    justifyContent: "center",
    gap: Gap.gap_6xs,
  },
  groupParent: {
    gap: Gap.gap_3xs,
  },
  frameWrapper: {
    backgroundColor: Color.lightBg,
    paddingVertical: Padding.p_xs,
    marginVertical: 4,
    borderRadius: 8,
  },
  frameGroup: {
    gap: Gap.gap_3xs,
    alignSelf: "stretch",
    marginTop: 12,
  },
  frameParent: {
    top: 135,
    gap: Gap.gap_4xl,
    left: 0,
    width: "100%",
  },
  yourInvites: {
    fontFamily: FontFamily.degularMedium,
    textAlign: "left",
    fontWeight: "500",
    fontSize: FontSize.size_5xl,
    color: Color.cSK430B92950,
  },
  createNew: {
    color: Color.cSK430B92500,
    textAlign: "left",
  },
});
