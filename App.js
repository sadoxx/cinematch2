import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, ActivityIndicator, Image, Dimensions, Alert } from 'react-native';
import { useEffect, useState } from 'react';
import { db } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const { height } = Dimensions.get('window');
const TMDB_KEY = "b0e0004308eb345b7717b678714ec34b";

export default function App() {
  const [movies, setMovies] = useState([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch Movies from TMDB
  useEffect(() => {
    fetch(`https://api.themoviedb.org/3/trending/movie/day?api_key=${TMDB_KEY}`)
      .then(res => res.json())
      .then(data => {
        const formatted = data.results.map(m => ({
          id: m.id.toString(),
          title: m.title,
          overview: m.overview,
          poster: `https://image.tmdb.org/t/p/w500${m.poster_path}`
        }));
        setMovies(formatted);
        setLoading(false);
      })
      .catch(err => console.error(err));
  }, []);

  const handleLike = async () => {
    if (!movies[index]) return;
    
    try {
      await addDoc(collection(db, "liked_movies"), {
        movieId: movies[index].id,
        movieTitle: movies[index].title,
        timestamp: serverTimestamp()
      });
      setIndex((prev) => (prev + 1) % movies.length);
    } catch (err) {
      Alert.alert("Error", err.message);
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#e50914"/></View>;

  const movie = movies[index];

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>CineMatch 🎬</Text>
      </View>

      <View style={styles.posterWrapper}>
        <Image source={{ uri: movie.poster }} style={styles.poster} resizeMode="cover"/>
        <View style={styles.gradient}><Text style={styles.movieName}>{movie.title}</Text></View>
      </View>

      <ScrollView style={styles.info}>
        <Text style={styles.overview}>{movie.overview}</Text>
      </ScrollView>

      <View style={styles.controls}>
        <TouchableOpacity style={styles.btnSkip} onPress={() => setIndex((prev) => (prev + 1) % movies.length)}>
          <Text style={styles.btnText}>Skip</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnLike} onPress={handleLike}>
          <Text style={styles.btnText}>Like</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  header: { padding: 20, paddingTop: 50, alignItems: 'center' },
  headerTitle: { color: '#e50914', fontSize: 28, fontWeight: 'bold' },
  posterWrapper: { height: height * 0.65, width: '100%' },
  poster: { width: '100%', height: '100%' },
  gradient: { position: 'absolute', bottom: 0, width: '100%', padding: 20, backgroundColor: 'rgba(0,0,0,0.6)' },
  movieName: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
  info: { padding: 20 },
  overview: { color: '#ccc', fontSize: 16, lineHeight: 24 },
  controls: { flexDirection: 'row', padding: 20, gap: 15, position: 'absolute', bottom: 30, width: '100%' },
  btnSkip: { flex: 1, backgroundColor: '#333', padding: 18, borderRadius: 30, alignItems: 'center' },
  btnLike: { flex: 1, backgroundColor: '#e50914', padding: 18, borderRadius: 30, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});