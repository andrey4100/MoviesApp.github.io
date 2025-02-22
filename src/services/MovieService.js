import { format, parseISO } from 'date-fns';
import { enUS } from 'date-fns/locale';

class MovieService {
  apiBase = 'https://api.themoviedb.org/3'; // Базовый URL API

  apiKey = 'e2e43d7fe98688bb25fcaa78ca64ec4f'; // Сгенерированный ключ API

  // Универсальный метод для запроса данных
  // eslint-disable-next-line class-methods-use-this
  getResource = async (url) => {
    try {
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Could not fetch ${url}, status ${res.status}`);
      }
      return await res.json();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Ошибка при выполнении запроса:', err);
      throw err;
    }
  };

  // Метод для получения списка фильмов
  getAllMovies = async (value, page) => {
    const res = await this.getResource(
      `${this.apiBase}/search/movie?api_key=${this.apiKey}&language=en-US&page=${page}&query='${value}'`
    );

    const movies = res.results.map(this.transformMovie);
    const totalMovies = res.total_results;
    return { movies, totalMovies };
  };

  // Метод для получения популярных фильмов
  getPopularMovies = async (page) => {
    const res = await this.getResource(
      `${this.apiBase}/movie/popular?api_key=${this.apiKey}&language=en-US&page=${page}`
    );

    const movies = res.results.map(this.transformMovie);
    const totalMovies = res.total_results;
    const totalPages = res.total_pages;

    return { movies, totalMovies, totalPages };
  };

  // Метод для получения списка жанров
  getGenres = async () => {
    const res = await this.getResource(`${this.apiBase}/genre/movie/list?api_key=${this.apiKey}&language=en-US`);

    const genres = res.genres.reduce((acc, genre) => {
      acc[genre.id] = genre.name;
      return acc;
    }, {});

    return genres;
  };

  // Создание гостевой сессии
  createGuestSession = async () => {
    const res = await this.getResource(`${this.apiBase}/authentication/guest_session/new?api_key=${this.apiKey}`);
    return res.guest_session_id;
  };

  // Метод для получения оцененных фильмов
  getRatedMovies = async (guestSessionId) => {
    try {
      const res = await this.getResource(
        `${this.apiBase}/guest_session/${guestSessionId}/rated/movies?api_key=${this.apiKey}&language=en-US`
      );

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const allRatedMovies = {};
      res.results.forEach((movie) => {
        allRatedMovies[movie.id] = movie.rating;
      });

      return allRatedMovies;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Ошибка при получении оцененных фильмов:', error);
      throw error;
    }
  };

  // Метод для размещения рейтинга
  postRatedMovie = async (guestSessionId, movieId, rating) => {
    try {
      const body = {
        value: rating,
      };

      const res = await fetch(
        `${this.apiBase}/movie/${movieId}/rating?api_key=${this.apiKey}&guest_session_id=${guestSessionId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json;charset=utf-8',
          },
          body: JSON.stringify(body),
        }
      );
      return await res.json();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Ошибка при отправке рейтинга:', error);
      throw error;
    }
  };

  // Метод для удаления рейтинга
  deleteRatedMovie = async (guestSessionId, movieId) => {
    try {
      const res = await fetch(
        `${this.apiBase}/movie/${movieId}/rating?api_key=${this.apiKey}&guest_session_id=${guestSessionId}`,
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json;charset=utf-8' },
        }
      );

      if (!res.ok) {
        throw new Error(`Could not delete rating, status ${res.status}`);
      }

      return res.status;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Ошибка при удалении рейтинга:', error);
      throw error;
    }
  };

  // Метод для преобразования даты в нужынй формат
  // eslint-disable-next-line class-methods-use-this
  transformMovie = (movie) => {
    const formatDate = (movieDate) => format(parseISO(movieDate), 'MMMM d, y', { locale: enUS });
    const formattedDate = movie.release_date ? formatDate(movie.release_date) : null;

    return {
      id: movie.id,
      title: movie.title,
      description: movie.overview,
      date: formattedDate,
      img: movie.poster_path,
      genres: movie.genre_ids,
      vote_average: movie.vote_average,
    };
  };
}

export default MovieService;
