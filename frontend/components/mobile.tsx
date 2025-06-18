import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Color } from '@/GlobalStyles';

const Mobile = () => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Explore Creators & Influencers</Text>
        <Text style={styles.subtitle}>Discover amazing partnerships</Text>
      </View>
      
      <View style={styles.searchBar}>
        <Text style={styles.searchText}>🔍 Search creators...</Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Featured Creators</Text>
        
        <View style={styles.creatorCard}>
          <Text style={styles.creatorName}>Emma Thompson</Text>
          <Text style={styles.creatorStats}>@emmastyle • 156K followers</Text>
          <Text style={styles.creatorBio}>Fashion & Lifestyle Creator</Text>
        </View>
        
        <View style={styles.creatorCard}>
          <Text style={styles.creatorName}>Marcus Johnson</Text>
          <Text style={styles.creatorStats}>@techmarc • 234K followers</Text>
          <Text style={styles.creatorBio}>Tech Reviewer & Smart Home Expert</Text>
        </View>
        
        <View style={styles.creatorCard}>
          <Text style={styles.creatorName}>Sofia Rodriguez</Text>
          <Text style={styles.creatorStats}>@sofiafit • 189K followers</Text>
          <Text style={styles.creatorBio}>Fitness Coach & Wellness Advocate</Text>
        </View>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Browse by Category</Text>
        <View style={styles.categories}>
          <View style={styles.categoryChip}>
            <Text style={styles.categoryText}>Fashion</Text>
          </View>
          <View style={styles.categoryChip}>
            <Text style={styles.categoryText}>Technology</Text>
          </View>
          <View style={styles.categoryChip}>
            <Text style={styles.categoryText}>Fitness</Text>
          </View>
          <View style={styles.categoryChip}>
            <Text style={styles.categoryText}>Food</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Color.cSK430B92500,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  searchBar: {
    margin: 16,
    padding: 16,
    backgroundColor: 'white',
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
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  creatorCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  creatorName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  creatorStats: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  creatorBio: {
    fontSize: 14,
    color: '#555',
  },
  categories: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    backgroundColor: Color.cSK430B92500,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  categoryText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default Mobile;