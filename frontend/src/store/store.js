import { configureStore } from '@reduxjs/toolkit';
import csvReducer from './csvSlice';

export const store = configureStore({
    reducer: {
        csv: csvReducer,
    },
});
