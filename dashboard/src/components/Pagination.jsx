import React from 'react';
import './Pagination.css';


const Pagination = ({ currentPage, totalPages, onPageChange, totalResults }) => {
    if (totalPages <= 1) return null;

    const renderPageNumbers = () => {
        const pages = [];
        const delta = 2;

        for (let i = 1; i <= totalPages; i++) {
            if (
                i === 1 ||
                i === totalPages ||
                (i >= currentPage - delta && i <= currentPage + delta)
            ) {
                pages.push(
                    <button
                        key={i}
                        className={`pagination__btn ${currentPage === i ? 'pagination__btn--active' : ''}`}
                        onClick={() => onPageChange(i)}
                    >
                        {i}
                    </button>
                );
            } else if (
                (i === currentPage - delta - 1 && i > 1) ||
                (i === currentPage + delta + 1 && i < totalPages)
            ) {
                pages.push(<span key={i} className="pagination__dots">...</span>);
            }
        }
        return pages;
    };

    return (
        <div className="pagination-container">
            {totalResults !== undefined && (
                <div className="pagination__meta">
                    Showing total <strong>{totalResults}</strong> results
                </div>
            )}
            <div className="pagination__controls">
                <button
                    className="pagination__arrow"
                    disabled={currentPage === 1}
                    onClick={() => onPageChange(currentPage - 1)}
                >
                    &larr; Prev
                </button>

                <div className="pagination__numbers">
                    {renderPageNumbers()}
                </div>

                <button
                    className="pagination__arrow"
                    disabled={currentPage === totalPages}
                    onClick={() => onPageChange(currentPage + 1)}
                >
                    Next &rarr;
                </button>
            </div>
        </div>
    );
};

export default Pagination;
