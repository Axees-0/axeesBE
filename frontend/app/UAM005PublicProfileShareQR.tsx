"use client";

import { useState } from "react";
import {
  Text,
  StyleSheet,
  View,
  Pressable,
  SafeAreaView,
  Dimensions,
  ScrollView,
  Modal,
  TouchableOpacity,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";

import Unlink04 from "../assets/unlink04.svg";
import Qrcode from "../assets/qr-code.svg";
import Share08 from "../assets/share08.svg";
import CustomBackButton from "@/components/CustomBackButton";
import ProfileInfo from "@/components/ProfileInfo";

const { width, height } = Dimensions.get("window");

const UAM005PublicProfileShareQR = () => {
  const [isQRModalVisible, setQRModalVisible] = useState(false);
  const [isOfferModalVisible, setOfferModalVisible] = useState(false);
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <View style={styles.header}>
          <CustomBackButton />

          <Text style={styles.headerTitle}>Creator Profile</Text>
          <TouchableOpacity
            style={styles.placeholder}
            onPress={() => {
              router.push("/profile");
            }}
          >
            <ProfileInfo />
          </TouchableOpacity>
        </View>

        <View style={styles.profileSection}>
          <Image
            style={styles.coverImage}
            contentFit="cover"
            source={require("../assets/cover.png")}
          />
          <Image
            style={styles.profileImage}
            contentFit="cover"
            source={require("../assets/rectangle-54.png")}
          />
          <View style={styles.profileInfo}>
            <Text style={styles.name}>Ashley Vaughn</Text>
            <Text style={styles.username}>@the_ashley_vaughan</Text>
            <View style={styles.tagContainer}>
              <Unlink04 width={20} height={20} />
              <Text style={styles.tag}>buythis</Text>
            </View>
            <View style={styles.categoriesContainer}>
              <View style={styles.categoryTag}>
                <Text style={styles.categoryText}>Entertainment</Text>
              </View>
              <View style={styles.categoryTag}>
                <Text style={styles.categoryText}>Car Enthusiast</Text>
              </View>
            </View>
          </View>

          <View style={styles.statsContainer}>
            {/* Add follower stats here */}
          </View>

          <Text style={styles.bio}>
            A video creator, a car lover and enthusiast in Reels, Memes, Merch,
            Fine Arts, and Prints. 20B FC RX7, BMW E46, LS WRX...
          </Text>

          <View style={styles.actionButtons}>
            <Pressable
              style={[styles.actionButton, styles.shareButton]}
              onPress={() => setQRModalVisible(true)}
            >
              <Text style={styles.shareButtonText}>Share Profile</Text>
            </Pressable>
            <Pressable
              style={[styles.actionButton, styles.offerButton]}
              onPress={() => setOfferModalVisible(true)}
            >
              <Text style={styles.offerButtonText}>Make Offer</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Social Links</Text>
          {/* Add social Links content here */}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Achievements</Text>
          <Text style={styles.sectionContent}>
            Most followed individual as a Car Enthusiast on Instagram Creative
            youtube videos
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Business Ventures</Text>
          <Text style={styles.sectionContent}>
            20B FC RX7 BMW E46 LS WRX CORVETTE C7 Z06 LB7 D-MAX
          </Text>
        </View>
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={isQRModalVisible}
        onRequestClose={() => setQRModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Qrcode width={250} height={250} />
            <Text style={styles.modalUsername}>@the_ashley_vaughan</Text>
            <Text style={styles.modalOr}>or</Text>
            <Pressable style={styles.shareIconButton}>
              <Share08 width={32} height={32} />
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollViewContent: {
    padding: width * 0.05,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: height * 0.02,
  },
  headerTitle: {
    fontSize: width * 0.06,
    fontWeight: "600",
    color: "#430B92",
  },
  placeholder: {},
  profileSection: {
    marginBottom: height * 0.03,
  },
  coverImage: {
    width: "100%",
    height: height * 0.2,
    borderRadius: 8,
  },
  profileImage: {
    width: width * 0.3,
    height: width * 0.3,
    borderRadius: width * 0.15,
    position: "absolute",
    top: height * 0.15,
    left: width * 0.05,
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  profileInfo: {
    marginTop: height * 0.1,
    marginLeft: width * 0.05,
  },
  name: {
    fontSize: width * 0.05,
    fontWeight: "600",
    color: "#430B92",
  },
  username: {
    fontSize: width * 0.04,
    color: "#6C6C6C",
    marginBottom: height * 0.01,
  },
  tagContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: height * 0.01,
  },
  tag: {
    marginLeft: width * 0.02,
    color: "#430B92",
  },
  categoriesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  categoryTag: {
    backgroundColor: "#E2D0FB",
    paddingHorizontal: width * 0.02,
    paddingVertical: height * 0.005,
    borderRadius: 4,
    marginRight: width * 0.02,
    marginBottom: height * 0.01,
  },
  categoryText: {
    color: "#430B92",
    fontSize: width * 0.03,
  },
  statsContainer: {
    // Add styles for stats container
  },
  bio: {
    marginTop: height * 0.02,
    fontSize: width * 0.035,
    color: "#6C6C6C",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: height * 0.02,
  },
  actionButton: {
    flex: 1,
    paddingVertical: height * 0.015,
    borderRadius: 8,
    alignItems: "center",
  },
  shareButton: {
    borderWidth: 1,
    borderColor: "#430B92",
    marginRight: width * 0.02,
  },
  offerButton: {
    backgroundColor: "#430B92",
  },
  shareButtonText: {
    color: "#430B92",
    fontSize: width * 0.04,
  },
  offerButtonText: {
    color: "#FFFFFF",
    fontSize: width * 0.04,
  },
  section: {
    marginBottom: height * 0.03,
  },
  sectionTitle: {
    fontSize: width * 0.05,
    fontWeight: "600",
    color: "#430B92",
    marginBottom: height * 0.01,
  },
  sectionContent: {
    fontSize: width * 0.035,
    color: "#6C6C6C",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    padding: width * 0.05,
    borderRadius: 16,
    alignItems: "center",
  },
  modalUsername: {
    marginTop: height * 0.02,
    fontSize: width * 0.04,
    color: "#430B92",
  },
  modalOr: {
    marginVertical: height * 0.02,
    fontSize: width * 0.04,
    color: "#6C6C6C",
  },
  shareIconButton: {
    backgroundColor: "#430B92",
    padding: width * 0.03,
    borderRadius: 50,
  },
  offerModalContent: {
    backgroundColor: "#FFFFFF",
    padding: width * 0.05,
    borderRadius: 16,
    width: width * 0.9,
  },
  offerModalTitle: {
    fontSize: width * 0.06,
    fontWeight: "600",
    color: "#430B92",
    marginBottom: height * 0.01,
  },
  offerModalSubtitle: {
    fontSize: width * 0.04,
    color: "#6C6C6C",
    marginBottom: height * 0.02,
  },
  offerOption: {
    backgroundColor: "#F0E7FD",
    paddingVertical: height * 0.02,
    paddingHorizontal: width * 0.04,
    borderRadius: 8,
    marginBottom: height * 0.01,
  },
  offerOptionText: {
    fontSize: width * 0.04,
    color: "#430B92",
  },
  nextButton: {
    backgroundColor: "#430B92",
    paddingVertical: height * 0.02,
    borderRadius: 8,
    alignItems: "center",
    marginTop: height * 0.02,
  },
  nextButtonText: {
    color: "#FFFFFF",
    fontSize: width * 0.04,
    fontWeight: "600",
  },
  placeholderText: {
    fontSize: 16,
    fontWeight: "600",
  },
});

export default UAM005PublicProfileShareQR;
