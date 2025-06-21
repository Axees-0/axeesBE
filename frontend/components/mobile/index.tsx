import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  ScrollView,
  SafeAreaView,
  TextInput,
  FlatList,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import { StatusBar } from "expo-status-bar";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import axios from "axios";

// ░░ assets ░░
import Menu05 from "@/assets/menu05.svg";
import Search01 from "@/assets/search01.svg";
const HeartOutline = require("@/assets/icons.png"); // outline ♥︎
const HeartFilled = require("@/assets/heart-red.png"); // filled ♥︎
const ShareIcon = require("@/assets/share-08.png"); // share glyph

import Usergroup from "@/assets/usergroup.svg";

// ░░ theme helpers ░░
import { Color, FontFamily, FontSize, Padding } from "@/GlobalStyles";
import { router, usePathname } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/hooks/useNotifications";

import WebBottomTabs from "../WebBottomTabs";
import { DEMO_MODE } from "@/demo/DemoMode";
import { DemoData } from "@/demo/DemoData";




/* ──────────────────────────────────────────────────────────────
   CONSTANTS & HELPERS
──────────────────────────────────────────────────────────────── */
const API_URL = `${process.env.EXPO_PUBLIC_BACKEND_URL}/api`;
const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL;

const CPM_RATES: Record<string, number> = {
  tiktok: 25,
  instagram: 10,
  facebook: 25,
  youtube: 20,
  twitter: 2,
  x: 2,
};
const calcAvgPrice = (
  pl?: Array<{ platform: string; followersCount?: number }>
) => {
  if (!pl?.length) return 0;
  let tot = 0,
    n = 0;
  pl.forEach(({ platform, followersCount }) => {
    if (!followersCount) return;
    const cpm = CPM_RATES[platform.toLowerCase()];
    if (!cpm) return;
    tot += (followersCount / 1000) * cpm;
    n += 1;
  });
  return n ? tot / n : 0;
};
const fmtNum = (n: number) =>
  n >= 1_000_000
    ? `${(n / 1_000_000).toFixed(1)}M`
    : n >= 1_000
    ? `${(n / 1_000).toFixed(1)}K`
    : `${n}`;

const PREDEFINED_TAGS = [
  "Racing",
  "Motorsports",
  "Speed",
  "Track Days",
  "Drifting",
  "Car Culture",
  "Car Reviews",
  "Speed Challenges",
  "Automotive",
  "Sports",
  "Lifestyle",
  "Events",
  "Culture",
  "Challenges",
  "Reviews",
];

type Sort = "none" | "low-hi" | "hi-low";

/* ──────────────────────────────────────────────────────────────
   SIDEBAR COMPONENT
──────────────────────────────────────────────────────────────── */
const SidebarMenu = ({
  isVisible,
  onClose,
}: {
  isVisible: boolean;
  onClose: () => void;
}) => {
  const { width } = useWindowDimensions();
  const styles = useMemo(() => makeStyles(width), [width]);
  const path = usePathname();
  const { user, logout } = useAuth();

  const [menuOpen, setMenuOpen] = useState(true);

  /* close menu on nav-change */
  useEffect(() => setMenuOpen(true), [path]);

  /* keyboard ESC to close */
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  /* outside click */
  useEffect(() => {
    const h = () => setMenuOpen(true);
    window.addEventListener("click", h);
    return () => window.removeEventListener("click", h);
  }, []);

  if (!isVisible) return null;

  return (
    <>
      <Pressable style={styles.sidebarOverlay} onPress={onClose} />

      <View style={styles.sidebarContainer}>
        <Image
          source={require("@/assets/3.png")}
          style={styles.logo}
          contentFit="contain"
        />

        {menuOpen && (
          <View>
            {[
              {
                title: "Profile",
                onPress: () => router.push(`/profile/${user?._id}`),
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
            ].map((i) => (
              <Pressable
                key={i.title}
                style={styles.sidebarItem}
                onPress={i.onPress}
              >
                <Text
                  style={[styles.menuItemText, i.logout && styles.logoutText]}
                >
                  {i.title}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>
    </>
  );
};


const getSafeAvatarSource = (avatarUrl?: string) => {
  if (!avatarUrl) return require("@/assets/empty-image.png");

  // Server-hosted file
  if (avatarUrl.includes("/uploads/")) {
    return { uri: backendUrl + avatarUrl };
  }

  // External URL
  if (avatarUrl.startsWith("http")) {
    return { uri: avatarUrl };
  }

  // Unknown / invalid
  return require("@/assets/empty-image.png");
};


/* ──────────────────────────────────────────────────────────────
   MAIN COMPONENT
──────────────────────────────────────────────────────────────── */
export default function UFM01ResultsScreen() {
  const { width } = useWindowDimensions();
  const styles = useMemo(() => makeStyles(width), [width]);

  const { user, updateUser } = useAuth();
  const { requestNotificationPermission } = useNotifications();
  const qc = useQueryClient();

  // —— UI state ——
  const [search, setSearch] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [showClearButton, setShowClearButton] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [sort, setSort] = useState<Sort>("none");
  const [isMenuOpen, setIsMenuOpen] = useState(false);


/** true while we’re waiting for _the first_ AI page */
const [aiFirstPagePending, setAiFirstPagePending] = useState(false);

  /* ------------- Type-writer helper + AI banner (shared with desktop) ------------- */
const TypewriterText = (
  { messages, typingSpeed = 45, style }:
  { messages: string[]; typingSpeed?: number; style?: any }
) => {
  const [mIdx, setMIdx] = useState(0);
  const [cIdx, setCIdx] = useState(0);
  const [text, setText] = useState("");

  useEffect(() => {
    if (mIdx >= messages.length) return;
    if (cIdx < messages[mIdx].length) {
      const t = setTimeout(() => {
        setText((t) => t + messages[mIdx][cIdx]);
        setCIdx((c) => c + 1);
      }, typingSpeed);
      return () => clearTimeout(t);
    }
  }, [cIdx, mIdx, messages, typingSpeed]);

  return <Text style={style}>{text}</Text>;
};

const MainScene = require("@/assets/main-scene.gif");

/**  Banner shown while AI results are coming in */
const AIBanner = ({ showSecond }: { showSecond: boolean }) => {
  const [showTyper, setShowTyper] = useState(false);
  useEffect(() => {
    if (!showSecond) return;
    const id = setTimeout(() => setShowTyper(true), 10_000);
    return () => clearTimeout(id);
  }, [showSecond]);

  return (
    <View style={styles.aiBanner}>
      <Image source={MainScene} style={styles.aiGif} />
      {!showTyper && (
        <Text style={styles.aiText}>
          Please standby while our system finds Influencers for you.
        </Text>
      )}
      {showSecond && showTyper && (
        <TypewriterText
          messages={[
            "Please standby, we are finding more influencers for you.",
          ]}
          style={[styles.aiText, { marginTop: 6 }]}
        />
      )}
    </View>
  );
};


  // —— committed tags ——
  const tags = useMemo(() => {
    if (selectedTag) return [selectedTag];
    if (!submitted) return [];
    const hit = PREDEFINED_TAGS.find((t) =>
      t.toLowerCase().startsWith(submitted.toLowerCase())
    );
    return hit ? [hit] : [submitted];
  }, [selectedTag, submitted]);

  // —— data ——
  const { data, isLoading, isFetchingNextPage, fetchNextPage, hasNextPage } =
    useInfiniteQuery({
      initialPageParam: null, // ✅ Add this line
      queryKey: ["find", tags.join(","), submitted],
      queryFn: async ({ pageParam = null }) => {
        // Return demo data in demo mode
        if (DEMO_MODE) {
          let filteredCreators = DemoData.creators;
          
          // Filter by name, location, or category if search term exists
          if (submitted) {
            const searchLower = submitted.toLowerCase();
            filteredCreators = DemoData.creators.filter(creator => {
              // Check name
              if (creator.name.toLowerCase().includes(searchLower)) return true;
              // Check location
              if (creator.location && creator.location.toLowerCase().includes(searchLower)) return true;
              // Check username
              if (creator.userName && creator.userName.toLowerCase().includes(searchLower)) return true;
              // Check categories
              if (creator.creatorData?.categories?.some(cat => 
                cat.toLowerCase().includes(searchLower)
              )) return true;
              return false;
            });
          }
          
          return {
            items: filteredCreators,
            nextCursor: null,
            total: filteredCreators.length
          };
        }
        
        const params: any = {
          limit: 12,
          cursor: pageParam || undefined,
          ai: pageParam ? 1 : 0,
        };
        if (tags.length) params.tags = tags.join(",");
        const { data } = await axios.get(`${API_URL}/find`, { params });
        return data as any;
      },
      getNextPageParam: (l) => l?.nextCursor ?? undefined,
      staleTime: 1000 * 60 * 5,
    });


    /* ──────────────────────────────────────────────────────────────
    AI second-page fetch (ai = 1) – parity with desktop
 ───────────────────────────────────────────────────────────────── */
type AIPage = { items: any[]; nextCursor: string | null };

const {
  mutateAsync: fetchAI,
  isPending  : aiPending,        // v5’s name for isLoading
} = useMutation<AIPage>({
  /* always hit /find with ai=1 */
  mutationFn: async () => {
    // Return demo data in demo mode
    if (DEMO_MODE) {
      return {
        items: DemoData.creators,
        nextCursor: null
      };
    }
    
    const { data } = await axios.get<AIPage>(`${API_URL}/find`, {
      params: {
        limit: 12,
        tags : tags.join(','),
        ai   : 1,
      },
    });
    return data;
  },

  /* append the AI page as a NEW react-query page */
  onSuccess: (aiPage) => {
    qc.setQueryData(['find', tags.join(',')], (old: any) =>
      old
        ? { ...old, pages: [...old.pages, aiPage] }
        : { pages: [aiPage] },
    );
  },
});

/* fire the AI call exactly once per unique search */
const firedRef = useRef<string>('');

useEffect(() => {
  /* wait for the first DB page to finish */
  if (isLoading) return;

  /* ignore empty searches */
  if (!tags.length) return;

  const key = tags.join(',');
  if (firedRef.current === key) return;   // already done for this term

  setAiFirstPagePending(true);
  fetchAI().finally(() => setAiFirstPagePending(false));  // 🔥 ai=1 request
  firedRef.current = key;
}, [isLoading, tags.join(',')]);

  const flat = useMemo(() => {
    const seen = new Set<string>();
    return (data?.pages.flatMap((p: any) => p.items) ?? []).filter((u: any) => {
      const k = (u.userName || "").toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }, [data]);

  const list = useMemo(() => {
  const enriched = flat.map((u: any) => ({
    ...u,
    avatarSource: getSafeAvatarSource(u?.avatarUrl),
  }));

  if (sort === "none") return enriched;

  const sorted = enriched.map((u: any) => ({
    u,
    p: calcAvgPrice(u.creatorData?.platforms),
  }));

  sorted.sort((a, b) => (sort === "low-hi" ? a.p - b.p : b.p - a.p));
  return sorted.map((x) => x.u);
}, [flat, sort]);



  const resultCategories = useMemo(() => {
  const set = new Set<string>();
  flat.forEach((usr: any) => {
    usr.creatorData?.categories?.forEach((c: string) => set.add(c));
  });
  return Array.from(set);
}, [flat]);

/* helper flags for banner logic */
const hasUserQuery =
  submitted.trim().length > 0 || selectedTag !== null;
const isAIRequestActive =
  (aiPending || aiFirstPagePending) && hasUserQuery;


const page0Tags = (data?.pages?.[0] as any)?.normalizedTags ?? [];

const chipTags = useMemo(() => {
  const combined = [...page0Tags];
  resultCategories.forEach(cat => {
    if (!combined.includes(cat)) combined.push(cat);
  });
  return combined.length > 0 ? combined : PREDEFINED_TAGS;
}, [page0Tags, resultCategories]);


  // —— favourite toggle ——
  const toggleFav = useMutation({
    mutationFn: async (cid: string) => {
      const { data } = await axios.patch(
        `${API_URL}/users/${user?._id}/favorites`,
        { creatorId: cid, userId: user?._id }
      );
      return data.favorites as string[];
    },
    onMutate: async (cid) => {
      qc.cancelQueries({ queryKey: ["authUser"] });
      const prev = user?.favorites ?? [];
      const next = prev.includes(cid)
        ? prev.filter((i) => i !== cid)
        : [...prev, cid];
      updateUser({ favorites: next });
      return { prev };
    },
    onError: (_e, _cid, ctx) =>
      ctx?.prev && updateUser({ favorites: ctx.prev }),
  });
  const isFav = (id: string) => !!user?._id && user.favorites?.includes(id);

  /* ───────── render helpers ───────── */
  const renderChips = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.chipRow}
      contentContainerStyle={styles.chipContent}
      
    >
      {chipTags.map((tag) => {
        const active = selectedTag === tag;
        return (
          <Pressable
            key={tag}
            style={[styles.chip, active && styles.chipActive]}
            onPress={() => setSelectedTag(active ? null : tag)}
          >
            <Text style={[styles.chipTxt, active && styles.chipTxtActive]}>
              {tag}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );

  const renderCard = ({ item }: { item: any }) => {
    const avg = calcAvgPrice(item.creatorData?.platforms);    

    return (
      <Pressable 
        style={({ pressed }) => [
          styles.card,
          pressed && styles.cardPressed
        ]}
        onPress={() => {
          if (Platform.OS === "web") {
            window.open(`/profile/${item._id}`, "_blank");
          } else {
            router.push(`/profile/${item._id}`);
          }
        }}
        testID={`creator-card-${item._id}`}
        accessibilityRole="button"
        accessibilityLabel={`View ${item.name} profile`}
      >
        <Image
            style={styles.cardImg}
            contentFit="cover"
            source={item.avatarSource}
          />
        {/* top‑icons */}
        <View style={styles.icons}>
          <Pressable
            style={styles.iconHeart}
            hitSlop={10}
            onPress={(e) => {
              e.stopPropagation?.();
              toggleFav.mutate(item._id);
            }}
          >
            <Image
              style={styles.icon20}
              source={isFav(item._id) ? HeartFilled : HeartOutline}
            />
          </Pressable>
          <Pressable
            style={styles.iconShare}
            hitSlop={10}
            onPress={(e) => {
              e.stopPropagation?.();
              requestNotificationPermission();
              if (Platform.OS === "web") {
                navigator.share?.({
                  title: item.name,
                  url: `/profile/${item._id}`,
                });
              }
            }}
          >
            <Image style={styles.icon20} source={ShareIcon} />
          </Pressable>
        </View>

        <View style={styles.cardBody}>
         <View style={styles.cardHead}>
            <Text numberOfLines={1} style={styles.cardName}>
              {item.name}
            </Text>

            {/* Add marginTop to push tags below the name */}
            <View style={[styles.cardCatRow, { marginTop: 6, flexWrap: 'wrap' }]}>
              {(item.creatorData?.categories || []).slice(0, 2).map((c: string) => (
                <View key={c} style={styles.catChip}>
                  <Text style={styles.catTxt}>{c}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={[styles.userInfo, styles.userFlexBox]}>
            <View style={[styles.statItem, styles.containerFlexBox]}>
              <Usergroup style={styles.userGroupIcon} width={20} height={20} />
              <Text style={[styles.categoryText, styles.textTypo]}>
                {fmtNum(item.creatorData?.totalFollowers || 0)}
              </Text>
            </View>
            <View style={styles.socialMediaIcons}>
              <Image
                contentFit="cover"
                source={require("@/assets/instagram.png")}
                style={[styles.social, styles.instagram]}
              />
              <Image
                contentFit="cover"
                source={require("@/assets/facebook-icon.png")}
                style={[styles.social, styles.facebook]}
              />
              <Image
                contentFit="cover"
                source={require("@/assets/transparenttiktoklogoblackandwhitelogotiktokappminimaminimalistblackandwhitetiktokapp1711004158896-1.png")}
                style={[styles.social, styles.tiktok]}
              />
              <Image
                contentFit="cover"
                source={require("@/assets/youtube-icon.png")}
                style={[styles.social, styles.youtube]}
              />
            </View>
          </View>
          <Text style={styles.description}>
            A video creator, a car lover and enthusiast in Reels, Memes, Merch,
            Fine Arts, and Prints. 20B FC RX7, BMW E46, LS WRX...
          </Text>
          {/* <View style={styles.cardMetaRow}>
            <Text style={styles.metaLabel}>Followers</Text>
            <Text style={styles.metaVal}>
              {fmtNum(item.creatorData?.totalFollowers || 0)}
            </Text>
          </View>
          <View style={styles.cardMetaRow}>
            <Text style={styles.metaLabel}>Avg. Price</Text>
            <Text style={styles.metaVal}>
              {avg ? `$${avg.toFixed(0)}` : "-"}
            </Text>
          </View> */}
          {/* buttons */}
          <View style={styles.costMain}>
            <Text style={styles.metaLabel}>Approx. Reel Cost</Text>
            <Text style={styles.metaVal}>
              {avg ? `$${avg.toFixed(0)}` : "-"}
            </Text>
          </View>
          <View style={styles.btnRow}>
            <Pressable 
              style={styles.removeBtn}
              onPress={(e) => {
                e.stopPropagation?.();
                // Demo: Show removed feedback
                console.log('Remove creator from list');
              }}
            >
              <Text style={styles.btnTxt1}>Remove</Text>
            </Pressable>
            <Pressable
              style={styles.viewBtn}
              onPress={(e) => {
                e.stopPropagation?.();
                if (Platform.OS === "web") {
                  window.open(`/profile/${item._id}`, "_blank");
                } else {
                  router.push(`/profile/${item._id}`);
                }
              }}
            >
              <Text style={styles.btnTxt2}>View</Text>
            </Pressable>
          </View>
        </View>
      </Pressable>
    );
  };

  /* ───────── render ───────── */
  return (
    <>
      <SafeAreaView style={styles.root}>
        <StatusBar style="auto" />

        {/* Sidebar Menu */}
        <SidebarMenu
          isVisible={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
        />

        {/* logo + hamburger */}
        <View style={styles.topBar}>
          <Image
            source={require("@/assets/fill-logo.png")}
            style={styles.logo}
            contentFit="contain"
          />
          <Pressable onPress={() => setIsMenuOpen(true)}>
            <Menu05 width={24} height={24} />
          </Pressable>
        </View>

        {/* search */}
        <View style={styles.searchWrap}>
          <Search01 width={18} height={18} />
          <TextInput
            value={search}
            onChangeText={(text) => {
              setSearch(text);
              setShowClearButton(text.length > 0);
            }}
            onSubmitEditing={() => {
              setSelectedTag(null);
              setSubmitted(search.trim());
            }}
            returnKeyType="search"
            style={styles.searchInput}
            placeholder="Search by name, location, or category (e.g. Emma, Los Angeles, Fashion)"
            placeholderTextColor="#888"
          />
          {showClearButton && (
            <Pressable
              onPress={() => {
                setSearch("");
                setSubmitted("");
                setSelectedTag(null);
                setShowClearButton(false);
              }}
              style={styles.clearButton}
            >
              <Text style={styles.clearButtonText}>×</Text>
            </Pressable>
          )}
        </View>

        {/* chips */}
        {renderChips()}

        
        <Pressable
        style={styles.sortBar}
        onPress={() =>
          setSort((s) =>
            s === 'hi-low' ? 'low-hi' : s === 'low-hi' ? 'none' : 'hi-low',
          )
        }>
        {/* left --------------------- right */}
        <Text style={styles.resultsLbl}>Results</Text>

        <Text style={styles.categoryText}>
          {sort === 'none'
            ? 'Sort'
            : sort === 'hi-low'
            ? 'High → Low'
            : 'Low → High'}
        </Text>
      </Pressable>



        {/* list — always render FlatList; use Empty/Footer slots for banners */}
        <FlatList
          data={list}
          keyExtractor={(i: { _id: any; }) => i._id}
          renderItem={renderCard}
          numColumns={2}
          columnWrapperStyle={styles.listCols}
          contentContainerStyle={{ paddingBottom: 120 }}

          /* ① banner while DB page 0 or AI page 1 is loading */
          ListEmptyComponent={() => (
            <AIBanner showSecond={isAIRequestActive} />
          )}

          /* ② endless-scroll footer */
          ListFooterComponent={() => {
            if (aiPending && list.length)      // first AI page
              return <AIBanner showSecond={true} />;
            if (isFetchingNextPage)            // any further page
              return <AIBanner showSecond={false} />;
            return null;
          }}

          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (!isFetchingNextPage && hasNextPage) fetchNextPage();
          }}
        />        

        

      </SafeAreaView>
      <WebBottomTabs />
    </>
  );
}

/* ──────────────────────────────────────────────────────────────
   STYLES – calc at runtime so we can use window width
──────────────────────────────────────────────────────────────── */
const makeStyles = (w: number) => {
  const GAP = 14;
  const CARD_W = (w - 20 * 2 - GAP) / 2; // 20px side‑padding, 14px gap
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: "#fff" },
    /* header */
    topBar: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingTop: 6,
      paddingBottom: 10,
    },
    logo: { width: 120, height: 36 },
    /* search */
    searchWrap: {
      backgroundColor: "#fcfaff",
      borderColor: "#e2d0fb",
      height: 60,
      paddingHorizontal: 24,
      gap: 16,
      paddingVertical: 12,
      borderRadius: 12,
      alignItems: "center",
      flexDirection: "row",
      borderWidth: 1,
      borderStyle: "solid",
      marginHorizontal: 20,
      marginVertical: 4,
    },
    sortBar: {
    flexDirection: 'row',        // ⬅️ put items side-by-side
    justifyContent: 'space-between', // ⬅️ left item ↔ right item
    alignItems: 'center',
    width: '98%',               // (or whatever width you need)
    paddingHorizontal: 12,       // optional: give it some breathing room
    paddingVertical: 10,
  },
    searchInput: {
      flex: 1,
      fontSize: 15,
      color: "#0b0218",
      paddingVertical: 0,
      opacity: 0.5,
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
   chipRow: {
      width: "98%",
      paddingHorizontal: 20,
      marginTop: 12,
      marginBottom: 8,
      height: 50,          // 🔒 fixed height
      backgroundColor: "#fff",   // chips never blend with cards
      zIndex: 2,                 // stay above the FlatList
      flexShrink: 0,
      overflow: "hidden",         // never grows

    },


  /* NEW: content style for the ScrollView wrapper */
  chipContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
  },

chip: {
  borderColor: "#f0e7fd",
  paddingHorizontal: 16,
  paddingVertical: 8,
  borderRadius: 6,
  alignItems: "center",
  flexDirection: "row",
  borderWidth: 1,
  borderStyle: "solid",
  fontSize: 14,
  marginRight: 12,
  minHeight: 34,        // keep chip size consistent
},

chipActive: {
  backgroundColor: Color.cSK430B92500,
},

chipTxt: {
  fontSize: 13,
  color: Color.cSK430B92950,
},

chipTxtActive: {
  color: "#fff",
},

    /* filter row */
    filterRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginHorizontal: 20,
      marginBottom: 21,
    },
    sortContainer: {
      marginHorizontal: 20,
      marginBottom: 25,
    },
    textTypo: {
      opacity: 0.5,
      Color: Color.cSK430B92950,
      fontFamily: FontFamily.inter,
    },
    categoryText: {
      Color: Color.cSK430B92950,
      fontFamily: FontFamily.inter,
    },
    containerFlexBox: {
      
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 8,
    },
    filterContainer: {
      marginLeft: -196,
      top: 257,
      gap: 86,
      left: "50%",
      position: "absolute",
    },
    resultsLbl: {
      fontSize: 20,
      fontWeight: "600",
      color: Color.cSK430B92950,
      fontFamily: FontFamily.clashDisplaySemibold,
    },
    sortBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      borderWidth: 1,
      borderColor: Color.cSK430B92500,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    sortTxt: { fontSize: 12, color: Color.cSK430B92500 },
    /* sidebar */
    sidebarOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0,0,0,0.5)",
      zIndex: 10,
    },
    sidebarContainer: {
      position: "absolute",
      top: 0,
      left: 0,
      bottom: 0,
      width: w * 0.7,
      backgroundColor: "#fff",
      zIndex: 9999999,
      paddingTop: 20,
      paddingHorizontal: 20,
    },
    sidebarItem: {
      paddingVertical: 15,
      borderBottomWidth: 1,
      borderBottomColor: "#eee",
    },
    sidebarText: {
      fontSize: 16,
      color: Color.cSK430B92950,
    },
    /* list & card */
    listCols: { paddingHorizontal: 20, justifyContent: "space-between" },
    card: {
      width: CARD_W,
      backgroundColor: "#fff",
      borderRadius: 12,
      marginBottom: 20,
      overflow: "hidden",
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    cardPressed: {
      opacity: 0.95,
      transform: [{ scale: 0.98 }],
    },
    cardImg: { width: "100%", height: 190, borderRadius: 12, marginBottom: 8 },
    icons: {
      position: "absolute",
      top: 10,
      right: 10,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
    },
    iconHeart: {
      width: 29,
      height: 29,
      borderRadius: 100,
      backgroundColor: "white",
      display: "flex",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
    },
    iconShare: {
      width: 29,
      height: 29,
      borderRadius: 100,
      backgroundColor: "white",
      display: "flex",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
    },
    icon20: { width: 20, height: 20 },
    // cardBody: { padding: 12 },
    cardHead: {
      display: "flex",
      flexDirection: "column", // 🔧 switch from 'row' to 'column'
    },

    cardName: {
      fontSize: 16,
      fontWeight: "600",
      color: Color.cSK430B92950,
      fontFamily: FontFamily.inter,
    },
    cardCatRow: {
      flexDirection: "row",
      gap: 6,
      flexWrap: "wrap",
    },
    catChip: {
      // backgroundColor: Color.cSK430B9250,
      // borderRadius: 12,
      // paddingHorizontal: 6,
      // paddingVertical: 2,
      paddingVertical: 3,
      paddingHorizontal: 6,
      backgroundColor: "#f0e7fd",
      justifyContent: "center",
      alignItems: "center",
      flexDirection: "row",
      borderRadius: 4,
      fontFamily: FontFamily.inter,
    },
    catTxt: {
      fontSize: 12,
      fontFamily: "interMedium",
      color: Color.cSK430B92500,
    },
    cardMetaRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 2,
    },
    costMain: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    metaLabel: {
      fontSize: 12,
      color: Color.cSK430B92950,
      opacity: 0.5,
      fontFamily: FontFamily.inter,
    },
    metaVal: {
      fontSize: 14,
      color: Color.cSK430B92950,
      fontFamily: FontFamily.inter,
    },
    btnRow: { flexDirection: "row", gap: 4, marginTop: 20 },
    removeBtn: {
      borderColor: "#6c6c6c",
      borderWidth: 0.5,
      borderStyle: "solid",
      paddingHorizontal: 12,
      height: 41,
      justifyContent: "center",
      paddingVertical: 8,
      borderRadius: 6,
      alignItems: "center",
      flexDirection: "row",
      flex: 1,
    },
    btnTxt1: {
      color: "#6c6c6c",
      fontSize: 14,
    },
    viewBtn: {
      backgroundColor: Color.cSK430B92500,
      paddingHorizontal: 12,
      height: 41,
      justifyContent: "center",
      paddingVertical: 8,
      borderRadius: 6,
      alignItems: "center",
      flexDirection: "row",
      flex: 1,
    },
    btnTxt2: {
      color: Color.white,
      fontSize: 14,
    },
    socialMediaIcons: {
      display: "flex",
      alignItems: "center",
      flexDirection: "row",
    },
    social: {
      width: 18,
      height: 18,
    },
    instagram: {
      marginRight: -8,
      zIndex: 3,
    },
    facebook: {
      marginRight: -8,
      zIndex: 2,
    },
    tiktok: {
      marginRight: -8,
      zIndex: 1,
    },
    youtube: {
      width: 18,
      height: 14.47,
    },
    userFlexBox: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    description: {
      color: Color.cSK430B92950,
      marginTop: 10,
      marginBottom: 8,
      fontSize: 12,
      fontFamily: FontFamily.inter,
      
    },

     

    /* AI banner */
    aiBanner: {
      width: "100%",
      paddingVertical: 30,
      alignItems: "center",
      gap: 20,
    },
    aiGif: { width: 100, height: 100 },
    aiText: {
      fontFamily: FontFamily.inter,
      fontSize: FontSize.size_lg,
      color: Color.cSK430B92950,
      textAlign: "center",
      paddingHorizontal: 20,
    },
  });
};