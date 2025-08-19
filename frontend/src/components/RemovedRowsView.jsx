import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function RemovedRowsView() {
    // Get location state from navigation
    const location = useLocation();
    const navigate = useNavigate();

    // Get data from location state
    const { removedRowsData, columns, filename } = location.state || {};

    // Check if we have valid data
    const hasValidData = removedRowsData &&
        Array.isArray(removedRowsData) &&
        removedRowsData.length > 0 &&
        Array.isArray(columns);

    // Pagination and filtering state
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(20);
    const [paginatedRows, setPaginatedRows] = useState([]);
    const [totalPages, setTotalPages] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredRows, setFilteredRows] = useState([]);

    // Filter rows based on search term
    useEffect(() => {
        if (hasValidData) {
            if (!searchTerm) {
                setFilteredRows(removedRowsData);
            } else {
                const lowerSearchTerm = searchTerm.toLowerCase();
                const filtered = removedRowsData.filter(row => {
                    // Check if the search term exists in any column value
                    return Object.values(row.data).some(value => {
                        if (value === null) return false;
                        return String(value).toLowerCase().includes(lowerSearchTerm);
                    }) ||
                        // Also check if it matches the row index
                        String(row.row_index).includes(searchTerm);
                });
                setFilteredRows(filtered);
            }
            setCurrentPage(1); // Reset to first page when search changes
        } else {
            setFilteredRows([]);
        }
    }, [searchTerm, removedRowsData, hasValidData]);

    // Set up pagination based on filtered rows
    useEffect(() => {
        if (hasValidData) {
            const total = Math.ceil(filteredRows.length / rowsPerPage);
            setTotalPages(total > 0 ? total : 1);

            const startIdx = (currentPage - 1) * rowsPerPage;
            const endIdx = startIdx + rowsPerPage;
            setPaginatedRows(filteredRows.slice(startIdx, endIdx));
        } else {
            setPaginatedRows([]);
            setTotalPages(1);
        }
    }, [filteredRows, currentPage, rowsPerPage, hasValidData]);

    // Pagination handlers
    const handlePageChange = (page) => {
        console.log('Changing to page:', page);
        setCurrentPage(page);
    };

    const handleRowsPerPageChange = (e) => {
        const newRowsPerPage = parseInt(e.target.value, 10);
        console.log('Changing rows per page to:', newRowsPerPage);
        setRowsPerPage(newRowsPerPage);
        setCurrentPage(1);
    };

    // Handle back button click
    const handleBack = () => {
        navigate('/csv-cleaning');
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-6">
                <button
                    onClick={handleBack}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to CSV Cleaning
                </button>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
                <h1 className="text-2xl font-bold mb-4 text-gray-800">
                    🗑️ All Removed Rows
                </h1>

                {filename && (
                    <p className="text-gray-600 mb-4">
                        Showing all rows that were removed from <span className="font-semibold">{filename}</span> due to null values
                    </p>
                )}

                {!hasValidData ? (
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                        <p className="text-yellow-700">
                            No removed rows data available. Please go back to the CSV cleaning page and process a file first.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="mb-4 flex flex-wrap justify-between items-center">
                            <p className="text-gray-700 mb-2 md:mb-0">
                                <span className="font-semibold">Total rows removed:</span> {removedRowsData.length}
                            </p>

                            {/* Search input */}
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <input
                                    type="text"
                                    className="border border-gray-300 bg-white h-10 pl-10 pr-4 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Search removed rows..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        {searchTerm && filteredRows.length === 0 && (
                            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                                <p className="text-yellow-700">
                                    No rows match your search criteria.
                                </p>
                            </div>
                        )}

                        <div className="mb-4 flex justify-between items-center">
                            <div>
                                <label className="mr-2 text-sm text-gray-700">Rows per page:</label>
                                <select
                                    className="border rounded px-2 py-1 text-sm"
                                    value={rowsPerPage}
                                    onChange={handleRowsPerPageChange}
                                >
                                    <option value={10}>10</option>
                                    <option value={20}>20</option>
                                    <option value={50}>50</option>
                                    <option value={100}>100</option>
                                </select>
                            </div>
                            <div className="text-sm text-gray-700">
                                {filteredRows.length > 0 ?
                                    `Showing ${((currentPage - 1) * rowsPerPage) + 1} - ${Math.min(currentPage * rowsPerPage, filteredRows.length)} of ${filteredRows.length} rows` :
                                    'No rows to display'
                                }
                                {searchTerm && filteredRows.length !== removedRowsData.length &&
                                    ` (filtered from ${removedRowsData.length} total)`
                                }
                            </div>
                        </div>

                        <div className="overflow-x-auto rounded-lg border border-gray-200 shadow">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-red-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-red-500 uppercase tracking-wider">
                                            Row Index
                                        </th>
                                        {columns.map((column, index) => (
                                            <th
                                                key={index}
                                                scope="col"
                                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                            >
                                                {column}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {paginatedRows.map((row, rowIndex) => (
                                        <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-500">
                                                {row.row_index}
                                            </td>
                                            {columns.map((column, colIndex) => (
                                                <td
                                                    key={`${rowIndex}-${colIndex}`}
                                                    className={`px-6 py-4 whitespace-nowrap text-sm ${row.data[column] === null
                                                        ? 'bg-red-50 text-red-500 font-semibold italic'
                                                        : 'text-gray-500'
                                                        }`}
                                                >
                                                    {row.data[column] === null ? 'NULL' : row.data[column]}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination controls */}
                        <div className="mt-4 flex flex-wrap justify-between items-center">
                            <div className="mb-2 md:mb-0">
                                <label htmlFor="rows-per-page" className="mr-2 text-sm text-gray-600">Rows per page:</label>
                                <select
                                    id="rows-per-page"
                                    value={rowsPerPage}
                                    onChange={handleRowsPerPageChange}
                                    className="border border-gray-300 rounded px-2 py-1 text-sm"
                                >
                                    <option value={10}>10</option>
                                    <option value={20}>20</option>
                                    <option value={50}>50</option>
                                    <option value={100}>100</option>
                                </select>
                            </div>

                            <div className="text-sm text-gray-700 mb-2 md:mb-0">
                                {filteredRows.length > 0 ?
                                    `Showing ${((currentPage - 1) * rowsPerPage) + 1} - ${Math.min(currentPage * rowsPerPage, filteredRows.length)} of ${filteredRows.length} rows` :
                                    'No rows to display'
                                }
                                {searchTerm && filteredRows.length !== removedRowsData.length &&
                                    ` (filtered from ${removedRowsData.length} total)`
                                }
                            </div>

                            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                {/* Previous page */}
                                <button
                                    onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                                    disabled={currentPage === 1}
                                    className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                                        }`}
                                >
                                    <span className="sr-only">Previous</span>
                                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                </button>

                                {/* Page numbers */}
                                {[...Array(Math.min(5, totalPages))].map((_, idx) => {
                                    let pageNum;
                                    if (totalPages <= 5) {
                                        pageNum = idx + 1;
                                    } else if (currentPage <= 3) {
                                        pageNum = idx + 1;
                                    } else if (currentPage >= totalPages - 2) {
                                        pageNum = totalPages - 4 + idx;
                                    } else {
                                        pageNum = currentPage - 2 + idx;
                                    }

                                    if (pageNum <= totalPages) {
                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => handlePageChange(pageNum)}
                                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${currentPage === pageNum
                                                        ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                                    }`}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    }
                                    return null;
                                })}

                                {/* Next page */}
                                <button
                                    onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                                    disabled={currentPage === totalPages}
                                    className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                                        }`}
                                >
                                    <span className="sr-only">Next</span>
                                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </nav>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
