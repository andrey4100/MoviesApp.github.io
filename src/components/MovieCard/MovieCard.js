import React from 'react';
import { Tag, Rate } from 'antd';

import MovieService from '../../services/MovieService';

import './MovieCard.css';
import placeholderImage from '../../resourses/img/Out_Of_Poster.jpg';

function MovieCard({ movie, genres, guestSessionId, onRatingDeleted }) {
  const imageBaseUrl = 'https://image.tmdb.org/t/p/w185';
  const imageUrl = movie.img ? `${imageBaseUrl}${movie.img}` : placeholderImage;


  const handleRate = async (value) => {
    const movieService = new MovieService();
    try {
      if (value === 0 && movie.rating !== 0) {
        await movieService.deleteRatedMovie(guestSessionId, movie.id);
        if (onRatingDeleted) {
          onRatingDeleted(movie.id, null);
        }
      } else {
        await movieService.postRatedMovie(guestSessionId, movie.id, value);
        if (onRatingDeleted) {
          onRatingDeleted(movie.id, value);
        }
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Ошибка при оценке фильма:', error);
    }
  };

  const getRatingColor = (voteAverage) => {
    if (voteAverage <= 3) {
      return '#E90000';
    }
    if (voteAverage <= 5) {
      return '#E97E00';
    }
    if (voteAverage <= 7) {
      return '#E9D100';
    }
    return '#66E900';
  };

  const formattedVoteAverage = movie.rating != null ? movie.rating.toFixed(1) : null;
  const ratingColor = getRatingColor(movie.rating || 0);

  const truncateDescription = (description, titleLength, genreCount) => {
    if (!description) {
      return 'No description available';
    }

    let maxLength;
    if (titleLength > 44 && genreCount > 3) {
      maxLength = 40;
    } else if (titleLength > 44) {
      maxLength = 80;
    } else if (titleLength > 22 && genreCount > 3) {
      maxLength = 80;
    } else if (titleLength > 22 || genreCount > 3) {
      maxLength = 120;
    } else {
      maxLength = 160;
    }

    if (description.length <= maxLength) {
      return description;
    }

    const lastSpaceIndex = description.substring(0, maxLength).lastIndexOf(' ');
    return `${description.substring(0, lastSpaceIndex)}...`;
  };

  return (
    <div className="movie__card">
      <img className="movie__card-img" src={imageUrl} alt={movie.title} />
      <div className="movie__card-title">{movie.title}</div>
      <div className="movie__card-date">{movie.date}</div>
      <ul className="movie__genres-list">
        {movie.genres.map((genreId) => (
          <li className="movie__genres-item" key={genreId}>
            <Tag>{genres[genreId]}</Tag>
          </li>
        ))}
      </ul>
      <div className="movie__card-description">
        {truncateDescription(movie.description, movie.title.length, movie.genres.length)}
      </div>
      {formattedVoteAverage !== null && (
        <div className="rating-circle" style={{ borderColor: ratingColor }}>
          {formattedVoteAverage}
        </div>
      )}
      <div className="movie__card-rating">
        <Rate allowHalf count={10} onChange={handleRate} value={movie.rating || 0} style={{ fontSize: 16 }} />
      </div>
    </div>
  );
}

export default MovieCard;
