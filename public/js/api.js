/**
 * FILE: api.js
 * PURPOSE: HTTP client for all fetch() calls to backend endpoints
 * DEPENDENCIES: None
 */

const API = {
    baseUrl: '/api',

    /**
     * Helper to process API responses and handle errors
     * @param {Response} response 
     * @returns {Promise<any>}
     */
    _handleResponse: async function(response) {
        const isJson = response.headers.get('content-type')?.includes('application/json');
        const data = isJson ? await response.json() : await response.text();

        if (!response.ok) {
            const errorObj = isJson ? data : { message: data, code: 'UNKNOWN_ERROR' };
            throw errorObj;
        }
        return data;
    },

    /**
     * Get all simulations for sidebar
     * @returns {Promise<Array>} Array of simulation list items
     */
    getSimulations: async function() {
        const res = await fetch(`${this.baseUrl}/simulations`);
        return this._handleResponse(res);
    },

    /**
     * Create a new simulation
     * @param {string} title 
     * @param {Array<{modelId, roleName}>} models 
     * @returns {Promise<Object>} Created simulation
     */
    createSimulation: async function(title, models) {
        const res = await fetch(`${this.baseUrl}/simulations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, models })
        });
        return this._handleResponse(res);
    },

    /**
     * Get a specific simulation by ID with full messages
     * @param {string} id 
     * @returns {Promise<Object>} Simulation object
     */
    getSimulation: async function(id) {
        const res = await fetch(`${this.baseUrl}/simulations/${id}`);
        return this._handleResponse(res);
    },

    /**
     * Rename a simulation
     * @param {string} id 
     * @param {string} newTitle 
     * @returns {Promise<Object>} Updated simulation list item
     */
    renameSimulation: async function(id, newTitle) {
        const res = await fetch(`${this.baseUrl}/simulations/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: newTitle })
        });
        return this._handleResponse(res);
    },

    /**
     * Delete a simulation
     * @param {string} id 
     * @returns {Promise<Object>} { success: true }
     */
    deleteSimulation: async function(id) {
        const res = await fetch(`${this.baseUrl}/simulations/${id}`, {
            method: 'DELETE'
        });
        return this._handleResponse(res);
    },

    /**
     * Trigger JSON export download via browser redirection
     * @param {string} id 
     */
    exportSimulation: function(id) {
        window.location.href = `${this.baseUrl}/simulations/${id}/export`;
    },

    /**
     * Send message to a single AI model
     * @param {string} simulationId 
     * @param {string} modelId 
     * @param {string} message 
     * @returns {Promise<Object>} { modelId, message: MessageObj }
     */
    sendMessage: async function(simulationId, modelId, message) {
        const res = await fetch(`${this.baseUrl}/messages/${simulationId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ modelId, message })
        });
        return this._handleResponse(res);
    },

    /**
     * Broadcast message to all AIs in a simulation
     * @param {string} simulationId 
     * @param {string} message 
     * @returns {Promise<Object>} { results: Array<{modelId, message}|{modelId, error}> }
     */
    broadcastMessage: async function(simulationId, message) {
        const res = await fetch(`${this.baseUrl}/messages/${simulationId}/broadcast`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message })
        });
        return this._handleResponse(res);
    }
};