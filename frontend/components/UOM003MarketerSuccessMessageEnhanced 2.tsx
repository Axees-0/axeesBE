"use client";

import React from "react";
import { View, Text, Pressable, StyleSheet, SafeAreaView } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { CheckCircle, AlertTriangle, Mail, MailX } from "lucide-react-native";
import CustomBackButton from "@/components/CustomBackButton";

export default function SuccessMessageEnhanced() {
  const router = useRouter();
  const { creatorName, emailSent, emailError } = useLocalSearchParams();

  const emailNotificationSent = emailSent === "true";

  const handleViewStatus = () => {
    // Navigate to the offers list or status page
    router.push("/UOM07MarketerOfferHistoryList");
  };

  const handleGoToSettings = () => {
    router.push("/UAM003NotificationSettings");
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />

      <View style={styles.header}>
        <CustomBackButton />
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <View style={styles.messageContainer}>
          <CheckCircle width={48} height={48} color="#430b92" />
          <Text style={styles.title}>Offer Sent!</Text>
          <Text style={styles.message}>
            Your offer has been sent to{" "}
            {creatorName ? `@${creatorName}` : "the creator"}
          </Text>

          {/* Email Notification Status */}
          <View style={styles.emailStatusContainer}>
            <View style={styles.emailStatusHeader}>
              {emailNotificationSent ? (
                <Mail width={20} height={20} color="#4CAF50" />
              ) : (
                <MailX width={20} height={20} color="#FF9800" />
              )}
              <Text style={[
                styles.emailStatusTitle,
                { color: emailNotificationSent ? "#4CAF50" : "#FF9800" }
              ]}>
                Email Notifications
              </Text>
            </View>

            {emailNotificationSent ? (
              <View style={styles.emailSuccessContent}>
                <Text style={styles.emailStatusText}>
                  Email notifications have been sent to both you and the creator.
                </Text>
                <View style={styles.emailFeatures}>
                  <Text style={styles.emailFeatureItem}>• Instant delivery confirmation</Text>
                  <Text style={styles.emailFeatureItem}>• Offer details included</Text>
                  <Text style={styles.emailFeatureItem}>• Response tracking enabled</Text>
                </View>
              </View>
            ) : (
              <View style={styles.emailWarningContent}>
                <Text style={styles.emailStatusText}>
                  Email notifications could not be sent.
                </Text>
                {emailError && (
                  <Text style={styles.emailErrorText}>
                    Reason: {emailError}
                  </Text>
                )}
                <Text style={styles.emailFallbackText}>
                  Don't worry - the offer was still created successfully and the creator will see it in their dashboard.
                </Text>
                
                <Pressable 
                  style={styles.settingsButton}
                  onPress={handleGoToSettings}
                >
                  <Text style={styles.settingsButtonText}>
                    Check Notification Settings
                  </Text>
                </Pressable>
              </View>
            )}
          </View>

          {/* Next Steps */}
          <View style={styles.nextStepsContainer}>
            <Text style={styles.nextStepsTitle}>What happens next?</Text>
            <View style={styles.nextStepsList}>
              <Text style={styles.nextStepItem}>
                1. The creator will review your offer
              </Text>
              <Text style={styles.nextStepItem}>
                2. You'll be notified when they respond
              </Text>
              <Text style={styles.nextStepItem}>
                3. Track progress in your offers list
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <Pressable style={styles.button} onPress={handleViewStatus}>
            <Text style={styles.buttonText}>View My Offers</Text>
          </Pressable>
          
          <Pressable 
            style={styles.secondaryButton} 
            onPress={() => router.push("/UOM04MarketerCustomOffer")}
          >
            <Text style={styles.secondaryButtonText}>Send Another Offer</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  placeholder: {},
  content: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingBottom: 40,
  },
  messageContainer: {
    alignItems: "center",
    gap: 16,
    marginTop: "20%",
    maxWidth: 400,
  },
  title: {
    fontSize: 32,
    fontWeight: "600",
    color: "#430b92",
    textAlign: "center",
  },
  message: {
    fontSize: 18,
    color: "#6C6C6C",
    textAlign: "center",
    marginBottom: 8,
  },
  emailStatusContainer: {
    width: "100%",
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
  },
  emailStatusHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  emailStatusTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  emailSuccessContent: {
    gap: 8,
  },
  emailWarningContent: {
    gap: 8,
  },
  emailStatusText: {
    fontSize: 14,
    color: "#6C6C6C",
    lineHeight: 20,
  },
  emailErrorText: {
    fontSize: 14,
    color: "#F44336",
    fontStyle: "italic",
  },
  emailFallbackText: {
    fontSize: 14,
    color: "#6C6C6C",
    lineHeight: 20,
    marginTop: 8,
  },
  emailFeatures: {
    marginTop: 8,
    gap: 4,
  },
  emailFeatureItem: {
    fontSize: 14,
    color: "#4CAF50",
  },
  settingsButton: {
    backgroundColor: "#430B92",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginTop: 12,
    alignSelf: "flex-start",
  },
  settingsButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
  },
  nextStepsContainer: {
    width: "100%",
    backgroundColor: "#F0E7FD",
    borderRadius: 12,
    padding: 16,
  },
  nextStepsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#430B92",
    marginBottom: 12,
  },
  nextStepsList: {
    gap: 8,
  },
  nextStepItem: {
    fontSize: 14,
    color: "#6C6C6C",
    lineHeight: 20,
  },
  buttonContainer: {
    width: "100%",
    gap: 12,
  },
  button: {
    backgroundColor: "#430b92",
    width: "100%",
    height: 58,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: "#430b92",
    width: "100%",
    height: 58,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#430b92",
    fontSize: 16,
    fontWeight: "500",
  },
});