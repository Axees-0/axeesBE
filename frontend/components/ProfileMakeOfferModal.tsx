"use client";

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  Platform,
  useWindowDimensions,
  TouchableOpacity,
} from "react-native";
import { router } from "expo-router";
import { FontFamily } from "@/GlobalStyles";
import { useAuth } from "@/contexts/AuthContext";
import { Ionicons } from "@expo/vector-icons";
const BREAKPOINTS = {
  TABLET: 768,
  DESKTOP: 1280,
};

export default function MakeOfferModal({
  visible,
  creatorId,
  creatorName,
  onClose,
}: {
  visible: boolean;
  creatorId: string;
  creatorName: string;
  onClose: () => void;
}) {
  const window = useWindowDimensions();
  const isWeb = Platform.OS === "web";
  const isWideScreen = window.width >= BREAKPOINTS.TABLET;
  const [offerType, setOfferType] = useState<"Reel" | "Shout Out" | "Custom">(
    "Reel"
  );
  const { user } = useAuth();

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalContent,
            isWeb && isWideScreen && styles.webModalContent,
          ]}
        >
          <Text style={styles.modalTitle}>Make an Offer</Text>
          <Text style={styles.modalSubtitle}>
            We have 3 pre made offers for you. Select any of the following or
            create your custom offer.
          </Text>

          <TouchableOpacity
            style={{ position: "absolute", top: 15, right: 15, padding: 10 }}
            onPress={onClose}
          >
            <Ionicons name="close" size={24} color="black" />
          </TouchableOpacity>
          <View style={styles.offerOptions}>
            <Pressable
              style={[
                styles.offerOption,
                offerType === "Reel" && styles.offerOptionSelected,
              ]}
              onPress={() => setOfferType("Reel")}
            >
              <Text style={styles.offerOptionText}>1 Reel</Text>
            </Pressable>

            <Pressable
              style={[
                styles.offerOption,
                offerType === "Shout Out" && styles.offerOptionSelected,
              ]}
              onPress={() => setOfferType("Shout Out")}
            >
              <Text style={styles.offerOptionText}>1 Shout out</Text>
            </Pressable>

            <Pressable
              style={[
                styles.offerOption,
                offerType === "Custom" && styles.offerOptionSelected,
              ]}
              onPress={() => {
                setOfferType("Custom");
              }}
            >
              <Text style={styles.offerOptionText}>Create custom offer</Text>
            </Pressable>
          </View>

          <Pressable
            style={styles.nextButton}
            onPress={() => {
              onClose();
              if (offerType === "Custom") {
                router.push({
                  pathname: "/UOM02MarketerOfferDetail",
                  params: {
                    offerName: offerType,
                    creatorName: creatorName,
                    creatorId: creatorId,
                    marketerId: user?._id,
                  },
                });
              } else {
                router.push({
                  pathname: "/UOM02MarketerOfferDetail",
                  params: {
                    offerName: offerType,
                    creatorName: creatorName,
                    creatorId: creatorId,
                    marketerId: user?._id,
                  },
                });
              }
            }}
          >
            <Text style={styles.nextButtonText}>Next</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    width: "90%",
    maxWidth: 400,
  },
  webModalContent: {
    width: "50%",
    maxWidth: 500,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 16,
    color: "#6C6C6C",
    marginBottom: 24,
    fontFamily: FontFamily.inter,
  },
  offerOptions: {
    gap: 12,
    marginBottom: 24,
  },
  offerOption: {
    backgroundColor: "#F0E7FD50",
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#F0E7FD",
  },
  offerOptionSelected: {
    backgroundColor: "#F0E7FD",
    borderColor: "#430B92",
  },
  offerOptionText: {
    fontSize: 16,
    color: "#430B92",
    fontFamily: Platform.select({
      ios: "SF Pro Display",
      android: "Roboto",
      default: "System",
    }),
  },
  nextButton: {
    backgroundColor: "#430B92",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  nextButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
    fontFamily: Platform.select({
      ios: "SF Pro Display",
      android: "Roboto",
      default: "System",
    }),
  },
});
