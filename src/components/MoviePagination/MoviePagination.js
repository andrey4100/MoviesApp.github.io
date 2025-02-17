import React from 'react';
import { Pagination } from "antd";

import "./MoviePagination.css"

function MoviePagination({ currentPage, totalResults, onPageChange }) {
  return (
    <div className="pagination-container">
      <Pagination
        current={currentPage}
        total={totalResults}
        pageSize={20}
        onChange={onPageChange}
        showSizeChanger={false}
      />
    </div>
  );
}

export default MoviePagination;