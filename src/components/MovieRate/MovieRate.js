/* eslint-disable import/extensions */
import React, { useContext } from 'react';

import MovieList from '../MoviesList';
import GenresContext from '../GenresContext';

function MovieRate({ guestSessionId, ratedMovies }) {
  const genres = useContext(GenresContext);

  const renderContent = () => <MovieList movies={ratedMovies} genres={genres} guestSessionId={guestSessionId} />;

  return <div>{ratedMovies.length > 0 ? <>{renderContent()}</> : <p>Вы еще не оценили ни одного фильма.</p>}</div>;
}

export default MovieRate;
