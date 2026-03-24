import axios from 'axios';

const API_BASE = 'http://localhost:8000/api/v1/dashboard';

/**
 * Send a dashboard-chat message to the backend.
 *
 * @param {string} sessionId — UUID identifying this browser session
 * @param {string} question — user's natural language question
 * @param {File} [file] — CSV file (only on first call)
 * @returns {Promise<{answer: string, dashboard: object|null, chat_history: Array}>}
 */
export async function sendDashboardMessage(sessionId, question, file) {
    const form = new FormData();
    form.append('session_id', sessionId);
    form.append('question', question);
    if (file) {
        form.append('file', file);
    }

    const { data } = await axios.post(`${API_BASE}/dashboard-chat`, form);
    return data;
}

/**
 * Send active filters to the backend to get an updated dashboard payload.
 *
 * @param {string} sessionId — UUID identifying this browser session
 * @param {object} filters — key-value object of active filters
 * @returns {Promise<{dashboard: object}>}
 */
export async function applyDashboardFilters(sessionId, filters) {
    const form = new FormData();
    form.append('session_id', sessionId);
    form.append('filters', JSON.stringify(filters));

    const { data } = await axios.post(`${API_BASE}/apply-filters`, form);
    return data;
}
