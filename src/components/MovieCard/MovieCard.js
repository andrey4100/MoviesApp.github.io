import React from 'react'; // Import useState
import { Tag, Rate } from 'antd';

import MovieService from '../../services/MovieService';

import './MovieCard.css';
import placeholderImage from '../../resourses/img/Out_Of_Poster.jpg';

function MovieCard({ movie, genres, guestSessionId, movieRatings, onRatingChange }) {
  const imageBaseUrl = 'https://image.tmdb.org/t/p/w185';
  const imageUrl = movie.img ? `${imageBaseUrl}${movie.img}` : placeholderImage;
  const movieService = new MovieService();

  const rating = movieRatings[movie.id] || 0;

  const handleRate = async (value) => {
    try {
      onRatingChange(movie.id, value);

      if (value === 0) {
        await movieService.deleteRatedMovie(guestSessionId, movie.id);
      } else {
        await movieService.postRatedMovie(guestSessionId, movie.id, value);
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

  const formattedVoteAverage = movie.vote_average != null ? movie.vote_average.toFixed(1) : null;
  const ratingColor = getRatingColor(movie.vote_average);

  const truncateDescription = (description, titleLength, genreCount) => {
    if (!description) {
      return 'No description available';
    }

    let maxLength = 160; 

    if (titleLength > 44) {
      maxLength = genreCount > 3 ? 40 : 80;
    } else if (titleLength > 22 || genreCount > 3) {
      maxLength = 120;
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
      {formattedVoteAverage !== null && formattedVoteAverage !== '0.0' && (
        <div className="rating-circle" style={{ borderColor: ratingColor }}>
          {formattedVoteAverage}
        </div>
      )}
      <div className="movie__card-rating">
        <Rate className="movie__card-rate" allowHalf count={10} onChange={handleRate} value={rating} />
      </div>
    </div>
  );
}

export default MovieCard;
