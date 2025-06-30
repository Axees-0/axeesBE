import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  Alert,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Color } from '@/GlobalStyles';
import { WebSEO } from '../web-seo';
import WebBottomTabs from '@/components/WebBottomTabs';
import { UniversalBackButton } from '@/components/UniversalBackButton';
import { useAuth } from '@/contexts/AuthContext';

interface User {
  id: string;
  name: string;
  email: string;
  userType: 'creator' | 'marketer';
  isActive: boolean;
  registrationDate: string;
  lastActiveDate: string;
  completedDeals: number;
  totalSpent?: number;
  totalEarnings?: number;
  followers?: number;
  engagementRate?: number;
  company?: string;
}

interface UsersResponse {
  users: User[];
  totalUsers: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

const AdminUsersPage: React.FC = () => {
  const isWeb = Platform.OS === 'web';
  const { user } = useAuth();
  
  const [usersData, setUsersData] = useState<UsersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'creator' | 'marketer'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role !== 'admin') {
      Alert.alert('Access Denied', 'You do not have permission to access this page.');
      router.replace('/');
      return;
    }
    
    fetchUsers();
  }, [user, currentPage, filterType, filterStatus, searchQuery]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        ...(filterType !== 'all' && { userType: filterType }),
        ...(filterStatus !== 'all' && { isActive: filterStatus === 'active' ? 'true' : 'false' }),
        ...(searchQuery && { search: searchQuery }),
      });

      const response = await fetch(`/api/admin/users?${params}`, {
        headers: { 'Authorization': `Bearer ${user?.token || ''}` }
      });

      const result = await response.json();

      if (result.success) {
        setUsersData(result.data);
      } else {
        Alert.alert('Error', result.message || 'Failed to load users');
      }

    } catch (error) {
      console.error('Error fetching users:', error);
      Alert.alert('Error', 'Failed to load users. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  const handleUserStatusToggle = async (userId: string, currentStatus: boolean) => {
    const action = currentStatus ? 'suspend' : 'activate';
    const actionText = currentStatus ? 'Suspend' : 'Activate';
    
    Alert.alert(
      `${actionText} User`,
      `Are you sure you want to ${action} this user?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: actionText, 
          style: currentStatus ? 'destructive' : 'default',
          onPress: async () => {
            setLoadingAction(userId);
            
            try {
              const response = await fetch(`/api/admin/users/${userId}/status`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${user?.token || ''}`,
                },
                body: JSON.stringify({
                  isActive: !currentStatus,
                  reason: `${actionText}d by admin`
                }),
              });

              const result = await response.json();

              if (result.success) {
                Alert.alert('Success', `User ${action}d successfully`);
                fetchUsers(); // Refresh the list
              } else {
                Alert.alert('Error', result.message || `Failed to ${action} user`);
              }
            } catch (error) {
              console.error(`Error ${action}ing user:`, error);
              Alert.alert('Error', `Failed to ${action} user. Please try again.`);
            } finally {
              setLoadingAction(null);
            }
          }
        }
      ]
    );
  };

  const handleViewUserDetails = (userId: string) => {
    router.push({
      pathname: '/admin/user-details',
      params: { userId }
    });
  };

  const getUserStatusColor = (isActive: boolean) => {
    return isActive ? '#10B981' : '#EF4444';
  };

  const getUserTypeColor = (userType: string) => {
    return userType === 'creator' ? Color.cSK430B92500 : '#3B82F6';
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleFilterChange = (type: 'type' | 'status', value: any) => {
    if (type === 'type') {
      setFilterType(value);
    } else {
      setFilterStatus(value);
    }
    setCurrentPage(1); // Reset to first page when filtering
  };

  // Loading state
  if (loading && !usersData) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="auto" />
        <View style={styles.header}>
          <UniversalBackButton fallbackRoute="/admin" />
          <Text style={styles.headerTitle}>Manage Users</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Color.cSK430B92500} />
          <Text style={styles.loadingText}>Loading users...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <>
      <WebSEO 
        title="User Management | Admin | Axees"
        description="Manage platform users, view details, and control user status"
        keywords="admin, user management, creators, marketers"
      />
      
      <SafeAreaView style={styles.container}>
        <StatusBar style="auto" />
        
        {/* Header */}
        <View style={styles.header}>
          <UniversalBackButton fallbackRoute="/admin" />
          <Text style={styles.headerTitle}>Manage Users</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Search and Filters */}
        <View style={styles.filtersSection}>
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={handleSearch}
            placeholder="Search users by name or email..."
            clearButtonMode="while-editing"
          />
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersRow}>
            <TouchableOpacity
              style={[styles.filterButton, filterType === 'all' && styles.activeFilterButton]}
              onPress={() => handleFilterChange('type', 'all')}
            >
              <Text style={[styles.filterText, filterType === 'all' && styles.activeFilterText]}>All Users</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.filterButton, filterType === 'creator' && styles.activeFilterButton]}
              onPress={() => handleFilterChange('type', 'creator')}
            >
              <Text style={[styles.filterText, filterType === 'creator' && styles.activeFilterText]}>Creators</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.filterButton, filterType === 'marketer' && styles.activeFilterButton]}
              onPress={() => handleFilterChange('type', 'marketer')}
            >
              <Text style={[styles.filterText, filterType === 'marketer' && styles.activeFilterText]}>Marketers</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.filterButton, filterStatus === 'active' && styles.activeFilterButton]}
              onPress={() => handleFilterChange('status', 'active')}
            >
              <Text style={[styles.filterText, filterStatus === 'active' && styles.activeFilterText]}>Active</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.filterButton, filterStatus === 'inactive' && styles.activeFilterButton]}
              onPress={() => handleFilterChange('status', 'inactive')}
            >
              <Text style={[styles.filterText, filterStatus === 'inactive' && styles.activeFilterText]}>Inactive</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Stats Summary */}
        <View style={styles.statsSection}>
          <Text style={styles.statsText}>
            Showing {usersData?.users.length || 0} of {usersData?.totalUsers || 0} users
          </Text>
          <Text style={styles.statsText}>
            Page {usersData?.currentPage || 1} of {usersData?.totalPages || 1}
          </Text>
        </View>

        <ScrollView 
          style={styles.scrollContainer} 
          contentContainerStyle={isWeb ? { paddingBottom: 120 } : undefined}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Color.cSK430B92500]}
            />
          }
        >
          {/* Users List */}
          <View style={styles.usersList}>
            {usersData?.users.map((userData) => (
              <View key={userData.id} style={styles.userCard}>
                <TouchableOpacity
                  style={styles.userInfo}
                  onPress={() => handleViewUserDetails(userData.id)}
                >
                  <View style={styles.userHeader}>
                    <View style={styles.userBasicInfo}>
                      <Text style={styles.userName}>{userData.name}</Text>
                      <Text style={styles.userEmail}>{userData.email}</Text>
                    </View>
                    
                    <View style={styles.userBadges}>
                      <View style={[styles.typeBadge, { backgroundColor: getUserTypeColor(userData.userType) + '20' }]}>
                        <Text style={[styles.typeBadgeText, { color: getUserTypeColor(userData.userType) }]}>
                          {userData.userType}
                        </Text>
                      </View>
                      
                      <View style={[styles.statusBadge, { backgroundColor: getUserStatusColor(userData.isActive) + '20' }]}>
                        <Text style={[styles.statusBadgeText, { color: getUserStatusColor(userData.isActive) }]}>
                          {userData.isActive ? 'Active' : 'Inactive'}
                        </Text>
                      </View>
                    </View>
                  </View>
                  
                  <View style={styles.userStats}>
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>{userData.completedDeals}</Text>
                      <Text style={styles.statLabel}>Deals</Text>
                    </View>
                    
                    {userData.userType === 'creator' ? (
                      <>
                        <View style={styles.statItem}>
                          <Text style={styles.statValue}>${(userData.totalEarnings || 0).toLocaleString()}</Text>
                          <Text style={styles.statLabel}>Earnings</Text>
                        </View>
                        <View style={styles.statItem}>
                          <Text style={styles.statValue}>{((userData.followers || 0) / 1000).toFixed(1)}K</Text>
                          <Text style={styles.statLabel}>Followers</Text>
                        </View>
                        <View style={styles.statItem}>
                          <Text style={styles.statValue}>{(userData.engagementRate || 0).toFixed(1)}%</Text>
                          <Text style={styles.statLabel}>Engagement</Text>
                        </View>
                      </>
                    ) : (
                      <>
                        <View style={styles.statItem}>
                          <Text style={styles.statValue}>${(userData.totalSpent || 0).toLocaleString()}</Text>
                          <Text style={styles.statLabel}>Spent</Text>
                        </View>
                        <View style={styles.statItem}>
                          <Text style={styles.statValue}>{userData.company || 'N/A'}</Text>
                          <Text style={styles.statLabel}>Company</Text>
                        </View>
                      </>
                    )}
                  </View>
                  
                  <View style={styles.userDates}>
                    <Text style={styles.dateText}>
                      Joined: {new Date(userData.registrationDate).toLocaleDateString()}
                    </Text>
                    <Text style={styles.dateText}>
                      Last Active: {new Date(userData.lastActiveDate).toLocaleDateString()}
                    </Text>
                  </View>
                </TouchableOpacity>
                
                <View style={styles.userActions}>
                  <TouchableOpacity
                    style={styles.viewButton}
                    onPress={() => handleViewUserDetails(userData.id)}
                  >
                    <Text style={styles.viewButtonText}>View Details</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.statusButton,
                      userData.isActive ? styles.suspendButton : styles.activateButton
                    ]}
                    onPress={() => handleUserStatusToggle(userData.id, userData.isActive)}
                    disabled={loadingAction === userData.id}
                  >
                    {loadingAction === userData.id ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.statusButtonText}>
                        {userData.isActive ? 'Suspend' : 'Activate'}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            
            {(!usersData?.users || usersData.users.length === 0) && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No users found</Text>
                <Text style={styles.emptyStateSubtext}>Try adjusting your search or filters</Text>
              </View>
            )}
          </View>

          {/* Pagination */}
          {usersData && usersData.totalPages > 1 && (
            <View style={styles.pagination}>
              <TouchableOpacity
                style={[styles.pageButton, !usersData.hasPrevPage && styles.disabledPageButton]}
                onPress={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={!usersData.hasPrevPage}
              >
                <Text style={[styles.pageButtonText, !usersData.hasPrevPage && styles.disabledPageButtonText]}>
                  Previous
                </Text>
              </TouchableOpacity>
              
              <Text style={styles.pageInfo}>
                Page {usersData.currentPage} of {usersData.totalPages}
              </Text>
              
              <TouchableOpacity
                style={[styles.pageButton, !usersData.hasNextPage && styles.disabledPageButton]}
                onPress={() => setCurrentPage(prev => prev + 1)}
                disabled={!usersData.hasNextPage}
              >
                <Text style={[styles.pageButtonText, !usersData.hasNextPage && styles.disabledPageButtonText]}>
                  Next
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
        
        {/* Bottom Navigation for Web */}
        {isWeb && <WebBottomTabs activeIndex={4} />}
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: Color.cSK430B92950,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 32,
  },
  filtersSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    marginBottom: 12,
  },
  filtersRow: {
    flexDirection: 'row',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8,
  },
  activeFilterButton: {
    backgroundColor: Color.cSK430B92500,
    borderColor: Color.cSK430B92500,
  },
  filterText: {
    fontSize: 14,
    color: '#666',
  },
  activeFilterText: {
    color: '#fff',
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f8f9fa',
  },
  statsText: {
    fontSize: 12,
    color: '#666',
  },
  scrollContainer: {
    flex: 1,
  },
  usersList: {
    padding: 16,
  },
  userCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  userInfo: {
    marginBottom: 12,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userBasicInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Color.cSK430B92950,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
  },
  userBadges: {
    alignItems: 'flex-end',
    gap: 4,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  userStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Color.cSK430B92500,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  userDates: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateText: {
    fontSize: 12,
    color: '#666',
  },
  userActions: {
    flexDirection: 'row',
    gap: 8,
  },
  viewButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Color.cSK430B92500,
    alignItems: 'center',
  },
  viewButtonText: {
    color: Color.cSK430B92500,
    fontSize: 14,
    fontWeight: '500',
  },
  statusButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  suspendButton: {
    backgroundColor: '#EF4444',
  },
  activateButton: {
    backgroundColor: '#10B981',
  },
  statusButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  pageButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: Color.cSK430B92500,
  },
  disabledPageButton: {
    backgroundColor: '#ccc',
  },
  pageButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  disabledPageButtonText: {
    color: '#999',
  },
  pageInfo: {
    fontSize: 14,
    color: '#666',
  },
});

export default AdminUsersPage;