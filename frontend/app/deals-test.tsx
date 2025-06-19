import React from "react";
import { View, Text, StyleSheet } from "react-native";

const TestDealsPage = () => {
  console.log("🔍 TEST: TestDealsPage component rendering");
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>✅ TEST DEALS PAGE WORKING</Text>
      <Text style={styles.subtitle}>Demo content should appear here</Text>
      <View style={styles.demoCard} data-testid="deal-card">
        <Text style={styles.cardTitle}>Demo Deal #1</Text>
        <Text style={styles.cardAmount}>$1,500</Text>
        <Text style={styles.cardStatus}>Active</Text>
      </View>
      <View style={styles.demoCard} data-testid="deal-card">
        <Text style={styles.cardTitle}>Demo Deal #2</Text>
        <Text style={styles.cardAmount}>$2,300</Text>
        <Text style={styles.cardStatus}>Completed</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#430B92",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 20,
  },
  demoCard: {
    backgroundColor: "#F8F9FD",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2D0FB",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#430B92",
    marginBottom: 4,
  },
  cardAmount: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#22C55E",
    marginBottom: 2,
  },
  cardStatus: {
    fontSize: 12,
    color: "#666",
  },
});

export default TestDealsPage;