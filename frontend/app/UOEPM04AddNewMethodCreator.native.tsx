import React from 'react';
import Mobile from '@/components/mobile/UOEPM04AddNewMethodCreator';
import { Redirect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

export default function Screen() {
  const { user } = useAuth();
  if (!user?._id) return <Redirect href="/UAM001Login" />;
  return <Mobile />;
}
