class AudioEngine {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.compressor = null;
        this.limiter = null;
        this.reverb = null;
        this.eq = {
            low: null,
            mid: null,
            high: null
        };
        this.isPlaying = false;
        this.currentTime = 0;
        this.bpm = 120;
        this.samples = new Map();
        this.activeBlocks = new Map();
        this.scheduleTime = 0;
        this.lookAhead = 25.0; // milliseconds
        this.scheduleAheadTime = 0.1; // seconds
        this.nextNoteTime = 0.0;
        this.timerID = null;
        this.activeSources = new Set();

        this.initializeAudio();
        this.loadBuiltInSamples();
    }

    async initializeAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

            // Create master output chain
            this.setupMasterChain();

            console.log('Audio engine initialized successfully');
        } catch (error) {
            console.error('Failed to initialize audio context:', error);
        }
    }

    setupMasterChain() {
        // Master gain
        this.masterGain = this.audioContext.createGain();
        this.masterGain.gain.value = 0.75;

        // EQ
        this.eq.low = this.audioContext.createBiquadFilter();
        this.eq.low.type = 'lowshelf';
        this.eq.low.frequency.value = 320;
        this.eq.low.gain.value = 0;

        this.eq.mid = this.audioContext.createBiquadFilter();
        this.eq.mid.type = 'peaking';
        this.eq.mid.frequency.value = 1000;
        this.eq.mid.Q.value = 1;
        this.eq.mid.gain.value = 0;

        this.eq.high = this.audioContext.createBiquadFilter();
        this.eq.high.type = 'highshelf';
        this.eq.high.frequency.value = 3200;
        this.eq.high.gain.value = 0;

        // Compressor
        this.compressor = this.audioContext.createDynamicsCompressor();
        this.compressor.threshold.value = -20;
        this.compressor.knee.value = 40;
        this.compressor.ratio.value = 12;
        this.compressor.attack.value = 0.003;
        this.compressor.release.value = 0.25;

        // Limiter (another compressor with harder settings)
        this.limiter = this.audioContext.createDynamicsCompressor();
        this.limiter.threshold.value = -3;
        this.limiter.knee.value = 0;
        this.limiter.ratio.value = 20;
        this.limiter.attack.value = 0.001;
        this.limiter.release.value = 0.01;

        // Reverb
        this.createReverb();

        // Connect the chain
        this.eq.low.connect(this.eq.mid);
        this.eq.mid.connect(this.eq.high);
        this.eq.high.connect(this.compressor);
        this.compressor.connect(this.limiter);
        this.limiter.connect(this.reverb);
        this.reverb.connect(this.masterGain);
        this.masterGain.connect(this.audioContext.destination);
    }

    async createReverb() {
        const reverbTime = 2;
        const sampleRate = this.audioContext.sampleRate;
        const length = sampleRate * reverbTime;
        const impulse = this.audioContext.createBuffer(2, length, sampleRate);

        for (let channel = 0; channel < 2; channel++) {
            const channelData = impulse.getChannelData(channel);
            for (let i = 0; i < length; i++) {
                const decay = Math.pow(1 - i / length, 2);
                channelData[i] = (Math.random() * 2 - 1) * decay;
            }
        }

        this.reverb = this.audioContext.createConvolver();
        this.reverb.buffer = impulse;

        // Create wet/dry control
        this.reverbGain = this.audioContext.createGain();
        this.reverbGain.gain.value = 0.2;
        this.dryGain = this.audioContext.createGain();
        this.dryGain.gain.value = 0.8;

        // Reconnect reverb properly
        this.reverb.disconnect();
        this.reverb = this.audioContext.createGain(); // Use gain node for now, will improve later
    }

    async loadBuiltInSamples() {
        const builtInSamples = {
            'kick': await this.generateKick(),
            'snare': await this.generateSnare(),
            'hihat': await this.generateHiHat(),
            'bass_low': await this.generateBass(55), // A1
            'bass_mid': await this.generateBass(110), // A2
            'lead_1': await this.generateLead(440), // A4
            'pad_1': await this.generatePad(220) // A3
        };

        for (const [name, buffer] of Object.entries(builtInSamples)) {
            this.samples.set(name, buffer);
        }
    }

    async generateKick() {
        const sampleRate = this.audioContext.sampleRate;
        const duration = 0.5;
        const length = sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < length; i++) {
            const t = i / sampleRate;
            const envelope = Math.exp(-t * 20);
            const frequency = 60 * Math.exp(-t * 10);
            const oscillator = Math.sin(2 * Math.PI * frequency * t);
            const noise = (Math.random() * 2 - 1) * 0.1;
            data[i] = (oscillator + noise) * envelope * 0.8;
        }

        return buffer;
    }

    async generateSnare() {
        const sampleRate = this.audioContext.sampleRate;
        const duration = 0.3;
        const length = sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < length; i++) {
            const t = i / sampleRate;
            const envelope = Math.exp(-t * 15);
            const tone = Math.sin(2 * Math.PI * 200 * t) * 0.3;
            const noise = (Math.random() * 2 - 1) * 0.7;
            data[i] = (tone + noise) * envelope * 0.6;
        }

        return buffer;
    }

    async generateHiHat() {
        const sampleRate = this.audioContext.sampleRate;
        const duration = 0.1;
        const length = sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < length; i++) {
            const t = i / sampleRate;
            const envelope = Math.exp(-t * 40);
            const noise = (Math.random() * 2 - 1);
            // High-pass filter simulation
            const filtered = i > 0 ? noise - 0.9 * data[i - 1] : noise;
            data[i] = filtered * envelope * 0.4;
        }

        return buffer;
    }

    async generateBass(frequency) {
        const sampleRate = this.audioContext.sampleRate;
        const duration = 1.0;
        const length = sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < length; i++) {
            const t = i / sampleRate;
            const envelope = Math.exp(-t * 2);
            const fundamental = Math.sin(2 * Math.PI * frequency * t);
            const harmonic = Math.sin(2 * Math.PI * frequency * 2 * t) * 0.3;
            const subHarmonic = Math.sin(2 * Math.PI * frequency * 0.5 * t) * 0.2;
            data[i] = (fundamental + harmonic + subHarmonic) * envelope * 0.7;
        }

        return buffer;
    }

    async generateLead(frequency) {
        const sampleRate = this.audioContext.sampleRate;
        const duration = 0.8;
        const length = sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < length; i++) {
            const t = i / sampleRate;
            const envelope = Math.exp(-t * 3);
            const saw = 2 * ((frequency * t) % 1) - 1; // Sawtooth wave
            const square = Math.sign(Math.sin(2 * Math.PI * frequency * t)); // Square wave
            data[i] = (saw * 0.6 + square * 0.4) * envelope * 0.5;
        }

        return buffer;
    }

    async generatePad(frequency) {
        const sampleRate = this.audioContext.sampleRate;
        const duration = 2.0;
        const length = sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < length; i++) {
            const t = i / sampleRate;
            const envelope = 1 - Math.exp(-t * 5); // Slow attack
            const fundamental = Math.sin(2 * Math.PI * frequency * t);
            const fifth = Math.sin(2 * Math.PI * frequency * 1.5 * t) * 0.4;
            const octave = Math.sin(2 * Math.PI * frequency * 2 * t) * 0.3;
            data[i] = (fundamental + fifth + octave) * envelope * 0.3;
        }

        return buffer;
    }

    playSample(sampleName, pitch = 1, timescale = 1, when = 0, volume = 1, pan = 0) {
        if (!this.samples.has(sampleName)) {
            console.warn(`Sample '${sampleName}' not found`);
            return;
        }

        const buffer = this.samples.get(sampleName);
        const source = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();
        const panNode = this.audioContext.createStereoPanner();

        source.buffer = buffer;
        source.playbackRate.value = pitch * timescale;
        gainNode.gain.value = volume;
        panNode.pan.value = Math.max(-1, Math.min(1, pan));

        source.connect(gainNode);
        gainNode.connect(panNode);
        panNode.connect(this.eq.low);

        const startTime = this.audioContext.currentTime + when;
        source.start(startTime);

        // Track active sources
        this.activeSources.add(source);
        source.addEventListener('ended', () => {
            this.activeSources.delete(source);
        });

        // Add fade out to prevent clicks
        gainNode.gain.setValueAtTime(volume, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + (buffer.duration / timescale) - 0.01);

        return source;
    }

    generateTone(frequency, duration = 1, waveType = 'sine', when = 0, volume = 1, pan = 0) {
        // Validate inputs
        if (!frequency || isNaN(frequency) || frequency <= 0) {
            console.warn(`Invalid frequency: ${frequency}, using 440 Hz`);
            frequency = 440;
        }

        if (!duration || isNaN(duration) || duration <= 0) {
            console.warn(`Invalid duration: ${duration}, using 1 second`);
            duration = 1;
        }

        if (!volume || isNaN(volume) || volume < 0) {
            volume = 0.5;
        }

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const panNode = this.audioContext.createStereoPanner();

        oscillator.type = waveType;
        oscillator.frequency.value = frequency;
        gainNode.gain.value = 0;
        panNode.pan.value = Math.max(-1, Math.min(1, pan));

        oscillator.connect(gainNode);
        gainNode.connect(panNode);
        panNode.connect(this.eq.low);

        const startTime = this.audioContext.currentTime + when;
        const endTime = startTime + duration;

        // ADSR envelope
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.01);
        gainNode.gain.linearRampToValueAtTime(volume * 0.8, startTime + 0.1);
        gainNode.gain.setValueAtTime(volume * 0.6, endTime - 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.001, endTime);

        // Track active sources
        this.activeSources.add(oscillator);
        oscillator.addEventListener('ended', () => {
            this.activeSources.delete(oscillator);
        });

        oscillator.start(startTime);
        oscillator.stop(endTime);

        return oscillator;
    }

    noteToFrequency(note) {
        const noteMap = {
            'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4, 'F': 5,
            'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11
        };

        // Convert to uppercase for case-insensitive matching
        const upperNote = note.toUpperCase();
        const match = upperNote.match(/^([A-G][#B]?)(\d+)$/);
        if (!match) {
            console.warn(`Invalid note format: ${note}, defaulting to A4`);
            return 440; // Default to A4
        }

        const noteName = match[1];
        const octave = parseInt(match[2]);

        // Validate octave range
        if (isNaN(octave) || octave < 0 || octave > 10) {
            console.warn(`Invalid octave: ${octave}, defaulting to A4`);
            return 440;
        }

        const noteNumber = noteMap[noteName];
        if (noteNumber === undefined) {
            console.warn(`Invalid note name: ${noteName}, defaulting to A4`);
            return 440;
        }

        // A4 = 440 Hz, MIDI note 69
        const midiNumber = (octave + 1) * 12 + noteNumber;
        const frequency = 440 * Math.pow(2, (midiNumber - 69) / 12);

        // Validate frequency range
        if (isNaN(frequency) || frequency <= 0 || frequency > 20000) {
            console.warn(`Invalid frequency calculated: ${frequency}, defaulting to A4`);
            return 440;
        }

        return frequency;
    }

    setMasterVolume(value) {
        if (this.masterGain) {
            this.masterGain.gain.value = value / 100;
        }
    }

    setEQ(band, value) {
        if (this.eq[band]) {
            this.eq[band].gain.value = value;
        }
    }

    setCompressor(threshold) {
        if (this.compressor) {
            this.compressor.threshold.value = threshold;
        }
    }

    setLimiter(threshold) {
        if (this.limiter) {
            this.limiter.threshold.value = threshold;
        }
    }

    setReverb(wetness) {
        // This is a simplified version - in a real implementation,
        // you'd need a proper wet/dry mix
        if (this.reverbGain) {
            this.reverbGain.gain.value = wetness / 100;
            this.dryGain.gain.value = (100 - wetness) / 100;
        }
    }

    async loadAudioFile(file) {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            const fileName = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
            this.samples.set(fileName, audioBuffer);
            return fileName;
        } catch (error) {
            console.error('Error loading audio file:', error);
            throw error;
        }
    }

    scheduler() {
        while (this.nextNoteTime < this.audioContext.currentTime + this.scheduleAheadTime) {
            // This would be called by the code interpreter to schedule notes
            this.nextNoteTime += 60.0 / this.bpm / 4; // 16th notes
        }
        this.timerID = setTimeout(() => this.scheduler(), this.lookAhead);
    }

    play() {
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }

        this.isPlaying = true;
        this.nextNoteTime = this.audioContext.currentTime;
        this.scheduler();
    }

    pause() {
        this.isPlaying = false;
        if (this.timerID) {
            clearTimeout(this.timerID);
            this.timerID = null;
        }
    }

    stop() {
        this.pause();
        this.currentTime = 0;
        this.nextNoteTime = 0;
        
        // Stop all active sources
        this.activeSources.forEach(source => {
            try {
                source.stop();
            } catch (e) {
                // Source might already be stopped
            }
        });
        this.activeSources.clear();
        
        // Stop all playing sources
        this.activeBlocks.clear();
    }

    async exportWAV(duration = 10) {
        // Create offline context for rendering
        const offlineContext = new OfflineAudioContext(
            2, // stereo
            duration * this.audioContext.sampleRate,
            this.audioContext.sampleRate
        );

        // This is a simplified version - in a real implementation,
        // you'd need to recreate the entire audio graph in the offline context
        // and render the current code

        try {
            const renderedBuffer = await offlineContext.startRendering();
            return this.audioBufferToWAV(renderedBuffer);
        } catch (error) {
            console.error('Error exporting WAV:', error);
            throw error;
        }
    }

    audioBufferToWAV(buffer) {
        const length = buffer.length;
        const numberOfChannels = buffer.numberOfChannels;
        const sampleRate = buffer.sampleRate;
        const arrayBuffer = new ArrayBuffer(44 + length * numberOfChannels * 2);
        const view = new DataView(arrayBuffer);

        // WAV header
        const writeString = (offset, string) => {
            for (let i = 0; i < string.length; i++) {
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        };

        writeString(0, 'RIFF');
        view.setUint32(4, 36 + length * numberOfChannels * 2, true);
        writeString(8, 'WAVE');
        writeString(12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, numberOfChannels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * numberOfChannels * 2, true);
        view.setUint16(32, numberOfChannels * 2, true);
        view.setUint16(34, 16, true);
        writeString(36, 'data');
        view.setUint32(40, length * numberOfChannels * 2, true);

        // Convert float samples to 16-bit PCM
        let offset = 44;
        for (let i = 0; i < length; i++) {
            for (let channel = 0; channel < numberOfChannels; channel++) {
                const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
                view.setInt16(offset, sample * 0x7FFF, true);
                offset += 2;
            }
        }

        return new Blob([arrayBuffer], { type: 'audio/wav' });
    }

    getAnalyserData() {
        if (!this.analyser) {
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 256;
            this.masterGain.connect(this.analyser);
        }

        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        this.analyser.getByteFrequencyData(dataArray);
        return dataArray;
    }
}

// Global audio engine instance
window.audioEngine = new AudioEngine();
