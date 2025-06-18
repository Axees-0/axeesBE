import React from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { Color } from '@/GlobalStyles';

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: any;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style,
}) => {
  const animatedValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 1500,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    animation.start();

    return () => animation.stop();
  }, []);

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['-100%', '100%'],
  });

  return (
    <View
      style={[
        styles.container,
        {
          width,
          height,
          borderRadius,
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.shimmer,
          {
            transform: [{ translateX }],
          },
        ]}
      />
    </View>
  );
};

export const UserCardSkeleton = () => {
  return (
    <View style={styles.cardContainer}>
      <SkeletonLoader width={131} height={131} borderRadius={20} />
      <View style={styles.contentContainer}>
        <SkeletonLoader width="60%" height={24} />
        <SkeletonLoader width="40%" height={20} style={{ marginTop: 8 }} />
        <SkeletonLoader width="30%" height={20} style={{ marginTop: 8 }} />
        <View style={styles.platformsContainer}>
          <SkeletonLoader width={37} height={37} borderRadius={18.5} />
          <SkeletonLoader width={37} height={37} borderRadius={18.5} />
          <SkeletonLoader width={37} height={37} borderRadius={18.5} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#E1E9EE',
    overflow: 'hidden',
    position: 'relative',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    transform: [{ skewX: '-20deg' }],
  },
  cardContainer: {
    backgroundColor: Color.buttonSelectable,
    borderRadius: 40,
    padding: 20,
    width: '30%',
    marginBottom: 40,
    gap: 20,
  },
  contentContainer: {
    width: '100%',
    gap: 10,
  },
  platformsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
}); 