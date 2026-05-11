/**
 * FILE: utils.js
 * PURPOSE: Pure utility functions: sanitize, formatDate, estimateTokens, debounce
 * DEPENDENCIES: None
 */

const Utils = {
    /**
     * Removes dangerous HTML tags to prevent XSS
     * @param {string} str - Raw input string
     * @returns {string} Sanitized string
     */
    sanitize: function(str) {
        if (!str) return '';
        const temp = document.createElement('div');
        temp.textContent = str;
        return temp.innerHTML;
    },

    /**
     * Escapes HTML specific characters
     * @param {string} str - String to escape
     * @returns {string} Escaped HTML string
     */
    escapeHTML: function(str) {
        return str
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    },

    /**
     * Formats an ISO date string to a human-readable format
     * @param {string} isoString - Date string
     * @returns {string} Formatted date (e.g., "Mar 15, 2026")
     */
    formatDate: function(isoString) {
        const date = new Date(isoString);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    },

    /**
     * Formats a date relative to now (e.g., "2 hours ago")
     * @param {string} isoString - Date string
     * @returns {string} Relative time string
     */
    formatRelativeTime: function(isoString) {
        const date = new Date(isoString);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);
        
        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
        
        return this.formatDate(isoString);
    },

    /**
     * Roughly estimates token count (4 chars approx = 1 token)
     * @param {string} text - Text to estimate
     * @returns {number} Estimated token count
     */
    estimateTokens: function(text) {
        if (!text) return 0;
        return Math.ceil(text.length / 4);
    },

    /**
     * Creates a debounced version of a function
     * @param {Function} fn - Function to debounce
     * @param {number} delayMs - Delay in milliseconds
     * @returns {Function} Debounced function
     */
    debounce: function(fn, delayMs) {
        let timeoutId;
        return function(...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => fn.apply(this, args), delayMs);
        };
    },

    /**
     * Generates a random alphanumeric ID for optimistic UI elements
     * @returns {string} Random ID
     */
    generateId: function() {
        return Math.random().toString(36).substring(2, 11);
    },

    /**
     * Truncates a string and appends ellipsis if it exceeds maxLength
     * @param {string} str - String to truncate
     * @param {number} maxLength - Maximum length
     * @returns {string} Truncated string
     */
    truncate: function(str, maxLength) {
        if (!str) return '';
        if (str.length <= maxLength) return str;
        return str.substring(0, maxLength) + '…';
    },

    /**
     * Converts a string to a URL-safe slug
     * @param {string} str - Input string
     * @returns {string} Slugified string
     */
    slugify: function(str) {
        return str
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }
};