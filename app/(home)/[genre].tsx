import React, { useEffect, useState } from 'react';
import { View, FlatList, Image, Pressable, StyleSheet, Text } from 'react-native';
import { useLocalSearchParams, Link } from 'expo-router';
import { Movie } from '../types/movie';

const GenreScreen = () => {
  const { genre } = useLocalSearchParams();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const response = await fetch(`https://sampleapis.assimilate.be/movies/${genre}`);
        const data = await response.json();
        setMovies(data);
      } catch {
        setError('Failed to load movies.');
      }
    };
    fetchMovies();
  }, [genre]);

  const renderItem = ({ item }: { item: Movie }) => (
    <Link
      href={{
        pathname: '/movie/[imdbId]',
        params: {
          imdbId: item.imdbId,
          movie: JSON.stringify(item),
        },
      }}
      asChild
    >
      <Pressable style={styles.posterContainer}>
        <Image source={{ uri: item.posterURL }} style={styles.posterImage} />
      </Pressable>
    </Link>
  );

  return (
    <View style={styles.container}>
      {error && <Text style={styles.errorText}>{error}</Text>}
      <FlatList
        data={movies}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        numColumns={3}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

export default GenreScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F1113',
    padding: 10,
    alignItems: 'center', 
  },
  listContent: {
    paddingBottom: 20,
    gap: 10,
  },
  posterContainer: {
    margin: 5,
    alignItems: 'center',
    width: 110, 
  },
  posterImage: {
    width: 100,
    height: 150,
    borderRadius: 8,
    borderColor: '#509290',
    borderWidth: 1,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginTop: 20,
  },
});

