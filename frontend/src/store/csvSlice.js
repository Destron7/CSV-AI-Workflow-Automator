import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    // Only lightweight metadata — NO row data
    columns: [],
    filename: '',
    metadata: {},
    sessionId: null,
    rowCount: 0,
};

const csvSlice = createSlice({
    name: 'csv',
    initialState,
    reducers: {
        setCsvMeta: (state, action) => {
            const { columns, filename, metadata, rowCount } = action.payload;
            state.columns = columns;
            state.filename = filename;
            state.metadata = metadata || {};
            state.rowCount = rowCount || 0;
        },
        setSessionId: (state, action) => {
            state.sessionId = action.payload;
        },
        clearCsvData: (state) => {
            state.columns = [];
            state.filename = '';
            state.metadata = {};
            state.sessionId = null;
            state.rowCount = 0;
        },
    },
});

export const { setCsvMeta, setSessionId, clearCsvData } = csvSlice.actions;
export default csvSlice.reducer;
