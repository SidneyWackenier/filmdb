import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, Text, StyleSheet } from 'react-native';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useRouter } from 'expo-router';

const HeaderRight = () => {
  const { isLoggedIn } = useAuth();
  const router = useRouter();

  return (
    <Pressable
      onPress={() => router.push(isLoggedIn ? '/profile' : '/login')}
      style={styles.headerRightPressable}
    >
      <Text style={styles.headerRightText}>{isLoggedIn ? 'Profile' : 'Log In'}</Text>
    </Pressable>
  );
};

const RootLayout = () => {
  return (
    <AuthProvider>
      <Stack
        screenOptions={{
          title: 'FilmDB',
          headerStyle: styles.header,
          headerTitleStyle: styles.headerTitle,
          contentStyle: styles.content,
          headerTintColor: '#EEECEE',
          headerRight: () => <HeaderRight />,
        }}
      />
      <StatusBar style="light" />
    </AuthProvider>
  );
};

export default RootLayout;

const styles = StyleSheet.create({
  headerRightPressable: {
    marginRight: 15,
  },
  headerRightText: {
    color: '#509290',
    fontWeight: 'bold',
  },
  header: {
    backgroundColor: '#0F1113',
  },
  headerTitle: {
    fontWeight: 'bold',
    color: '#509290',
  },
  content: {
    backgroundColor: '#0F1113',
  },
});
