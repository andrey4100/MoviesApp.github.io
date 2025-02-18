/* eslint-disable import/extensions */
import React, { useContext, useEffect } from 'react';

import MovieList from '../MoviesList';
import GenresContext from '../GenresContext';

function MovieRate({ guestSessionId, ratedMovies, onRatingDeleted, onRatedPageChange, ratedCurrentPage }) {
  const genres = useContext(GenresContext);

  useEffect(() => {
    // Логика перемещения на предыдущую страницу
    if (ratedMovies.length === 0) {
      if (ratedCurrentPage > 1) {
        onRatedPageChange(ratedCurrentPage - 1); 
      } else {
        onRatedPageChange(1); 
      }
    }
  }, [ratedMovies.length, ratedCurrentPage, onRatedPageChange]);

  const renderContent = () => (
    <MovieList 
      movies={ratedMovies} 
      genres={genres} 
      guestSessionId={guestSessionId} 
      onRatingDeleted={onRatingDeleted} 
    />
  );

  return (
    <div>
      {ratedMovies.length > 0 ? (
        <>{renderContent()}</>
      ) : (
        <p>Вы еще не оценили ни одного фильма.</p>
      )}
    </div>
  );
}

export default MovieRate;
