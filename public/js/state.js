/**
 * FILE: state.js
 * PURPOSE: Central state manager: single source of truth for all client data
 * DEPENDENCIES: Utils
 */

const State = {
    // --- State Properties ---
    activeSimulation: null,
    simulationList: [],
    activeMode: 'chat', // 'chat' | 'voice'
    thinkingModels: new Set(),
    speakingModelId: null,
    voiceSettings: {},
    isLoading: false,
    
    // Simple event dispatcher
    listeners: {},

    /**
     * Initializes state, loading any cached preferences
     */
    init: function() {
        try {
            const savedSettings = localStorage.getItem('voiceSettings');
            if (savedSettings) {
                this.voiceSettings = JSON.parse(savedSettings);
            }
            const savedMode = localStorage.getItem('activeMode');
            if (savedMode && (savedMode === 'chat' || savedMode === 'voice')) {
                this.activeMode = savedMode;
            }
        } catch (e) {
            console.error('Failed to load local settings', e);
        }
    },

    /**
     * Subscribe to state changes
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     */
    on: function(event, callback) {
        if (!this.listeners[event]) this.listeners[event] = [];
        this.listeners[event].push(callback);
    },

    /**
     * Notify listeners of a state change
     * @param {string} event - Event name
     * @param {any} data - Payload
     */
    emit: function(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(cb => cb(data));
        }
    },

    // --- State Mutators ---

    setSimulationList: function(list) {
        this.simulationList = list;
        this.emit('simulationListChanged', this.simulationList);
    },

    setActiveSimulation: function(simulation) {
        this.activeSimulation = simulation;
        this.thinkingModels.clear();
        this.speakingModelId = null;
        if (simulation) {
            localStorage.setItem('lastActiveSimulationId', simulation.id);
        }
        this.emit('activeSimulationChanged', this.activeSimulation);
    },

    setMode: function(mode) {
        this.activeMode = mode;
        localStorage.setItem('activeMode', mode);
        this.emit('modeChanged', this.activeMode);
    },

    setThinking: function(modelId, isThinking) {
        if (isThinking) {
            this.thinkingModels.add(modelId);
        } else {
            this.thinkingModels.delete(modelId);
        }
        this.emit('thinkingChanged', { modelId, isThinking });
    },

    setSpeaking: function(modelId) {
        const previousId = this.speakingModelId;
        this.speakingModelId = modelId;
        this.emit('speakingChanged', { previousId, currentId: modelId });
    },

    addMessage: function(message) {
        if (!this.activeSimulation) return;
        this.activeSimulation.messages.push(message);
        this.emit('messageAdded', message);
    },

    updateVoiceSettings: function(modelId, settings) {
        this.voiceSettings[modelId] = { ...this.voiceSettings[modelId], ...settings };
        localStorage.setItem('voiceSettings', JSON.stringify(this.voiceSettings));
        this.emit('voiceSettingsChanged', { modelId, settings: this.voiceSettings[modelId] });
    },

    getSimulationContext: function() {
        return this.activeSimulation ? this.activeSimulation.messages : [];
    }
};