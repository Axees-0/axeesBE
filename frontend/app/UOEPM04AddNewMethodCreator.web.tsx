import React from 'react';
import Web from '@/components/UOEPM04AddNewMethodCreator';
import { Redirect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

export default function Screen() {
  const { user } = useAuth();
  if (!user?._id) return <Redirect href="/UAM001Login" />;
  return <Web />;
}
