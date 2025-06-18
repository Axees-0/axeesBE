// useAvatarSource.tsx
import { useEffect, useState } from "react";
import { Image as RNImage } from "react-native";

const fallback = require("@/assets/empty-image.png");

export const useAvatarSource = (avatarUrl?: string): { uri: string } | number => {
  const [source, setSource] = useState<{ uri: string } | number>(fallback);

  useEffect(() => {
    if (!avatarUrl) {
      setSource(fallback);
      return;
    }

    let fullUrl = "";

    if (avatarUrl.includes("/uploads/")) {
      fullUrl = process.env.EXPO_PUBLIC_BACKEND_URL + avatarUrl;
    } else if (avatarUrl.startsWith("http")) {
      fullUrl = avatarUrl;
    }

    if (!fullUrl) {
      setSource(fallback);
      return;
    }

    RNImage.prefetch(fullUrl)
      .then((success: boolean) => {
        if (success) {
          setSource({ uri: fullUrl });
        } else {
          setSource(fallback);
        }
      })
      .catch(() => {
        setSource(fallback);
      });
  }, [avatarUrl]);

  return source;
};
