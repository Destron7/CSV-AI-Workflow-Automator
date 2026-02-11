import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    data: [],
    columns: [],
    filename: '',
    metadata: {},
};

const csvSlice = createSlice({
    name: 'csv',
    initialState,
    reducers: {
        setCsvData: (state, action) => {
            const { data, columns, filename, metadata } = action.payload;
            state.data = data;
            state.columns = columns;
            state.filename = filename;
            state.metadata = metadata || {};
        },
        clearCsvData: (state) => {
            state.data = [];
            state.columns = [];
            state.filename = '';
            state.metadata = {};
        },
    },
});

export const { setCsvData, clearCsvData } = csvSlice.actions;
export default csvSlice.reducer;
