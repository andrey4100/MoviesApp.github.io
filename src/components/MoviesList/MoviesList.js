import React from 'react';

import MovieCard from '../MovieCard';

import './MoviesList.css';

function MovieList({ movies, genres, guestSessionId }) {
  if (!movies || movies.length === 0) {
    return <p>Фильмы не найдены.</p>;
  }

  return (
    <div className="movie__list">
      {movies.map((movie) => (
        <MovieCard key={movie.id} movie={movie} genres={genres} guestSessionId={guestSessionId} />
      ))}
    </div>
  );
}

export default MovieList;
