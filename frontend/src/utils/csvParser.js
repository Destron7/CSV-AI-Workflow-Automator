import Papa from 'papaparse';

/**
 * Parses a CSV file object into JSON data and columns.
 * @param {File} file - The CSV file object.
 * @returns {Promise<{data: Array<Object>, columns: Array<string>}>}
 */
export const parseCsvFile = (file) => {
    return new Promise((resolve, reject) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                if (results.errors && results.errors.length > 0) {
                    console.warn("CSV Parsing errors:", results.errors);
                }
                const data = results.data;
                const columns = results.meta.fields || [];
                resolve({ data, columns });
            },
            error: (error) => {
                reject(error);
            }
        });
    });
};

/**
 * Reconstructs a CSV string from JSON data.
 * @param {Array<Object>} data - Array of row objects.
 * @param {Array<string>} columns - Array of column names.
 * @returns {string} - The CSV string.
 */
export const jsonToCsvString = (data, columns) => {
    if (!data || !columns) return '';
    return Papa.unparse({
        fields: columns,
        data: data
    });
};
