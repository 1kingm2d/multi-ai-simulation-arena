/**
 * FILE: app.js
 * PURPOSE: Application orchestrator: init, auth, event binding, mode coordination
 * DEPENDENCIES: Utils, State, API, UI, Voice
 */

document.addEventListener('DOMContentLoaded', async () => {
    
    // 1. Initialize core systems
    State.init();
    Voice.init();
    
    // 2. Load sidebar data
    try {
        const sims = await API.getSimulations();
        State.setSimulationList(sims);
    } catch (e) {
        UI.showToast("Failed to load simulations.", "error");
    }

    // Restore last active simulation if any
    const lastActiveId = localStorage.getItem('lastActiveSimulationId');
    if (lastActiveId) {
        document.dispatchEvent(new CustomEvent('loadSimulation', { detail: lastActiveId }));
    }

    // Set initial mode UI
    UI.renderModeSwitch(State.activeMode);

    // --- State Listeners (Reactivity) ---
    State.on('simulationListChanged', list => UI.renderSidebar(list));
    State.on('activeSimulationChanged', sim => UI.renderSimulationCards(sim));
    State.on('modeChanged', mode => {
        UI.renderModeSwitch(mode);
        if (mode === 'chat') {
            Voice.stopListening();
            Voice.stopAll();
        }
    });
    State.on('speakingChanged', ({ previousId, currentId }) => {
        if (previousId) UI.hideSpeakingIndicator(previousId);
        if (currentId) UI.showSpeakingIndicator(currentId);
    });
    
    // --- Custom Event Listeners (From UI components) ---

    // Load Simulation
    document.addEventListener('loadSimulation', async (e) => {
        const id = e.detail;
        try {
            UI.showToast("Loading simulation...", "info");
            const sim = await API.getSimulation(id);
            State.setActiveSimulation(sim);
            // Re-render sidebar to highlight active
            UI.renderSidebar(State.simulationList);
        } catch (err) {
            UI.showToast(err.message || "Failed to load simulation.", "error");
        }
    });

    // Create Simulation
    document.addEventListener('createSimulation', async (e) => {
        const { title, models } = e.detail;
        try {
            const newSim = await API.createSimulation(title, models);
            UI.showToast("Simulation created successfully!", "success");
            
            // Refresh list
            const sims = await API.getSimulations();
            State.setSimulationList(sims);
            
            // Load the new simulation
            document.dispatchEvent(new CustomEvent('loadSimulation', { detail: newSim.id }));
        } catch (err) {
            UI.showToast(err.message || "Failed to create simulation.", "error");
        }
    });

    // Rename
    document.addEventListener('renameSimulation', async (e) => {
        const { id, title } = e.detail;
        try {
            await API.renameSimulation(id, title);
            const sims = await API.getSimulations();
            State.setSimulationList(sims);
            if (State.activeSimulation && State.activeSimulation.id === id) {
                State.activeSimulation.title = title;
            }
            UI.showToast("Simulation renamed.", "success");
        } catch (err) {
            UI.showToast("Failed to rename.", "error");
        }
    });

    // Delete
    document.addEventListener('deleteSimulation', async (e) => {
        const id = e.detail;
        try {
            await API.deleteSimulation(id);
            const sims = await API.getSimulations();
            State.setSimulationList(sims);
            
            if (State.activeSimulation && State.activeSimulation.id === id) {
                State.setActiveSimulation(null);
            }
            UI.showToast("Simulation deleted.", "success");
        } catch (err) {
            UI.showToast("Failed to delete.", "error");
        }
    });

    // Send Message to Single AI
    document.addEventListener('sendToModel', async (e) => {
        const { modelId, text } = e.detail;
        if (!State.activeSimulation) return;
        
        const simId = State.activeSimulation.id;
        
        // Optimistic UI - Add user message
        const userMsg = { role: 'user', content: text, timestamp: new Date().toISOString() };
        UI.appendMessageToCard(modelId, userMsg);
        State.activeSimulation.messages.push(userMsg); // Local sync

        UI.showThinkingIndicator(modelId);
        State.setThinking(modelId, true);

        try {
            const response = await API.sendMessage(simId, modelId, text);
            UI.hideThinkingIndicator(modelId);
            State.setThinking(modelId, false);
            
            UI.appendMessageToCard(modelId, response.message);
            State.activeSimulation.messages.push(response.message);
            
            if (State.activeMode === 'voice') {
                Voice.speakSequentially([{ modelId, text: response.message.content }]);
            }
        } catch (err) {
            UI.hideThinkingIndicator(modelId);
            State.setThinking(modelId, false);
            UI.showErrorOnCard(modelId, err.message || "Failed to get response.");
        }
    });

    // --- DOM Event Listeners ---

    // Top Bar Actions
    document.getElementById('mode-toggle').addEventListener('click', () => {
        State.setMode(State.activeMode === 'chat' ? 'voice' : 'chat');
    });

    document.getElementById('new-sim-btn').addEventListener('click', () => {
        UI.showNewSimModal();
    });

    // Broadcast (Send to All)
    const handleBroadcast = async () => {
        if (!State.activeSimulation) return;
        const input = document.getElementById('global-chat-input');
        const text = input.value.trim();
        if (!text) return;

        input.value = ''; // clear immediately
        
        // Optimistic UI updates
        const userMsg = { role: 'user', content: text, timestamp: new Date().toISOString() };
        UI.appendUserMessageToAllCards(userMsg);
        State.activeSimulation.messages.push(userMsg);

        const simId = State.activeSimulation.id;
        const models = State.activeSimulation.models.map(m => m.modelId);
        
        models.forEach(id => {
            UI.showThinkingIndicator(id);
            State.setThinking(id, true);
        });

        try {
            const data = await API.broadcastMessage(simId, text);
            
            // Process results
            const successfulResponses = [];
            
            data.results.forEach(result => {
                UI.hideThinkingIndicator(result.modelId);
                State.setThinking(result.modelId, false);

                if (result.error) {
                    UI.showErrorOnCard(result.modelId, result.error);
                } else if (result.message) {
                    UI.appendMessageToCard(result.modelId, result.message);
                    State.activeSimulation.messages.push(result.message);
                    successfulResponses.push({ modelId: result.modelId, text: result.message.content });
                }
            });

            // Queue all successful responses in voice mode
            if (State.activeMode === 'voice' && successfulResponses.length > 0) {
                Voice.speakSequentially(successfulResponses);
            }

        } catch (err) {
            // Global failure
            models.forEach(id => {
                UI.hideThinkingIndicator(id);
                State.setThinking(id, false);
                UI.showErrorOnCard(id, "Broadcast failed.");
            });
            UI.showToast(err.message || "Failed to broadcast message.", "error");
        }
    };

    document.getElementById('send-all-btn').addEventListener('click', handleBroadcast);
    document.getElementById('global-chat-input').addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleBroadcast();
        }
    });
    
    document.getElementById('clear-input-btn').addEventListener('click', () => {
        document.getElementById('global-chat-input').value = '';
    });

    // Voice Interactions
    const micBtn = document.getElementById('mic-btn');
    micBtn.addEventListener('click', () => {
        if (Voice.isListening) {
            Voice.stopListening();
            micBtn.classList.remove('border-cyber-pink', 'animate-pulse');
            micBtn.classList.add('border-gray-500', 'text-gray-500');
            UI.updateVoiceTranscript("Click to speak...");
        } else {
            micBtn.classList.add('border-cyber-pink', 'animate-pulse');
            micBtn.classList.remove('border-gray-500', 'text-gray-500');
            
            Voice.startListening(
                (interim) => UI.updateVoiceTranscript(interim, true), // On interim
                (final) => { // On final
                    UI.updateVoiceTranscript(final, false);
                    micBtn.classList.remove('animate-pulse');
                    // Automatically broadcast transcribed text
                    document.getElementById('global-chat-input').value = final;
                    handleBroadcast();
                },
                (err) => { // On error
                    UI.updateVoiceTranscript(err, false);
                    micBtn.classList.remove('animate-pulse');
                }
            );
        }
    });

    document.addEventListener('recognitionEnded', () => {
        micBtn.classList.remove('animate-pulse');
    });

    document.getElementById('stop-speech-btn').addEventListener('click', () => {
        Voice.stopAll();
    });

    // Mobile Sidebar Toggle
    document.getElementById('mobile-menu-btn').addEventListener('click', () => {
        const sidebar = document.getElementById('sidebar');
        sidebar.classList.toggle('-translate-x-full');
    });
    document.getElementById('close-sidebar-btn').addEventListener('click', () => {
        const sidebar = document.getElementById('sidebar');
        sidebar.classList.add('-translate-x-full');
    });
});