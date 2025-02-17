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

  // Загрузка основных данных (жанров, списка фильмов) при монтировании компонента
  useEffect(() => {
    const movieService = new MovieService();

    async function fetchData() {
      try {
        setLoading(true);
        setError(false);

        const genresData = await movieService.getGenres(); // GET-запрос для получения списка жанров
        setGenres(genresData);

        try {
          const guestSession = await movieService.createGuestSession(); // GET-запрос для создания гостевой сессии
          setGuestSessionId(guestSession);
        } catch (guestSessionError) {
          // eslint-disable-next-line no-console
          console.error('Ошибка при создании гостевой сессии:', guestSessionError);
          setError(true);
        }

        const value = searchValue || 'return';
        const data = await movieService.getAllMovies(value, currentPage); // GET-запрос для получения списка фильмов
        setMovies(data.movies);
        setTotalResults(data.totalMovies);

        setLoading(false);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Ошибка при загрузке данных:', error);
        setLoading(false);
        setError(true);
      }
    }

    fetchData();
  }, [searchValue, currentPage]);

  // useEffect для получения фильмов с рейтингом при переключении Тab
  useEffect(() => {
    async function fetchRatedMovies() {
      if (guestSessionId && activeTab === '2') {
        try {
          const movieService = new MovieService();
          const ratedData = await movieService.getRatedMovies(guestSessionId, 1);
          const ratedMoviesWithRating = ratedData.ratedMovies.map((movie) => ({
            ...movie,
            rating: movie.rating !== undefined ? movie.rating : null,
          }));
          setRatedMovies(ratedMoviesWithRating);
        } catch (ratedError) {
          // eslint-disable-next-line no-console
          console.error('Ошибка при получении оцененных фильмов:', ratedError);
          setRatedMovies([]);
        } finally {
          setLoading(false);
        }
      }
    }

    if (activeTab === '2') {
      fetchRatedMovies();
    }
  }, [guestSessionId, activeTab]);

  const searchMovies = (value) => {
    setSearchValue(value);
    setCurrentPage(1);
  };

  const onPageChange = (page) => {
    setCurrentPage(page);
  };

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
      if (newRating !== null) {
        const existingMovieIndex = prevRatedMovies.findIndex((movie) => movie.id === movieId);
        if (existingMovieIndex !== -1) {
          // Если фильм уже есть, обновляем его рейтинг
          const updatedRatedMovies = [...prevRatedMovies];
          updatedRatedMovies[existingMovieIndex] = { ...updatedRatedMovies[existingMovieIndex], rating: newRating };
          return updatedRatedMovies;
        }
        // Если фильма нет, добавляем его в список
        const updatedMovie = movies.find((movie) => movie.id === movieId); // Получаем полную информацию о фильме из movies
        if (updatedMovie) {
          return [...prevRatedMovies, { ...updatedMovie, rating: newRating }];
        }
      }
      return prevRatedMovies;
    });
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
                <MoviePagination currentPage={currentPage} totalResults={totalResults} onPageChange={onPageChange} />
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
            <div className="movieRate-disabled">
              <MovieRate guestSessionId={guestSessionId} ratedMovies={ratedMovies} />
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
