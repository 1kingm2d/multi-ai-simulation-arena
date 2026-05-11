/**
 * FILE: public/js/events.js
 * PURPOSE: Global event listener bindings
 */
import { State } from './state.js';

export const Events = {
  bind(handlers) {
    // Send Button
    document.getElementById('send-btn').addEventListener('click', handlers.onSend);

    // Enter Key
    document.getElementById('global-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handlers.onSend();
    });

    // Mic Button
    document.getElementById('mic-btn').addEventListener('click', handlers.onMic);

    // New Simulation
    document.getElementById('new-sim-btn').addEventListener('click', handlers.onNewSim);

    // Mode Toggles
    document.getElementById('chat-mode').addEventListener('click', () => {
      handlers.onModeChange('chat');
    });

    document.getElementById('voice-mode').addEventListener('click', () => {
      handlers.onModeChange('voice');
    });
    
    // Global Stop Voice
    document.getElementById('stop-btn').addEventListener('click', () => {
      window.speechSynthesis.cancel();
      document.getElementById('stop-btn').classList.add('hidden');
    });
  }
};