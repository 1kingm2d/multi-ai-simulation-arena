/**
 * FILE: voice.js
 * PURPOSE: Web Speech API wrapper: STT, TTS, voice management, sequential speak
 * DEPENDENCIES: State, Utils, UI
 */

const Voice = {
    recognition: null,
    isListening: false,
    availableVoices: [],
    speechQueue: [],
    isSpeaking: false,
    
    init: function() {
        // Init TTS Voices
        const loadVoices = () => {
            this.availableVoices = window.speechSynthesis.getVoices();
        };
        loadVoices();
        if (speechSynthesis.onvoiceschanged !== undefined) {
            speechSynthesis.onvoiceschanged = loadVoices;
        }

        // Init STT (Speech Recognition)
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.interimResults = true;
            this.recognition.lang = 'en-US';
        } else {
            console.warn("Speech recognition not supported in this browser.");
        }
    },

    /**
     * Starts listening for user speech
     * @param {Function} onInterim Callback for partial results
     * @param {Function} onFinal Callback for final result
     * @param {Function} onError Callback for errors
     */
    startListening: function(onInterim, onFinal, onError) {
        if (!this.recognition) {
            if(onError) onError("Voice input is not supported in your browser. Please use Chrome or Edge.");
            return;
        }

        if (this.isListening) {
            this.stopListening();
            return;
        }

        try {
            this.recognition.onstart = () => {
                this.isListening = true;
            };

            this.recognition.onresult = (event) => {
                let interimTranscript = '';
                let finalTranscript = '';

                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    } else {
                        interimTranscript += event.results[i][0].transcript;
                    }
                }

                if (interimTranscript && onInterim) onInterim(interimTranscript);
                if (finalTranscript) {
                    this.stopListening();
                    if (onFinal) onFinal(finalTranscript);
                }
            };

            this.recognition.onerror = (event) => {
                this.isListening = false;
                if(onError) {
                    let msg = "Microphone error.";
                    if (event.error === 'not-allowed') msg = "Microphone access denied. Please allow permissions.";
                    if (event.error === 'no-speech') msg = "No speech detected. Try again.";
                    onError(msg);
                }
            };

            this.recognition.onend = () => {
                this.isListening = false;
                // Dispatch event to update UI toggle state
                document.dispatchEvent(new Event('recognitionEnded'));
            };

            this.recognition.start();
        } catch (e) {
            console.error("STT Error", e);
            if(onError) onError("Failed to start microphone.");
        }
    },

    stopListening: function() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
            this.isListening = false;
        }
    },

    /**
     * Queues AI responses to speak sequentially
     * @param {Array<{modelId, text}>} responses 
     */
    speakSequentially: function(responses) {
        // Merge with existing queue
        responses.forEach(r => {
            // Strip special characters that sound bad in TTS (*, _, #)
            const cleanText = r.text.replace(/[\*\_#]/g, '');
            this.speechQueue.push({ modelId: r.modelId, text: cleanText });
            UI.setQueuedIndicator(r.modelId, true);
        });

        if (!this.isSpeaking) {
            this.speakNext();
        }
    },

    speakNext: function() {
        if (this.speechQueue.length === 0) {
            this.isSpeaking = false;
            State.setSpeaking(null);
            document.getElementById('stop-speech-btn').classList.add('hidden');
            return;
        }

        this.isSpeaking = true;
        const current = this.speechQueue.shift();
        
        UI.setQueuedIndicator(current.modelId, false);
        State.setSpeaking(current.modelId);
        document.getElementById('stop-speech-btn').classList.remove('hidden');

        // Get voice settings from state or defaults
        const settings = State.voiceSettings[current.modelId] || { pitch: 1.0, rate: 1.0, volume: 1.0 };
        
        const utterance = new SpeechSynthesisUtterance(current.text);
        utterance.pitch = settings.pitch || 1.0;
        utterance.rate = settings.rate || 1.0;
        utterance.volume = settings.volume || 1.0;

        if (settings.voiceName && this.availableVoices.length > 0) {
            const selectedVoice = this.availableVoices.find(v => v.name === settings.voiceName);
            if (selectedVoice) utterance.voice = selectedVoice;
        }

        utterance.onend = () => {
            // Delay slightly before next speaker
            setTimeout(() => {
                this.speakNext();
            }, 800);
        };

        utterance.onerror = (e) => {
            console.warn("TTS Error", e);
            this.speakNext(); // skip to next on error
        };

        window.speechSynthesis.speak(utterance);
    },

    stopAll: function() {
        window.speechSynthesis.cancel();
        this.speechQueue = [];
        this.isSpeaking = false;
        State.setSpeaking(null);
        UI.clearSpeakingIndicators();
        document.querySelectorAll('.queued-badge').forEach(el => el.classList.add('hidden'));
        document.getElementById('stop-speech-btn').classList.add('hidden');
    }
};