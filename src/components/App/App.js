import React, { useState, useEffect } from 'react';
import { Alert, Spin, Tabs } from 'antd';
import { Offline, Online } from 'react-detect-offline';

import MovieService from '../../services/MovieService';
import Search from '../Search';
import MovieList from '../MoviesList';
import MoviePagination from '../MoviePagination';
import MovieRate from '../MovieRate';
import GenresContext from '../GenresContext';

import './App.css';

function App() {
  
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [genres, setGenres] = useState({});
  const [isError, setError] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [guestSessionId, setGuestSessionId] = useState(null);
  const [ratedMovies, setRatedMovies] = useState([]);
  const [activeTab, setActiveTab] = useState('1');
  const [ratedCurrentPage, setRatedCurrentPage] = useState(1);

  const movieService = new MovieService();
  const moviesPerPage = 20;

  // Инициализация сессии, получение жанров
  useEffect(() => {
    async function initialize() {
      try {
        setLoading(true);
        setError(false);

        const genresData = await movieService.getGenres();
        setGenres(genresData);

        try {
          const guestSession = await movieService.createGuestSession();
          setGuestSessionId(guestSession);
        } catch (guestSessionError) {
          // eslint-disable-next-line no-console
          console.error('Ошибка при создании гостевой сессии:', guestSessionError);
          setError(true);
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Ошибка при загрузке данных:', error);
        setLoading(false);
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Получение списка фильмов, объединение оцененных фильмов
  useEffect(() => {
    async function fetchMovies() {
      try {
        setLoading(true);
        setError(false);

        if (activeTab === '1') {
          const value = searchValue || 'return';
          const data = await movieService.getAllMovies(value, currentPage);

          const moviesWithRatings = data.movies.map((movie) => {
            const ratedMovie = ratedMovies.find((rated) => rated.id === movie.id);
            return ratedMovie ? { ...movie, rating: ratedMovie.rating } : movie;
          });

          setMovies(moviesWithRatings);
          setTotalResults(data.totalMovies);
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Ошибка при загрузке данных:', error);
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    if (activeTab === '1') {
      fetchMovies();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, currentPage, searchValue]);

  // Функция обрабатывает изменения рейтинга
  const handleRatingDeleted = (movieId, newRating = null) => {
    setRatedMovies((prevRatedMovies) => prevRatedMovies.filter((movie) => movie.id !== movieId));

    setMovies((prevMovies) =>
      prevMovies.map((movie) => {
        if (movie.id === movieId) {
          return { ...movie, rating: newRating };
        }
        return movie;
      })
    );

    // Обновляем состояние ratedMovies
    setRatedMovies((prevRatedMovies) => {
      if (newRating === null) {
        return prevRatedMovies.filter((movie) => movie.id !== movieId);
      }
      const updatedMovie = movies.find((movie) => movie.id === movieId);
      if (updatedMovie) {
        const existingMovieIndex = prevRatedMovies.findIndex((movie) => movie.id === movieId);
        if (existingMovieIndex !== -1) {
          const updatedRatedMovies = [...prevRatedMovies];
          updatedRatedMovies[existingMovieIndex] = { ...updatedRatedMovies[existingMovieIndex], rating: newRating };
          return updatedRatedMovies;
        }
        return [...prevRatedMovies, { ...updatedMovie, rating: newRating }];
      }
      return prevRatedMovies;
    });
  };

  const searchMovies = (value) => {
    setSearchValue(value);
    setCurrentPage(1);
  };

  const onPageChange = (page) => {
    setCurrentPage(page);
  };

  const onRatedPageChange = (page) => {
    setRatedCurrentPage(page);
};

  const renderContent = () => {
    if (isError) {
      return (
        <div className="movie__list-alert">
          <Alert message="Error" description="Oopse! Something went wrong. Wait, we'll fix it." type="error" showIcon />
        </div>
      );
    }

    if (!(movies.length > 0)) {
      return <p>Фильмы не найдены.</p>;
    }

    return (
      <MovieList
        movies={movies}
        genres={genres}
        guestSessionId={guestSessionId}
        onRatingDeleted={handleRatingDeleted}
      />
    );
  };


  const getPaginatedRatedMovies = () => {
    const startIndex = (ratedCurrentPage - 1) * moviesPerPage;
    const endIndex = startIndex + moviesPerPage;
    return ratedMovies.slice(startIndex, endIndex);
};

  const items = [
    {
      key: '1',
      label: 'Search',
      children: (
        <>
          <Search searchMovies={searchMovies} />
          {loading ? (
            <div className="loading-container">
              <Spin size="large" />
              <div className="loading-text">Loading...</div>
            </div>
          ) : (
            <>
              {renderContent()}
              {!loading && !isError && movies.length > 0 && (
                <MoviePagination 
                  currentPage={currentPage} 
                  totalResults={totalResults} 
                  onPageChange={onPageChange} 
                />
              )}
            </>
          )}
        </>
      ),
    },
    {
      key: '2',
      label: 'Rated',
      children: (
        <>
          {guestSessionId && (
            <div>
              <div className="movieRate-disabled">
                <MovieRate guestSessionId={guestSessionId} ratedMovies={getPaginatedRatedMovies()} />
              </div>
                {ratedMovies.length > moviesPerPage && (
                <MoviePagination
                  currentPage={ratedCurrentPage}
                  totalResults={ratedMovies.length}
                  onPageChange={onRatedPageChange}
                />
                )}
            </div>
          )}
        </>
      ),
    },
  ];

  return (
    <GenresContext.Provider value={genres}>
      <Online polling={{ enabled: true, interval: 10000 }}>
        <div className="app">
          <div className="container">
            <Tabs defaultActiveKey="1" items={items} className="custom-tabs" onChange={(key) => setActiveTab(key)} />
          </div>
        </div>
      </Online>
      <Offline polling={{ enabled: true, interval: 10000 }}>
        <div className="movie-offline">
          <Alert message="Error" type="error" description="You are offline :(" showIcon />
        </div>
      </Offline>
    </GenresContext.Provider>
  );
}

export default App;
