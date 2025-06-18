"use client";

import React from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import CustomBackButton from "@/components/CustomBackButton";
import { 
  AlertCircle, 
  RefreshCw, 
  Settings, 
  Mail, 
  HelpCircle,
  CheckCircle 
} from "lucide-react-native";
import { useAuth } from "@/contexts/AuthContext";
import ProfileInfo from "@/components/ProfileInfo";

export default function ErrorMessageEnhanced() {
  const router = useRouter();
  const { errorMessage } = useLocalSearchParams();
  const { user } = useAuth();

  // Parse error message to categorize the type of error
  const isEmailError = errorMessage && 
    (String(errorMessage).toLowerCase().includes('email') ||
     String(errorMessage).toLowerCase().includes('notification'));

  const isPaymentError = errorMessage && 
    (String(errorMessage).toLowerCase().includes('payment') ||
     String(errorMessage).toLowerCase().includes('stripe'));

  const isValidationError = errorMessage && 
    (String(errorMessage).toLowerCase().includes('validation') ||
     String(errorMessage).toLowerCase().includes('required'));

  const getErrorCategory = () => {
    if (isEmailError) return 'email';
    if (isPaymentError) return 'payment';
    if (isValidationError) return 'validation';
    return 'general';
  };

  const getErrorIcon = () => {
    const category = getErrorCategory();
    switch (category) {
      case 'email':
        return <Mail width={32} height={32} color="#F44336" />;
      case 'payment':
        return <AlertCircle width={32} height={32} color="#F44336" />;
      case 'validation':
        return <HelpCircle width={32} height={32} color="#F44336" />;
      default:
        return <AlertCircle width={32} height={32} color="#F44336" />;
    }
  };

  const getErrorTitle = () => {
    const category = getErrorCategory();
    switch (category) {
      case 'email':
        return 'Email Notification Error';
      case 'payment':
        return 'Payment Processing Error';
      case 'validation':
        return 'Validation Error';
      default:
        return 'Something Went Wrong';
    }
  };

  const getSuggestions = () => {
    const category = getErrorCategory();
    switch (category) {
      case 'email':
        return [
          {
            icon: <Settings width={20} height={20} color="#430B92" />,
            title: "Check Email Settings",
            description: "Verify your email address and notification preferences",
            action: () => router.push('/UAM003NotificationSettings')
          },
          {
            icon: <Mail width={20} height={20} color="#430B92" />,
            title: "Update Profile Email",
            description: "Make sure your profile has a valid email address",
            action: () => router.push('/profile')
          },
          {
            icon: <RefreshCw width={20} height={20} color="#430B92" />,
            title: "Try Again",
            description: "The email service may be temporarily unavailable",
            action: () => router.back()
          }
        ];
      case 'payment':
        return [
          {
            icon: <RefreshCw width={20} height={20} color="#430B92" />,
            title: "Retry Payment",
            description: "Try the payment process again",
            action: () => router.back()
          },
          {
            icon: <Settings width={20} height={20} color="#430B92" />,
            title: "Check Payment Method",
            description: "Verify your payment information",
            action: () => router.push('/payment-settings')
          }
        ];
      case 'validation':
        return [
          {
            icon: <CheckCircle width={20} height={20} color="#430B92" />,
            title: "Review Form",
            description: "Check that all required fields are filled correctly",
            action: () => router.back()
          }
        ];
      default:
        return [
          {
            icon: <RefreshCw width={20} height={20} color="#430B92" />,
            title: "Try Again",
            description: "The issue may be temporary",
            action: () => router.back()
          }
        ];
    }
  };

  const handleContactSupport = () => {
    // Navigate to support or open email client
    router.push('/support');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />

      <View style={styles.header}>
        <CustomBackButton />
        <ProfileInfo />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.messageContainer}>
            {getErrorIcon()}
            <Text style={styles.title}>{getErrorTitle()}</Text>
            <Text style={styles.message}>
              {errorMessage || "An unexpected error occurred. Please try again."}
            </Text>
          </View>

          {/* Error-specific guidance */}
          <View style={styles.guidanceContainer}>
            <Text style={styles.guidanceTitle}>What you can do:</Text>
            
            {getSuggestions().map((suggestion, index) => (
              <TouchableOpacity
                key={index}
                style={styles.suggestionItem}
                onPress={suggestion.action}
              >
                <View style={styles.suggestionIcon}>
                  {suggestion.icon}
                </View>
                <View style={styles.suggestionContent}>
                  <Text style={styles.suggestionTitle}>{suggestion.title}</Text>
                  <Text style={styles.suggestionDescription}>{suggestion.description}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Additional help section */}
          <View style={styles.helpContainer}>
            <Text style={styles.helpTitle}>Still having issues?</Text>
            <Text style={styles.helpText}>
              If the problem persists, our support team can help you resolve it.
            </Text>
            
            <TouchableOpacity
              style={styles.supportButton}
              onPress={handleContactSupport}
            >
              <HelpCircle width={20} height={20} color="#FFFFFF" />
              <Text style={styles.supportButtonText}>Contact Support</Text>
            </TouchableOpacity>
          </View>

          {/* Technical details (collapsible) */}
          {errorMessage && (
            <View style={styles.technicalContainer}>
              <Text style={styles.technicalTitle}>Technical Details</Text>
              <View style={styles.technicalContent}>
                <Text style={styles.technicalText}>
                  Error: {errorMessage}
                </Text>
                <Text style={styles.technicalText}>
                  Time: {new Date().toLocaleString()}
                </Text>
                <Text style={styles.technicalText}>
                  User: {user?.email || 'Not logged in'}
                </Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable style={styles.primaryButton} onPress={() => router.back()}>
          <Text style={styles.primaryButtonText}>Try Again</Text>
        </Pressable>
        
        <Pressable 
          style={styles.secondaryButton} 
          onPress={() => router.push('/UOM07MarketerOfferHistoryList')}
        >
          <Text style={styles.secondaryButtonText}>View My Offers</Text>
        </Pressable>
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 100, // Space for fixed footer
  },
  messageContainer: {
    alignItems: "center",
    gap: 16,
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: "600",
    color: "#F44336",
    textAlign: "center",
  },
  message: {
    fontSize: 16,
    color: "#6C6C6C",
    textAlign: "center",
    lineHeight: 24,
    maxWidth: 300,
  },
  guidanceContainer: {
    marginBottom: 32,
  },
  guidanceTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 16,
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    marginBottom: 12,
  },
  suggestionIcon: {
    marginRight: 16,
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 4,
  },
  suggestionDescription: {
    fontSize: 14,
    color: "#6C6C6C",
    lineHeight: 20,
  },
  helpContainer: {
    backgroundColor: "#F0E7FD",
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    alignItems: "center",
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#430B92",
    marginBottom: 8,
  },
  helpText: {
    fontSize: 14,
    color: "#6C6C6C",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 16,
  },
  supportButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#430B92",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  supportButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
  },
  technicalContainer: {
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    padding: 16,
  },
  technicalTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6C6C6C",
    marginBottom: 8,
  },
  technicalContent: {
    gap: 4,
  },
  technicalText: {
    fontSize: 12,
    color: "#6C6C6C",
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E2D0FB",
    gap: 12,
  },
  primaryButton: {
    backgroundColor: "#430b92",
    width: "100%",
    height: 58,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  primaryButtonText: {
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