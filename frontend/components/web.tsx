import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Color } from '@/GlobalStyles';

const Web = () => {
  return (
    <View style={styles.container}>
      <View style={styles.sidebar}>
        <Text style={styles.sidebarTitle}>Filters</Text>
        <Text style={styles.filterItem}>✓ Fashion</Text>
        <Text style={styles.filterItem}>✓ Technology</Text>
        <Text style={styles.filterItem}>✓ Fitness</Text>
        <Text style={styles.filterItem}>✓ Lifestyle</Text>
      </View>
      
      <ScrollView style={styles.mainContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Explore Creators & Influencers</Text>
          <Text style={styles.subtitle}>Connect with top creators for your brand campaigns</Text>
        </View>
        
        <View style={styles.searchSection}>
          <View style={styles.searchBar}>
            <Text style={styles.searchText}>🔍 Search by name, category, or keyword...</Text>
          </View>
        </View>
        
        <View style={styles.creatorsGrid}>
          {/* Creator 1 */}
          <View style={styles.creatorCard}>
            <View style={styles.creatorAvatar}>
              <Text style={styles.avatarText}>ET</Text>
            </View>
            <Text style={styles.creatorName}>Emma Thompson</Text>
            <Text style={styles.creatorHandle}>@emmastyle</Text>
            <Text style={styles.creatorStats}>156K followers • 8.9% engagement</Text>
            <Text style={styles.creatorBio}>Fashion & Lifestyle Creator | Sustainable Fashion Advocate</Text>
            <View style={styles.creatorTags}>
              <Text style={styles.tag}>Fashion</Text>
              <Text style={styles.tag}>Lifestyle</Text>
            </View>
          </View>
          
          {/* Creator 2 */}
          <View style={styles.creatorCard}>
            <View style={styles.creatorAvatar}>
              <Text style={styles.avatarText}>MJ</Text>
            </View>
            <Text style={styles.creatorName}>Marcus Johnson</Text>
            <Text style={styles.creatorHandle}>@techmarc</Text>
            <Text style={styles.creatorStats}>234K followers • 7.2% engagement</Text>
            <Text style={styles.creatorBio}>Tech Reviewer | Smart Home Enthusiast | Future Tech Explorer</Text>
            <View style={styles.creatorTags}>
              <Text style={styles.tag}>Technology</Text>
              <Text style={styles.tag}>Reviews</Text>
            </View>
          </View>
          
          {/* Creator 3 */}
          <View style={styles.creatorCard}>
            <View style={styles.creatorAvatar}>
              <Text style={styles.avatarText}>SR</Text>
            </View>
            <Text style={styles.creatorName}>Sofia Rodriguez</Text>
            <Text style={styles.creatorHandle}>@sofiafit</Text>
            <Text style={styles.creatorStats}>189K followers • 9.8% engagement</Text>
            <Text style={styles.creatorBio}>Certified Personal Trainer | Nutrition Coach | Wellness Advocate</Text>
            <View style={styles.creatorTags}>
              <Text style={styles.tag}>Fitness</Text>
              <Text style={styles.tag}>Health</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
  },
  sidebar: {
    width: 250,
    backgroundColor: 'white',
    padding: 20,
    borderRightWidth: 1,
    borderRightColor: '#e0e0e0',
  },
  sidebarTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  filterItem: {
    fontSize: 14,
    color: '#555',
    paddingVertical: 8,
  },
  mainContent: {
    flex: 1,
    padding: 24,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Color.cSK430B92500,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
  },
  searchSection: {
    marginBottom: 24,
  },
  searchBar: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  searchText: {
    fontSize: 16,
    color: '#999',
  },
  creatorsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
  },
  creatorCard: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 16,
    width: 350,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  creatorAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Color.cSK430B92500,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  creatorName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  creatorHandle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  creatorStats: {
    fontSize: 14,
    color: '#888',
    marginBottom: 12,
  },
  creatorBio: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    marginBottom: 16,
  },
  creatorTags: {
    flexDirection: 'row',
    gap: 8,
  },
  tag: {
    backgroundColor: '#e7f3ff',
    color: '#007bff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    fontSize: 12,
    fontWeight: '600',
  },
});

export default Web;