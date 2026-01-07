// ============================================
// IMPORTS
// ============================================

// React & React Native
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, ActivityIndicator, Image, Dimensions, Alert, FlatList } from 'react-native';
import { StatusBar } from 'expo-status-bar';

// Firebase
import { db } from './firebase';
import { collection, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';

const { height } = Dimensions.get('window');
const TMDB_KEY = "b0e0004308eb345b7717b678714ec34b";

// ============================================
// MAIN APP
// ============================================

export default function App() {

  // ============================================
  // STATE - Data we need to remember
  // ============================================
  const [movies, setMovies] = useState([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('browse');
  const [likedMovies, setLikedMovies] = useState([]);
  const [loadingLikes, setLoadingLikes] = useState(false);

  // ============================================
  // API - Get trending movies when app starts
  // ============================================
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

  // ============================================
  // DATABASE - Load liked movies from Firebase
  // ============================================
  const fetchLikedMovies = async () => {
    setLoadingLikes(true);
    try {
      const snapshot = await getDocs(collection(db, "liked_movies"));
      const likes = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      likes.sort((a, b) => {
        const timeA = a.timestamp?.toMillis() || 0;
        const timeB = b.timestamp?.toMillis() || 0;
        return timeB - timeA;
      });
      setLikedMovies(likes);
    } catch (err) {
      Alert.alert("Error", "Could not load liked movies");
      console.error(err);
    }
    setLoadingLikes(false);
  };

  // Reload likes when switching to likes view
  useEffect(() => {
    if (viewMode === 'likes') {
      fetchLikedMovies();
    }
  }, [viewMode]);

  // Save a liked movie to Firebase
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

  // ============================================
  // UI - Show loading spinner while movies load
  // ============================================
  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#e50914"/></View>;

  const movie = movies[index];

  // ============================================
  // UI - Liked Movies Screen
  // ============================================
  if (viewMode === 'likes') {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Likes ❤️</Text>
        </View>
        
        {loadingLikes ? (
          <View style={styles.center}><ActivityIndicator size="large" color="#e50914"/></View>
        ) : likedMovies.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.emptyText}>No liked movies yet!</Text>
            <Text style={styles.emptySubtext}>Start swiping to build your list</Text>
          </View>
        ) : (
          <FlatList
            data={likedMovies}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item, index }) => (
              <View style={styles.likedItem}>
                <Text style={styles.likedNumber}>{index + 1}</Text>
                <View style={styles.likedInfo}>
                  <Text style={styles.likedTitle}>{item.movieTitle}</Text>
                  <Text style={styles.likedDate}>
                    {item.timestamp ? new Date(item.timestamp.toMillis()).toLocaleDateString() : 'Recently'}
                  </Text>
                </View>
              </View>
            )}
          />
        )}

        <View style={styles.controls}>
          <TouchableOpacity style={styles.btnBack} onPress={() => setViewMode('browse')}>
            <Text style={styles.btnText}>← Back to Browse</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ============================================
  // UI - Browse Movies Screen (Parallax Layout)
  // ============================================
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <ScrollView style={styles.mainScroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>CineMatch 🎬</Text>
          <TouchableOpacity style={styles.likesBtn} onPress={() => setViewMode('likes')}>
            <Text style={styles.likesBtnText}>My Likes ❤️</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.posterWrapper}>
          <Image source={{ uri: movie.poster }} style={styles.poster} resizeMode="cover"/>
          <View style={styles.gradient}><Text style={styles.movieName}>{movie.title}</Text></View>
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.overview}>{movie.overview}</Text>
        </View>
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

// ============================================
// STYLES - Netflix-style dark theme
// ============================================

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  mainScroll: { flex: 1 },
  header: { padding: 20, paddingTop: 50, alignItems: 'center', backgroundColor: '#000' },
  headerTitle: { color: '#e50914', fontSize: 28, fontWeight: 'bold' },
  likesBtn: { marginTop: 10, backgroundColor: '#222', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20 },
  likesBtnText: { color: '#fff', fontSize: 14 },
  posterWrapper: { height: height * 0.85, width: '100%' },
  poster: { width: '100%', height: '100%' },
  gradient: { position: 'absolute', bottom: 0, width: '100%', padding: 20, backgroundColor: 'rgba(0,0,0,0.6)' },
  movieName: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
  textContainer: { backgroundColor: '#000', padding: 20, paddingBottom: 120 },
  overview: { color: '#ccc', fontSize: 16, lineHeight: 24 },
  controls: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', padding: 20, paddingBottom: 30, gap: 15, backgroundColor: '#000' },
  btnSkip: { flex: 1, backgroundColor: '#333', padding: 18, borderRadius: 30, alignItems: 'center' },
  btnLike: { flex: 1, backgroundColor: '#e50914', padding: 18, borderRadius: 30, alignItems: 'center' },
  btnBack: { flex: 1, backgroundColor: '#e50914', padding: 18, borderRadius: 30, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  listContent: { paddingBottom: 100 },
  likedItem: { flexDirection: 'row', backgroundColor: '#1a1a1a', padding: 20, marginHorizontal: 20, marginVertical: 8, borderRadius: 12, alignItems: 'center' },
  likedNumber: { color: '#e50914', fontSize: 24, fontWeight: 'bold', marginRight: 15, width: 40 },
  likedInfo: { flex: 1 },
  likedTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  likedDate: { color: '#888', fontSize: 14, marginTop: 5 },
  emptyText: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  emptySubtext: { color: '#888', fontSize: 16 }
});