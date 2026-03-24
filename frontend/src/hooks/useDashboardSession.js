import { useState, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { sendDashboardMessage, applyDashboardFilters } from '../utils/dashboardApi';

const SESSION_KEY = 'dashboard_session_id';

/**
 * Custom hook managing the dashboard session lifecycle.
 *
 * Provides: sessionId, dashboard payload (cached), chatHistory,
 * loading state, error, and the send function.
 */
export function useDashboardSession() {
    // Generate or restore session ID
    const [sessionId] = useState(() => {
        const existing = localStorage.getItem(SESSION_KEY);
        if (existing) return existing;
        const id = uuidv4();
        localStorage.setItem(SESSION_KEY, id);
        return id;
    });

    const [dashboard, setDashboard] = useState(null);
    const [chatHistory, setChatHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isFiltering, setIsFiltering] = useState(false);
    const [error, setError] = useState(null);

    // Track whether we've already received a dashboard
    const hasDashboard = useRef(false);

    /**
     * Send a message (and optionally a CSV file) to the backend.
     * On the very first call, `file` should be provided.
     */
    const sendMessage = useCallback(async (question, file) => {
        setIsLoading(true);
        setError(null);

        try {
            const result = await sendDashboardMessage(sessionId, question, file);

            // Cache dashboard on first successful call — never overwrite with null
            if (result.dashboard && !hasDashboard.current) {
                setDashboard(result.dashboard);
                hasDashboard.current = true;
            }

            setChatHistory(result.chat_history || []);

            return result;
        } catch (err) {
            const msg = err?.response?.data?.detail || err?.response?.data?.error || err.message;
            setError(msg);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [sessionId]);

    /**
     * Apply UI filters to the backend DataFrame and fetch the updated dashboard charts.
     */
    const applyFilters = useCallback(async (filters) => {
        setIsFiltering(true);
        setError(null);

        try {
            const result = await applyDashboardFilters(sessionId, filters);
            if (result.dashboard) {
                // Completely replace charts, preserve the rest (filters, summary, etc.)
                setDashboard(prev => ({
                    ...prev,
                    charts: result.dashboard.charts
                }));
            }
            return result;
        } catch (err) {
            const msg = err?.response?.data?.detail || err?.response?.data?.error || err.message;
            setError(msg);
            throw err;
        } finally {
            setIsFiltering(false);
        }
    }, [sessionId]);

    /**
     * Reset the session (e.g. to upload a new file).
     */
    const resetSession = useCallback(() => {
        const newId = uuidv4();
        localStorage.setItem(SESSION_KEY, newId);
        setDashboard(null);
        setChatHistory([]);
        setError(null);
        hasDashboard.current = false;
        window.location.reload();
    }, []);

    return {
        sessionId,
        dashboard,
        chatHistory,
        isLoading,
        isFiltering,
        error,
        sendMessage,
        applyFilters,
        resetSession,
    };
}
