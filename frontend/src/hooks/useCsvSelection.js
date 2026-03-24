import { useEffect, useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setCsvMeta, clearCsvData } from '../store/csvSlice';
import { parseCsvFile, jsonToCsvString } from '../utils/csvParser';
import localforage from 'localforage';

// Dedicated IndexedDB store for raw CSV text (separate from redux-persist)
const csvStorage = localforage.createInstance({
    name: 'csv-workflow',
    storeName: 'csv_raw_content',
});

const CSV_RAW_KEY = 'raw_csv_text';

export const useCsvSelection = () => {
    const dispatch = useDispatch();
    const { columns, filename, metadata, rowCount } = useSelector((state) => state.csv);

    // Local state for the File object (needed for APIs that expect a File)
    const [selectedFile, setSelectedFile] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isRestoring, setIsRestoring] = useState(true);

    // On mount: restore File from IndexedDB if we have metadata in Redux
    useEffect(() => {
        let cancelled = false;

        const restore = async () => {
            if (filename && columns.length > 0) {
                try {
                    const rawCsv = await csvStorage.getItem(CSV_RAW_KEY);
                    if (rawCsv && !cancelled) {
                        const file = new File([rawCsv], filename, { type: 'text/csv' });
                        setSelectedFile(file);
                    }
                } catch (err) {
                    console.warn('Failed to restore CSV from IndexedDB', err);
                }
            }
            if (!cancelled) setIsRestoring(false);
        };

        restore();
        return () => { cancelled = true; };
    }, []); // Only on mount

    // Sync: if Redux is cleared externally, clear local state too
    useEffect(() => {
        if (!filename && selectedFile) {
            setSelectedFile(null);
        }
    }, [filename]); // eslint-disable-line react-hooks/exhaustive-deps

    /**
     * Handles a new file upload from a file input.
     * Parses the file, stores raw text in IndexedDB, and saves metadata to Redux.
     */
    const handleFileUpload = useCallback(async (file) => {
        if (!file) {
            dispatch(clearCsvData());
            setSelectedFile(null);
            await csvStorage.removeItem(CSV_RAW_KEY);
            return;
        }

        setIsProcessing(true);
        try {
            // Read raw text for compact IndexedDB storage
            const rawText = await file.text();

            // Parse for metadata
            const { data: parsedData, columns: parsedColumns } = await parseCsvFile(file);

            // Store raw CSV text in IndexedDB (compact, no JSON overhead)
            await csvStorage.setItem(CSV_RAW_KEY, rawText);

            // Store only lightweight metadata in Redux (persisted by redux-persist)
            dispatch(setCsvMeta({
                columns: parsedColumns,
                filename: file.name,
                rowCount: parsedData.length,
                metadata: {
                    original_rows: parsedData.length,
                },
            }));

            // Set local File object for API calls
            setSelectedFile(file);
        } catch (error) {
            console.error("Failed to parse CSV", error);
        } finally {
            setIsProcessing(false);
        }
    }, [dispatch]);

    /**
     * Updates the global state with new data (e.g. after cleaning).
     * Rebuilds the raw CSV and stores it in IndexedDB.
     */
    const updateGlobalCsv = useCallback(async (newData, newColumns, newFilename, newMetadata) => {
        try {
            const csvString = jsonToCsvString(newData, newColumns);
            await csvStorage.setItem(CSV_RAW_KEY, csvString);

            dispatch(setCsvMeta({
                columns: newColumns,
                filename: newFilename || filename,
                rowCount: newData.length,
                metadata: newMetadata || metadata,
            }));

            // Rebuild the File object
            const newFile = new File([csvString], newFilename || filename, { type: 'text/csv' });
            setSelectedFile(newFile);
        } catch (error) {
            console.error("Failed to update CSV", error);
        }
    }, [dispatch, filename, metadata]);

    const clearGlobalCsv = useCallback(async () => {
        dispatch(clearCsvData());
        setSelectedFile(null);
        await csvStorage.removeItem(CSV_RAW_KEY);
    }, [dispatch]);

    return {
        selectedFile,      // The File object (ready for FormData APIs)
        csvData: [],       // No longer stored in Redux — use selectedFile for API calls
        csvColumns: columns,
        csvFilename: filename,
        csvMetadata: metadata,
        csvRowCount: rowCount,
        handleFileUpload,
        updateGlobalCsv,
        clearGlobalCsv,
        isProcessing,
        isRestoring,       // True while restoring from IndexedDB on page load
    };
};
