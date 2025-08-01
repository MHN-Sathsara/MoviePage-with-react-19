import React, {useEffect,useState} from 'react'
import Search from './components/Search'
import Spinner from './components/Spinner';
import MovieCard from './components/MovieCard';
import { useDebounce } from 'react-use';
import { updateSearchCount, getTrendingMovies } from './appwrite'; 

const API_BASE_URL = 'https://api.themoviedb.org/3';
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

const API_OPTIONS = {
  method: 'GET',
  headers: {
    accept: 'application/json',
    Authorization: `Bearer ${API_KEY}`
  }}

const App = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [movieList, setMovieList] = useState([]);
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  useDebounce(() => {
    setDebouncedSearchTerm(searchTerm);
  }, 800, [searchTerm]);

  const fetchMovies = async (query = "") => {
    setIsLoading(true);
    setErrorMessage('');


    try{
      const endpoint = query 
      ? `${API_BASE_URL}/search/movie?query=${encodeURIComponent(query)}`
      : `${API_BASE_URL}/discover/movie?sort_by=popularity.desc`
      const response = await fetch(endpoint, API_OPTIONS);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if(data.Response === 'False'){
        setErrorMessage(data.Error || 'An error occurred while fetching movies.');
        setMovieList([]);
        return;
      }

      setMovieList(data.results || []);

      if(query && data.results.length > 0){
        await updateSearchCount(query, data.results[0]);
      }
    } catch(error){
      console.error(`Error fetching movies: ${error}`);
      setErrorMessage('Failed to fetch movies. Please try again later.');
  } finally {
      setIsLoading(false);
    }
}

const loadTrendingMovies = async () => {
  try {
    const movies = await getTrendingMovies();
    setTrendingMovies(movies);
  } catch (error) {
    console.error("Error loading trending movies:", error);
  }
};

  useEffect(() => {
    fetchMovies(debouncedSearchTerm); // Call fetchMovies when component mounts
  }, [debouncedSearchTerm]);

  useEffect(() => {
    loadTrendingMovies(); // Load trending movies when component mounts
  }, []);

  return (
    <div className="pattern">
      <div className="wrapper">
        <header>
          <img src="./hero.png" alt="Hero Banner" />
          <h1>Find <span className="text-gradient">Movies</span> You like Without the Hassle</h1>

          <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm}/>
        </header>
        { trendingMovies.length > 0 && (
          <section className="trending">
            <h2>Trending Movies</h2>
            <ul>
              {trendingMovies.map((movie, index) => (
                <li key={movie.$id}>
                  <p>{index + 1}</p>
                  <img src={movie.poster_url} alt={movie.title}  />
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="all-movies">
          <h2>All Movies</h2>
          {isLoading ? (
            <Spinner />
          ): errorMessage ? (
            <p className="text-red-500">{errorMessage}</p>
          ):(
            <ul>
              {movieList.map((movie) => (
                <li key={movie.id}>
                  <MovieCard key={movie.id} movie={movie} />
                </li>
              ))}
            </ul>
          )}
        </section>

      </div>
    </div>
  )
}

export default App