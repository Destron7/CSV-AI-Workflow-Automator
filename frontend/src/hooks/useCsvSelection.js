import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setCsvData, clearCsvData } from '../store/csvSlice';
import { parseCsvFile, jsonToCsvString } from '../utils/csvParser';

export const useCsvSelection = () => {
    const dispatch = useDispatch();
    const { data, columns, filename, metadata } = useSelector((state) => state.csv);

    // Local state for the File object (needed for APIs that expect a File)
    const [selectedFile, setSelectedFile] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // Sync Redux state to local File object
    useEffect(() => {
        if (data && data.length > 0 && columns.length > 0 && filename) {
            // Check if we need to regenerate the file (e.g. if Redux changed but local file is stale/null)
            // We use a simple check: if selectedFile.name matches filename, we assume it's mostly in sync, 
            // BUT for "Cleaning", the content might change while filename stays same. 
            // So we can arguably always regenerate if they mismatch or if we want to be sure.
            // For performance, maybe only if selectedFile is null or name mismatches?
            // User requirement: "If the choosen file is cleaned then replace that with the current value"

            // Reconstruct the file content
            const csvString = jsonToCsvString(data, columns);
            const newFile = new File([csvString], filename, { type: 'text/csv' });
            setSelectedFile(newFile);
        } else if (!filename && selectedFile) {
            // Redux was cleared external to this hook
            setSelectedFile(null);
        }
    }, [data, columns, filename]); // Dependency on Redux state

    /**
     * Handles a new file upload from a file input.
     * Parses the file and updates Redux, which will then trigger the useEffect to update selectedFile.
     */
    const handleFileUpload = async (file) => {
        if (!file) {
            dispatch(clearCsvData());
            setSelectedFile(null);
            return;
        }

        setIsProcessing(true);
        try {
            const { data: parsedData, columns: parsedColumns } = await parseCsvFile(file);

            dispatch(setCsvData({
                data: parsedData,
                columns: parsedColumns,
                filename: file.name,
                metadata: {
                    original_rows: parsedData.length,
                    // We can retain or reset other metadata. For a fresh upload, reset.
                }
            }));
            // selectedFile will be updated by the useEffect
        } catch (error) {
            console.error("Failed to parse CSV", error);
            // Optionally handle error state here or let component handle it
        } finally {
            setIsProcessing(false);
        }
    };

    /**
     * Updates the global state with new data (e.g. after cleaning).
     */
    const updateGlobalCsv = (newData, newColumns, newFilename, newMetadata) => {
        dispatch(setCsvData({
            data: newData,
            columns: newColumns,
            filename: newFilename || filename,
            metadata: newMetadata || metadata
        }));
    };

    const clearGlobalCsv = () => {
        dispatch(clearCsvData());
    }

    return {
        selectedFile,      // The File object (ready for FormData APIs)
        csvData: data,     // JSON data
        csvColumns: columns,
        csvFilename: filename,
        csvMetadata: metadata,
        handleFileUpload,  // Call this with the file from <input type="file" />
        updateGlobalCsv,   // Call this after cleaning
        clearGlobalCsv,
        isProcessing
    };
};
