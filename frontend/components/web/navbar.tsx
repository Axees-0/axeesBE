/* ────────────────────────────────────────────────────────────────
   NAVBAR  – Axees Web
   Global search bar lives here + user menu + tabs
   (Merged original 370-line style section with new logic)
   ───────────────────────────────────────────────────────────── */

   import React, { useState, useEffect, useRef } from "react";
   import {
     View,
     Text,
     Image,
     Pressable,
     TouchableWithoutFeedback,
     TouchableOpacity,
     TextInput,
     StyleSheet,
     Dimensions,
     TextInput as RNTextInput,
   } from "react-native";
   import { router, usePathname } from "expo-router";
   import { useAuth } from "@/contexts/AuthContext";
   import Search01 from "@/assets/search01.svg";
   import { FontFamily, FontSize, Color, Padding, Focus } from "@/GlobalStyles";
   
   /* ———————————————————————————————————————————————————————
      Props
   ——————————————————————————————————————————————————————— */
   type NavbarProps = {
     searchText: string;
     setSearchText: (v: string) => void;
     onSubmitSearch: () => void;
   };
   
   /* ———————————————————————————————————————————————————————
      Static
   ——————————————————————————————————————————————————————— */
   const TABS = [
     { name: "/", label: "Explore" },
     { name: "/deals", label: "Deals/Offers" },
     { name: "messages", label: "Messages" },
     { name: "notifications", label: "Notifications" },
   ];
   
   const BREAKPOINTS = { DESKTOP: 1280, ULTRA_WIDE: 1440 };
   
   /* ———————————————————————————————————————————————————————
      Component
   ——————————————————————————————————————————————————————— */
   export default function Navbar({
     searchText,
     setSearchText,
     onSubmitSearch,
   }: NavbarProps) {
     const { width } = Dimensions.get("window");
     const isWide = width >= BREAKPOINTS.DESKTOP;
     const isUltraWide = width >= BREAKPOINTS.ULTRA_WIDE;
     const { user, logout } = useAuth();
     const inputRef = useRef<RNTextInput>(null);
     const path = usePathname();
     const [menuOpen, setMenuOpen] = useState(false);
   
     /* close menu on nav-change */
     useEffect(() => setMenuOpen(false), [path]);
   
     /* keyboard ESC to close */
     useEffect(() => {
       const h = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
       window.addEventListener("keydown", h);
       return () => window.removeEventListener("keydown", h);
     }, []);
   
     /* outside click */
     useEffect(() => {
       const h = () => setMenuOpen(false);
       window.addEventListener("click", h);
       return () => window.removeEventListener("click", h);
     }, []);
   
     /* ——— render ——— */
     return (
       <TouchableWithoutFeedback>
         <View style={[styles.container, isWide && styles.containerWide, isUltraWide && styles.containerUltraWide]}>
           {/* ─── Left: logo + tabs ─────────────────────────────── */}
           <View style={[styles.left, isUltraWide && styles.leftUltraWide]}>
             <TouchableOpacity onPress={() => router.push("/")}>
               <Image
                 source={require("@/assets/3.png")}
                 style={styles.logo}
                 resizeMode="contain"
               />
             </TouchableOpacity>
   
             {user?._id && (
               <View style={styles.tabs}>
                 {TABS.map(t => (
                   <Pressable
                     key={t.name}
                     style={({ focused }) => [
                       styles.tabButton,
                       focused && styles.tabButtonFocused,
                     ]}
                     onPress={() =>
                       router.push(t.name === "/" ? "/" : `/${t.name}`)
                     }
                     accessible={true}
                     accessibilityRole="button"
                     accessibilityLabel={`Navigate to ${t.label}`}
                   >
                     <Text
                       style={[
                         styles.tabLabel,
                         ((t.name === "/" && (path === "/" || path === "/index")) ||
                          (t.name !== "/" && (path.includes(`/${t.name}`) || path === `/(tabs)/${t.name}`))) && styles.activeTab,
                       ]}
                     >
                       {t.label}
                     </Text>
                   </Pressable>
                 ))}
               </View>
             )}
           </View>
   
           {/* ─── Center: global search bar (Explore page only) ─── */}
           {path === "/" && (
             <View style={[styles.searchBar, isWide && styles.searchBarWide, isUltraWide && styles.searchBarUltraWide]}>
               <Search01 width={isUltraWide ? 24 : 20} height={isUltraWide ? 24 : 20} />
               <TextInput
                ref={inputRef}
                value={searchText}
                onChangeText={setSearchText}
                returnKeyType="search"
                blurOnSubmit={true}
                onSubmitEditing={() => {
                  onSubmitSearch();
                  inputRef.current?.blur();
                }}
                placeholder={isUltraWide ? "Search by name, location, or category (e.g. Emma, Los Angeles, Fashion, #lifestyle)" : isWide ? "Search by name, location, or category (e.g. Emma, Los Angeles, Fashion)" : "Search creators by name, location, or category"}
                placeholderTextColor={Color.cSK430B92950}
                style={styles.searchInput}
                accessible={true}
                accessibilityRole="searchbox"
                accessibilityLabel="Search creators"
                accessibilityHint="Search by name, location, or category"
                tabIndex={1} // Ensure search gets focus priority
              />
              {searchText.length > 0 && (
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={() => {
                    setSearchText('');
                    inputRef.current?.focus();
                  }}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel="Clear search"
                  accessibilityHint="Clear the search text and refocus search input"
                >
                  <Text style={styles.clearButtonText}>×</Text>
                </TouchableOpacity>
              )}
            </View>
           )}
   
           {/* ─── Right: auth buttons / user dropdown ───────────── */}
           <View style={styles.right}>
             {!user || !user._id ? (
               <View style={styles.authBtns}>
                 <TouchableOpacity
                   style={styles.signInBtn}
                   onPress={() => router.push("/login")}
                 >
                   <Text style={styles.signInTxt}>Sign In</Text>
                 </TouchableOpacity>
                 <TouchableOpacity
                   style={styles.joinBtn}
                   onPress={() => router.push("/register")}
                 >
                   <Text style={styles.joinTxt}>Join</Text>
                 </TouchableOpacity>
               </View>
             ) : (
               <View style={styles.userBox}>
                 <TouchableOpacity
                   onPress={() => router.push(`/profile/${user._id}`)}
                   style={styles.userMeta}
                 >
                   <Image
                     style={styles.avatar}
                     source={
                       user.avatarUrl?.startsWith("/uploads/")
                         ? {
                             uri:
                               process.env.EXPO_PUBLIC_BACKEND_URL +
                               user.avatarUrl,
                           }
                         : user.avatarUrl?.match(/^https?:\/\//)
                         ? { uri: user.avatarUrl }
                         : require("@/assets/empty-image.png")
                     }
                   />
                   <View>
                     <Text style={styles.profileType}>
                       {user.userType === "Marketer"
                         ? "Marketer Profile"
                         : "Influencer Profile"}
                     </Text>
                     <Text style={styles.username}>{user.name}</Text>
                   </View>
                 </TouchableOpacity>
                 <Pressable onPress={() => setMenuOpen(!menuOpen)}>
                   <Text style={styles.hamburger}>☰</Text>
                 </Pressable>
               </View>
             )}
           </View>
   
           {/* ─── Dropdown menu ─────────────────────────────────── */}
           {menuOpen && (
             <View style={styles.dropdown}>
               {[
                 {
                   title: "Profile",
                   onPress: () => router.push(`/profile/${user._id}`),
                 },
                 {
                   title: "Invites",
                   onPress: () => router.push("/UAM05InviteList"),
                 },
                 {
                   title: "Notification Settings",
                   onPress: () => router.push("/UAM003NotificationSettings"),
                 },
                 {
                   title: "Change Password",
                   onPress: () => router.push("/UAM04ChangePassword"),
                 },
                 {
                   title: "Privacy Policy",
                   onPress: () => router.push("/privacy-policy"),
                 },
                 {
                   title: "Log Out",
                   onPress: async () => {
                     await logout();
                     router.replace("/login");
                   },
                   logout: true,
                 },
               ].map(i => (
                 <Pressable
                   key={i.title}
                   style={styles.menuItemWrapper}
                   onPress={i.onPress}
                 >
                   <Text
                     style={[
                       styles.menuItemText,
                       i.logout && styles.logoutText,
                     ]}
                   >
                     {i.title}
                   </Text>
                 </Pressable>
               ))}
             </View>
           )}
         </View>
       </TouchableWithoutFeedback>
     );
   }
   
   /* ────────────────────────────────────────────────────────────────
   STYLES – _responsive rebuild_
   ·  one‑row layout ≥ 768 px
   ·  graceful wrap below 768 px
──────────────────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  /* —— layout shell —— */
  container: {
    width: "100%",
    height: 60,
    marginVertical: Padding.p_5xs,
    paddingHorizontal: 20,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",              // mobile: items may wrap
    rowGap: 16,
    columnGap: 24,
    zIndex: 10,
  },
  containerWide: {
    maxWidth: 2030,
    alignSelf: "center",
  },
  containerUltraWide: {
    height: 80,
    paddingHorizontal: 40,
    maxWidth: 2200,
  },

  /* —— left —— */
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 24,
    flexShrink: 0,                 // never shrink logo/tabs
  },
  leftUltraWide: {
    gap: 32,
  },
  logo: { width: 160, height: 70, resizeMode: "contain" },

  tabs: { flexDirection: "row", gap: 24, flexWrap: "wrap" },
  
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  
  tabButtonFocused: {
    ...Focus.primary,
    borderRadius: 8,
  },
  
  tabLabel: {
    fontSize: FontSize.size_lg,
    fontFamily: FontFamily.inter,
    color: Color.grey,
  },
  activeTab: {
    color: Color.cSK430B92500,
    fontWeight: "700",
    borderBottomWidth: 1,
    borderBottomColor: Color.cSK430B92500,
  },

  /* —— search bar —— */
  searchBar: {
    flexGrow: 1,                   // take the leftover space
    minWidth: 220,
    maxWidth: 780,
    height: 48,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: Color.colorPlum,
    borderRadius: 12,
    backgroundColor: Color.buttonSelectable,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  searchBarWide: { maxWidth: 960 },
  searchBarUltraWide: { 
    maxWidth: 1200,
    height: 56,
    paddingHorizontal: 24,
    borderRadius: 16,
    gap: 14,
  },

  searchInput: {
    flex: 1,
    fontFamily: FontFamily.inter,
    fontSize: FontSize.size_base_2,
    color: Color.cSK430B92950,
  },
  clearButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: 'bold',
    lineHeight: 16,
  },

  /* —— right —— */
  right: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
    flexShrink: 0,                 // keep user box on one row
  },

  /* auth buttons */
  authBtns: { flexDirection: "row", gap: 12 },
  signInBtn: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: Color.cSK430B92500,
    borderRadius: 10,
  },
  signInTxt: {
    fontSize: FontSize.size_base_2,
    color: Color.cSK430B92500,
    fontFamily: FontFamily.inter,
  },
  joinBtn: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    backgroundColor: Color.cSK430B92500,
    borderRadius: 10,
  },
  joinTxt: {
    fontSize: FontSize.size_base_2,
    color: "#fff",
    fontFamily: FontFamily.inter,
  },

  /* user box */
  userBox: { flexDirection: "row", alignItems: "center", gap: 10 },
  userMeta: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: "#eee" },
  profileType: {
    fontSize: FontSize.size_sm,
    fontStyle: "italic",
    color: Color.grey,
    fontFamily: FontFamily.inter,
  },
  username: {
    fontSize: FontSize.size_lg,
    fontFamily: FontFamily.inter,
    color: Color.cSK430B92950,
  },
  hamburger: { fontSize: FontSize.size_xl, color: Color.cSK430B92950 },

  /* dropdown */
  dropdown: {
    position: "absolute",
    top: 70,
    right: 24,
    width: 200,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    paddingVertical: 12,    elevation: 10,
    zIndex: 1000,
  },
  menuItemWrapper: { paddingVertical: 10, paddingHorizontal: 16 },
  menuItemText: { fontSize: FontSize.size_base_2, color: Color.cSK430B92950 },
  logoutText: { color: Color.cSK430B92500, fontWeight: "700" },
});