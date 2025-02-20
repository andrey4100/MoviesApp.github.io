/* eslint-disable no-lonely-if */
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
  const [isErrorTab1, setIsErrorTab1] = useState(false);
  const [isErrorTab2, setIsErrorTab2] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [guestSessionId, setGuestSessionId] = useState(null);
  const [activeTab, setActiveTab] = useState('1');
  const [ratedCurrentPage, setRatedCurrentPage] = useState(1);
  const [ratedMovies, setRatedMovies] = useState([]); // Состояние для хранения оцененных фильмов, полученных с сервера
  const [totalRatedMovies, setTotalRatedMovies] = useState(0); // Состояние для хранения общего количества оцененных фильмов
  const [hasEverRatedMovies, setHasEverRatedMovies] = useState(false);

  const movieService = new MovieService();
  const moviesPerPage = 20;

  // Инициализация сессии, получение жанров
  useEffect(() => {
    async function initialize() {
      try {
        setLoading(true);
        setIsErrorTab1(false);

        const genresData = await movieService.getGenres();
        setGenres(genresData);

        try {
          const guestSession = await movieService.createGuestSession();
          setGuestSessionId(guestSession);
        } catch (guestSessionError) {
          // eslint-disable-next-line no-console
          console.error('Ошибка при создании гостевой сессии:', guestSessionError);
          setIsErrorTab1(true);
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Ошибка при загрузке данных:', error);
        setLoading(false);
        setIsErrorTab1(true);
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
        setIsErrorTab1(false);
        let data;

        if (activeTab === '1') {
          const value = searchValue.trim();

          if (!value) {
            data = await movieService.getPopularMovies(currentPage);
          } else {
            data = await movieService.getAllMovies(value, currentPage);
          }

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
        setIsErrorTab1(true);
      } finally {
        setLoading(false);
      }
    }

    fetchMovies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchValue, currentPage]);

  //  Получение оцененных фильмов с сервера при переключении на второй таб
  useEffect(() => {
    async function fetchRatedMovies() {
      if (!guestSessionId || activeTab !== '2') {
        setRatedMovies([]); // Clear movies if not active or no guest session
        setTotalRatedMovies(0);
        return;
      }

      try {
        setLoading(true);
        setIsErrorTab2(false);

        const data = await movieService.getRatedMovies(guestSessionId);
        setRatedMovies(data.ratedMovies);
        setTotalRatedMovies(data.totalratedMovies);
        // eslint-disable-next-line no-console
        console.log('Оцененные фильмы, полученные с сервера:', data.ratedMovies);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Ошибка при загрузке оцененных фильмов:', error);
        setIsErrorTab2(true);
        setRatedMovies([]);
        setTotalRatedMovies(0);
      } finally {
        setLoading(false);
      }
    }

    fetchRatedMovies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, guestSessionId]);

  // Функция обрабатывает изменения рейтинга
  const handleRatingDeleted = (movieId, newRating = null) => {
    if (typeof newRating === 'number') {
      if (!hasEverRatedMovies) {
        setHasEverRatedMovies(true);
      }
    } else {
      if (ratedMovies.length <= 1) {
        setHasEverRatedMovies(false);
      }
    }

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

  const getPaginatedRatedMovies = () => {
    const startIndex = (ratedCurrentPage - 1) * moviesPerPage;
    const endIndex = startIndex + moviesPerPage;
    return ratedMovies.slice(startIndex, endIndex);
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
          {loading ? (
            <div className="loading-container">
              <Spin size="large" />
              <div className="loading-text">Loading...</div>
            </div>
          ) : (
            (() => {
              if (hasEverRatedMovies === false) {
                return (
                  <div className="no-rated-movies">
                    <p>Вы еще не оценили ни одного фильма.</p>
                  </div>
                );
              }
              if (isErrorTab2) {
                return (
                  <div className="movie__list-alert">
                    <Alert
                      message="Error"
                      description="Oopse! Something went wrong. Wait, we'll fix it."
                      type="error"
                      showIcon
                    />
                  </div>
                );
              }
              if (!guestSessionId) {
                return null;
              }
              return (
                <div>
                  <div className="movieRate-disabled">
                    <MovieRate
                      guestSessionId={guestSessionId}
                      ratedMovies={getPaginatedRatedMovies()}
                      ratedCurrentPage={ratedCurrentPage}
                      onRatedPageChange={onRatedPageChange}
                    />
                  </div>
                  {ratedMovies.length > moviesPerPage && (
                    <MoviePagination
                      currentPage={ratedCurrentPage}
                      totalResults={totalRatedMovies}
                      onPageChange={onRatedPageChange}
                    />
                  )}
                </div>
              );
            })()
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
