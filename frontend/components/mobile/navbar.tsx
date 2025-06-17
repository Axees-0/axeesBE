/*───────────────────────────────────────────────────────────────
  NAVBAR – Axees **Mobile**
  Single‑row header (logo + hamburger)  ➜  search bar  ➜  chips row
  Figma reference: see attachment ③.
────────────────────────────────────────────────────────────────*/

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  useWindowDimensions,
} from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";

// assets
import Menu05 from "@/assets/menu05.svg";
import Search01 from "@/assets/search01.svg";
import LogoSvg from "@/assets/Logo.svg";

// theme helpers
import { FontFamily, FontSize, Color } from "@/GlobalStyles";

/*───────────────────────────────────────────────────────────────
  Props
────────────────────────────────────────────────────────────*/
export type MobileNavbarProps = {
  searchText: string;
  setSearchText: (v: string) => void;
  onSubmitSearch: () => void;
  /** optional – let the parent open a drawer / menu */
  onMenuPress?: () => void;
};

/*───────────────────────────────────────────────────────────────
  Component
────────────────────────────────────────────────────────────*/
export default function MobileNavbar({
  searchText,
  setSearchText,
  onSubmitSearch,
  onMenuPress,
}: MobileNavbarProps) {
  const { width } = useWindowDimensions();
  const styles = React.useMemo(() => makeStyles(width), [width]);

  return (
    <View style={styles.wrapper}>
      {/* ─── Header row (logo + burger) ─────────────────────── */}
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.push("/")}>
          {/* Expo Image handles SVG just fine */}
          {/* <LogoSvg width={110} height={28} /> */}
          <Image
            source={require("@/assets/3.png")}
            style={styles.logo}
            contentFit="contain"
          />
        </Pressable>

        <Pressable onPress={onMenuPress} hitSlop={8}>
          <Menu05 width={26} height={26} />
        </Pressable>
      </View>

      {/* ─── Search bar ──────────────────────────────────────── */}
      <View style={styles.searchBar}>
        <Search01 width={18} height={18} />
        <TextInput
          style={styles.searchInput}
          value={searchText}
          onChangeText={setSearchText}
          placeholder="Search creators…"
          placeholderTextColor="#888"
          returnKeyType="search"
          onSubmitEditing={onSubmitSearch}
        />
      </View>
    </View>
  );
}

/*───────────────────────────────────────────────────────────────
  Responsive styles
────────────────────────────────────────────────────────────*/
const makeStyles = (width: number) =>
  StyleSheet.create({
    wrapper: {
      width: "100%",
      paddingHorizontal: 18,
      paddingTop: 12,
      paddingBottom: 10,
      backgroundColor: "#fff",
    },

    /* header: logo | burger */
    headerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
    },

    /* search */
    searchBar: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: "#f3f3f3",
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 8,
    },
    searchInput: {
      flex: 1,
      fontSize: 15,
      fontFamily: FontFamily.inter,
      color: Color.cSK430B92950,
    },
  });
