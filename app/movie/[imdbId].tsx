import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useFocusEffect, useRouter } from 'expo-router';
import { Movie } from '../types/movie';
import { Review } from '../types/review';

const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InMxMjQ2NTZAYXAuYmUiLCJpYXQiOjE3NDgxMjI0MTd9.SLmjdTVwMvUiHa3FJ8Qu4MN9rqUrKS0zSjNbpleK_Ns';

const MovieDetails = () => {
  const { id, movie: movieParam } = useLocalSearchParams();
  const router = useRouter();

  const [movie, setMovie] = useState<Movie | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const [username, setUsername] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isWatchlist, setIsWatchlist] = useState(false);

  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewComment, setReviewComment] = useState('');
  const [showAlreadyReviewedModal, setShowAlreadyReviewedModal] = useState(false);


  useFocusEffect(
    React.useCallback(() => {
      const syncUsername = async () => {
        const storedUsername = await AsyncStorage.getItem('username');
        setUsername(storedUsername);
      };
      syncUsername();
    }, [])
  );

  useEffect(() => {
    const fetchMovieAndReviews = async () => {
      setLoading(true);
      try {
        let selectedMovie: Movie | null = null;

        if (movieParam) {
          try {
            selectedMovie = JSON.parse(movieParam as string);
          } catch {
            selectedMovie = null;
          }
        }

        if (!selectedMovie && id) {
          const response = await fetch('https://sampleapis.assimilate.be/movies/actionAdventure');
          const movies: Movie[] = await response.json();
          selectedMovie = movies.find((m) => m.id.toString() === id) || null;
        }

        setMovie(selectedMovie);

        if (selectedMovie) {
          const reviewsResponse = await fetch('https://sampleapis.assimilate.be/movies/reviews', {
            headers: {
              Authorization: `Bearer ${TOKEN}`,
            },
          });
          const allReviews: Review[] = await reviewsResponse.json();
          const filteredReviews = allReviews.filter(
            (r) => r.imdbId === selectedMovie.imdbId
          );
          setReviews(filteredReviews);
        }

        const storedUsername = await AsyncStorage.getItem('username');
        setUsername(storedUsername);

        if (selectedMovie && storedUsername) {
          const favs = await AsyncStorage.getItem(`favorites_${storedUsername}`);
          const favList = favs ? JSON.parse(favs) : [];
          setIsFavorite(favList.some((m: Movie) => m.imdbId === selectedMovie!.imdbId));

          const watch = await AsyncStorage.getItem(`watchlist_${storedUsername}`);
          const watchList: Movie[] = watch ? JSON.parse(watch) : [];
          setIsWatchlist(watchList.some((m) => m.imdbId === selectedMovie!.imdbId));
        }
      } catch (err) {
        console.error('Error fetching movie data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMovieAndReviews();
  }, [id, movieParam]);

  const toggleStorage = async (
    key: string,
    state: boolean,
    setState: React.Dispatch<React.SetStateAction<boolean>>
  ) => {
    if (!movie) return;

    if (!username) {
      router.push('/login');
      return;
    }

    const storageKey = `${key}_${username}`;
    const stored = await AsyncStorage.getItem(storageKey);
    const list: Movie[] = stored ? JSON.parse(stored) : [];

    const exists = list.some((m) => m.imdbId === movie.imdbId);

    const updatedList = exists
      ? list.filter((m) => m.imdbId !== movie.imdbId)
      : [...list, movie];

    await AsyncStorage.setItem(storageKey, JSON.stringify(updatedList));
    setState(!state);
  };

  const handleSubmitReview = async () => {
    if (!movie || !reviewComment.trim()) return;

    try {
      const currentUsername = await AsyncStorage.getItem('username');
      if (!currentUsername) {
        Alert.alert('Not logged in', 'You must be logged in to write a review.');
        return;
      }

      const response = await fetch('https://sampleapis.assimilate.be/movies/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${TOKEN}`,
        },
        body: JSON.stringify({
          imdbId: movie.imdbId,
          username: currentUsername,
          comment: reviewComment.trim(),
        }),
      });

      if (!response.ok) throw new Error('Failed to post review');

      const newReview = await response.json();

      setReviews((prev) => [...prev, newReview]);
      setReviewComment('');
      setShowReviewForm(false);
    } catch (err) {
      console.error('Error posting review:', err);
      Alert.alert('Error', 'Could not post review. Please try again later.');
    }
  };

  const handleDeleteReview = async (reviewId: number) => {
    try {
      const response = await fetch(`https://sampleapis.assimilate.be/movies/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${TOKEN}`,
        },
      });

      if (!response.ok) throw new Error('Failed to delete review');

      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
    } catch (err) {
      console.error('Error deleting review:', err);
      Alert.alert('Error', 'Could not delete review. Please try again later.');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#509290" />
      </View>
    );
  }

  if (!movie) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Movie not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{movie.title}</Text>
      <Image source={{ uri: movie.posterURL }} style={styles.poster} />
      <Text style={styles.rating}>IMDb Rating: {movie.rating}</Text>

      <View style={styles.buttonRow}>
        <Pressable
          onPress={() => toggleStorage('favorites', isFavorite, setIsFavorite)}
          style={styles.actionButton}
        >
          <Text style={styles.actionButtonText}>
            {isFavorite ? 'Favorited' : 'Add to Favorites'}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => toggleStorage('watchlist', isWatchlist, setIsWatchlist)}
          style={styles.actionButton}
        >
          <Text style={styles.actionButtonText}>
            {isWatchlist ? 'On Watchlist' : 'Add to Watchlist'}
          </Text>
        </Pressable>
      </View>

      <Text style={styles.reviewHeader}>Reviews:</Text>

      <Pressable
  style={styles.reviewButton}
  onPress={() => {
    if (!username) {
      router.push('/login');
    } else {
      const userHasReview = reviews.some((r) => r.username === username);
      if (userHasReview) {
        setShowAlreadyReviewedModal(true);
      } else {
        setShowReviewForm(true);
      }
    }
  }}
>
  <Text style={styles.reviewButtonText}>Write a Review</Text>
</Pressable>


      {reviews.length === 0 ? (
        <Text style={styles.noReviews}>No reviews yet. Be the first to write one!</Text>
      ) : (
        reviews.map((item) => (
          <View key={item.id.toString()} style={styles.reviewItem}>
            <Text style={styles.reviewer}>{item.username}</Text>
            <Text style={styles.comment}>{item.comment}</Text>
            {username === item.username && (
              <Pressable onPress={() => handleDeleteReview(item.id)}>
                <Text style={styles.deleteText}>Delete</Text>
              </Pressable>
            )}
          </View>
        ))
      )}

      <Modal visible={showReviewForm} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.reviewHeader}>Write a Review</Text>
            <TextInput
              style={styles.input}
              placeholder="Your review..."
              placeholderTextColor="#777"
              multiline
              value={reviewComment}
              onChangeText={setReviewComment}
            />
            <View style={styles.modalButtons}>
              <Pressable style={styles.submitButton} onPress={handleSubmitReview}>
                <Text style={styles.submitButtonText}>Submit</Text>
              </Pressable>
              <Pressable style={styles.cancelButton} onPress={() => setShowReviewForm(false)}>
                <Text style={styles.submitButtonText}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
      <Modal visible={showAlreadyReviewedModal} animationType="fade" transparent>
  <View style={styles.modalContainer}>
    <View style={styles.modalContent}>
      <Text style={[styles.reviewHeader, { marginBottom: 12 }]}>Notice</Text>
      <Text style={{ color: '#EEECEE', marginBottom: 20, fontSize: 16, textAlign: 'center' }}>
        You have already written a review for this movie.
      </Text>
      <Pressable
        style={[styles.submitButton, { alignSelf: 'center', paddingHorizontal: 30 }]}
        onPress={() => setShowAlreadyReviewedModal(false)}
      >
        <Text style={styles.submitButtonText}>OK</Text>
      </Pressable>
    </View>
  </View>
</Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#0F1113',
    paddingBottom: 64,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#0F1113',
  },
  errorText: {
    color: '#EEECEE',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#EEECEE',
    textAlign: 'center',
    marginBottom: 10,
  },
  poster: {
    width: '100%',
    aspectRatio: 2 / 3,
    resizeMode: 'contain',
    borderRadius: 8,
    marginBottom: 8,
  },
  rating: {
    color: '#EEECEE',
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#509290',
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 6,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#0F1113',
    fontSize: 16,
    fontWeight: '600',
  },
  reviewHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#EEECEE',
    marginBottom: 10,
  },
  reviewButton: {
    backgroundColor: '#509290',
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
    marginBottom: 10,
  },
  reviewButtonText: {
    color: '#0F1113',
    fontSize: 16,
    fontWeight: '600',
  },
  noReviews: {
    color: '#AAA',
    fontStyle: 'italic',
    marginBottom: 10,
  },
  reviewItem: {
    backgroundColor: '#1A1D20',
    padding: 12,
    borderRadius: 6,
    marginBottom: 10,
  },
  reviewer: {
    fontWeight: 'bold',
    color: '#EEECEE',
    marginBottom: 4,
  },
  comment: {
    color: '#DDD',
  },
  deleteText: {
    marginTop: 6,
    color: '#FF5C5C',
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#1F2326',
    padding: 16,
    borderRadius: 8,
  },
  input: {
    backgroundColor: '#333',
    color: '#EEECEE',
    minHeight: 80,
    padding: 10,
    borderRadius: 6,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  submitButton: {
    backgroundColor: '#509290',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
  },
  cancelButton: {
    backgroundColor: '#777',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
  },
  submitButtonText: {
    color: '#0F1113',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default MovieDetails;
