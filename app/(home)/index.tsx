import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function IndexRedirect() {
  const router = useRouter();
  const { loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      router.replace({
        pathname: '/[genre]',
        params: { genre: 'actionAdventure' },
      });
    }
  }, [loading, router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#509290" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F1113',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
