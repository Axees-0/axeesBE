import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  SafeAreaView,
  FlatList,
  Image,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useChat } from "@/hooks/useChat";
import { isMessageAllowed } from "@/utils/contentFilter";
import * as DocumentPicker from "expo-document-picker";
import { Picker } from "emoji-mart-native";
import { Audio } from "expo-av";
import { useAuth } from "@/contexts/AuthContext";
import WebBottomTabs from "@/components/WebBottomTabs";

interface ChatRoomPreview {
  id: string;
  name: string;
  avatar: string;
  peerId: string;
  lastMessage?: string;
  unread?: number;
}

const BREAKPOINTS = { TABLET: 768, DESKTOP: 1280 } as const;

export default function MessagesScreen() {
  const window = useWindowDimensions();
  const isWide = window.width >= BREAKPOINTS.TABLET;
  const [chats, setChats] = useState<ChatRoomPreview[]>([]);
  const [selectedChat, setSelectedChat] = useState<ChatRoomPreview | null>(
    null
  );
  const [message, setMessage] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  // const soundRef = useRef<Audio.Sound | null>(null);
  const { user } = useAuth();
  const MY_ID = user?._id;

  const { messages, send } = useChat(selectedChat?.id || "", MY_ID || "");
  // Load notification sound
  // useEffect(() => {
  //   const loadSound = async () => {
  //     const { sound } = await Audio.Sound.createAsync(
  //       require('@/assets/sounds/messages.wav')
  //     );
  //     soundRef.current = sound;
  //   };
  //   loadSound();

  //   return () => {
  //     if (soundRef.current) {
  //       soundRef.current.unloadAsync();
  //     }
  //   };
  // }, []);

  // Fetch chat list
  useEffect(() => {
    const fetchChats = async () => {
      try {
        const res = await fetch(
          `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/chats?userId=${MY_ID}`
        );
        const data = await res.json();

        const formattedChats = data.map((chat: any) => ({
          id: chat._id,
          name: chat.participants.find((p: string) => p !== MY_ID) || "Unknown",
          avatar:
            "https://i.pravatar.cc/150?u=" +
            chat.participants.find((p: string) => p !== MY_ID),
          peerId: chat.participants.find((p: string) => p !== MY_ID),
          lastMessage: chat.lastMessage?.text || "",
          unread: chat.unreadCount?.[MY_ID] || 0,
        }));

        setChats(formattedChats);
        if (formattedChats.length > 0 && !selectedChat) {
          setSelectedChat(formattedChats[0]);
        }
      } catch (error) {
        console.error("Failed to fetch chats:", error);
      }
    };

    fetchChats();
  }, []);

  // Play sound on new message
  useEffect(() => {
    // if (messages.length > 0 && soundRef.current) {
    //   soundRef.current.replayAsync();
    // }
  }, [messages]);

  const handleSend = async (opts: { attachments?: any[] } = {}) => {
    if (!message.trim() && !opts.attachments?.length) return;
    if (message && !isMessageAllowed(message)) {
      alert("Message contains blocked content");
      return;
    }

    try {
      await send({
        text: message || undefined,
        attachments: opts.attachments,
        receiverId: selectedChat!.peerId,
      });
      setMessage("");
      setShowEmoji(false);
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const pickAttachment = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({ multiple: true });
      if (res.canceled) return;

      const files = res.assets.map((a) => ({
        uri: a.uri,
        name: a.name,
        type: a.mimeType || "application/octet-stream",
        size: a.size || 0,
      }));

      await handleSend({ attachments: files });
    } catch (error) {
      console.error("Failed to pick attachment:", error);
    }
  };

  const ChatListItem = ({ item }: { item: ChatRoomPreview }) => (
    <Pressable
      onPress={() => setSelectedChat(item)}
      style={[
        styles.chatItem,
        selectedChat?.id === item.id && styles.selectedChat,
      ]}
    >
      <Image source={{ uri: item.avatar }} style={styles.avatar} />
      <View style={styles.chatInfo}>
        <View style={styles.chatHeader}>
          <Text style={styles.chatName}>{item.name}</Text>
          <Text style={styles.chatTime}>
            {item?.lastMessage?.substring(0, 20)}
            {item?.lastMessage?.length > 20 ? "..." : ""}
          </Text>
        </View>
        <Text style={styles.lastMessage} numberOfLines={1}>
          {item.lastMessage}
        </Text>
      </View>
      {item.unread ? (
        <View style={styles.unreadDot}>
          <Text style={styles.unreadText}>{item.unread}</Text>
        </View>
      ) : null}
    </Pressable>
  );

  const renderMessage = ({ item }: { item: any }) => {
    const isMe = item.senderId === MY_ID;
    return (
      <View
        style={[
          styles.messageBubble,
          isMe ? styles.myMessage : styles.theirMessage,
        ]}
      >
        {item.text && (
          <Text style={isMe ? styles.myMessageText : styles.messageText}>
            {item.text}
          </Text>
        )}
        {item.attachments?.map((att: any) => (
          <Pressable key={att.url} onPress={() => {}}>
            <Text
              style={[styles.messageText, { textDecorationLine: "underline" }]}
            >
              {att.name}
            </Text>
          </Pressable>
        ))}
        <Text style={isMe ? styles.myMessageTime : styles.messageTime}>
          {new Date(item.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      </View>
    );
  };

  return (
    <>
      <SafeAreaView style={styles.container}>
        <StatusBar style="auto" />
        <View style={[styles.content, isWide && styles.webContent]}>
          {/* Chat List */}
          <View style={[styles.chatList, isWide && styles.webChatList]}>
            <FlatList
              data={chats}
              renderItem={ChatListItem}
              keyExtractor={(c) => c.id}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          </View>

          {/* Messages */}
          {selectedChat ? (
            <View style={styles.chatContainer}>
              <View style={styles.chatHeader}>
                <Image
                  source={{ uri: selectedChat.avatar }}
                  style={styles.chatAvatar}
                />
                <Text style={styles.chatHeaderName}>{selectedChat.name}</Text>
              </View>

              <FlatList
                data={[...messages].reverse()} // Reverse the array to show newest at bottom
                renderItem={renderMessage}
                keyExtractor={(m) => m._id}
                contentContainerStyle={styles.messagesList}
                style={styles.messagesContainer}
              />

              <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
                style={styles.inputContainer}
              >
                {showEmoji && (
                  <Picker
                    onEmojiSelected={(e: any) =>
                      setMessage((p) => p + e.native)
                    }
                    theme="light"
                    style={styles.emojiPicker}
                  />
                )}
                <View style={styles.inputRow}>
                  <TouchableOpacity
                    onPress={pickAttachment}
                    style={styles.iconButton}
                  >
                    <Text style={styles.iconText}>📎</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setShowEmoji((v) => !v)}
                    style={styles.iconButton}
                  >
                    <Text style={styles.iconText}>😀</Text>
                  </TouchableOpacity>
                  <TextInput
                    style={styles.input}
                    multiline
                    placeholder="Type a message..."
                    value={message}
                    onChangeText={setMessage}
                    onSubmitEditing={() => handleSend()}
                  />
                  <TouchableOpacity
                    disabled={!message.trim()}
                    onPress={() => handleSend()}
                    style={[
                      styles.sendButton,
                      !message.trim() && styles.sendButtonDisabled,
                    ]}
                  >
                    <Text style={styles.sendButtonText}>Send</Text>
                  </TouchableOpacity>
                </View>
              </KeyboardAvoidingView>
            </View>
          ) : (
            <View style={styles.emptyChat}>
              <Text style={styles.emptyText}>
                Select a chat to start messaging
              </Text>
            </View>
          )}
        </View>
      </SafeAreaView>
   */}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  content: {
    flex: 1,
  },
  webContent: {
    flexDirection: "row",
  },
  chatList: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: "#E5E7EB",
  },
  webChatList: {
    width: 320,
  },
  chatItem: {
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  selectedChat: {
    backgroundColor: "#F3F4F6",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
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
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  chatTime: {
    fontSize: 12,
    color: "#6B7280",
  },
  lastMessage: {
    fontSize: 14,
    color: "#6B7280",
  },
  unreadDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#EF4444",
    justifyContent: "center",
    alignItems: "center",
  },
  unreadText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  separator: {
    height: 1,
    backgroundColor: "#E5E7EB",
  },
  chatContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  // chatHeader: {
  //   flexDirection: "row",
  //   alignItems: "center",
  //   padding: 16,
  //   borderBottomWidth: 1,
  //   borderBottomColor: "#E5E7EB",
  // },
  chatAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  chatHeaderName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  messagesList: {
    paddingBottom: 16,
  },
  messageBubble: {
    maxWidth: "80%",
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
  },
  myMessage: {
    backgroundColor: "#4F46E5",
    alignSelf: "flex-end",
    borderBottomRightRadius: 4,
  },
  theirMessage: {
    backgroundColor: "#F3F4F6",
    alignSelf: "flex-start",
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    color: "#111827",
  },
  myMessageText: {
    color: "#FFFFFF",
  },
  messageTime: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
  },
  myMessageTime: {
    color: "rgba(255, 255, 255, 0.8)",
  },
  inputContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconButton: {
    padding: 8,
    marginRight: 8,
  },
  iconText: {
    fontSize: 20,
  },
  input: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: "#4F46E5",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    marginLeft: 8,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  emojiPicker: {
    position: "absolute",
    bottom: 60,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  emptyChat: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
  },
  emptyText: {
    fontSize: 16,
    color: "#6B7280",
  },
});
