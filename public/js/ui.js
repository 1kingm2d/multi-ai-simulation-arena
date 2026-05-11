/**
 * FILE: ui.js
 * PURPOSE: DOM rendering engine: cards, sidebar, modals, indicators
 * DEPENDENCIES: Utils, State
 */

const UI = {
    elements: {
        sidebar: document.getElementById('sidebar'),
        simList: document.getElementById('simulation-list'),
        aiGrid: document.getElementById('ai-grid'),
        globalInputArea: document.getElementById('global-input-area'),
        chatInputContainer: document.getElementById('chat-input-container'),
        voiceInputContainer: document.getElementById('voice-input-container'),
        globalChatInput: document.getElementById('global-chat-input'),
        modalContainer: document.getElementById('modal-container'),
        toastContainer: document.getElementById('toast-container'),
        modeThumb: document.getElementById('mode-toggle-thumb'),
        lblChat: document.getElementById('label-chat-mode'),
        lblVoice: document.getElementById('label-voice-mode'),
        micBtn: document.getElementById('mic-btn'),
        stopSpeechBtn: document.getElementById('stop-speech-btn'),
        voiceTranscript: document.getElementById('voice-transcript')
    },

    /**
     * Render the sidebar list of simulations
     * @param {Array} simulations 
     */
    renderSidebar: function(simulations) {
        const { simList } = this.elements;
        simList.innerHTML = '';

        if (!simulations || simulations.length === 0) {
            simList.innerHTML = '<div class="text-sm text-gray-500 p-2 text-center">No simulations found.</div>';
            return;
        }

        simulations.forEach(sim => {
            const isActive = State.activeSimulation && State.activeSimulation.id === sim.id;
            const bgClass = isActive ? 'bg-white/10 shadow-[0_0_10px_rgba(255,255,255,0.1)]' : 'hover:bg-white/5';
            
            const div = document.createElement('div');
            div.className = `p-3 rounded cursor-pointer transition-all ${bgClass} border border-transparent hover:border-white/10 group relative`;
            div.innerHTML = `
                <div class="flex justify-between items-start mb-1">
                    <h3 class="font-semibold text-gray-200 truncate pr-2" title="${Utils.escapeHTML(sim.title)}">${Utils.escapeHTML(sim.title)}</h3>
                    <span class="text-xs px-1.5 py-0.5 rounded bg-gray-800 text-gray-400 shrink-0 border border-white/5">${sim.modelCount} AIs</span>
                </div>
                <div class="text-xs text-gray-500 mb-1 flex justify-between">
                    <span>${Utils.formatRelativeTime(sim.updatedAt)}</span>
                </div>
                <div class="text-xs text-gray-400 italic truncate">${Utils.escapeHTML(sim.preview || 'No messages yet')}</div>
                
                <div class="absolute right-2 top-2 hidden group-hover:flex gap-1 bg-[#0a0a0f]/90 p-1 rounded backdrop-blur shadow-lg border border-white/10">
                    <button class="action-btn rename-btn p-1 text-gray-400 hover:text-cyber-cyan transition-colors" data-id="${sim.id}" title="Rename">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                    </button>
                    <button class="action-btn export-btn p-1 text-gray-400 hover:text-cyber-green transition-colors" data-id="${sim.id}" title="Export JSON">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                    </button>
                    <button class="action-btn delete-btn p-1 text-gray-400 hover:text-cyber-pink transition-colors" data-id="${sim.id}" title="Delete">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                </div>
            `;
            
            div.addEventListener('click', (e) => {
                if (e.target.closest('.action-btn')) return; // ignore action buttons
                document.dispatchEvent(new CustomEvent('loadSimulation', { detail: sim.id }));
            });

            // Action listeners
            div.querySelector('.rename-btn').addEventListener('click', () => this.showRenameModal(sim));
            div.querySelector('.export-btn').addEventListener('click', () => API.exportSimulation(sim.id));
            div.querySelector('.delete-btn').addEventListener('click', () => this.showDeleteConfirm(sim));

            simList.appendChild(div);
        });
    },

    /**
     * Render the grid of AI cards based on active simulation
     * @param {Object} simulation 
     */
    renderSimulationCards: function(simulation) {
        const { aiGrid, globalInputArea } = this.elements;
        aiGrid.innerHTML = '';

        if (!simulation) {
            aiGrid.innerHTML = '<div class="col-span-full h-full flex items-center justify-center text-gray-500">Select a simulation from the sidebar or create a new one.</div>';
            globalInputArea.classList.add('hidden');
            return;
        }

        globalInputArea.classList.remove('hidden');

        simulation.models.forEach(model => {
            const card = this.createModelCard(model);
            aiGrid.appendChild(card);
            
            // Populate previous messages for this model
            const modelMessages = simulation.messages.filter(m => 
                m.role === 'user' || (m.role === 'assistant' && m.modelId === model.modelId)
            );
            
            modelMessages.forEach(msg => {
                // Ignore system summary messages in UI
                if(msg.role === 'system') return; 
                this.appendMessageToCard(model.modelId, msg, false);
            });
            
            this.scrollCardToBottom(model.modelId);
        });
    },

    /**
     * Create DOM element for a single AI card
     * @param {Object} modelObj { modelId, roleName, config: {name, avatar, color} }
     * @returns {HTMLElement}
     */
    createModelCard: function(model) {
        const card = document.createElement('div');
        card.id = `card-${model.modelId}`;
        card.className = `glass-panel rounded-lg flex flex-col h-[500px] border-l-4 transition-all duration-300 relative overflow-hidden`;
        card.style.borderLeftColor = model.config.color;
        
        card.innerHTML = `
            <div class="p-3 border-b border-white/10 bg-black/30 flex items-center justify-between shrink-0">
                <div class="flex items-center gap-3">
                    <div class="text-2xl">${model.config.avatar}</div>
                    <div>
                        <div class="font-bold text-gray-200" style="color: ${model.config.color}; text-shadow: 0 0 5px ${model.config.color}40;">${Utils.escapeHTML(model.config.name)}</div>
                        <div class="text-xs text-gray-400 uppercase tracking-wider font-semibold">${Utils.escapeHTML(model.roleName)}</div>
                    </div>
                </div>
                <div class="indicator-container flex gap-2">
                    <span class="thinking-badge hidden text-xs font-bold px-2 py-1 rounded bg-black/50 border border-white/20 animate-pulse-fast">
                        Thinking <span class="tracking-widest">...</span>
                    </span>
                    <span class="speaking-badge hidden text-xs font-bold px-2 py-1 rounded bg-black/50 border flex items-center gap-1" style="border-color: ${model.config.color}; box-shadow: 0 0 10px ${model.config.color}80;">
                        🔊 Speaking
                    </span>
                    <span class="queued-badge hidden text-xs font-bold px-2 py-1 rounded bg-black/50 border border-gray-600 text-gray-400">
                        Queued
                    </span>
                </div>
            </div>

            <div id="messages-${model.modelId}" class="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide text-sm">
                </div>

            <div class="card-input-area p-3 border-t border-white/10 bg-black/30 shrink-0">
                <form id="form-${model.modelId}" class="flex gap-2">
                    <input type="text" class="flex-1 bg-black/50 border border-white/20 rounded px-3 py-1.5 text-white focus:outline-none focus:border-[${model.config.color}] transition-colors" placeholder="Message ${model.config.name}...">
                    <button type="submit" class="px-3 rounded bg-white/5 hover:bg-white/10 border border-white/10 transition-colors">
                        <svg class="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
                    </button>
                </form>
            </div>
            
            <div id="error-${model.modelId}" class="absolute bottom-16 left-2 right-2 bg-red-900/90 border border-red-500 rounded p-2 text-sm text-white hidden flex justify-between items-center z-10 shadow-lg">
                <span class="error-msg truncate flex-1 mr-2"></span>
                <button class="retry-btn text-xs bg-red-700 hover:bg-red-600 px-2 py-1 rounded shrink-0">Retry</button>
            </div>
        `;

        // Bind form submit event
        const form = card.querySelector(`#form-${model.modelId}`);
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const input = form.querySelector('input');
            const text = input.value.trim();
            if (text) {
                document.dispatchEvent(new CustomEvent('sendToModel', { 
                    detail: { modelId: model.modelId, text } 
                }));
                input.value = '';
            }
        });

        return card;
    },

    appendMessageToCard: function(modelId, message, animate = true) {
        const container = document.getElementById(`messages-${modelId}`);
        if (!container) return;

        const div = document.createElement('div');
        div.className = `flex flex-col max-w-[90%] ${message.role === 'user' ? 'self-end items-end ml-auto' : 'self-start items-start'} mb-4`;
        
        // Setup classes based on role
        let bubbleClass = "px-3 py-2 rounded-lg text-[13px] leading-relaxed break-words shadow-sm ";
        if (message.role === 'user') {
            bubbleClass += "bg-white/10 text-gray-200 rounded-tr-none border border-white/5";
        } else {
            // Find model color from state config
            const modelConfig = State.activeSimulation.models.find(m => m.modelId === message.modelId)?.config;
            const color = modelConfig ? modelConfig.color : '#444';
            // Slight tint of the model's color for background
            bubbleClass += `text-white rounded-tl-none border-l-2`;
            div.style.borderLeftColor = color;
            // Hacky way to set background with opacity via CSS custom prop
            div.style.backgroundColor = `rgba(30, 30, 40, 0.8)`; 
        }

        if (animate) div.classList.add('animate-[fadeIn_0.3s_ease-out]');

        div.innerHTML = `
            <div class="${bubbleClass}">${Utils.sanitize(message.content).replace(/\n/g, '<br>')}</div>
            <div class="text-[10px] text-gray-500 mt-1">${Utils.formatRelativeTime(message.timestamp || new Date().toISOString())}</div>
        `;

        container.appendChild(div);
        this.scrollCardToBottom(modelId);
    },

    appendUserMessageToAllCards: function(messageObj) {
        if (!State.activeSimulation) return;
        State.activeSimulation.models.forEach(model => {
            this.appendMessageToCard(model.modelId, messageObj);
        });
    },

    scrollCardToBottom: function(modelId) {
        const container = document.getElementById(`messages-${modelId}`);
        if (container) {
            // Slight delay to allow DOM to paint
            setTimeout(() => {
                container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
            }, 50);
        }
    },

    // --- Indicators ---

    showThinkingIndicator: function(modelId) {
        const card = document.getElementById(`card-${modelId}`);
        if (card) {
            card.querySelector('.thinking-badge').classList.remove('hidden');
            // Dim messages slightly
            document.getElementById(`messages-${modelId}`).style.opacity = '0.7';
        }
    },

    hideThinkingIndicator: function(modelId) {
        const card = document.getElementById(`card-${modelId}`);
        if (card) {
            card.querySelector('.thinking-badge').classList.add('hidden');
            document.getElementById(`messages-${modelId}`).style.opacity = '1';
        }
    },

    showSpeakingIndicator: function(modelId) {
        this.clearSpeakingIndicators(); // Ensure only one speaks visually
        const card = document.getElementById(`card-${modelId}`);
        if (card) {
            card.classList.add('scale-[1.02]', 'z-10');
            card.style.boxShadow = `0 0 20px ${card.style.borderLeftColor}40`;
            card.querySelector('.speaking-badge').classList.remove('hidden');
            card.querySelector('.queued-badge').classList.add('hidden');
        }
    },

    hideSpeakingIndicator: function(modelId) {
        const card = document.getElementById(`card-${modelId}`);
        if (card) {
            card.classList.remove('scale-[1.02]', 'z-10');
            card.style.boxShadow = 'none';
            card.querySelector('.speaking-badge').classList.add('hidden');
        }
    },
    
    setQueuedIndicator: function(modelId, isQueued) {
        const card = document.getElementById(`card-${modelId}`);
        if (card) {
            const badge = card.querySelector('.queued-badge');
            if (isQueued) badge.classList.remove('hidden');
            else badge.classList.add('hidden');
        }
    },

    clearSpeakingIndicators: function() {
        document.querySelectorAll('.speaking-badge').forEach(el => el.classList.add('hidden'));
        document.querySelectorAll('.glass-panel').forEach(card => {
            if (card.id.startsWith('card-')) {
                card.classList.remove('scale-[1.02]', 'z-10');
                card.style.boxShadow = 'none';
            }
        });
    },

    showErrorOnCard: function(modelId, message) {
        const errDiv = document.getElementById(`error-${modelId}`);
        if (errDiv) {
            errDiv.querySelector('.error-msg').textContent = message;
            errDiv.classList.remove('hidden');
            // Bind retry - auto dismiss error on click
            const btn = errDiv.querySelector('.retry-btn');
            btn.onclick = () => {
                errDiv.classList.add('hidden');
                // Could fire a custom event to retry last request, for now just hides
            };
            // Auto hide after 5 seconds
            setTimeout(() => errDiv.classList.add('hidden'), 5000);
        }
    },

    // --- Mode Management ---

    renderModeSwitch: function(mode) {
        const { modeThumb, lblChat, lblVoice, chatInputContainer, voiceInputContainer } = this.elements;
        
        if (mode === 'voice') {
            modeThumb.classList.add('translate-x-6');
            lblVoice.classList.replace('text-gray-500', 'text-cyber-pink');
            lblVoice.classList.add('font-bold');
            lblChat.classList.replace('text-cyber-cyan', 'text-gray-500');
            lblChat.classList.remove('font-bold');
            
            chatInputContainer.classList.add('hidden');
            voiceInputContainer.classList.remove('hidden');
            voiceInputContainer.classList.add('flex');
            
            // Hide individual card input areas
            document.querySelectorAll('.card-input-area').forEach(el => el.classList.add('hidden'));
            
        } else {
            modeThumb.classList.remove('translate-x-6');
            lblChat.classList.replace('text-gray-500', 'text-cyber-cyan');
            lblChat.classList.add('font-bold');
            lblVoice.classList.replace('text-cyber-pink', 'text-gray-500');
            lblVoice.classList.remove('font-bold');
            
            voiceInputContainer.classList.add('hidden');
            voiceInputContainer.classList.remove('flex');
            chatInputContainer.classList.remove('hidden');
            
            // Show individual card inputs
            document.querySelectorAll('.card-input-area').forEach(el => el.classList.remove('hidden'));
        }
    },

    updateVoiceTranscript: function(text, isInterim = false) {
        const { voiceTranscript } = this.elements;
        voiceTranscript.textContent = text || 'Listening...';
        voiceTranscript.className = `text-center w-full min-h-[1.5rem] ${isInterim ? 'text-gray-400 italic' : 'text-white font-medium'}`;
    },

    // --- Modals & Toasts ---

    showToast: function(message, type = 'info') {
        const container = this.elements.toastContainer;
        const toast = document.createElement('div');
        
        let colors = 'bg-gray-800 border-gray-600 text-white';
        if (type === 'success') colors = 'bg-green-900/90 border-green-500 text-green-100 shadow-[0_0_10px_rgba(34,197,94,0.3)]';
        if (type === 'error') colors = 'bg-red-900/90 border-red-500 text-red-100 shadow-[0_0_10px_rgba(239,68,68,0.3)]';

        toast.className = `px-4 py-3 rounded border backdrop-blur-sm text-sm transform transition-all translate-y-full opacity-0 ${colors} flex items-center justify-between min-w-[250px]`;
        toast.innerHTML = `
            <span>${Utils.escapeHTML(message)}</span>
            <button class="ml-4 text-white/70 hover:text-white">&times;</button>
        `;

        container.appendChild(toast);
        
        // Trigger animation
        setTimeout(() => {
            toast.classList.remove('translate-y-full', 'opacity-0');
        }, 10);

        const close = () => {
            toast.classList.add('opacity-0', 'translate-x-full');
            setTimeout(() => toast.remove(), 300);
        };

        toast.querySelector('button').onclick = close;
        setTimeout(close, 4000);
    },

    closeModal: function() {
        const container = this.elements.modalContainer;
        container.innerHTML = '';
        container.classList.add('hidden');
    },

    showNewSimModal: function() {
        const container = this.elements.modalContainer;
        
        // The default models required by spec
        const defaultModels = [
            { id: 'grok', name: 'Grok' },
            { id: 'gpt4o', name: 'GPT-4o' },
            { id: 'claude', name: 'Claude-3.5' },
            { id: 'gemini', name: 'Gemini-1.5' },
            { id: 'deepseek', name: 'DeepSeek-V3' },
            { id: 'qwen', name: 'Qwen-2.5' }
        ];

        let rolesHtml = defaultModels.map(m => `
            <div class="flex gap-3 items-center">
                <label class="w-24 text-sm text-gray-400 font-semibold">${m.name}</label>
                <input type="text" data-model="${m.id}" class="role-input flex-1 bg-black/50 border border-white/20 rounded px-3 py-1.5 text-white focus:border-cyber-cyan" placeholder="e.g. Detective, Victim, Observer..." required>
            </div>
        `).join('');

        container.innerHTML = `
            <div class="glass-panel p-6 rounded-lg w-full max-w-lg border border-white/20 shadow-[0_0_30px_rgba(0,0,0,0.8)] scale-95 transition-transform duration-200">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-xl font-bold text-cyber-cyan">Create Simulation</h2>
                    <button id="close-modal" class="text-gray-400 hover:text-white">&times;</button>
                </div>
                <form id="new-sim-form" class="space-y-4">
                    <div>
                        <label class="block text-sm text-gray-400 mb-1">Simulation Title</label>
                        <input type="text" id="sim-title" class="w-full bg-black/50 border border-white/20 rounded px-3 py-2 text-white focus:border-cyber-cyan" placeholder="e.g. Cyberpunk Murder Mystery" maxlength="200" required>
                    </div>
                    <div class="border-t border-white/10 pt-4 mt-4">
                        <label class="block text-sm font-semibold text-gray-300 mb-3">Assign Character Roles</label>
                        <div class="space-y-3">
                            ${rolesHtml}
                        </div>
                    </div>
                    <div class="flex justify-end gap-3 mt-6 pt-4 border-t border-white/10">
                        <button type="button" id="cancel-modal" class="px-4 py-2 rounded text-gray-400 hover:text-white transition-colors">Cancel</button>
                        <button type="submit" class="px-6 py-2 rounded bg-cyber-cyan text-black font-bold hover:bg-white hover:shadow-[0_0_15px_rgba(0,240,255,0.6)] transition-all">Create</button>
                    </div>
                </form>
            </div>
        `;
        
        container.classList.remove('hidden');
        
        // Animate in
        setTimeout(() => container.querySelector('.glass-panel').classList.remove('scale-95'), 10);

        container.querySelector('#close-modal').onclick = () => this.closeModal();
        container.querySelector('#cancel-modal').onclick = () => this.closeModal();
        
        container.querySelector('#new-sim-form').onsubmit = (e) => {
            e.preventDefault();
            const title = document.getElementById('sim-title').value.trim();
            const roleInputs = container.querySelectorAll('.role-input');
            const models = Array.from(roleInputs).map(input => ({
                modelId: input.dataset.model,
                roleName: input.value.trim()
            }));
            
            document.dispatchEvent(new CustomEvent('createSimulation', { detail: { title, models } }));
            this.closeModal();
        };
    },

    showRenameModal: function(simulation) {
        const container = this.elements.modalContainer;
        container.innerHTML = `
            <div class="glass-panel p-6 rounded-lg w-full max-w-sm border border-white/20">
                <h2 class="text-lg font-bold text-white mb-4">Rename Simulation</h2>
                <form id="rename-form" class="space-y-4">
                    <input type="text" id="rename-title" value="${Utils.escapeHTML(simulation.title)}" class="w-full bg-black/50 border border-white/20 rounded px-3 py-2 text-white focus:border-cyber-cyan" required>
                    <div class="flex justify-end gap-2">
                        <button type="button" id="cancel-modal" class="px-3 py-1.5 text-sm text-gray-400">Cancel</button>
                        <button type="submit" class="px-4 py-1.5 text-sm bg-cyber-cyan text-black font-bold rounded">Save</button>
                    </div>
                </form>
            </div>
        `;
        container.classList.remove('hidden');
        
        container.querySelector('#cancel-modal').onclick = () => this.closeModal();
        container.querySelector('#rename-form').onsubmit = (e) => {
            e.preventDefault();
            const newTitle = document.getElementById('rename-title').value.trim();
            document.dispatchEvent(new CustomEvent('renameSimulation', { detail: { id: simulation.id, title: newTitle } }));
            this.closeModal();
        };
    },

    showDeleteConfirm: function(simulation) {
        const container = this.elements.modalContainer;
        container.innerHTML = `
            <div class="glass-panel p-6 rounded-lg w-full max-w-sm border border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                <h2 class="text-lg font-bold text-red-500 mb-2">Delete Simulation</h2>
                <p class="text-sm text-gray-300 mb-6">Are you sure you want to delete <strong class="text-white">"${Utils.escapeHTML(Utils.truncate(simulation.title, 30))}"</strong>? This cannot be undone.</p>
                <div class="flex justify-end gap-2">
                    <button id="cancel-modal" class="px-4 py-2 text-sm text-gray-400">Cancel</button>
                    <button id="confirm-delete" class="px-4 py-2 text-sm bg-red-600 hover:bg-red-500 text-white font-bold rounded">Delete</button>
                </div>
            </div>
        `;
        container.classList.remove('hidden');
        
        container.querySelector('#cancel-modal').onclick = () => this.closeModal();
        container.querySelector('#confirm-delete').onclick = () => {
            document.dispatchEvent(new CustomEvent('deleteSimulation', { detail: simulation.id }));
            this.closeModal();
        };
    }
};