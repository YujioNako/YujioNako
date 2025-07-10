// Audio System for FPS Training Simulator

class AudioSystem {
    constructor() {
        this.context = null;
        this.masterVolume = 0.5;
        this.sfxVolume = 0.7;
        this.musicVolume = 0.3;
        this.sounds = {};
        this.initialized = false;
        
        this.initializeAudioContext();
        this.generateSounds();
    }
    
    async initializeAudioContext() {
        try {
            // Create audio context (requires user interaction)
            this.context = new (window.AudioContext || window.webkitAudioContext)();
            
            // Handle audio context suspension (mobile Safari)
            if (this.context.state === 'suspended') {
                document.addEventListener('click', () => this.resumeContext(), { once: true });
                document.addEventListener('touchstart', () => this.resumeContext(), { once: true });
            }
            
            this.initialized = true;
            console.log('Audio system initialized');
        } catch (error) {
            console.warn('Audio context not supported:', error);
        }
    }
    
    async resumeContext() {
        if (this.context && this.context.state === 'suspended') {
            await this.context.resume();
            console.log('Audio context resumed');
        }
    }
    
    generateSounds() {
        // Generate synthetic gun sounds since we can't include real audio files
        this.sounds = {
            pistol_shot: this.generatePistolSound(),
            assault_shot: this.generateAssaultSound(),
            sniper_shot: this.generateSniperSound(),
            reload: this.generateReloadSound(),
            weapon_switch: this.generateSwitchSound(),
            hit: this.generateHitSound(),
            miss: this.generateMissSound(),
            ui_click: this.generateUISound(),
            ambient: this.generateAmbientSound()
        };
    }
    
    generatePistolSound() {
        return {
            type: 'pistol',
            frequencies: [200, 400, 800],
            duration: 0.15,
            volume: 0.6,
            attack: 0.01,
            decay: 0.05,
            sustain: 0.3,
            release: 0.09
        };
    }
    
    generateAssaultSound() {
        return {
            type: 'assault',
            frequencies: [150, 300, 600, 1200],
            duration: 0.12,
            volume: 0.7,
            attack: 0.005,
            decay: 0.03,
            sustain: 0.4,
            release: 0.085
        };
    }
    
    generateSniperSound() {
        return {
            type: 'sniper',
            frequencies: [100, 200, 400, 800, 1600],
            duration: 0.25,
            volume: 0.8,
            attack: 0.002,
            decay: 0.08,
            sustain: 0.2,
            release: 0.17
        };
    }
    
    generateReloadSound() {
        return {
            type: 'reload',
            frequencies: [300, 600],
            duration: 0.3,
            volume: 0.4,
            attack: 0.1,
            decay: 0.1,
            sustain: 0.5,
            release: 0.1
        };
    }
    
    generateSwitchSound() {
        return {
            type: 'switch',
            frequencies: [400, 800],
            duration: 0.2,
            volume: 0.3,
            attack: 0.05,
            decay: 0.05,
            sustain: 0.3,
            release: 0.1
        };
    }
    
    generateHitSound() {
        return {
            type: 'hit',
            frequencies: [800, 1600],
            duration: 0.1,
            volume: 0.5,
            attack: 0.01,
            decay: 0.03,
            sustain: 0.2,
            release: 0.06
        };
    }
    
    generateMissSound() {
        return {
            type: 'miss',
            frequencies: [1200, 2400],
            duration: 0.08,
            volume: 0.2,
            attack: 0.01,
            decay: 0.02,
            sustain: 0.1,
            release: 0.05
        };
    }
    
    generateUISound() {
        return {
            type: 'ui',
            frequencies: [600, 1200],
            duration: 0.1,
            volume: 0.3,
            attack: 0.01,
            decay: 0.02,
            sustain: 0.3,
            release: 0.07
        };
    }
    
    generateAmbientSound() {
        return {
            type: 'ambient',
            frequencies: [50, 100, 150],
            duration: 10.0,
            volume: 0.1,
            attack: 2.0,
            decay: 2.0,
            sustain: 0.5,
            release: 4.0
        };
    }
    
    playSound(soundName, options = {}) {
        if (!this.context || !this.initialized) return;
        
        const sound = this.sounds[soundName];
        if (!sound) return;
        
        try {
            const volume = (options.volume || sound.volume) * this.sfxVolume * this.masterVolume;
            const pitch = options.pitch || 1.0;
            const pan = options.pan || 0; // -1 (left) to 1 (right)
            
            // Create audio nodes
            const oscillators = [];
            const gainNode = this.context.createGain();
            const panNode = this.context.createStereoPanner?.() || this.context.createPanner?.();
            
            // Set up panning
            if (panNode.setPosition) {
                // 3D panner
                panNode.setPosition(pan, 0, 1 - Math.abs(pan));
            } else if (panNode.pan) {
                // Stereo panner
                panNode.pan.value = pan;
            }
            
            // Connect nodes
            gainNode.connect(panNode);
            panNode.connect(this.context.destination);
            
            // Set up envelope
            const now = this.context.currentTime;
            const attackTime = sound.attack;
            const decayTime = sound.decay;
            const sustainLevel = sound.sustain * volume;
            const releaseTime = sound.release;
            const totalDuration = sound.duration;
            
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(volume, now + attackTime);
            gainNode.gain.linearRampToValueAtTime(sustainLevel, now + attackTime + decayTime);
            gainNode.gain.setValueAtTime(sustainLevel, now + totalDuration - releaseTime);
            gainNode.gain.linearRampToValueAtTime(0, now + totalDuration);
            
            // Create oscillators for each frequency
            sound.frequencies.forEach((freq, index) => {
                const osc = this.context.createOscillator();
                const oscGain = this.context.createGain();
                
                // Set oscillator properties
                osc.type = this.getOscillatorType(sound.type, index);
                osc.frequency.setValueAtTime(freq * pitch, now);
                
                // Add slight frequency modulation for realism
                if (sound.type !== 'ui') {
                    const lfo = this.context.createOscillator();
                    const lfoGain = this.context.createGain();
                    
                    lfo.frequency.setValueAtTime(5 + Math.random() * 10, now);
                    lfoGain.gain.setValueAtTime(freq * 0.02, now);
                    
                    lfo.connect(lfoGain);
                    lfoGain.connect(osc.frequency);
                    lfo.start(now);
                    lfo.stop(now + totalDuration);
                }
                
                // Set relative volume for this frequency
                const relativeVolume = 1.0 / sound.frequencies.length;
                oscGain.gain.setValueAtTime(relativeVolume, now);
                
                // Connect oscillator
                osc.connect(oscGain);
                oscGain.connect(gainNode);
                
                // Start and stop
                osc.start(now);
                osc.stop(now + totalDuration);
                
                oscillators.push(osc);
            });
            
            // Add noise for gun sounds
            if (['pistol', 'assault', 'sniper'].includes(sound.type)) {
                this.addGunNoise(gainNode, now, totalDuration, volume * 0.3);
            }
            
        } catch (error) {
            console.warn('Error playing sound:', error);
        }
    }
    
    getOscillatorType(soundType, index) {
        switch (soundType) {
            case 'pistol':
                return index === 0 ? 'square' : 'sawtooth';
            case 'assault':
                return index < 2 ? 'square' : 'sawtooth';
            case 'sniper':
                return index === 0 ? 'square' : 'triangle';
            case 'ui':
                return 'sine';
            default:
                return 'sawtooth';
        }
    }
    
    addGunNoise(destination, startTime, duration, volume) {
        try {
            // Create noise buffer
            const bufferSize = this.context.sampleRate * duration;
            const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
            const data = buffer.getChannelData(0);
            
            // Fill with white noise
            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * volume;
            }
            
            // Create buffer source
            const noiseSource = this.context.createBufferSource();
            const noiseGain = this.context.createGain();
            const noiseFilter = this.context.createBiquadFilter();
            
            noiseSource.buffer = buffer;
            noiseFilter.type = 'highpass';
            noiseFilter.frequency.setValueAtTime(1000, startTime);
            
            // Envelope for noise
            noiseGain.gain.setValueAtTime(0, startTime);
            noiseGain.gain.linearRampToValueAtTime(volume, startTime + 0.01);
            noiseGain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
            
            // Connect noise
            noiseSource.connect(noiseFilter);
            noiseFilter.connect(noiseGain);
            noiseGain.connect(destination);
            
            noiseSource.start(startTime);
            noiseSource.stop(startTime + duration);
            
        } catch (error) {
            console.warn('Error adding gun noise:', error);
        }
    }
    
    playWeaponSound(weaponType, options = {}) {
        const soundMap = {
            'pistol': 'pistol_shot',
            'assault': 'assault_shot',
            'sniper': 'sniper_shot'
        };
        
        const soundName = soundMap[weaponType] || 'pistol_shot';
        this.playSound(soundName, options);
    }
    
    playUISound() {
        this.playSound('ui_click');
    }
    
    playReloadSound() {
        this.playSound('reload');
    }
    
    playWeaponSwitchSound() {
        this.playSound('weapon_switch');
    }
    
    playHitSound(distance = 1.0) {
        // Adjust volume based on distance
        const volume = Math.max(0.1, 1.0 / (1.0 + distance * 0.1));
        this.playSound('hit', { volume });
    }
    
    playMissSound() {
        this.playSound('miss', { volume: 0.5 });
    }
    
    startAmbientSound() {
        if (this.ambientPlaying) return;
        
        this.ambientPlaying = true;
        const playAmbient = () => {
            if (!this.ambientPlaying) return;
            
            this.playSound('ambient', { volume: 0.1 });
            setTimeout(playAmbient, 8000); // Restart before it ends
        };
        
        playAmbient();
    }
    
    stopAmbientSound() {
        this.ambientPlaying = false;
    }
    
    setMasterVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
    }
    
    setSFXVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
    }
    
    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
    }
    
    getMasterVolume() {
        return this.masterVolume;
    }
    
    // Play positional audio (for 3D effect)
    playPositionalSound(soundName, x, y, listenerX, listenerY, options = {}) {
        const distance = Math.sqrt((x - listenerX) ** 2 + (y - listenerY) ** 2);
        const maxDistance = 500; // pixels
        
        // Calculate volume based on distance
        const distanceVolume = Math.max(0.1, 1.0 - (distance / maxDistance));
        
        // Calculate panning based on position
        const pan = Math.max(-1, Math.min(1, (x - listenerX) / 200));
        
        this.playSound(soundName, {
            ...options,
            volume: (options.volume || 1.0) * distanceVolume,
            pan: pan
        });
    }
    
    // Preload/test audio system
    async testAudio() {
        if (!this.initialized) return false;
        
        try {
            this.playSound('ui_click', { volume: 0.1 });
            return true;
        } catch (error) {
            console.warn('Audio test failed:', error);
            return false;
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AudioSystem;
}