import React from 'react';
import { Drawer } from 'expo-router/drawer';
import { Link } from 'expo-router';
import { Pressable, Text, View, StyleSheet } from 'react-native';

const genres = [
  { key: 'actionAdventure', label: 'Action & Adventure' },
  { key: 'animation', label: 'Animation' },
  { key: 'classic', label: 'Classic' },
  { key: 'comedy', label: 'Comedy' },
  { key: 'drama', label: 'Drama' },
  { key: 'horror', label: 'Horror' },
  { key: 'family', label: 'Family' },
  { key: 'mystery', label: 'Mystery' },
  { key: 'scifiFantasy', label: 'Sci-Fi & Fantasy' },
  { key: 'western', label: 'Western' },
];

export default function HomeLayout() {
  return (
    <Drawer
      screenOptions={{
        headerTitle: 'Genres',
        headerTitleAlign: 'left',
        headerStyle: { backgroundColor: '#0F1113' },
        headerTintColor: '#509290',
        drawerStyle: { backgroundColor: '#1A1D21', width: 240 },
        drawerLabelStyle: { color: '#FFFFFF' },
      }}
      drawerContent={() => (
        <View style={styles.drawerContent}>
          <Text style={styles.drawerTitle}>Genres</Text>
          {genres.map(({ key, label }) => (
            <Link
              key={key}
              href={{ pathname: '/(home)/[genre]', params: { genre: key } }}
              asChild
            >
              <Pressable style={styles.link}>
                <Text style={styles.linkText}>{label}</Text>
              </Pressable>
            </Link>
          ))}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  drawerContent: {
    flex: 1,
    paddingTop: 50,
    paddingHorizontal: 20,
    backgroundColor: '#1A1D21',
  },
  drawerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#509290',
    marginBottom: 20,
  },
  link: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  linkText: {
    fontSize: 16,
    color: '#fff',
  },
});
