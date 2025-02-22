/* eslint-disable no-lonely-if */
import React, { useState, useEffect } from 'react';
import { Alert, Spin, Tabs } from 'antd';
import { Offline, Online } from 'react-detect-offline';

import MovieService from '../../services/MovieService';
import Search from '../Search';
import MovieList from '../MoviesList';
import MoviePagination from '../MoviePagination';
import GenresContext from '../GenresContext';

import './App.css';

function App() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [genres, setGenres] = useState({});
  const [isErrorTab1, setIsErrorTab1] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [guestSessionId, setGuestSessionId] = useState(null);
  const [movieRatings, setMovieRatings] = useState({});
  const [activeTab, setActiveTab] = useState('1');
  const [ratedMoviesLoaded, setRatedMoviesLoaded] = useState(false)
  const [allMovies, setAllMovies] = useState([]);

  const movieService = new MovieService();


    // Загрузка жанров 
    useEffect(() => {
      async function fetchGenres() {
        try {
          const genresData = await movieService.getGenres();
          setGenres(genresData);
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('Ошибка при загрузке жанров:', error);
          setIsErrorTab1(true); 
        }
      }
      fetchGenres();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); 


  // Инициализация сессии, получение жанров и рейтингов
  useEffect(() => {
    async function initialize() {
      try {
        setLoading(true);
        setIsErrorTab1(false);

        try {
          // Загрузка рейтингов с сервера 
          if (!guestSessionId) {
            const guestSession = await movieService.createGuestSession();
            setGuestSessionId(guestSession);
          }

          // Загрузка рейтингов из Local Storage
          const storedRatings = localStorage.getItem('movieRatings');
          let initialRatings = storedRatings ? JSON.parse(storedRatings) : {};

          if (guestSessionId && activeTab === '2' && !ratedMoviesLoaded) {
            try {
              const serverRatings = await movieService.getRatedMovies(guestSessionId);
              initialRatings = { ...initialRatings, ...serverRatings };
              setRatedMoviesLoaded(true);
            } catch (serverRatingsError) {
              // eslint-disable-next-line no-console
              console.error('Ошибка при загрузке рейтингов с сервера:', serverRatingsError);
            }
          }

          // Объединение рейтингов 
          setMovieRatings(initialRatings);
        } catch (guestSessionError) {
          // eslint-disable-next-line no-console
          console.error('Ошибка при создании гостевой сессии:', guestSessionError);
          setIsErrorTab1(true);
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Ошибка при загрузке данных:', error);
        setIsErrorTab1(true);
      } finally {
        setLoading(false);
      }
    }
    initialize();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, guestSessionId, ratedMoviesLoaded]);

 // Сохранение рейтингов в Local Storage при изменении
 useEffect(() => {
  try {
    localStorage.setItem('movieRatings', JSON.stringify(movieRatings));
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Ошибка при сохранении оценок в Local Storage:', error);
  }
}, [movieRatings]);

// Получение списка фильмов
useEffect(() => {
  async function fetchMovies() {
    try {
      setLoading(true);
      setIsErrorTab1(false);
      let data;

      const value = searchValue.trim();

      if (!value) {
        data = await movieService.getPopularMovies(currentPage);
      } else {
        data = await movieService.getAllMovies(value, currentPage);
      }

      setMovies(data.movies);
      // Обновляем allMovies, добавляя новые фильмы
      setAllMovies((prevAllMovies) => {
        const newMovies = data.movies.filter((movie) => !prevAllMovies.find((m) => m.id === movie.id));
        return [...prevAllMovies, ...newMovies];
      });
      setTotalResults(data.totalMovies);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Ошибка при загрузке данных:', error);
      setIsErrorTab1(true);
    } finally {
      setLoading(false);
    }
  }

  fetchMovies();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [searchValue, currentPage]);



  // Функция обрабатывает изменения рейтинга
  const handleRatingChange = (movieId, newRating) => {
    setMovieRatings((prevRatings) => {
      const updatedRatings = { ...prevRatings };
      if (newRating === 0 || newRating === null) {
        delete updatedRatings[movieId];
      } else {
        updatedRatings[movieId] = newRating;
      }
      return updatedRatings;
    });
  };

  const searchMovies = (value) => {
    setSearchValue(value);
    setCurrentPage(1);
  };

  const onPageChange = (page) => {
    setCurrentPage(page);
  };

  const renderContent = () => {
    if (isErrorTab1) {
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
        movieRatings={movieRatings}
        onRatingChange={handleRatingChange}
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
              {!loading && !isErrorTab1 && movies.length > 0 && (
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
          {
            (() => {
              const ratedMovies = allMovies.filter((movie) => movieRatings[movie.id] !== undefined);
              if (ratedMovies.length === 0) {
                return <p>Вы еще не оценили ни одного фильма.</p>;
              }
              return (
                <MovieList
                  movies={ratedMovies}
                  genres={genres}
                  guestSessionId={guestSessionId}
                  movieRatings={movieRatings}
                  onRatingChange={handleRatingChange}
                />
              );
            })()
          }
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