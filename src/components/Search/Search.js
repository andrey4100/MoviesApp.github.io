import React from 'react';

import { Input } from 'antd';
import { debounce } from 'lodash';

import './Search.css';

function Search({ searchMovies }) {
  const debouncedSearch = debounce((currValue) => {
    searchMovies(currValue);
  }, 500);

  const onValueChange = (event) => {
    const target = event.target.value;

    if (target.trim() === '') {
      debouncedSearch('');
    }

    debouncedSearch(target);
  };

  return (
    <div className="search-container">
      <Input className="search" placeholder="Type to search..." size="large" onChange={onValueChange} allowClear />
    </div>
  );
}

export default Search;
