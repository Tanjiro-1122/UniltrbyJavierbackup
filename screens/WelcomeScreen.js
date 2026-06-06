
import React, { useEffect } from 'react';
import { SafeAreaView, Text, View, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext'; // Adjust path as needed

const WelcomeScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      // New user — auto navigate after 3s
      const timer = setTimeout(() => {
        navigation.navigate('Home');
      }, 3000);
      return () => clearTimeout(timer);
    }
    // Returning user — wait for tap
  }, [navigation, user]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Welcome to Unfiltr</Text>
        <Text style={styles.subtitle}>Your AI Companion</Text>
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Home')}>
          <Text style={styles.buttonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#c9a84c',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#f0e6d0',
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#c9a84c',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  buttonText: {
    color: '#0a0a0a',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default WelcomeScreen;
