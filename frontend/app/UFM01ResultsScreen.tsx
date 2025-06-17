import {
  Text,
  StyleSheet,
  View,
  Pressable,
  SafeAreaView,
  Dimensions,
  ScrollView,
} from "react-native";
import { Image } from "expo-image";
import { StatusBar } from "expo-status-bar";

import Menu05 from "../assets/menu05.svg";
import Search01 from "../assets/search01.svg";
import Usergroup from "../assets/usergroup.svg";
import Frame4 from "../assets/frame-4.svg";
import Frame105 from "../assets/frame-105.svg";
import Button from "../assets/button.svg";

// Import social media icons
import InstagramIcon from "../assets/instagram-icon.svg";
import YoutubeIcon from "../assets/youtube-icon.svg";
import TiktokIcon from "../assets/tiktok-icon.svg";
import FacebookIcon from "../assets/facebook-icon.svg";

const { width, height } = Dimensions.get("window");

const UFM01ResultsScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image
              style={styles.logoIcon}
              contentFit="contain"
              source={require("../assets/logo.png")}
            />
          </View>
          <Menu05 width={24} height={24} />
        </View>

        <View style={styles.searchBar}>
          <Search01 width={20} height={20} />
          <Text style={styles.searchText}>Racing</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryFilter}
        >
          {["Men", "Women", "Girls", "Dresses"].map((category, index) => (
            <Pressable key={index} style={styles.categoryItem}>
              <Text style={styles.categoryText}>{category}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.filterSort}>
          <View style={styles.favoriteToggle}>
            <View style={styles.toggleBase}>
              <Button style={styles.toggleButton} width={16} height={16} />
            </View>
            <Text style={styles.favoriteText}>Favorites</Text>
          </View>
          <View style={styles.sortBy}>
            <Text style={styles.sortByText}>Sort by:</Text>
            <Text style={styles.sortOption}>Most Popular</Text>
          </View>
        </View>

        <Text style={styles.resultsTitle}>Results</Text>

        <View style={styles.resultsGrid}>
          {[1, 2, 3, 4].map((item) => (
            <ResultCard key={item} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const ResultCard = () => (
  <Pressable style={styles.resultCard}>
    <Image
      style={styles.resultImage}
      contentFit="cover"
      source={require("../assets/rectangle-5.png")}
    />
    <View style={styles.badgeContainer}>
      <Frame4 style={styles.badge} width={29} height={29} />
      <Frame105 style={styles.badge} width={29} height={29} />
    </View>
    <View style={styles.resultInfo}>
      <View style={styles.nameRow}>
        <Text style={styles.resultName}>Ashley Vaughn</Text>
        <View style={styles.resultCategory}>
          <Text style={styles.categoryLabel}>Racing</Text>
        </View>
      </View>
      <View style={styles.cardRow}>
        <View style={styles.followerCount}>
          <Usergroup width={20} height={20} />
          <Text style={styles.followerText}>343K</Text>
        </View>
        <View style={styles.socialIcons}>
          <InstagramIcon width={18} height={18} />
          <FacebookIcon width={18} height={18} style={styles.socialIcon} />
          <YoutubeIcon width={18} height={18} style={styles.socialIcon} />
          <TiktokIcon width={18} height={18} style={styles.socialIcon} />
        </View>
      </View>
      <Text style={styles.resultDescription} numberOfLines={3}>
        A video creator, a car lover and enthusiast in Reels, Memes, Merch, Fine
        Arts, and Prints. 20B FC RX7, BMW E46, LS WRX...
      </Text>
      <View style={styles.reelCostContainer}>
        <Text style={styles.reelCostLabel}>Approx. Reel Cost</Text>
        <Text style={styles.reelCostValue}>$4k</Text>
      </View>
      <View style={styles.actionButtons}>
        <Pressable style={[styles.actionButton, styles.removeButton]}>
          <Text style={styles.removeButtonText}>Remove</Text>
        </Pressable>
        <Pressable style={[styles.actionButton, styles.viewButton]}>
          <Text style={styles.viewButtonText}>View</Text>
        </Pressable>
      </View>
    </View>
  </Pressable>
);

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
  logoContainer: {
    backgroundColor: "#430B92",
    borderRadius: 8,
    paddingHorizontal: width * 0.02,
  },
  logoIcon: {
    width: width * 0.3,
    height: height * 0.05,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FCFAFF",
    borderRadius: 8,
    padding: width * 0.03,
    marginBottom: height * 0.02,
    borderWidth: 1,
    borderColor: "#E2D0FB",
  },
  searchText: {
    marginLeft: width * 0.02,
    color: "#6C6C6C",
    fontSize: width * 0.04,
  },
  categoryFilter: {
    marginBottom: height * 0.02,
  },
  categoryItem: {
    borderColor: "#430B92",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: width * 0.03,
    paddingVertical: height * 0.01,
    marginRight: width * 0.02,
  },
  categoryText: {
    color: "#430B92",
    fontSize: width * 0.035,
  },
  filterSort: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: height * 0.02,
  },
  favoriteToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: width * 0.02,
  },
  toggleBase: {
    width: width * 0.09,
    height: height * 0.024,
    backgroundColor: "#E2D0FB",
    borderRadius: width * 0.045,
    padding: 2,
    justifyContent: "center",
  },
  toggleButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: width * 0.04,
  },
  favoriteText: {
    color: "#000000",
    fontSize: width * 0.045,
  },
  sortBy: {
    flexDirection: "row",
    alignItems: "center",
  },
  sortByText: {
    color: "#6C6C6C",
    marginRight: width * 0.02,
    fontSize: width * 0.035,
  },
  sortOption: {
    color: "#000000",
    fontSize: width * 0.035,
  },
  resultsTitle: {
    fontSize: width * 0.06,
    fontWeight: "600",
    color: "#000000",
    marginBottom: height * 0.02,
  },
  resultsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  resultCard: {
    width: width * 0.43,
    marginBottom: height * 0.02,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    overflow: "hidden",
  },
  resultImage: {
    width: "100%",
    height: height * 0.2,
  },
  badgeContainer: {
    position: "absolute",
    top: height * 0.01,
    right: width * 0.02,
    flexDirection: "row",
  },
  badge: {
    marginLeft: width * 0.01,
  },
  resultInfo: {
    padding: width * 0.02,
  },
  resultName: {
    fontSize: width * 0.03,
    fontWeight: "500",
    color: "#000000",
    marginBottom: height * 0.005,
  },
  resultCategory: {
    backgroundColor: "#F0E7FD",
    borderRadius: 4,
    paddingHorizontal: width * 0.02,
    paddingVertical: height * 0.003,
    alignSelf: "flex-start",
    marginBottom: height * 0.005,
  },
  categoryLabel: {
    color: "#430B92",
    fontSize: width * 0.03,
  },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: height * 0.005,
  },
  followerCount: {
    flexDirection: "row",
    alignItems: "center",
  },
  followerText: {
    marginLeft: width * 0.01,
    color: "#000000",
    fontSize: width * 0.035,
  },
  socialIcons: {
    flexDirection: "row",
    alignItems: "center",
  },
  socialIcon: {
    marginLeft: -width * 0.02,
  },
  resultDescription: {
    color: "#6C6C6C",
    fontSize: width * 0.03,
    marginBottom: height * 0.005,
  },
  reelCostContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: height * 0.01,
  },
  reelCostLabel: {
    color: "#6C6C6C",
    fontSize: width * 0.035,
  },
  reelCostValue: {
    color: "#000000",
    fontSize: width * 0.035,
    fontWeight: "500",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: width * 0.02,
  },
  actionButton: {
    flex: 1,
    paddingVertical: height * 0.01,
    borderRadius: 4,
    alignItems: "center",
  },
  removeButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 0.5,
    borderColor: "#6C6C6C",
  },
  removeButtonText: {
    color: "#6C6C6C",
  },
  viewButton: {
    backgroundColor: "#430B92",
  },
  viewButtonText: {
    color: "#FFFFFF",
  },
  nameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: height * 0.005,
  },
});

export default UFM01ResultsScreen;
