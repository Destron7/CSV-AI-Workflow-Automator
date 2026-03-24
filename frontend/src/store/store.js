import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import localforage from 'localforage';
import csvReducer from './csvSlice';

// Configure localforage to use IndexedDB (large quota, survives reloads)
localforage.config({
    name: 'csv-workflow',
    storeName: 'redux_persist',
});

const persistConfig = {
    key: 'csv-workflow',
    storage: localforage, // IndexedDB — no 5MB quota limit
};

const persistedCsvReducer = persistReducer(persistConfig, csvReducer);

export const store = configureStore({
    reducer: {
        csv: persistedCsvReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                // redux-persist dispatches non-serializable actions internally
                ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
            },
        }),
});

export const persistor = persistStore(store);
