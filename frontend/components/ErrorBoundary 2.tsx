import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { router } from "expo-router";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: string;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; retry: () => void }>;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    
    this.setState({
      hasError: true,
      error,
      errorInfo: errorInfo.componentStack,
    });

    if (process.env.NODE_ENV === "development") {
      console.group("🚨 Error Boundary Details");
      console.error("Error:", error.message);
      console.error("Stack:", error.stack);
      console.error("Component Stack:", errorInfo.componentStack);
      console.groupEnd();
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    router.replace("/");
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return <this.props.fallback error={this.state.error} retry={this.handleRetry} />;
      }

      return (
        <View style={styles.container}>
          <View style={styles.errorCard}>
            <Text style={styles.title}>Something went wrong</Text>
            <Text style={styles.message}>
              {this.state.error?.message || "An unexpected error occurred"}
            </Text>
            
            {process.env.NODE_ENV === "development" && this.state.errorInfo && (
              <View style={styles.debugContainer}>
                <Text style={styles.debugTitle}>Debug Info:</Text>
                <Text style={styles.debugText}>{this.state.errorInfo}</Text>
              </View>
            )}

            <View style={styles.buttonContainer}>
              <Pressable style={styles.retryButton} onPress={this.handleRetry}>
                <Text style={styles.buttonText}>Try Again</Text>
              </Pressable>
              
              <Pressable style={styles.homeButton} onPress={this.handleGoHome}>
                <Text style={styles.buttonText}>Go Home</Text>
              </Pressable>
            </View>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  errorCard: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 12,
    maxWidth: 400,
    width: "100%",
    boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
    elevation: 3,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 8,
    textAlign: "center",
  },
  message: {
    fontSize: 16,
    color: "#6B7280",
    marginBottom: 20,
    textAlign: "center",
    lineHeight: 24,
  },
  debugContainer: {
    backgroundColor: "#FEF2F2",
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#DC2626",
    marginBottom: 8,
  },
  debugText: {
    fontSize: 12,
    color: "#7F1D1D",
    fontFamily: "monospace",
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
  },
  retryButton: {
    flex: 1,
    backgroundColor: "#430B92",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  homeButton: {
    flex: 1,
    backgroundColor: "#6B7280",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default ErrorBoundary;