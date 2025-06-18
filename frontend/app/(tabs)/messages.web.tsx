// app/(tabs)/messages.web.tsx
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  SafeAreaView,
  FlatList,
  Pressable,
  TextInput,
  useWindowDimensions,
  StyleSheet,
  Linking,
  Dimensions,
  TouchableOpacity,
  Platform,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import CustomBackButton from "@/components/CustomBackButton";
import { Message, useChat } from "@/hooks/useChat";
import Toast from "react-native-toast-message";
import { useDropzone } from "react-dropzone";
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";
import { useAuth } from "@/contexts/AuthContext";
import { useUnreadMessages } from "@/hooks/messagesContext";
import { validateMessage } from "@/utils/contentFilter";
import { showErrorToast, handleAsyncError, validateNetworkConnection } from "@/utils/errorHandler";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import ProfileInfo from "@/components/ProfileInfo";
import * as Progress from "react-native-progress";
import Header from "@/components/Header";
import { Color, FontFamily, FontSize } from "@/GlobalStyles";
import Search01 from "@/assets/search01.svg";
import { ActivityIndicator } from "react-native";

const BREAKPOINTS = { TABLET: 768 } as const;

type ChatPreview = {
  id: string;
  peerId: string;
  peerName: string;
  peerAvatar?: string;
  lastMessage: string;
  updatedAt: Date | string;
  unread: number;
  offerName?: string;
  offerType?: string;
  offerDescription?: string;
  offerNotes?: string;
  offerStatus?: string;
  offerId?: string;
  participants?: Array<{
    _id: string;
    name: string;
    avatarUrl?: string;
    userName?: string;
  }>;
};
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const isDesktop = SCREEN_WIDTH > 768;

export default function MessagesWeb() {
  const { width } = useWindowDimensions();
  const isMobile = width < BREAKPOINTS.TABLET;
  const { user } = useAuth();
  const [chats, setChats] = useState<ChatPreview[]>([]);
  const [selectedChat, setSelectedChat] = useState<ChatPreview | null>(null);
  const [message, setMessage] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const MY_ID = user?._id || "";
  const { unreadCount, refreshUnreadCount, markChatAsRead, setCurrentChatId } =
    useUnreadMessages();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Message[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [loadingOlderMessages, setLoadingOlderMessages] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [searchChatResults, setSearchChatResults] = useState<any>();
  const [filteredChat, setFilteredChats] = useState<any>();
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>(
    {}
  );
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const [showChatList, setShowChatList] = useState(!isMobile || !selectedChat);
  const [isLoading, setIsLoading] = useState(false);
  const [isChatLoad, setIsChatLoad] = useState(false);

  // Close emoji picker when clicking outside of it
  useEffect(() => {
    const handleClickOutsideEmoji = (event: MouseEvent) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target as Node)
      ) {
        setShowEmoji(false);
      }
    };
    if (showEmoji) {
      document.addEventListener("mousedown", handleClickOutsideEmoji);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutsideEmoji);
    };
  }, [showEmoji]);

  // Update UI when screen size changes
  useEffect(() => {
    if (!isMobile) {
      setShowChatList(true);
    } else if (selectedChat) {
      setShowChatList(false);
    } else {
      setShowChatList(true);
    }
  }, [isMobile, selectedChat]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    if (!validateNetworkConnection()) return;

    setIsSearching(true);
    
    const searchOperation = async () => {
      // Search both messages and chats in parallel
      const [messagesRes, chatsRes] = await Promise.all([
        fetch(
          `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/chats/${
            selectedChat?.id
          }/search?query=${encodeURIComponent(searchQuery)}&userId=${MY_ID}`
        ),
        fetch(
          `${
            process.env.EXPO_PUBLIC_BACKEND_URL
          }/api/chats/search?query=${encodeURIComponent(
            searchQuery
          )}&userId=${MY_ID}`
        ),
      ]);

      if (!messagesRes.ok || !chatsRes.ok) {
        throw new Error('Search request failed');
      }

      const [messageResults, chatResults] = await Promise.all([
        messagesRes.json(),
        chatsRes.json(),
      ]);

      const filteredChats = chats.filter((chat) => {
        const searchRegex = new RegExp(searchQuery, "i");
        const peer = chat.participants?.find((p) => p._id !== MY_ID);
        const peerName = peer?.name || peer?.userName || "";

        return (
          searchRegex.test(peerName) ||
          searchRegex.test(chat.offerName || "") ||
          searchRegex.test(chat.offerType || "")
        );
      });

      setFilteredChats(filteredChats);
      setSearchResults(messageResults);
      setSearchChatResults(chatResults);
    };

    try {
      await searchOperation();
    } catch (error) {
      console.error("Search failed:", error);
      showErrorToast(error, "Search failed. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  const [activeSearchTab, setActiveSearchTab] = useState<"messages" | "chats">(
    "messages"
  );

  const [validationError, setValidationError] = useState<{
    type: "badWord" | "contactInfo" | null;
    message: string;
  }>({ type: null, message: "" });

  const handleMessageChange = (text: string) => {
    setMessage(text);

    if (!text.trim()) {
      setValidationError({ type: null, message: "" });
      return;
    }

    const validation = validateMessage(text);

    if (validation.containsBadWord) {
      setValidationError({
        type: "badWord",
        message: "Your message contains offensive words",
      });
    } else if (validation.containsContactInfo) {
      setValidationError({
        type: "contactInfo",
        message:
          "As stated in our policy, communicating using methods other than this app is prohibited",
      });
    } else {
      setValidationError({ type: null, message: "" });
    }
  };

  // Track currently open chat
  useEffect(() => {
    setCurrentChatId(selectedChat?.id || null);

    if (selectedChat?.id) {
      markChatAsRead(selectedChat.id);
      refreshUnreadCount();
    }
  }, [selectedChat?.id]);

  // Handle window focus changes
  useEffect(() => {
    const handleFocus = () => {
      if (selectedChat?.id) {
        markChatAsRead(selectedChat.id);
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [selectedChat?.id]);

  useEffect(() => {
    const markMessagesAsRead = async () => {
      if (selectedChat?.id && MY_ID) {
        setIsChatLoad(true);
        try {
          await fetch(
            `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/chats/messages/read`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                chatId: selectedChat.id,
                userId: MY_ID,
              }),
            }
          );

          setChats((prevChats) =>
            prevChats.map((chat) =>
              chat.id === selectedChat.id ? { ...chat, unread: 0 } : chat
            )
          );
        } catch (error) {
          console.error("Failed to mark messages as read", error);
        } finally {
          setIsChatLoad(false);
        }
      }
    };

    markMessagesAsRead();
  }, [selectedChat?.id, MY_ID]);

  const { messages, send, fetchMessages, fetchMore, refreshChatList } = useChat(
    selectedChat?.id || "",
    MY_ID
  );
  const renderTextWithLinks = (text: string) => {
    if (!text) return null;

    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);

    return (
      <Text>
        {parts.map((part, i) => {
          if (part.match(urlRegex)) {
            return (
              <Text
                key={i}
                style={{ color: "#3B82F6", textDecorationLine: "underline" }}
                onPress={() => Linking.openURL(part)}
              >
                {part}
              </Text>
            );
          }
          return part;
        })}
      </Text>
    );
  };

  useEffect(() => {
    const handleNewUnreadMessages = async () => {
      const updatedChats = await refreshChatList();
      const normalizedChats = updatedChats.map((r: any) => ({
        id: r._id,
        peerId: r.participants.find((p: any) => p._id !== MY_ID)?._id,
        peerName: r.peerName || "Unknown",
        peerAvatar: r.peerAvatar
          ? `${process.env.EXPO_PUBLIC_BACKEND_URL}${r.peerAvatar}`
          : undefined,
        lastMessage: r.lastMessage?.text || "",
        unread: r.unreadCount?.[MY_ID] || 0,
        offerName: r.createdFromOffer?.offerName,
        offerType: r.createdFromOffer?.offerType,
        offerDescription: r.createdFromOffer?.description,
        offerNotes: r.createdFromOffer?.notes,
        offerStatus: r.createdFromOffer?.status,
        participants: r.participants,
        updatedAt: r.lastMessage?.createdAt || r.createdAt,
        offerId: r.createdFromOffer?._id,
      }));

      setChats(
        normalizedChats.sort(
          (a: any, b: any) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        )
      );
    };

    window.addEventListener("newUnreadMessages", handleNewUnreadMessages);
    return () => {
      window.removeEventListener("newUnreadMessages", handleNewUnreadMessages);
    };
  }, [refreshChatList]);

  // Fetch and normalize chat list
  useEffect(() => {
    if (!MY_ID) return;
    setIsLoading(true);
    (async () => {
      try {
        const res = await fetch(
          `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/chats?userId=${MY_ID}`
        );
        const raw = await res.json();

        const list: ChatPreview[] = raw.map((r: any) => ({
          id: r._id,
          peerId: r.participants.find((p: any) => p._id !== MY_ID)?._id,
          peerName: r.peerName || "Unknown",
          peerAvatar: r.peerAvatar
            ? `${process.env.EXPO_PUBLIC_BACKEND_URL}${r.peerAvatar}`
            : undefined,
          lastMessage: r.lastMessage?.text || "",
          unread: r.unreadCount?.[MY_ID] || 0,
          offerName: r.createdFromOffer?.offerName,
          offerType: r.createdFromOffer?.offerType,
          offerDescription: r.createdFromOffer?.description,
          offerNotes: r.createdFromOffer?.notes,
          offerStatus: r.createdFromOffer?.status,
          participants: r.participants,
          updatedAt: r.lastMessage?.createdAt || r.createdAt,
          offerId: r.createdFromOffer?._id,
        }));

        list.sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );

        setChats(list);

        // Check localStorage for selectedOfferId and select the corresponding chat
        const selectedOfferId = localStorage.getItem("selectedOfferId");
        if (selectedOfferId) {
          const matchingChat = list.find(
            (chat) => chat.offerId === selectedOfferId
          );
          if (matchingChat) {
            setSelectedChat(matchingChat);
          }
          localStorage.removeItem("selectedOfferId");
        } else if (list.length > 0 && !selectedChat) {
          setSelectedChat(list[0]);
        }
      } catch (err) {
        console.error("Failed to load chat list", err);
      } finally {
        setIsLoading(false); // Stop loader
      }
    })();
  }, [MY_ID]);

  const isChattingAllowed = (chat: ChatPreview | null) => {
    return chat?.offerStatus === "Accepted" || !chat?.offerStatus;
  };

  useEffect(() => {
    const checkForNewChats = async () => {
      if (
        messages.length > 0 &&
        (!selectedChat ||
          messages.some((m) => !chats.some((c) => c?.id === m?.chatId)))
      ) {
        const updatedChats = await refreshChatList();
        const normalizedChats = updatedChats.map((r: any) => ({
          id: r._id,
          peerId: r.participants.find((p: any) => p._id !== MY_ID)?._id,
          peerName: r.peerName || "Unknown",
          peerAvatar: r.peerAvatar
            ? `${process.env.EXPO_PUBLIC_BACKEND_URL}${r.peerAvatar}`
            : undefined,
          lastMessage: r.lastMessage?.text || "",
          unread: r.unreadCount?.[MY_ID] || 0,
          offerName: r.createdFromOffer?.offerName,
          offerType: r.createdFromOffer?.offerType,
          offerDescription: r.createdFromOffer?.description,
          offerNotes: r.createdFromOffer?.notes,
          offerStatus: r.createdFromOffer?.status,
          participants: r.participants,
          updatedAt: r.lastMessage?.createdAt || r.createdAt,
          offerId: r.createdFromOffer?._id,
        }));

        setChats(
          normalizedChats.sort(
            (a: any, b: any) =>
              new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          )
        );
      }
    };

    checkForNewChats();
  }, [messages, refreshChatList, MY_ID, selectedChat]);

  // New improved onDrop handler
  const onDrop = async (accepted: File[], rejected: File[]) => {
    // Handle rejected files (oversized)
    if (rejected.length > 0) {
      const oversizedNames = rejected.map((f) => f.name).join(", ");
      Toast.show({
        type: "error",
        text1: "File too large",
        text2: `The following files exceed 20MB limit: ${oversizedNames}`,
        position: "top",
        visibilityTime: 4000,
      });
      return;
    }

    // Process accepted files
    const attachments = accepted.map((f) => ({
      id: `${f.name}-${Date.now()}`,
      url: URL.createObjectURL(f),
      name: f.name,
      type: f.type,
      size: f.size,
      file: f,
    }));

    // Show success toast if files were accepted
    if (attachments.length > 0) {
      Toast.show({
        type: "success",
        text1: "Uploading files",
        text2: `Processing ${attachments.length} file(s)`,
        position: "top",
        visibilityTime: 2000,
      });
    }

    // Upload each file
    for (const att of attachments) {
      try {
        setUploadProgress((prev) => ({ ...prev, [att.id]: 0 }));

        // Simulate progress
        const interval = setInterval(() => {
          setUploadProgress((prev) => {
            const current = prev[att.id] || 0;
            return current >= 90 ? prev : { ...prev, [att.id]: current + 5 };
          });
        }, 200);

        // Actual upload
        await send({
          attachments: [att],
          receiverId: selectedChat!.peerId,
        });

        // Complete progress
        clearInterval(interval);
        setUploadProgress((prev) => ({ ...prev, [att.id]: 100 }));

        // Clean up after delay
        setTimeout(() => {
          setUploadProgress((prev) => {
            const { [att.id]: _, ...rest } = prev;
            return rest;
          });
        }, 1000);
      } catch (error) {
        console.error("Upload failed:", error);
        Toast.show({
          type: "error",
          text1: "Upload failed",
          text2: `Failed to upload ${att.name}`,
          position: "top",
          visibilityTime: 4000,
        });
        setUploadProgress((prev) => {
          const { [att.id]: _, ...rest } = prev;
          return rest;
        });
      }
    }
  };

  // Update useDropzone to handle rejections
  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    maxSize: 20 * 1024 * 1024, // 20MB
    multiple: true,
  });

  const handleDownload = (url: string) => {
    if (url.startsWith("/")) {
      Linking.openURL(`${process.env.EXPO_PUBLIC_BACKEND_URL}${url}`);
    } else {
      Linking.openURL(url);
    }
  };

  const getReceiverName = () => {
    if (!selectedChat?.participants) return "Unknown";
    const receiver = selectedChat.participants.find((p) => p._id !== MY_ID);
    return receiver?.name || receiver?.userName || "Unknown";
  };

  const handleSend = async () => {
    if (!message.trim()) return;
    const validation = validateMessage(message);
    if (!validation.isValid) {
      const message = validation.containsBadWord
        ? "Message contains inappropriate content and is under review"
        : "Message contains contact information and is under review";

      Toast.show({
        type: "error",
        text1: "Validation Error",
        text2: message,
        position: "top",
        autoHide: true,
        visibilityTime: 7000,
        topOffset: 50,
      });
    }

    try {
      await send({
        text: message,
        receiverId: selectedChat!.peerId,
        createdAt: new Date().toISOString(),
      });

      setMessage("");
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const [popupMessageId, setPopupMessageId] = useState<string | null>(null);
  const popupRef = useRef<View>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popupRef.current &&
        !(popupRef.current as any).contains(event.target)
      ) {
        setPopupMessageId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // // Get user avatar from participants array
  // const getUserAvatar = (userId: string) => {
  //   if (!selectedChat?.participants) return undefined;
  //   const user = selectedChat.participants.find((p) => p._id === userId);
  //   return user?.avatarUrl
  //     ? `${process.env.EXPO_PUBLIC_BACKEND_URL}${user.avatarUrl}`
  //     : undefined;
  // };


    /** Return a valid <Image source={…}> object for any avatar string
+   *  –  /uploads/xxxx      ➜ { uri: backend + avatar }
+   *  –  https://…          ➜ { uri: avatar }
+   *  –  falsy / nothing    ➜ require placeholder
+   */
  const buildAvatarSource = (avatar?: string) => {
    if (!avatar) return require("@/assets/empty-image.png");
    return avatar.includes("/uploads/")
      ? { uri: `${process.env.EXPO_PUBLIC_BACKEND_URL}${avatar}` }
      : { uri: avatar };
  };



  // Get avatar *source* suitable for <Image source={…} />:
  //  • If stored under /uploads/, prefix backend URL and wrap in { uri: … }.
  //  • If it’s already a full/absolute URL, return that string as-is.
  //  • Otherwise fall back to the local placeholder asset.
  const getUserAvatar = (userId: string) => {
    if (!selectedChat?.participants) {
      return require("@/assets/empty-image.png");
    }

    const usr = selectedChat.participants.find((p) => p._id === userId);
    if (!usr?.avatarUrl) {
      return require("@/assets/empty-image.png");
    }

    return usr.avatarUrl.includes('/uploads/')
   ? { uri: `${process.env.EXPO_PUBLIC_BACKEND_URL}${usr.avatarUrl}` }
   : { uri: usr.avatarUrl };      // always an object or require()
  };

  // Get user name from participants array
  const getUserName = (userId: string) => {
    if (!selectedChat?.participants) return "Unknown";
    const user = selectedChat.participants.find((p) => p._id === userId);
    return user?.name || user?.userName || "Unknown";
  };

  const ChatItem = ({ item }: { item: ChatPreview }) => {
    const unreadCount = item.unread || 0;

    
    /* pick avatar: use item.peerAvatar if present, otherwise grab it
       from the peer inside participants */
    const peer = item.participants?.find((p) => p._id !== MY_ID);
    const avatarPath = peer?.avatarUrl || item.peerAvatar;
    
    return (
      <Pressable
        onPress={() => {
          setSelectedChat(item);
          if (isMobile) {
            setShowChatList(false);
          }
          if (item.id && MY_ID) {
            fetch(
              `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/chats/${item.id}/mark-read`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ userId: MY_ID }),
              }
            );
          }
        }}
        style={[
          styles.chatItem,
          selectedChat?.id === item.id && styles.selectedChat,
        ]}
      >
        <Image
          style={styles.avatar}
          source={buildAvatarSource(avatarPath)}
          placeholder={require("@/assets/empty-image.png")}
        />
        <View style={styles.chatInfo}>
          <View style={styles.chatHeader}>
            <Text style={styles.chatName} numberOfLines={1}>
              {(item.offerName && item.peerName) ? `${item.peerName}` : (item.peerName || "Unknown")}
            </Text>
          </View>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {item.lastMessage ||
              (item.offerDescription && item.offerName && item.offerType
                ? `${item.offerName} (${item.offerType})`
                : "No messages yet")}
          </Text>
        </View>
        <View style={styles.endBox}>
          <Text style={styles.messageTimeNew}>
            {new Date(item.updatedAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
          {/* <Text
          style={[
            isMe ? styles.myMessageTime : styles.messageTime,
            isMobile && { fontSize: 10 },
          ]}
          >
            {new Date(item.updatedAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text> */}
          {unreadCount > 0 && (
            <View style={styles.unreadDot}>
              <Text style={styles.unreadText}>
                {unreadCount > 9 ? "9+" : unreadCount}
              </Text>
            </View>
          )}
        </View>

        {isMobile && unreadCount > 0 && (
          <View style={styles.unreadDot}>
            <Text style={styles.unreadText}>
              {unreadCount > 9 ? "9+" : unreadCount}
            </Text>
          </View>
        )}
      </Pressable>
    );
  };

  const renderMessage = ({ item }: { item: any }) => {
    const SenderId = item.senderId?._id || item.senderId;
    const isMe = SenderId === MY_ID;
    const senderAvatar = getUserAvatar(SenderId);
    const senderName = getUserName(SenderId);

    return (
      <View
        style={[
          styles.messageContainer,
          isMe ? styles.myMessageContainer : styles.theirMessageContainer,
        ]}
      >
        {!isMe && (
          <Image
              source={senderAvatar}               //  ✅ just hand it over
              placeholder={require('@/assets/empty-image.png')}
              style={styles.messageAvatar}
            />
        )}

        <View style={styles.messageContent}>
          {!isMe && (
            <Pressable
              onPress={() => router.push(`/profile/${SenderId}`)}
              style={{ marginBottom: 4, marginLeft: 8 }}
            >
              {/* <Text
                style={{ fontWeight: "bold", fontSize: isMobile ? 12 : 14 }}
              >
                {senderName}
              </Text> */}
            </Pressable>
          )}

          <View
            style={[
              styles.messageBubble,
              isMe ? styles.myMessage : styles.theirMessage,
            ]}
          >
            {item.deleted ? (
              <Text
                style={[
                  styles.messageText,
                  {
                    fontStyle: "italic",
                    color: "#fff",
                    fontSize: isMobile ? 14 : 16,
                  },
                ]}
              >
                {senderName} has deleted this message
              </Text>
            ) : (
              <>
                {item.text && (
                  <Text
                    style={[
                      isMe ? styles.myMessageText : styles.messageText,
                      isMobile && { fontSize: 14 },
                    ]}
                  >
                    {renderTextWithLinks(item.text)}
                  </Text>
                )}
                {item.attachments?.map((att: any) => (
                  <View
                    key={att.id || att.url}
                    style={styles.attachmentContainer}
                  >
                    <Pressable onPress={() => handleDownload(att.url)}>
                      <Text
                        style={[
                          styles.messageText,
                          styles.attachmentBox,
                          { textDecorationLine: "underline" },
                          isMobile && { fontSize: 14 },
                          isMe ? styles.myMessageText : styles.messageText,
                        ]}
                      >
                        {att.name || "Download attachment"}
                        <Image
                          source={require("@/assets/attachment.png")}
                          style={styles.attachmentMain}
                        />
                      </Text>
                      <Text
                        style={[
                          styles.attachmentSize,
                          isMobile && { fontSize: 10 },
                        ]}
                      >
                        {Math.round((att.size / 1024) * 100) / 100} KB
                      </Text>
                    </Pressable>
                    {uploadProgress[att.id] && uploadProgress[att.id] < 100 && (
                      <Progress.Bar
                        progress={uploadProgress[att.id] / 100}
                        width={isMobile ? 150 : 200}
                        color="#3B82F6"
                      />
                    )}
                  </View>
                ))}
              </>
            )}
          </View>
          <Text
            style={[
              isMe ? styles.myMessageTime : styles.messageTime,
              isMobile && { fontSize: 10 },
            ]}
          >
            {new Date(item.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>

        {isMe && (
            <Image
              source={getUserAvatar(MY_ID)}            //  ✅ just give the final source
              placeholder={require('@/assets/empty-image.png')}
              style={styles.messageAvatar}
            />
          )}

        {/* {isMe && !item.deleted && (
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              setPopupMessageId(item._id === popupMessageId ? null : item._id);
            }}
            style={styles.messageOptions}
          >
            <Text>⋮</Text>
          </Pressable>
        )} */}

        {popupMessageId === item._id && (
          <View ref={popupRef} style={styles.popupContainer}>
            <Pressable
              style={styles.popupItem}
              onPress={async () => {
                try {
                  await fetch(
                    `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/chats/messages/${item._id}`,
                    {
                      method: "DELETE",
                      headers: {
                        "Content-Type": "application/json",
                        "X-User-Id": MY_ID,
                      },
                    }
                  );
                  setPopupMessageId(null);
                  fetchMessages();
                } catch (error) {
                  console.error("Failed to delete message:", error);
                }
              }}
            >
              <Text style={styles.popupItemText}>Delete</Text>
            </Pressable>
          </View>
        )}
      </View>
    );
  };
const peerAvatar = getUserAvatar(selectedChat?.peerId || '');
  return (
    <>
      <Header pageTitle="Messages" />
      <SafeAreaView style={{ flex: 1, marginHorizontal: 40 }}>
        <StatusBar style="auto" />
        <View style={{ flexDirection: "row", flex: 1, gap: 24, marginTop: 14 }}>
          {isLoading && isChatLoad ? (
            <View
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "#ffffff",
                justifyContent: "center",
                alignItems: "center",
                zIndex: 10,
              }}
            >
              <ActivityIndicator size="large" color={"#430b92"} />
            </View>
          ) : (
            <>
              {/* Chat List */}
              {(showChatList || !isMobile) && (
                <View
                  style={{
                    width: isDesktop ? 513 : isMobile ? "100%" : 80,
                    display: isMobile && !showChatList ? "none" : "flex",
                  }}
                >
                  {isLoading ? (
                    <ActivityIndicator
                      size="large"
                      color={"red"}
                      style={{ marginTop: 40 }}
                    />
                  ) : (
                    <>
                      <View style={[styles.header1]}>
                        <Text style={styles.title}>Messages</Text>
                        <Text style={[styles.subtitle, styles.janeDoeTypo]}>
                          All your conversations will appear here
                        </Text>
                      </View>
                      <View style={styles.searchBar1}>
                        <Search01 width={24} height={24} />
                        <TextInput
                          style={styles.searchInput}
                          placeholder="Search messages..."
                          value={searchQuery}
                          onChangeText={setSearchQuery}
                          onSubmitEditing={handleSearch}
                        />
                        {searchQuery && (
                          <Pressable
                            onPress={() => {
                              setSearchQuery("");
                              setSearchResults([]);
                            }}
                          >
                            <Text>✕</Text>
                          </Pressable>
                        )}
                      </View>
                      {searchQuery && (
                        <View style={styles.searchTabs}>
                          <Pressable
                            style={[
                              styles.searchTab,
                              activeSearchTab === "messages" &&
                                styles.activeSearchTab,
                            ]}
                            onPress={() => setActiveSearchTab("messages")}
                          >
                            <Text>Messages</Text>
                          </Pressable>
                          <Pressable
                            style={[
                              styles.searchTab,
                              activeSearchTab === "chats" &&
                                styles.activeSearchTab,
                            ]}
                            onPress={() => setActiveSearchTab("chats")}
                          >
                            <Text>Chats</Text>
                          </Pressable>
                        </View>
                      )}

                      {activeSearchTab === "chats" ? (
                        <FlatList
                          data={filteredChat}
                          renderItem={({ item }) => <ChatItem item={item} />}
                          keyExtractor={(c) => c.id}
                          style={styles.chatListContent}
                        />
                      ) : (
                        <FlatList
                          data={chats}
                          renderItem={({ item }) => <ChatItem item={item} />}
                          keyExtractor={(c) => c.id}
                          style={styles.chatListContent}
                        />
                      )}
                    </>
                  )}
                </View>
              )}
              {/* Chat Messages */}
              {isChatLoad ? (
                <View
                  style={{
                    flex: 1,
                    justifyContent: "center",
                    alignItems: "center",
                    paddingVertical: 40,
                  }}
                >
                  <ActivityIndicator size="large" color="#430b92" />
                </View>
              ) : (
                selectedChat &&
                (!isMobile || !showChatList) && (
                  <View
                    style={{
                      flex: 1,
                      position: "relative",
                      display: isMobile && showChatList ? "none" : "flex",
                    }}
                  >
                    <View style={styles.chatHeaderContainer}>
                      {isMobile && (
                        <TouchableOpacity
                          style={styles.backToChats}
                          onPress={() => setShowChatList(true)}
                        >
                          <Feather
                            name="chevron-left"
                            size={24}
                            color="#1F2937"
                          />
                          <Text style={{ marginLeft: 4, fontSize: 14 }}>
                            Back
                          </Text>
                        </TouchableOpacity>
                      )}
                      <View style={styles.userChat}>
                        <Pressable
                          onPress={() => {
                            const peerId = selectedChat.participants?.find(
                              (p) => p._id !== MY_ID
                            )?._id;
                            if (peerId) {
                              router.push(`/profile/${peerId}`);
                            }
                          }}
                          style={styles.chatHead}
                        >
                         <Image
                            style={styles.userAvtar}
                            source={peerAvatar}                              // ✅ already valid
                            placeholder={require('@/assets/empty-image.png')}
                          />
                          <View>
                            <Text
                              style={[
                                styles.chatTitle,
                                isMobile && { fontSize: 16 },
                              ]}
                            >
                              <Text>
                                {getReceiverName()}
                                {selectedChat.offerType && (
                                  <Text
                                    style={[
                                      styles.chatSubtitle,
                                      isMobile && { fontSize: 14 },
                                    ]}
                                  >
                                    {" • "}{selectedChat.offerType}
                                  </Text>
                                )}
                              </Text>
                            </Text>
                            {/* <Text style={styles.userName}>
                              @{getUserName(selectedChat?.peerId || "")}
                            </Text> */}
                            {(selectedChat.offerDescription ||
                        selectedChat.offerNotes) && (
                          <Pressable
                          onPress={() => {
                            const isDeal =
                            selectedChat.offerStatus === "Accepted";
                            const baseUrl = window.location.origin;
                            const role = user?.userType || "Creator";
                            
                            const url = isDeal
                            ? `${baseUrl}/UOM08MarketerDealHistoryList`
                              : `${baseUrl}/UOM10CreatorOfferDetails?offerId=${selectedChat?.offerId}&role=${role}`;

                            window.location.href = url;
                            }}
                            style={styles.offerLink}
                            >
                            <Text
                            style={[
                              styles.chatDescription,
                              isMobile && { fontSize: 12 },
                              ]}
                              numberOfLines={2}
                          >
                            {selectedChat.offerDescription || ""}
                            {selectedChat.offerDescription && selectedChat.offerNotes ? " • " : ""}
                            {selectedChat.offerNotes || ""}
                          </Text>
                        </Pressable>
                        )}
                          </View>
                          <View style={styles.activeUser}></View>
                        </Pressable>
                        <Pressable>
                          <Image
                            source={require("@/assets/more.png")}
                            style={styles.moreBtn}
                          />
                        </Pressable>
                      </View>
                    </View>

                    {/* message showsn */}
                    <FlatList
                      data={searchResults.length > 0 ? searchResults : messages}
                      renderItem={renderMessage}
                      keyExtractor={(m) => m._id}
                      inverted={searchResults.length === 0}
                      contentContainerStyle={styles.messagesList}
                      onEndReached={async () => {
                        if (
                          !loadingOlderMessages &&
                          hasMoreMessages &&
                          messages.length > 0 &&
                          searchResults.length === 0
                        ) {
                          setLoadingOlderMessages(true);
                          try {
                            const oldestMessage = messages[messages.length - 1];
                            const newMessages = await fetchMore(
                              oldestMessage.createdAt
                            );
                            if (newMessages.length === 0) {
                              setHasMoreMessages(false);
                            }
                          } finally {
                            setLoadingOlderMessages(false);
                          }
                        }
                      }}
                      onEndReachedThreshold={0.5}
                      ListFooterComponent={
                        loadingOlderMessages ? (
                          <View style={styles.loadingMore}>
                            <Text>Loading older messages...</Text>
                          </View>
                        ) : null
                      }
                      ListEmptyComponent={
                        searchResults.length === 0 && isSearching ? (
                          <Text>Searching...</Text>
                        ) : null
                      }
                    />

                    {isChattingAllowed(selectedChat) ? (
                      <View
                        style={{
                          flexDirection: "column",
                          alignItems: "center",
                          padding: 8,
                          marginTop: 9,
                        }}
                      >
                        {/* Attachment & Emoji Inputs Row */}
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            width: "100%",
                            paddingHorizontal: 4,
                            position: "relative",
                          }}
                        >
                          <div
                            {...getRootProps()}
                            style={{
                              cursor: "pointer",
                              display: "inline-block",
                              marginRight: 8,
                            }}
                          >
                            <input {...getInputProps()} />
                            <Image
                              source={require("@/assets/attachment.png")}
                              style={styles.attachmentBtn}
                            />
                          </div>
                          <Pressable
                            onPress={() => {
                              setShowEmoji((v) => !v);
                              // Close keyboard if open to prevent overlap
                              if (Platform.OS === "web") {
                                const activeElement =
                                  document.activeElement as HTMLElement;
                                if (activeElement && activeElement.blur) {
                                  activeElement.blur();
                                }
                              }
                            }}
                            style={{ marginRight: 8 }}
                          >
                            <Text style={{ fontSize: 20 }}>
                              {showEmoji ? "🙂" : "😀"}
                            </Text>
                          </Pressable>

                          <View style={{ flex: 1 }}>
                            <TextInput
                              style={[
                                styles.input,
                                styles.msgInput,
                                validationError.type && styles.inputError,
                                isMobile && { fontSize: 14 },
                              ]}
                              multiline
                              value={message}
                              onChangeText={handleMessageChange}
                              placeholder="Type your message here"
                              onSubmitEditing={handleSend}
                              returnKeyType="send"
                              blurOnSubmit={false}
                              onKeyPress={(e) => {
                                if (e.nativeEvent.key === "Enter") {
                                  handleSend(); // Trigger the send action when Enter is pressed
                                }
                              }}
                            />
                          </View>
                          <Pressable
                            disabled={!message.trim()}
                            onPress={handleSend}
                            style={[
                              styles.sendButton,
                              { opacity: message.trim() ? 1 : 0.4 },
                              isMobile && {
                                paddingHorizontal: 12,
                                paddingVertical: 6,
                              },
                            ]}
                          >
                            {/* <Text
                        style={[
                          styles.sendButtonText,
                          isMobile && { fontSize: 14 },
                        ]}
                      > */}
                            <Image
                              source={require("@/assets/send.png")}
                              style={styles.shareBtn}
                            />
                            {/* </Text> */}
                          </Pressable>
                        </View>

                        {/* Progress Bars Below Input */}
                        {Object.keys(uploadProgress).length > 0 && (
                          <View style={{ width: "100%", marginTop: 8 }}>
                            {Object.entries(uploadProgress).map(
                              ([key, progress]) => (
                                <View
                                  key={key}
                                  style={{
                                    marginVertical: 4,
                                    alignItems: "center",
                                  }}
                                >
                                  <Progress.Bar
                                    progress={progress / 100}
                                    width={isDesktop ? 400 : width - 40}
                                    color="#3B82F6"
                                  />
                                  <Text
                                    style={{
                                      fontSize: isMobile ? 10 : 12,
                                      color: "#6B7280",
                                      marginTop: 4,
                                    }}
                                  >
                                    Uploading {key.includes("-") ? key.split("-")[0] : key} ({progress}%)
                                  </Text>
                                </View>
                              )
                            )}
                          </View>
                        )}
                      </View>
                    ) : (
                      <View
                        style={{
                          padding: 16,
                          backgroundColor: "#F0E7FD",
                          alignItems: "center",
                        }}
                      >
                        <Text
                          style={{
                            color: "#6B7280",
                            textAlign: "center",
                            fontSize: isMobile ? 12 : 14,
                          }}
                        >
                          Chatting is not available for this offer until it's
                          accepted
                        </Text>
                      </View>
                    )}

                    {showEmoji && isChattingAllowed(selectedChat) && (
                      <View style={styles.emojiPickerContainer}>
                        <div
                          ref={emojiPickerRef}
                          style={{
                            position: "relative",
                            zIndex: 1000,
                          }}
                        >
                          <Picker
                            data={data}
                            onEmojiSelect={(e: any) => {
                              setMessage((prev) => prev + e.native);
                              // setShowEmoji(false);
                            }}
                            theme="light"
                            onClickOutside={() => setShowEmoji(false)}
                          />
                        </div>
                      </View>
                    )}
                  </View>
                )
              )}
            </>
          )}
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  messageContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
    width: "100%",
    gap: 16,
  },

  // emojiPickerContainer: {
  //   position: 'absolute',
  //   bottom: 60, // Adjust this value based on your input height
  //   right: 16,
  //   zIndex: 1000,
  //   elevation: 1000, // For Android
  //     //     //     //     // },
  placeholder: {},
  chatListContainer: {
    width: "100%",
    height: "100%",
    overflow: "hidden",
    paddingHorizontal: isDesktop ? 40 : 6,
  },
  chatListContent: {
    flex: 1,
    overflow: "scroll",
  },
  searchTabs: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  searchTab: {
    flex: 1,
    padding: 12,
    alignItems: "center",
  },
  offerLink: {},
  backToChats: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  attachmentContainer: {
    marginBottom: 8,
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: "#E5E7EB",
    borderRadius: 2,
    marginTop: 4,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#3B82F6",
  },
  activeSearchTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#3B82F6",
  },
  myMessageContainer: {
    justifyContent: "flex-end",
  },
  theirMessageContainer: {
    justifyContent: "flex-start",
  },
  messageContent: {
    flex: 1,
    maxWidth: "80%",
  },
  senderName: {
    fontWeight: "bold",
    fontSize: 14,
    marginBottom: 4,
    marginLeft: 8,
  },
  messageOptions: {
    padding: 4,
    marginLeft: 8,
  },
  inputError: {
    borderWidth: 1,
    borderColor: "#EF4444",
  },
  errorText: {
    color: "#EF4444",
    fontSize: 12,
    marginTop: 4,
    marginLeft: 8,
  },
  popupContainer: {
    position: "absolute",
    right: 0,
    top: "90%",
    backgroundColor: "white",
    borderRadius: 8,
    padding: 8,
    boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
    elevation: 3,
    zIndex: 100,
  },
  sendButton: {
    backgroundColor: "#430B92",
    borderRadius: 20,
    marginLeft: 8,
    width: 32,
    height: 32,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  loadingMore: {
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  popupItem: {
    padding: 8,
  },
  popupItemText: {
    fontSize: 14,
    color: "#1F2937",
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
    marginBottom: 4,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    marginHorizontal: "5%",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000000",
    textAlign: "center",
    fontFamily: Platform.select({
      ios: "SF Pro Display",
      android: "Roboto",
      default: "System",
    }),
  },
  searchContainer: {
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    flexDirection: "row",
    alignItems: "center",
  },
  myMessage: {
    backgroundColor: "#430B92",
    borderBottomRightRadius: 4,
    alignSelf: "flex-end",
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  theirMessage: {
    backgroundColor: "#F0E7FD",
    borderBottomLeftRadius: 4,
    alignSelf: "flex-start",
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  messagesList: {
    paddingVertical: 16,
    flexGrow: 1,
    justifyContent: "flex-end",
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 20,
  },
  input: {
    flex: 1,
    alignContent: "center",
    padding: 8,
    backgroundColor: "#f3f3f3",
    borderRadius: 16,
  },
  chatItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 15,
    borderRadius: 12,
  },
  selectedChat: {
    backgroundColor: "#F0E7FD",
  },
  avatar: {
    width: 67,
    height: 67,
    borderRadius: 50,
  },
  chatInfo: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  chatName: {
    fontSize: 20,
    fontWeight: "600",
    color: "#0B0218",
  },
  chatTime: {
    fontSize: 12,
    color: "#6B7280",
  },
  lastMessage: {
    fontSize: 18,
    color: "#938f99",
    flex: 1,
    marginRight: 8,
  },
  unreadDot: {
    backgroundColor: "#EF4444",
    borderRadius: 10,
    minWidth: 16,
    width: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  endBox: {
    height: "100%",
    gap: 14,
    alignItems: "end",
  },
  unreadText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  messageText: {
    fontSize: 15,
    color: "#281D1B",
    marginBottom: 4,
    fontFamily: FontFamily.inter,
  },
  myMessageText: {
    fontSize: 16,
    color: "#fff",
    marginBottom: 4,
    fontFamily: FontFamily.inter,
  },
  messageTimeNew: {
    fontSize: 18,
    fontWeight: 600,
    color: "#6B7280",
    alignSelf: "flex-end",
  },
  messageTime: {
    fontSize: 13,
    fontWeight: 600,
    color: "#6B7280",
  },
  myMessageTime: {
    fontSize: 13,
    fontWeight: 600,
    color: "#6B7280",
    alignSelf: "flex-end",
  },
  attachment: {
    marginBottom: 4,
  },
  attachmentSize: {
    fontSize: 12,
    color: "#6B7280",
  },
  // chatHeaderContainer: {
  //   padding: 16,
  //   borderBottomWidth: 1,
  //   borderBottomColor: "#E5E7EB",
  // },
  chatTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: "#1F2937",
  },
  chatSubtitle: {
    fontSize: 16,
    fontWeight: "400",
    color: "#6B7280",
  },
  chatDescription: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 4,
  },
  emojiPickerContainer: {
    position: "absolute",
    bottom: 80,
    left: 16,
    zIndex: 1000,
    backgroundColor: "white",
    borderRadius: 8,
    overflow: "hidden",
  },
  header1: {
    marginBottom: 26,
  },
  title: {
    fontSize: 32,
    fontFamily: "Degular",
    fontWeight: "600",
    // color: Color.cSK430B92950,
  },
  subtitle: {
    opacity: 0.5,
    fontSize: 20,
    fontFamily: FontFamily.inter,
  },
  searchBar1: {
    borderColor: "rgba(11, 2, 24, 0.4)",
    borderWidth: 1,
    height: 48,
    borderStyle: "solid",
    alignSelf: "stretch",
    gap: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    flexDirection: "row",
    marginBottom: 12,
  },
  searchText: {
    fontSize: 18,
    opacity: 0.5,
    textAlign: "center",
    color: "#0B0218",
  },
  searchInput: {
    color: "#0B0218",
    width: "100%",
    fontFamily: FontFamily.inter,
    fontSize: 18,
    placeholderTextColor: "#0b021880",
  },
  userAvtar: {
    width: 67,
    height: 67,
    borderRadius:50,
  },
  chatHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },
  userName: {
    color: "#0B0218",
    fontSize: 18,
    fontFamily: FontFamily.inter,
    marginTop: 4,
    opacity: 0.5,
  },
  activeUser: {
    width: 12,
    height: 12,
    backgroundColor: "#1ABC1A",
    borderRadius: 50,
  },
  moreBtn: {
    width: 24,
    height: 24,
  },
  userChat: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  attachmentBtn: {
    width: 24,
    height: 24,
  },
  shareBtn: {
    width: 16,
    height: 16,
  },
  msgInput: {
    backgroundColor: "transparent",
    placeholderTextColor: "#85808B",
    color: "#0B0218",
    fontFamily: FontFamily.inter,
    fontSize: 15,
  },
  attachmentBox: {
    display: "flex",
    alignItems: "center",
    gap: 4,
  },
  attachmentMain: {
    width: 16,
    height: 16,
  },
});