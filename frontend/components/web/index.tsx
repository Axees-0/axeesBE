import { Image } from "expo-image";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Pressable,
  TouchableWithoutFeedback,
  ActivityIndicator,
  Dimensions,
  Platform,
  ViewStyle
} from "react-native";
import Arrowdown01 from "@/assets/arrowdown01.svg";
import Zap from "@/assets/zap.svg";

import {
  Padding,
  Border,
  FontFamily,
  Gap,
  Color,
  FontSize,
} from "@/GlobalStyles";
import { router } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState, useCallback } from "react";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import ShareModal from "../ShareModal";
import { useNotifications } from "@/hooks/useNotifications";
import Navbar from "./navbar";
import React from "react";
/* …the other imports stay unchanged … */
import MainScene from "@/assets/main-scene.gif";   // ➊ new
import { DEMO_MODE } from "@/demo/DemoMode";
import { DemoData } from "@/demo/DemoData";


/* …imports stay exactly the same … */
import { FlatList } from "react-native";
import Toast from "react-native-toast-message";
import { UserCardSkeleton } from '../SkeletonLoader';

/* --------------------------------------------------------- */

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL + "/api";
const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL;

/* tiny helper to add / remove an id in an array */
const toggleId = (arr: string[], id: string) =>
    arr.includes(id) ? arr.filter(x => x !== id) : [...arr, id];
  

// Update User interface
interface User {
  _id: string;
  favorites?: string[];
  name?: string;
  avatarUrl?: string;
  isActive?: boolean;
  userType?: string;
  creatorData?: {
    totalFollowers?: number;
    categories?: string[];
    platforms?: Array<{
      platform: string;
      followersCount?: number;
    }>;
  };
  marketerData?: {
    categories?: string[];
  };
}

/** shape returned by /api/find */
interface FindPage {
  items: any[];
  nextCursor?: string | null;
  normalizedTags?: string[];
}

//  ─── constants you can re-use ──────────────────────────────────────────
const CARD_GAP = 30;     // ↔ the value in columnWrapperStyle.gap
const COLS     = 3;      // 3 columns on desktop


// ─── Type-writer helper ───────────────────────────────────────────
const TypewriterText = ({
  messages,
  typingSpeed = 40,       // ms between letters
  holdTime    = 10_000,   // ms to keep the full 1st sentence
  style,
}: {
  messages: string[];
  typingSpeed?: number;
  holdTime?: number;
  style?: any;
}) => {
  const [msgIndex , setMsgIndex ] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [text     , setText     ] = useState('');

  useEffect(() => {
    if (msgIndex >= messages.length) return;

    /* keep typing the current sentence … */
    if (charIndex < messages[msgIndex].length) {
      const t = setTimeout(() => {
        setText((t) => t + messages[msgIndex][charIndex]);
        setCharIndex((c) => c + 1);
      }, typingSpeed);
      return () => clearTimeout(t);
    }

    /* …then wait `holdTime` and start the next one (once) */
    if (msgIndex < messages.length - 1) {
      const t = setTimeout(() => {
        setMsgIndex((i) => i + 1);
        setCharIndex(0);
        setText('');
      }, holdTime);
      return () => clearTimeout(t);
    }
  }, [charIndex, msgIndex, messages, typingSpeed, holdTime]);

  return <Text style={style}>{text}</Text>;
};

/** Banner that:
 *  • always shows the first line instantly
 *  • optionally shows the second line with a typewriter effect
 *    after a 10 s delay (when `showSecond` is true)
 */
const AIBanner = ({ showSecond }: { showSecond: boolean }) => {
  const [showTyper, setShowTyper] = React.useState(false);

  /* start 10-s timer when banner mounts or when showSecond flips to true */
  React.useEffect(() => {
    if (!showSecond) return;               // DB-only → never start timer
    const id = setTimeout(() => setShowTyper(true), 10_000);
    return () => clearTimeout(id);
  }, [showSecond]);

  return (
    <View style={styles.aiBanner}>
      <Image source={MainScene} style={styles.aiGif} />

      {/* 1️⃣ FIRST LINE – show it **only** until the typewriter starts */}
      {!showTyper && (
        <Text style={styles.aiText}>
          Please standby while our system finds Influencers for you.
        </Text>
      )}

      {/* 2️⃣ SECOND LINE – typewriter after 10 s, only when AI search is active */}
      {showSecond && showTyper && (
        <TypewriterText
          messages={['Please standby, we are finding more influencers for you.']}
          typingSpeed={45}
          style={[styles.aiText, { marginTop: 6 }]}
        />
      )}
    </View>
  );
};




const AxeesMockup = () => {
  const { user, isLoading: authLoading, updateUser } = useAuth();

  const [isShareModalVisible, setIsShareModalVisible] = useState(false);
  const [accountUrl, setAccountUrl] = useState("");
  

  const { requestNotificationPermission } = useNotifications();
  const queryClient = useQueryClient();
  

/* ───────── state shared with Navbar ───────── */
  const [searchText, setSearchText]    = useState("");
  const [selectedTag, setSelectedTag]  = useState<string | null>(null);

  /* NEW: value committed only after user hits Enter */
  const [submittedSearch, setSubmittedSearch] = useState("");

  // ───────── sorting (avg-price) ─────────
type SortOrder = 'none' | 'low-hi' | 'hi-low';
const [sortOrder, setSortOrder] = useState<SortOrder>('none');


// top of the component
const [aiFirstPagePending, setAiFirstPagePending] = useState(false);
const [isDropDown,setIsDropDown] = useState(false)



  const onSubmitSearch = () => {
    setSelectedTag(null);                       // clear chip
    setSubmittedSearch(searchText.trim());     // 💡 commit search
  };

  const CPM_RATES: Record<string, number> = {
  tiktok: 25,
  instagram: 10,
  facebook: 25,
  youtube: 20,
  twitter: 2,
  x: 2, // alias for twitter
};


const calculateAverageOfferPrice = (platforms?: Array<{ platform: string; followersCount?: number }>): number => {
  if (!platforms || platforms.length === 0) return 0;

  let totalPrice = 0;
  let countedPlatforms = 0;

  platforms.forEach(({ platform, followersCount }) => {
    if (!followersCount || followersCount <= 0) return;

    const key = platform.toLowerCase();
    const cpm = CPM_RATES[key];

    if (cpm) {
      // Calculate offer price for this platform
      const price = (followersCount / 1000) * cpm;
      totalPrice += price;
      countedPlatforms++;
    }
  });

  // Return average price per platform, or 0 if none valid
  return countedPlatforms > 0 ? totalPrice / countedPlatforms : 0;
};


 

// Predefined tags for the chip row
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
    "Reviews"
];


const normalizedTags = (() => {
  if (selectedTag) return [selectedTag];
  const term = submittedSearch;
  if (!term) return [];
  const hit = PREDEFINED_TAGS.find(t =>
    t.toLowerCase().startsWith(term.toLowerCase())
  );
  return hit ? [hit] : [term];
})();

const {
  data,
  isLoading: queryLoading,
  isFetching,
  isFetchingNextPage,
  fetchNextPage,  
  hasNextPage,
  isError,
  error,
} = useInfiniteQuery<FindPage, Error, FindPage, [string, string, string?]>({
  /* unique cache-key for this search */
  queryKey: ['find', normalizedTags.join(','), user?._id],

  /* first page = DB only */
  queryFn : async ({ pageParam = null }) => {
    // Return demo data in demo mode
    if (DEMO_MODE) {
      return {
        items: DemoData.creators,
        nextCursor: null,
        total: DemoData.creators.length
      } as FindPage;
    }
    
    const params: Record<string, any> = {
   limit : 12,
   cursor: pageParam || undefined,
   ai    : pageParam ? 1                       // pages ≥ 2
          : 0                                 // page 0 → DB only
 };
    if (normalizedTags.length) params.tags = normalizedTags.join(',');

    const { data } = await axios.get(`${API_URL}/find`, { params });
    return data as FindPage;
  },

  getNextPageParam : (last) => last?.nextCursor ?? undefined,

  /* keep list alive while the user browses profiles */
  staleTime : 1000 * 60 * 5,   // 5 min
  gcTime    : 1000 * 60 * 20,  // 20 min   (v5 name for cacheTime)

  enabled                : !authLoading,
  refetchOnWindowFocus   : false,
  refetchOnMount         : false,
});


/* -------- one-off call that fetches AI results & pushes a NEW page ---------- */
type AIPage = {                     // 👈 carries the cursor that came back
  items: any[];
  nextCursor: string | null;
};

const {
  mutateAsync: fetchAI,
  isPending  : aiPending,          // v5 name for isLoading
} = useMutation<AIPage>({
  /* ① call the same /find endpoint */
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
        limit : 12,
        tags  : normalizedTags.join(','),
        ai    : 1                 // AI-only ✅
      }
    });
    return data;                  // ← keep the *whole* page inc. nextCursor
  },

  /* ② push it as an additional page instead of merging into page 0 */
  onSuccess: (aiPage) => {
    queryClient.setQueryData(
      ['find', normalizedTags.join(','), user?._id],
      (old: any) => old
        ? { ...old, pages: [...old.pages, aiPage] }   // 👈 append page
        : { pages: [aiPage] }
    );
  }
});




/* fire it exactly once per new search */
const firedRef = React.useRef<string>("");
useEffect(() => {
  if (!queryLoading && !isFetching && normalizedTags.length) {
    const key = normalizedTags.join(',');   // ← lives in here only

    if (firedRef.current !== key) {
      setAiFirstPagePending(true);          // show banner
      fetchAI().finally(() => setAiFirstPagePending(false));
      firedRef.current = key;
    }
  }
}, [queryLoading, isFetching, normalizedTags.join(',')]);






/* ───────── flatten pages for FlatList ───────── */
const flatListData =
  data?.pages?.flatMap((p: any) => p.items) ?? [];
  const hasItems = flatListData.length > 0;



  // inside your component, _after_ you build flatListData:
const resultCategories = React.useMemo(() => {
  // gather every category out of every creator's creatorData.categories
  const set = new Set<string>()
  flatListData.forEach(usr => {
    usr.creatorData?.categories?.forEach((c: string) => set.add(c))
  })
  return Array.from(set)
}, [flatListData])

/* final client-side guard – remove any dupes that slipped through */
const seen = new Set<string>();
const uniqueFlatListData = flatListData.filter(u => {
  const key = (u.userName || '').toLowerCase();
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
});

  // inside your component, after you've built `resultCategories`:
const page0Tags = (data?.pages?.[0] as any)?.normalizedTags ?? [];

// 1️⃣ Combine them uniquely:
const chipTags = React.useMemo(() => {
  // start with whatever the AI suggested:
  const combined = [...page0Tags];

  // then add any resultCategories that aren't already in page0Tags
  resultCategories.forEach(cat => {
    if (!combined.includes(cat)) combined.push(cat);
  });

  // finally, if still nothing, fall back to PREDEFINED_TAGS
  return combined.length > 0 ? combined : PREDEFINED_TAGS;
}, [page0Tags, resultCategories]);




  



   /* ───────── apply price sort ───────── */
const sortedData = React.useMemo(() => {
  if (sortOrder === 'none') return uniqueFlatListData;

  // pre-calculate once for speed
  const withPrice = uniqueFlatListData.map(u => ({
    price: calculateAverageOfferPrice(u.creatorData?.platforms),
    u
  }));

  withPrice.sort((a, b) =>
    sortOrder === 'low-hi' ? a.price - b.price : b.price - a.price
  );

  return withPrice.map(p => p.u);
}, [uniqueFlatListData, sortOrder]);


  
/* ───────────── toggle Favourite (with toast) ───────────── */
const toggleFavorite = useMutation({
  mutationFn: async (creatorId: string) => {
    if (!user?._id) { router.push("/UAM001Login"); throw new Error(); }

    const { data } = await axios.patch(
      `${API_URL}/users/${user._id}/favorites`,
      { creatorId, userId: user._id }
    );                                   // ⇒ { favorites:[…] }
    return { creatorId, favorites: data.favorites as string[] };
  },

  /* optimistic --------------------------------------------------- */
  onMutate: async (creatorId) => {
    await queryClient.cancelQueries({ queryKey: ["authUser"] });
    const previous = user?.favorites ?? [];
    updateUser({ favorites: toggleId(previous, creatorId) });
    return { previous };
  },

  /* success ------------------------------------------------------ */
  onSuccess: ({ creatorId, favorites }) => {
    updateUser({ favorites });                       // server truth
    queryClient.invalidateQueries({ queryKey:["users"] });

    const isNowFav = favorites.includes(creatorId);
    Toast.show({
      type: "customNotification",
      text1: "Success",
      text2: isNowFav
        ? "Creator added to your favourites list."
        : "Creator removed from your favourites list.",
      position: "top",
      autoHide: true,
      visibilityTime: 3000,
      topOffset: 80,
    });
  },

  /* rollback ----------------------------------------------------- */
  onError: (_e, _id, ctx) => {
    if (ctx?.previous) updateUser({ favorites: ctx.previous });
  },
});



const isFav = (creatorId: string) => {
  // Only check favorites if user is logged in
  if (!user?._id) return false;
  return !!user?.favorites?.includes(creatorId);
};

/* did the user provide a real query/tag? */
const hasUserQuery =
  submittedSearch.trim().length > 0 ||   // typed search
  !!selectedTag;                         // clicked chip

const isAIRequestActive =
  (aiPending || aiFirstPagePending) &&   // an AI call is running
  hasUserQuery;  
  

  // Render each user card
  const renderUserCard = (usr: any, index: number) => {
    const creatorCategory = usr.creatorData?.categories?.slice(0, 2);
    const marketerCategory = usr.marketerData?.categories?.slice(0, 2);

    const categories =
      usr.userType === "Marketer" ? marketerCategory : creatorCategory;
    const favNow = isFav(usr._id);

    return (
      <Pressable
        key={usr._id}
        style={({ pressed, hovered }) => [
          styles.rectangleParent, 
          styles.parentFlexBox1,
          pressed && styles.cardPressed,
          Platform.OS === 'web' && hovered && styles.cardHovered,
        ]}
        onPress={() => {
          if (Platform.OS === 'web') {
            window.open(`/profile/${usr._id}`, '_blank', 'noopener,noreferrer');
          } else {
            router.push(`/profile/${usr._id}`);
          }
        }}
      >
        <Image
          style={styles.frameChild}
          contentFit="cover"
          source={
            usr?.avatarUrl?.includes("/uploads/")
              ? { uri: backendUrl + usr.avatarUrl }
              : usr.avatarUrl || require("@/assets/empty-image.png")
          }
          placeholder={require("@/assets/empty-image.png")}
        />

        <View style={styles.frameParent2}>
          <View style={[styles.jordanRiversParent, styles.parentFlexBox]}>
            <Text style={[styles.jordanRivers, styles.categoryTypo]}>
              {usr.name || "No Name"}
            </Text>
            <View
              style={[styles.availableParent, styles.foodWrapperSpaceBlock]}
            >
              <Text style={[styles.available, styles.foodTypo]}>
                {usr.isActive ? "Available" : "Available"}
              </Text>
              <Zap width={24} height={24} />
            </View>
          </View>
          <View style={[styles.followersParent, styles.parentFlexBox]}>
            <Text style={[styles.searchCategoryTags, styles.categoryTypo]}>
              Followers
            </Text>
            {/* Suppose we show totalFollowers if user is a Creator */}
            <Text style={[styles.m, styles.mTypo]}>
              {usr.creatorData?.totalFollowers
                ? usr.creatorData.totalFollowers >= 1000000
                  ? `${(usr.creatorData.totalFollowers / 1000000).toFixed(1)}M`
                  : usr.creatorData.totalFollowers >= 1000
                  ? `${(usr.creatorData.totalFollowers / 1000).toFixed(1)}K`
                  : usr.creatorData.totalFollowers
                : 0}
            </Text>
          </View>
          <View style={[styles.followersParent, styles.parentFlexBox]}>
            <Text style={[styles.searchCategoryTags, styles.categoryTypo]}>
              Avg Price.
            </Text>
            <Text style={[styles.m, styles.mTypo]}>
  {calculateAverageOfferPrice(usr.creatorData?.platforms).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  })}
</Text>

          </View>
          <View style={styles.twitterIconTransparent1Parent}>
            {usr.creatorData?.platforms?.map((platform: any) => (
              <View
                key={platform.platform}
                style={{
                  gap: -10,
                  justifyContent: "center",
                  flexDirection: "row",
                  maxWidth: 200,
                }}
              >
                
                {(platform.platform == "twitter" || platform.platform == "x") && (
                  <Image
                    style={[
                      styles.transparentTiktokLogoBlackIcon,
                      styles.iconPosition1,
                    ]}
                    contentFit="contain"
                    source={require("@/assets/1707226109newtwitterlogopng-1.png")}
                  />
                )}
                {(platform.platform == "tiktok" || platform.platform == "TikTok") && (
                  <Image
                    style={[
                      styles.transparentTiktokLogoBlackIcon,
                      styles.iconPosition1,
                    ]}
                    contentFit="contain"
                    source={require("@/assets/transparenttiktoklogoblackandwhitelogotiktokappminimaminimalistblackandwhitetiktokapp1711004158896-12.png")}
                  />
                )}
                {(platform.platform == "instagram" || platform.platform == "Instagram") && (
                  <Image
                    style={[
                      styles.transparentTiktokLogoBlackIcon,
                      styles.iconPosition1,
                    ]}
                    contentFit="contain"
                    source={require("@/assets/pngclipartinstagramlogoiconotherstextphotographythumbnail-12.png")}
                  />
                )}

                {(platform.platform == "youtube" || platform.platform == "YouTube") && (
                  <Image
                    style={[
                      styles.transparentTiktokLogoBlackIcon,
                      styles.iconPosition1,
                    ]}
                    contentFit="contain"
                    source={require("@/assets/png-clipart-youtube-play-button-computer-icons-youtube-youtube-logo-angle-rectangle-thumbnail.png")}
                  />
                )}

                {(platform.platform == "facebook" || platform.platform == "Facebook") && (
                  <Image
                    style={[
                      styles.iconPosition1,
                      styles.transparentTiktokLogoBlackIcon,
                    ]}
                    contentFit="contain"
                    source={require("@/assets/facebook-icon.png")}
                  />
                )}
              </View>
            ))}
          </View>
        </View>

        <View style={[styles.frameParent3, styles.frameFlexBox]}>
         <TouchableOpacity
            style={[styles.joinWrapper, styles.parentSpaceBlock]}
            onPress={(e) => {
              e.stopPropagation?.();
              if (Platform.OS === 'web') {
                window.open(`/profile/${usr._id}`, '_blank', 'noopener,noreferrer');
              } else {
                router.push(`/profile/${usr._id}`);
              }
            }}
          >
            <Text style={[styles.join, styles.categoryTypo]}>View Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.shareParent, styles.shareParentBorder]}
            onPress={(e) => {
              e.stopPropagation?.();
              setIsShareModalVisible(true);
              requestNotificationPermission();
              if (typeof window !== "undefined") {
                setAccountUrl(`${window.location.origin}/profile/${usr._id}`);
              }
            }}
          >
            <Text style={[styles.signIn, styles.signInClr]}>Share</Text>
            <Image
              source={require("@/assets/share-08.png")}
              style={{ width: 24, height: 24 }}
            />
          </TouchableOpacity>
        </View>
        <View
          style={[
            { flexDirection: "row", gap: 10, marginBottom: 20 },
            styles.foodWrapper,
          ]}
        >
          {categories?.map((cat: string) => (
            <View
              key={cat}
              style={[
                styles.foodWrapperSpaceBlock,
                { backgroundColor: Color.colorLimegreen_200 },
              ]}
            >
              <Text style={[styles.food, styles.mTypo]}>{cat}</Text>
            </View>
          ))}
        </View>
      


<Pressable
  hitSlop={10}
  onPress={(e) => {
    e.stopPropagation?.();
    toggleFavorite.mutate(usr._id);
  }}
  style={{ position: 'absolute', top: 10, right: 10 }}
>
  <Image
    style={{ width: 24, height: 24 }}
    source={
      favNow
        ? require('@/assets/heart-red.png')   // filled heart
        : require('@/assets/icons.png')       // empty heart / outline
    }
  />
</Pressable>


      </Pressable>
    );
  };

  

// ** UPDATED: ** use `apiTags` when rendering chips
  const renderTagChips = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.tagChipsContainer as ViewStyle}
    >
      {chipTags.map(tag => (
        <Pressable
          key={tag}
          style={[
            styles.tagChip,
            selectedTag === tag && styles.selectedTagChip,
          ]}
          onPress={() => setSelectedTag(selectedTag === tag ? null : tag)}
        >
          <Text
            style={[
              styles.tagChipText,
              selectedTag === tag && styles.selectedTagChipText,
            ]}
          >
            {tag}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );


const renderListHeader = hasItems ? () => (
  <View style={{ width: '100%', marginBottom: 20 }}>

    {/* tag chips row */}
    {renderTagChips()}
    {/* row: heading + filter */}
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 25,
        marginBottom: 10,
      }}
    >
      <Text
        style={{
          fontFamily : FontFamily.inter,
          fontSize   : FontSize.size_5xl,
          fontWeight : '600',
          color      : Color.cSK430B92950,
        }}
      >
        Search Results
      </Text>

      {/* tiny pseudo-dropdown */}
      <Pressable
        onPress={() =>
          setSortOrder(o =>
            o === 'hi-low'
              ? 'low-hi'
              : o === 'low-hi'
              ? 'none'
              : 'hi-low')
        }
        style={{
          flexDirection     : 'row',
          alignItems        : 'center',
          borderWidth       : 1,
          borderColor       : Color.cSK430B92500,
          borderRadius      : 8,
          paddingVertical   : 6,
          paddingHorizontal : 12,
          gap               : 6,
        }}
      >
        <Text
          style={{
            fontFamily : FontFamily.inter,
            fontSize   : FontSize.size_sm,
            color      : Color.cSK430B92500,
          }}
        >
          {sortOrder === 'none'
            ? 'Sort by'
            : sortOrder === 'hi-low'
            ? 'Highest → Lowest'
            : 'Lowest → Highest'}
        </Text>
        <Arrowdown01 width={14} height={14} />
      </Pressable>
    </View>

    
  </View>
) : null;


const isLoadingFirstPage =
  (queryLoading || isFetching) && !hasItems;   // 👈 add !hasItems





const renderEmpty = () => {
  /* ①  first case: DB returned zero rows **and** the AI call is still running   */
   return <AIBanner showSecond={isAIRequestActive} />;

  /* ②  we’re still waiting for the very first DB page → skeleton cards          */
  if (isLoadingFirstPage) {
    return (
      <View style={{
        flexDirection: 'row', flexWrap: 'wrap', gap: 30,
        justifyContent: 'space-between', width: '100%'
      }}>
        {[...Array(6)].map((_, i) => <UserCardSkeleton key={i} />)}
      </View>
    );
  }

  /* ③  network / server error                                                   */
  if (isError) {
    return (
      <Text style={{ color: 'red', marginTop: 40 }}>
        {(error as any)?.response?.data?.message || (error as Error).message}
      </Text>
    );
  }

  /* ④  genuine empty result                                                     */
  return <Text style={{ color: '#777', marginTop: 40 }}>No creators found.</Text>;
};




  return (
    <>
    
      <Navbar
        searchText={searchText}
        setSearchText={setSearchText}
        onSubmitSearch={onSubmitSearch}
      />
      
    <TouchableWithoutFeedback onPress={() => setIsDropDown(false)}>      
      <View style={{ flex: 1 }}>
        
        <View style={[styles.axeesMockup2 as ViewStyle, { paddingHorizontal: "0%" }]}>
          <FlatList
            data={sortedData}
            extraData={sortOrder}
            keyExtractor={(item: { _id: any; userName: any; }, index: string) =>
   (item._id || item.userName || 'row') + '_' + index}
            ListHeaderComponent={renderListHeader}
            ListEmptyComponent={renderEmpty}
            renderItem={({ item, index }) => renderUserCard(item, index)}
            numColumns={3}
            columnWrapperStyle={{
              flexDirection: 'row',
              flexWrap    : 'wrap',
              gap         : CARD_GAP,        // your card marginBottom is 20
              paddingHorizontal: 40,
              /* <-- add this line again */
              justifyContent: 'space-between',
            }}
            contentContainerStyle={{ paddingBottom: 150, paddingHorizontal: "10%" }}
            scrollEnabled={true}
            style={{ flexGrow: 1, width: "100%" }}
            onEndReached={() => {
              /* nothing else must be running before we ask for the next page */
              const busy =
                queryLoading ||           // first DB page
                isFetching      ||        // any react-query request
                isFetchingNextPage ||
                aiPending ||              // one-off AI pre-fetch
                aiFirstPagePending       // 🆕 banner still filling the viewport

              if (!busy && hasNextPage) {
                fetchNextPage();
              }
            }}

            onEndReachedThreshold={0.001}
            ListFooterComponent={() => {
              /* 1️⃣ show the banner *below* the DB results while AI runs       */
             if (aiPending && hasItems && !isFetchingNextPage)
                return <AIBanner showSecond={true} />;

              /* 2️⃣ normal endless-scroll skeletons                           */
              if (isFetchingNextPage)   
                return <AIBanner showSecond={true} />;
              //   return (
              //   <View style={styles.skeletonFooter}>
              //     {[1,2,3].map(i => <UserCardSkeleton key={i}/> )}
              //   </View>
              // );

              return null;
            }}

          />         
        </View>
        
        <ShareModal
          visible={isShareModalVisible}
          onClose={() => setIsShareModalVisible(false)}
          profileUrl={accountUrl}
        />
      </View>      
    </TouchableWithoutFeedback>
    
    </>
  );
};

const styles = StyleSheet.create({
  userInfo: {
    paddingVertical: Padding.p_xs,
    paddingLeft: Padding.p_5xl,
    borderRadius: Border.br_xs,
    flexDirection: "row",
    gap: 10,
  },
  userTypeInfo: {
    fontFamily: "sFPro",
    fontStyle: "italic",
    color: Color.grey,
  },
  userInfoText: {
    fontSize: FontSize.size_lg,
    fontFamily: FontFamily.inter,
  },

  frameParentSpaceBlock: {
    paddingVertical: 0,
    paddingHorizontal: Padding.p_13xl,
    marginRight: "5%",
    width: "100%",
    justifyContent: "space-between",
    alignItems: "center",
    flexDirection: "row",
    position: "absolute",
  },

  parentSpaceBlock: {
    paddingVertical: Padding.p_xs,
    borderRadius: Border.br_xs,
    flexDirection: "row",
    paddingHorizontal: 20,
  },
  categoryTypo: {
    textAlign: "center",
    fontFamily: FontFamily.inter,
  },
  frameFlexBox: {    
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  signInClr: {
    color: Color.cSK430B92500,
    textAlign: "center",
  },
  parentFlexBox2: {
    alignItems: "center",
    flexDirection: "row",
  },
  parentFlexBox1: {
    gap: Gap.gap_lg,
    alignItems: "center",
  },
  parentFlexBox: {
    flex: 1,
    alignItems: "center",
    flexDirection: "row",
  },
  foodWrapperSpaceBlock: {
    paddingVertical: Padding.p_7xs,
    paddingHorizontal: Padding.p_xs,
    borderRadius: Border.br_5xs,
    alignItems: "center",
    flexDirection: "row",
  },
  foodTypo: {
    fontSize: FontSize.size_sm,
    fontFamily: FontFamily.inter,
  },
  mTypo: {
    fontWeight: "600",
  },
  iconPosition1: {
    width: 37,
    marginLeft: -10,
    position: "relative",
  },
  iconPosition: {
    left: 22,
    width: 37,
    top: 0,
    position: "absolute",
  },
  shareParentBorder: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: Color.cSK430B92500,
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: "5%",
  },
  aiBanner: {
  width       : "100%",
  paddingTop  : 30,
  paddingBottom: 40,
  alignItems  : "center",
  justifyContent: "center",
  gap         : 20,
},
aiGif: {
  width : 120,
  height: 120,
},
aiText: {
  fontFamily: FontFamily.inter,
  fontSize  : FontSize.size_lg,
  color     : Color.cSK430B92950,
  textAlign : "center",
  paddingHorizontal: 20,
},
skeletonFooter: {
  flexDirection : "row",
  flexWrap      : "wrap",
  gap           : 30,
  justifyContent: "space-between",
  width         : "100%",
  paddingHorizontal: 25,
},

  iconsLayout: {},
  bgIconPosition: {
    bottom: "0%",
    top: "0%",
    height: "100%",
    left: "0%",
    right: "0%",
    position: "absolute",
    overflow: "hidden",
    width: "100%",
  },
  pathIconPosition: {
    height: 14,
    width: 8,
    marginTop: -7.35,
    top: "50%",
    left: "50%",
    position: "absolute",
  },
  groupViewPosition: {
    top: "50%",
    left: "50%",
    position: "absolute",
  },
  bgGroupPosition: {
    width: "30.39%",
    bottom: "0%",
    top: "0%",
    height: "100%",
    position: "absolute",
    overflow: "hidden",
  },
  ofTypo: {
    textAlign: "left",
    fontFamily: FontFamily.lato,
    lineHeight: 24,
    fontSize: FontSize.size_smi,
    bottom: 4,
    color: Color.cSK430B92500,
    position: "absolute",
  },
  icon: {
    width: 139,
    left: 0,
    top: 0,
    height: 60,
    position: "absolute",
  },
  wrapper: {
    width: 162,
    height: 60,
  },
  searchCategoryTags: {
    opacity: 0.5,
    color: Color.cSK430B92950,
    fontSize: FontSize.size_lg,
  },
  search01Parent: {
    borderColor: Color.colorPlum,
    gap: Gap.gap_md,
    borderWidth: 1,
    borderStyle: "solid",
    paddingVertical: Padding.p_xs,
    backgroundColor: Color.buttonSelectable,
    flex: 1,
  },
  signIn: {
    fontFamily: FontFamily.inter,
    fontSize: FontSize.size_lg,
  },
  join: {
    color: Color.white,
    fontSize: FontSize.size_lg,
  },
  joinWrapper: {
    backgroundColor: Color.cSK430B92500,
  },
  frameGroup: {
    paddingLeft: Padding.p_5xl,
  },
  frameParent: {
    // top: 20,
  },
  category: {
    color: Color.cSK430B92950,
    fontSize: FontSize.size_lg,
  },
  categoryParent: {
    borderColor: "rgba(11, 2, 24, 0.5)",
    gap: Gap.gap_md,
    borderWidth: 1,
    borderStyle: "solid",
    paddingVertical: Padding.p_xs,
  },
  buttonIcon: {},
  toggleBase: {
    backgroundColor: Color.cSK430B92100,
    width: 36,
    height: 20,
    padding: Padding.p_11xs,
    borderRadius: Border.br_xs,
    alignItems: "center",
    flexDirection: "row",
    overflow: "hidden",
  },
  toggleParent: {
    gap: Gap.gap_lg,
    flexDirection: "row",
  },
  frameView: {
    gap: Gap.gap_2xl,
  },
  priceParent: {
    gap: Gap.gap_md,
  },
  sortByParent: {
    gap: Gap.gap_4xs,
  },
  frameChild: {
    borderRadius: Border.br_xl,
    width: 131,
    height: 131,
    zIndex: 0,
  },
  jordanRivers: {
    fontSize: FontSize.size_xl,
    fontWeight: "500",
    color: Color.cSK430B92950,
  },
  available: {
    color: Color.cSK430B92500,
    textAlign: "center",
  },
  availableParent: {
    backgroundColor: Color.cSK430B9250,
    gap: Gap.gap_4xs,
  },
  jordanRiversParent: {
    flexWrap: "wrap",
    alignContent: "center",
    gap: 5,
  },
  m: {
    fontSize: FontSize.size_5xl,
    color: Color.cSK430B92950,
    fontFamily: FontFamily.inter,
  },
  followersParent: {
    height: 29,
    justifyContent: "space-between",
  },
  twitterIconTransparent1: {
    left: 43,
    height: 37,
  },
  transparentTiktokLogoBlackIcon: {
    height: 38,
  },
  pngClipartInstagramLogoIcoIcon: {
    height: 37,
    left: 0,
  },
  twitterIconTransparent1Parent: {
    height: 38,
    display: "flex",
    flexDirection: "row",
    marginLeft: "10%",
  },
  frameParent2: {
    justifyContent: "flex-end",
    gap: Gap.gap_5xs,
    zIndex: 1,
    width: "100%",
  },
  shareParent: {
    gap: Gap.gap_md,
  },
  frameParent3: {
    alignSelf: "stretch",
    zIndex: 2,
  },
  food: {
    color: Color.colorLimegreen_100,
    fontSize: FontSize.size_sm,
    fontFamily: FontFamily.inter,
  },
  foodWrapper: {
    top: 16,
    left: 24,
    zIndex: 3,
    position: "absolute",
  },
  icons: {
    top: 19,
    left: "85%",
    zIndex: 4,
    position: "absolute",
  },
  rectangleParent: {
    borderRadius: Border.br_5xl,
    paddingTop: Padding.p_29xl,
    paddingBottom: Padding.p_5xl,
    paddingHorizontal: Padding.p_5xl,
    gap: Gap.gap_lg,
    backgroundColor: Color.buttonSelectable,
    // ---- width -----------------------------------------------------------
    // RN-web accepts any valid CSS string – tell TS to chill once
    // @ts-ignore
    flexBasis : Platform.OS === 'web'
      ? `calc((100% - ${(COLS - 1) * CARD_GAP}px) / ${COLS})`
      : '33%',                 // native: plain percentage is fine
    minWidth  : 300,

    marginBottom : 20,
  },
  cardPressed: {
    opacity: 0.95,
    transform: [{ scale: 0.98 }],
  },
  cardHovered: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    transform: [{ translateY: -2 }],
  },
  twitterIconTransparent11: {
    height: 37,
  },
  transparentTiktokLogoBlackIcon2: {
    height: 38,
    left: 0,
  },
  frameParent1: {
    top: 200,
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 30,
  },
  frameParent8: {
    top: 757,
  },
  frameContainer:{
    top:50
  },
  suggestedListBy: {
    top:130,
    width: "100%",
    fontSize: FontSize.size_13xl,
    fontFamily: FontFamily.sFProDisplaySemibold,
    color: Color.colorBlack,
    marginLeft: "2%",
    marginRight: "5%",
  },
  pathIcon: {
    marginLeft: -80,
  },
  pathIcon1: {
    marginLeft: 72,
  },
  bgIcon: {
    borderRadius: Border.br_9xs,
    maxWidth: "100%",
    maxHeight: "100%",
    left: "0%",
  },
  text6: {
    left: 12,
  },
  bgParent: {
    right: "69.61%",
    left: "0%",
  },
  of: {
    left: 46,
  },
  bgGroup: {
    left: "69.61%",
    right: "0%",
    width: "30.39%",
  },
  groupView: {
    marginTop: -15.35,
    marginLeft: -52,
    width: 102,
    height: 30,
    overflow: "hidden",
  },
  pagination1: {
    left: "0%",
  },
  pagination: {
    height: "1.98%",
    top: "93.7%",
    bottom: "4.32%",
    width: 160,
    marginLeft: -80,
    left: "50%",
    position: "absolute",
  },
  logoIcon: {
    width: 211,
    height: 62,
  },
  logoWrapper: {
    borderRadius: 6,
    width: 234,
    paddingHorizontal: 13,
    paddingVertical: 6,
    backgroundColor: Color.cSK430B92500,
  },
  axeesMockup2: {
    backgroundColor: Color.white,
    flex: 1,
    width: "100%",    
    overflow: "visible",
  },
  
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 20,
    gap: 8,
    width: "100%",
  },
  pageButton: {
    borderWidth: 1,
    borderColor: "#430B92",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 4,
  },
  pageButtonText: {
    color: "#430B92",
  },
  activePageButton: {
    backgroundColor: "#430B92",
  },
  pageButtonTextActive: {
    color: "white",
  },


  // Tag chips container
  tagChipsContainer: {
    paddingHorizontal: 25,
    paddingVertical: 10,
    gap: 10,    
    maxHeight:70,    
  },

  // Tag chip
  tagChip: {
    backgroundColor: Color.colorLimegreen_200,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 12,
    minHeight: 40,
    alignItems: "center",
    justifyContent: "center",
    margin: 5,
  },

  // Selected tag chip
  selectedTagChip: {
    backgroundColor: Color.cSK430B92500,
  },

  // Tag chip text
  tagChipText: {
    color: Color.colorLimegreen_100,
    fontSize: FontSize.size_sm,
    fontFamily: FontFamily.inter,
    fontWeight: "500",
    textAlign: "center",
  },

  // Selected tag chip text
  selectedTagChipText: {
    color: Color.white,
  },
});

export default AxeesMockup;