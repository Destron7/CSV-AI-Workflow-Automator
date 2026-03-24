import localforage from 'localforage';

/**
 * Session Guard — clears persisted CSV data when the browser session ends.
 *
 * How it works:
 *  - `sessionStorage` holds a "session alive" marker. It survives page refreshes
 *    but is wiped when the browser (or the last tab) closes.
 *  - `localStorage` holds a heartbeat timestamp updated every 2 seconds by any
 *    active tab. This lets a newly opened tab detect whether other tabs are alive.
 *
 * On app startup:
 *  1. If `sessionStorage` has the marker → this is a page refresh → do nothing.
 *  2. If `sessionStorage` has NO marker → either a new tab or a new browser session:
 *     a. Check the heartbeat. If another tab updated it within the last 5 seconds,
 *        assume an active session → just set the marker (cross-tab persistence).
 *     b. If no recent heartbeat → this is a fresh browser session → clear all
 *        persisted CSV data, then set the marker.
 *  3. Start a heartbeat interval so other tabs know this tab is alive.
 */

const SESSION_MARKER = 'csv_session_alive';
const HEARTBEAT_KEY = 'csv_session_heartbeat';
const HEARTBEAT_STALE_MS = 5000; // 5 seconds

// LocalForage instance matching the one in useCsvSelection.js
const csvStorage = localforage.createInstance({
    name: 'csv-workflow',
    storeName: 'csv_raw_content',
});

// LocalForage instance matching redux-persist in store.js
const reduxStorage = localforage.createInstance({
    name: 'csv-workflow',
    storeName: 'redux_persist',
});

/**
 * Clear all persisted CSV data from IndexedDB and localStorage.
 */
async function clearAllPersistedData() {
    try {
        await csvStorage.clear();
        await reduxStorage.clear();

        // Clear dashboard session and chat-related localStorage items
        localStorage.removeItem('dashboard_session_id');
        ['csvChat_messages', 'csvChat_sessionId', 'csvChat_csvInfo', 'csvChat_sessionFileName']
            .forEach(k => localStorage.removeItem(k));

        console.info('[SessionGuard] Cleared persisted CSV data (stale session)');
    } catch (err) {
        console.warn('[SessionGuard] Failed to clear data:', err);
    }
}

/**
 * Call this ONCE at app startup, before React renders.
 * It runs synchronously for the check, but data clearing is async (fire-and-forget
 * for IndexedDB — redux-persist will see an empty store on rehydration).
 */
export function initSessionGuard() {
    const isRefresh = sessionStorage.getItem(SESSION_MARKER);

    if (!isRefresh) {
        // No marker → new tab or new browser session
        const lastHeartbeat = parseInt(localStorage.getItem(HEARTBEAT_KEY) || '0', 10);
        const isOtherTabAlive = (Date.now() - lastHeartbeat) < HEARTBEAT_STALE_MS;

        if (!isOtherTabAlive) {
            // No active tabs → fresh browser session → clear stale data
            clearAllPersistedData();
        }

        sessionStorage.setItem(SESSION_MARKER, 'true');
    }

    // Start heartbeat so other tabs (and future loads) know this tab is alive
    const updateHeartbeat = () => {
        localStorage.setItem(HEARTBEAT_KEY, String(Date.now()));
    };
    updateHeartbeat();
    setInterval(updateHeartbeat, 2000);
}
