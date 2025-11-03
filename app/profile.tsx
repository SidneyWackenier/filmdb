import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Image,
  Alert,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, Link } from 'expo-router';
import { useAuth } from './context/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import { Calendar } from 'react-native-calendars';
import { Movie } from './types/movie';

const ProfileScreen = () => {
  const [username, setUsername] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Movie[]>([]);
  const [watchlist, setWatchlist] = useState<Movie[]>([]);
  const [profilePicUri, setProfilePicUri] = useState<string | null>(null);

  const [watchDates, setWatchDates] = useState<{ [movieId: number]: string }>({});

  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [selectedMovieForDate, setSelectedMovieForDate] = useState<Movie | null>(null);

  const router = useRouter();
  const { logout } = useAuth();

  useEffect(() => {
    const loadData = async () => {
      const storedUsername = await AsyncStorage.getItem('username');
      setUsername(storedUsername);

      if (storedUsername) {
        const favs = await AsyncStorage.getItem(`favorites_${storedUsername}`);
        const watch = await AsyncStorage.getItem(`watchlist_${storedUsername}`);
        const picUri = await AsyncStorage.getItem(`profilePic_${storedUsername}`);
        const savedWatchDates = await AsyncStorage.getItem(`watchDates_${storedUsername}`);

        setFavorites(favs ? JSON.parse(favs) : []);
        setWatchlist(watch ? JSON.parse(watch) : []);
        setProfilePicUri(picUri);
        setWatchDates(savedWatchDates ? JSON.parse(savedWatchDates) : {});
      }
    };
    loadData();
  }, []);

  const sortedWatchlist = [...watchlist].sort((a, b) => {
    const dateA = watchDates[a.id];
    const dateB = watchDates[b.id];

    if (dateA && dateB) {
      if (dateA < dateB) return -1;
      if (dateA > dateB) return 1;
      return a.title.localeCompare(b.title);
    }
    if (dateA && !dateB) return -1;
    if (!dateA && dateB) return 1;
    return a.title.localeCompare(b.title);
  });

  const handleLogout = async () => {
    await AsyncStorage.removeItem('isLoggedIn');
    await AsyncStorage.removeItem('username');
    logout();
    router.replace('/(home)');
  };

  const pickImage = async () => {
    if (!username) {
      Alert.alert('Error', 'You must be logged in to change your profile picture.');
      return;
    }

    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.status !== 'granted') {
      Alert.alert('Permission denied', 'Permission to access gallery is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setProfilePicUri(uri);
      await AsyncStorage.setItem(`profilePic_${username}`, uri);
    }
  };

  const openDatePickerForMovie = (movie: Movie) => {
    setSelectedMovieForDate(movie);
    setDatePickerVisible(true);
  };

  const onDateSelected = async (day: any) => {
    if (!username || !selectedMovieForDate) return;

    const newWatchDates = {
      ...watchDates,
      [selectedMovieForDate.id]: day.dateString,
    };

    setWatchDates(newWatchDates);
    setDatePickerVisible(false);

    await AsyncStorage.setItem(`watchDates_${username}`, JSON.stringify(newWatchDates));
  };

  const renderPosterGrid = (movies: Movie[], isWatchlist = false) => (
    <View style={styles.posterGrid}>
      {movies.map((movie) => (
        <View key={movie.id} style={{ alignItems: 'center' }}>
          {isWatchlist ? (
            <Pressable
              style={styles.posterContainer}
              onPress={() => openDatePickerForMovie(movie)}
            >
              <Image source={{ uri: movie.posterURL }} style={styles.posterImage} />
            </Pressable>
          ) : (
            <Link
              href={{
                pathname: '/movie/[imdbId]',
                params: { imdbId: movie.imdbId, movie: JSON.stringify(movie) },
              }}
              asChild
            >
              <Pressable style={styles.posterContainer}>
                <Image source={{ uri: movie.posterURL }} style={styles.posterImage} />
              </Pressable>
            </Link>
          )}

          {isWatchlist && watchDates[movie.id] ? (
            <Text style={styles.watchDateText}>
              {watchDates[movie.id]}
            </Text>
          ) : null}
        </View>
      ))}
    </View>
  );

  return (
    <>
      <ScrollView contentContainerStyle={styles.container}>
        <Pressable onPress={pickImage} style={styles.profilePicWrapper}>
          {profilePicUri ? (
            <Image source={{ uri: profilePicUri }} style={styles.profilePic} />
          ) : (
            <View style={[styles.profilePic, styles.profilePicPlaceholder]}>
              <Text style={styles.placeholderText}>Tap to add photo</Text>
            </View>
          )}
        </Pressable>

        <Text style={styles.title}>Welcome{username ? `, ${username}` : ''}!</Text>

        <Pressable style={styles.button} onPress={handleLogout}>
          <Text style={styles.buttonText}>Log Out</Text>
        </Pressable>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Favorites</Text>
          {favorites.length === 0 ? (
            <Text style={styles.emptyText}>No favorites yet.</Text>
          ) : (
            renderPosterGrid(favorites)
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Watchlist</Text>
          {watchlist.length === 0 ? (
            <Text style={styles.emptyText}>No watchlist items yet.</Text>
          ) : (
            renderPosterGrid(sortedWatchlist, true)
          )}
        </View>
      </ScrollView>

      <Modal
        visible={datePickerVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setDatePickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Pick watch date for:</Text>
            <Text style={styles.modalMovieTitle}>{selectedMovieForDate?.title}</Text>

            <Calendar
              onDayPress={onDateSelected}
              markedDates={
                selectedMovieForDate && watchDates[selectedMovieForDate.id]
                  ? {
                      [watchDates[selectedMovieForDate.id]]: {
                        selected: true,
                        selectedColor: '#509290',
                      },
                    }
                  : {}
              }
              theme={{
                backgroundColor: '#0F1113',
                calendarBackground: '#0F1113',
                textSectionTitleColor: '#509290',
                dayTextColor: '#EEECEE',
                monthTextColor: '#509290',
                todayTextColor: '#509290',
                selectedDayBackgroundColor: '#509290',
                arrowColor: '#509290',
                textDisabledColor: '#555',
                dotColor: '#509290',
                selectedDotColor: '#EEECEE',
              }}
            />

            <View style={styles.modalButtonRow}>
              <Pressable
                onPress={() => setDatePickerVisible(false)}
                style={styles.modalButtonCancel}
              >
                <Text style={styles.modalButtonCancelText}>Cancel</Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  setDatePickerVisible(false);
                  if (selectedMovieForDate) {
                    router.push({
                      pathname: '/movie/[imdbId]',
                      params: {
                        imdbId: selectedMovieForDate.imdbId,
                        movie: JSON.stringify(selectedMovieForDate),
                      },
                    });
                  }
                }}
                style={styles.modalButtonGo}
              >
                <Text style={styles.modalButtonGoText}>Go to Movie</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#0F1113',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 40,
  },
  profilePicWrapper: {
    marginBottom: 20,
  },
  profilePic: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: '#509290',
  },
  profilePicPlaceholder: {
    backgroundColor: '#222',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#777',
    fontSize: 14,
  },
  title: {
    color: '#EEECEE',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#509290',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginBottom: 30,
  },
  buttonText: {
    color: '#0F1113',
    fontSize: 16,
    fontWeight: 'bold',
  },
  section: {
    width: '100%',
    marginTop: 20,
  },
  sectionTitle: {
    color: '#509290',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  emptyText: {
    color: '#AAA',
    fontStyle: 'italic',
  },
  posterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  posterContainer: {
    width: '30%',
    marginBottom: 15,
    alignItems: 'center',
  },
  posterImage: {
    width: 100,
    height: 150,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#509290',
  },
  watchDateText: {
    color: '#AAA',
    fontSize: 14,
    marginTop: 4,
    fontWeight: 'bold',
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: '#000000cc',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#0F1113',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 350,
    alignItems: 'center',
  },
  modalTitle: {
    color: '#EEECEE',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalMovieTitle: {
    color: '#509290',
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtonRow: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButtonCancel: {
    flex: 1,
    marginRight: 10,
    backgroundColor: '#509290',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonCancelText: {
    color: '#0F1113',
    fontWeight: 'bold',
  },
  modalButtonGo: {
    flex: 1,
    backgroundColor: '#3B7A7A',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonGoText: {
    color: '#EEECEE',
    fontWeight: 'bold',
  },
});
