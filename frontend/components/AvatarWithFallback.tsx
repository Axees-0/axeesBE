import React, { useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { Color } from '@/GlobalStyles';

interface AvatarWithFallbackProps {
  source?: string;
  name?: string;
  size?: number;
  style?: any;
  accessibilityLabel?: string;
}

export const AvatarWithFallback: React.FC<AvatarWithFallbackProps> = ({
  source,
  name = 'User',
  size = 60,
  style,
  accessibilityLabel,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Generate initials from name
  const getInitials = (fullName: string) => {
    const names = fullName.trim().split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return fullName.substring(0, 2).toUpperCase();
  };

  // Generate consistent color from name
  const getAvatarColor = (name: string) => {
    const colors = [
      '#7C3AED', // Purple
      '#3B82F6', // Blue
      '#10B981', // Green
      '#F59E0B', // Amber
      '#EF4444', // Red
      '#8B5CF6', // Violet
      '#EC4899', // Pink
      '#14B8A6', // Teal
    ];
    
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  };

  const initials = getInitials(name);
  const bgColor = getAvatarColor(name);

  if (error || !source) {
    // Show initials fallback
    return (
      <View 
        style={[
          styles.initialsContainer,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: bgColor,
          },
          style,
        ]}
        accessible={true}
        accessibilityRole="image"
        accessibilityLabel={accessibilityLabel || `${name}'s profile picture`}
      >
        <Text 
          style={[
            styles.initials,
            { fontSize: size * 0.4 }
          ]}
        >
          {initials}
        </Text>
      </View>
    );
  }

  return (
    <View 
      style={[{ width: size, height: size }, style]}
      accessible={true}
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel || `${name}'s profile picture`}
    >
      {loading && (
        <View style={[styles.loadingContainer, { borderRadius: size / 2 }]}>
          <ActivityIndicator size="small" color={Color.cSK430B92500} />
        </View>
      )}
      
      <Image
        source={{ uri: source }}
        style={[
          styles.image,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            opacity: loading ? 0 : 1,
          },
        ]}
        contentFit="cover"
        transition={200}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setError(true);
        }}
        alt={accessibilityLabel || `${name}'s profile picture`}
        accessibilityLabel={accessibilityLabel || `${name}'s profile picture`}
      />
    </View>
  );
};

// Avatar group component for showing multiple avatars
export const AvatarGroup: React.FC<{
  avatars: Array<{ source?: string; name: string }>;
  size?: number;
  max?: number;
}> = ({ avatars, size = 40, max = 3 }) => {
  const displayAvatars = avatars.slice(0, max);
  const remaining = avatars.length - max;

  return (
    <View style={styles.avatarGroup}>
      {displayAvatars.map((avatar, index) => (
        <View
          key={index}
          style={[
            styles.avatarGroupItem,
            {
              marginLeft: index > 0 ? -(size * 0.3) : 0,
              zIndex: displayAvatars.length - index,
            },
          ]}
        >
          <AvatarWithFallback
            source={avatar.source}
            name={avatar.name}
            size={size}
            style={styles.avatarGroupBorder}
            accessibilityLabel={`${avatar.name}'s profile picture`}
          />
        </View>
      ))}
      
      {remaining > 0 && (
        <View
          style={[
            styles.avatarGroupItem,
            styles.remainingContainer,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              marginLeft: -(size * 0.3),
              zIndex: 0,
            },
          ]}
          accessible={true}
          accessibilityRole="text"
          accessibilityLabel={`${remaining} more member${remaining > 1 ? 's' : ''}`}
        >
          <Text style={styles.remainingText}>+{remaining}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  initialsContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    color: '#FFFFFF',
    fontFamily: 'interSemiBold',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    backgroundColor: '#F3F4F6',
  },
  // Avatar group styles
  avatarGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarGroupItem: {
    position: 'relative',
  },
  avatarGroupBorder: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  remainingContainer: {
    backgroundColor: Color.cSK430B92500,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  remainingText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'interMedium',
  },
});

export default AvatarWithFallback;