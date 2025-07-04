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
        this.masterGain.gain.value = 0.5;

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
            // Drum kit
            'kick': await this.generateKick(),
            'snare': await this.generateSnare(),
            'hihat': await this.generateHiHat(),
            'hihat_open': await this.generateOpenHiHat(),
            'crash': await this.generateCrash(),
            'ride': await this.generateRide(),
            'tom_high': await this.generateTom(200),
            'tom_mid': await this.generateTom(150),
            'tom_low': await this.generateTom(100),
            'clap': await this.generateClap(),

            // Bass sounds
            'bass_low': await this.generateBass(55), // A1
            'bass_mid': await this.generateBass(110), // A2
            'bass_high': await this.generateBass(220), // A3
            'sub_bass': await this.generateSubBass(41), // E1
            'bass_pluck': await this.generateBassPluck(82), // E2

            // Lead sounds
            'lead_1': await this.generateLead(440), // A4
            'lead_2': await this.generateLead2(440),
            'lead_bright': await this.generateBrightLead(880),
            'lead_soft': await this.generateSoftLead(440),

            // Pad sounds
            'pad_1': await this.generatePad(220), // A3
            'pad_warm': await this.generateWarmPad(220),
            'pad_strings': await this.generateStringPad(330),
            'pad_choir': await this.generateChoirPad(440),

            // Percussion
            'shaker': await this.generateShaker(),
            'tambourine': await this.generateTambourine(),
            'cowbell': await this.generateCowbell(),
            'woodblock': await this.generateWoodblock(),
            'triangle': await this.generateWoodblock(), // Using woodblock for triangle sound

            // FX sounds
            'whoosh': await this.generateWhoosh(),
            'zap': await this.generateZap(),
            'drop': await this.generateDrop(),
            'rise': await this.generateRise()
        };

        for (const [name, buffer] of Object.entries(builtInSamples)) {
            this.samples.set(name, buffer);
        }
    }

    getBuiltInSampleNames() {
        // Return only the built-in sample names (not imported ones)
        return [
            'kick', 'snare', 'hihat', 'hihat_open', 'crash', 'ride',
            'tom_high', 'tom_mid', 'tom_low', 'clap', 'triangle',
            'bass_low', 'bass_mid', 'bass_high', 'sub_bass', 'bass_pluck',
            'lead_1', 'lead_2', 'lead_bright', 'lead_soft',
            'pad_1', 'pad_warm', 'pad_strings', 'pad_choir',
            'shaker', 'tambourine', 'cowbell', 'woodblock',
            'whoosh', 'zap', 'drop', 'rise'
        ];
    }

    async generateOpenHiHat() {
        const sampleRate = this.audioContext.sampleRate;
        const duration = 0.3;
        const length = sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < length; i++) {
            const t = i / sampleRate;
            const envelope = Math.exp(-t * 8);
            const noise = (Math.random() * 2 - 1);
            // High-pass filter simulation with less aggressive filtering
            const filtered = i > 0 ? noise - 0.7 * data[i - 1] : noise;
            data[i] = filtered * envelope * 0.5;
        }

        return buffer;
    }

    async generateCrash() {
        const sampleRate = this.audioContext.sampleRate;
        const duration = 2.0;
        const length = sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < length; i++) {
            const t = i / sampleRate;
            const envelope = Math.exp(-t * 2);
            const noise = (Math.random() * 2 - 1);
            // Metallic resonance
            const metallic = Math.sin(2 * Math.PI * 3000 * t * Math.random()) * 0.3;
            data[i] = (noise + metallic) * envelope * 0.6;
        }

        return buffer;
    }

    async generateRide() {
        const sampleRate = this.audioContext.sampleRate;
        const duration = 1.5;
        const length = sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < length; i++) {
            const t = i / sampleRate;
            const envelope = Math.exp(-t * 1.5);
            const bell = Math.sin(2 * Math.PI * 2000 * t) * 0.4;
            const shimmer = (Math.random() * 2 - 1) * 0.3;
            data[i] = (bell + shimmer) * envelope * 0.5;
        }

        return buffer;
    }

    async generateTom(frequency) {
        const sampleRate = this.audioContext.sampleRate;
        const duration = 0.8;
        const length = sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < length; i++) {
            const t = i / sampleRate;
            const envelope = Math.exp(-t * 8);
            const pitch = frequency * Math.exp(-t * 3);
            const tone = Math.sin(2 * Math.PI * pitch * t);
            const noise = (Math.random() * 2 - 1) * 0.1;
            data[i] = (tone + noise) * envelope * 0.7;
        }

        return buffer;
    }

    async generateClap() {
        const sampleRate = this.audioContext.sampleRate;
        const duration = 0.2;
        const length = sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < length; i++) {
            const t = i / sampleRate;
            // Multiple quick bursts to simulate hand clap
            const burst1 = t < 0.01 ? 1 : 0;
            const burst2 = (t >= 0.02 && t < 0.03) ? 0.8 : 0;
            const burst3 = (t >= 0.04 && t < 0.05) ? 0.6 : 0;
            const envelope = burst1 + burst2 + burst3;
            const noise = (Math.random() * 2 - 1);
            data[i] = noise * envelope * 0.6;
        }

        return buffer;
    }

    async generateSubBass(frequency) {
        const sampleRate = this.audioContext.sampleRate;
        const duration = 1.5;
        const length = sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < length; i++) {
            const t = i / sampleRate;
            const envelope = Math.exp(-t * 1.5);
            const fundamental = Math.sin(2 * Math.PI * frequency * t);
            const subharmonic = Math.sin(2 * Math.PI * frequency * 0.5 * t) * 0.5;
            data[i] = (fundamental + subharmonic) * envelope * 0.8;
        }

        return buffer;
    }

    async generateBassPluck(frequency) {
        const sampleRate = this.audioContext.sampleRate;
        const duration = 0.6;
        const length = sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < length; i++) {
            const t = i / sampleRate;
            const envelope = Math.exp(-t * 8);
            const saw = 2 * ((frequency * t) % 1) - 1;
            const filter = 1 - t * 2; // Simple low-pass
            data[i] = saw * envelope * filter * 0.6;
        }

        return buffer;
    }

    async generateLead2(frequency) {
        const sampleRate = this.audioContext.sampleRate;
        const duration = 0.8;
        const length = sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < length; i++) {
            const t = i / sampleRate;
            const envelope = Math.exp(-t * 2);
            const square = Math.sign(Math.sin(2 * Math.PI * frequency * t));
            const pwm = Math.sign(Math.sin(2 * Math.PI * frequency * t * (1 + 0.3 * Math.sin(t * 10))));
            data[i] = (square * 0.6 + pwm * 0.4) * envelope * 0.4;
        }

        return buffer;
    }

    async generateBrightLead(frequency) {
        const sampleRate = this.audioContext.sampleRate;
        const duration = 0.6;
        const length = sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < length; i++) {
            const t = i / sampleRate;
            const envelope = Math.exp(-t * 4);
            const saw = 2 * ((frequency * t) % 1) - 1;
            const harmonic = Math.sin(2 * Math.PI * frequency * 3 * t) * 0.3;
            data[i] = (saw + harmonic) * envelope * 0.5;
        }

        return buffer;
    }

    async generateSoftLead(frequency) {
        const sampleRate = this.audioContext.sampleRate;
        const duration = 1.0;
        const length = sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < length; i++) {
            const t = i / sampleRate;
            const envelope = Math.exp(-t * 1.5);
            const sine = Math.sin(2 * Math.PI * frequency * t);
            const vibrato = Math.sin(2 * Math.PI * 5 * t) * 0.1;
            data[i] = sine * (1 + vibrato) * envelope * 0.4;
        }

        return buffer;
    }

    async generateWarmPad(frequency) {
        const sampleRate = this.audioContext.sampleRate;
        const duration = 3.0;
        const length = sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < length; i++) {
            const t = i / sampleRate;
            const envelope = 1 - Math.exp(-t * 3);
            const fundamental = Math.sin(2 * Math.PI * frequency * t);
            const third = Math.sin(2 * Math.PI * frequency * 1.25 * t) * 0.3;
            const fifth = Math.sin(2 * Math.PI * frequency * 1.5 * t) * 0.2;
            data[i] = (fundamental + third + fifth) * envelope * 0.25;
        }

        return buffer;
    }

    async generateStringPad(frequency) {
        const sampleRate = this.audioContext.sampleRate;
        const duration = 2.5;
        const length = sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < length; i++) {
            const t = i / sampleRate;
            const envelope = 1 - Math.exp(-t * 4);
            const saw = 2 * ((frequency * t) % 1) - 1;
            const filter = Math.exp(-t * 0.5); // Gradual filter sweep
            data[i] = saw * envelope * filter * 0.3;
        }

        return buffer;
    }

    async generateChoirPad(frequency) {
        const sampleRate = this.audioContext.sampleRate;
        const duration = 3.0;
        const length = sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < length; i++) {
            const t = i / sampleRate;
            const envelope = 1 - Math.exp(-t * 2);
            // Multiple sine waves for choir-like effect
            const voice1 = Math.sin(2 * Math.PI * frequency * t);
            const voice2 = Math.sin(2 * Math.PI * frequency * 1.02 * t) * 0.8;
            const voice3 = Math.sin(2 * Math.PI * frequency * 0.98 * t) * 0.8;
            const formant = Math.sin(2 * Math.PI * frequency * 2.5 * t) * 0.2;
            data[i] = (voice1 + voice2 + voice3 + formant) * envelope * 0.2;
        }

        return buffer;
    }

    async generateShaker() {
        const sampleRate = this.audioContext.sampleRate;
        const duration = 0.15;
        const length = sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < length; i++) {
            const t = i / sampleRate;
            const envelope = Math.exp(-t * 20);
            const noise = (Math.random() * 2 - 1);
            // High frequency emphasis
            const filtered = i > 0 ? noise - 0.5 * data[i - 1] : noise;
            data[i] = filtered * envelope * 0.3;
        }

        return buffer;
    }

    async generateTambourine() {
        const sampleRate = this.audioContext.sampleRate;
        const duration = 0.4;
        const length = sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < length; i++) {
            const t = i / sampleRate;
            const envelope = Math.exp(-t * 10);
            const jingle = Math.sin(2 * Math.PI * 2000 * t * (1 + Math.sin(t * 50))) * 0.5;
            const shake = (Math.random() * 2 - 1) * 0.3;
            data[i] = (jingle + shake) * envelope * 0.4;
        }

        return buffer;
    }

    async generateCowbell() {
        const sampleRate = this.audioContext.sampleRate;
        const duration = 0.3;
        const length = sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < length; i++) {
            const t = i / sampleRate;
            const envelope = Math.exp(-t * 15);
            const bell1 = Math.sin(2 * Math.PI * 800 * t);
            const bell2 = Math.sin(2 * Math.PI * 900 * t) * 0.7;
            data[i] = (bell1 + bell2) * envelope * 0.5;
        }

        return buffer;
    }

    async generateWoodblock() {
        const sampleRate = this.audioContext.sampleRate;
        const duration = 0.1;
        const length = sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < length; i++) {
            const t = i / sampleRate;
            const envelope = Math.exp(-t * 50);
            const click = Math.sin(2 * Math.PI * 1500 * t);
            const thump = Math.sin(2 * Math.PI * 300 * t) * 0.3;
            data[i] = (click + thump) * envelope * 0.6;
        }

        return buffer;
    }

    async generateWhoosh() {
        const sampleRate = this.audioContext.sampleRate;
        const duration = 1.0;
        const length = sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < length; i++) {
            const t = i / sampleRate;
            const envelope = Math.sin(Math.PI * t / duration);
            const noise = (Math.random() * 2 - 1);
            const sweep = 1 - t; // High to low frequency emphasis
            data[i] = noise * envelope * sweep * 0.4;
        }

        return buffer;
    }

    async generateZap() {
        const sampleRate = this.audioContext.sampleRate;
        const duration = 0.2;
        const length = sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < length; i++) {
            const t = i / sampleRate;
            const envelope = Math.exp(-t * 10);
            const freq = 2000 * Math.exp(-t * 5);
            const zap = Math.sin(2 * Math.PI * freq * t);
            const noise = (Math.random() * 2 - 1) * 0.2;
            data[i] = (zap + noise) * envelope * 0.5;
        }

        return buffer;
    }

    async generateDrop() {
        const sampleRate = this.audioContext.sampleRate;
        const duration = 0.8;
        const length = sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < length; i++) {
            const t = i / sampleRate;
            const envelope = 1 - t / duration;
            const freq = 800 * Math.exp(-t * 3);
            const drop = Math.sin(2 * Math.PI * freq * t);
            data[i] = drop * envelope * 0.6;
        }

        return buffer;
    }

    async generateRise() {
        const sampleRate = this.audioContext.sampleRate;
        const duration = 1.5;
        const length = sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < length; i++) {
            const t = i / sampleRate;
            const envelope = t / duration;
            const freq = 100 * Math.exp(t * 2);
            const rise = Math.sin(2 * Math.PI * freq * t);
            const noise = (Math.random() * 2 - 1) * 0.1;
            data[i] = (rise + noise) * envelope * 0.4;
        }

        return buffer;
    }

    async generateKick() {
        const sampleRate = this.audioContext.sampleRate;
        const duration = 0.4;
        const length = Math.floor(sampleRate * duration);
        const buffer = this.audioContext.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < length; i++) {
            const t = i / sampleRate;

            // Deep pitch drop for subby thump
            const freq = 110 * Math.pow(0.2, t / 0.18); // drops from 110Hz to ~22Hz
            const lowEnv = Math.exp(-t * 12);
            const low = Math.sin(2 * Math.PI * freq * t) * lowEnv;

            // Very subtle mid for body (not clicky)
            const midEnv = Math.exp(-t * 30);
            const mid = Math.sin(2 * Math.PI * 180 * t) * midEnv * 0.18;

            // Extremely short, soft click for attack
            const clickEnv = Math.exp(-t * 400);
            const click = Math.sin(2 * Math.PI * 2000 * t) * clickEnv * 0.08;

            // No metallic or rimshot overtones!
            data[i] = (low + mid + click) * 0.98;
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

    playSample(sampleName, pitch = 1, timescale = 1, when = 0, volume = 1, pan = 0, outputNode = null) {
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
        panNode.pan.value = Math.max(-1, Math.min(1, pan));

        source.connect(gainNode);
        gainNode.connect(panNode);
        panNode.connect(outputNode || this.eq.low);

        source.gainNode = gainNode;

        const startTime = this.audioContext.currentTime + when;
        const sampleDuration = buffer.duration / (pitch * timescale);

        // Smooth envelope for samples - very short fade to prevent clicks
        const fadeTime = Math.min(0.002, sampleDuration * 0.02); // 2ms or 2% of sample duration

        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(volume, startTime + fadeTime);

        // Fade out near the end
        const fadeOutStart = startTime + sampleDuration - fadeTime;
        if (fadeOutStart > startTime + fadeTime) {
            gainNode.gain.setValueAtTime(volume, fadeOutStart);
            gainNode.gain.linearRampToValueAtTime(0, startTime + sampleDuration);
        }

        source.start(startTime);

        // Track active sources
        this.activeSources.add(source);
        source.addEventListener('ended', () => {
            this.activeSources.delete(source);
        });

        return source;
    }

    generateTone(frequency, duration = 1, waveType = 'sine', when = 0, volume = 1, pan = 0, outputNode = null) {
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
        panNode.pan.value = Math.max(-1, Math.min(1, pan));

        oscillator.connect(gainNode);
        gainNode.connect(panNode);
        panNode.connect(outputNode || this.eq.low);

        const startTime = this.audioContext.currentTime + when;
        const endTime = startTime + duration;

        // Smooth envelope to prevent clicks - shorter fade times for less noticeable effect
        const fadeTime = Math.min(0.003, duration * 0.05); // 3ms or 5% of duration, whichever is smaller

        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(volume, startTime + fadeTime);
        gainNode.gain.setValueAtTime(volume, endTime - fadeTime);
        gainNode.gain.linearRampToValueAtTime(0, endTime);

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

        // Stop text-to-speech
        if (typeof speechSynthesis !== 'undefined') {
            speechSynthesis.cancel();
        }
    }

    async exportWAV(duration = 10) {
        if (!window.codeInterpreter) {
            throw new Error('Code interpreter not available');
        }

        // Get current code
        const code = window.editor.getValue();
        if (!code.trim()) {
            throw new Error('No code to export');
        }

        // Parse code to update blocks
        window.codeInterpreter.parse(code);

        // Estimate duration using the interpreter
        let estimatedDuration = 10;
        try {
            estimatedDuration = window.codeInterpreter.estimateDuration('main');
            console.log('Estimated duration:', estimatedDuration);
            if (!estimatedDuration || isNaN(estimatedDuration) || estimatedDuration < 1) {
                estimatedDuration = 10;
            }
        } catch (e) {
            estimatedDuration = 10;
        }
        // Add a buffer to avoid cutting off reverb/tails
        const TAIL_SECONDS = 5;
        estimatedDuration += TAIL_SECONDS;

        // Create offline context for rendering
        const offlineContext = new OfflineAudioContext(
            2, // stereo
            estimatedDuration * this.audioContext.sampleRate,
            this.audioContext.sampleRate
        );

        try {
            // Parse and execute the code in offline context
            await this.renderCodeToOfflineContext(code, offlineContext, estimatedDuration);

            // Render the audio
            const renderedBuffer = await offlineContext.startRendering();
            return this.audioBufferToWAV(renderedBuffer);
        } catch (error) {
            console.error('Error exporting WAV:', error);
            throw error;
        }
    }

    async renderCodeToOfflineContext(code, offlineContext, duration) {
        // Create offline versions of audio nodes
        const offlineMasterGain = offlineContext.createGain();
        offlineMasterGain.gain.value = this.masterGain.gain.value;
        offlineMasterGain.connect(offlineContext.destination);

        // Create offline EQ
        const offlineEQ = {
            low: offlineContext.createBiquadFilter(),
            mid: offlineContext.createBiquadFilter(),
            high: offlineContext.createBiquadFilter()
        };

        // Copy EQ settings
        offlineEQ.low.type = 'lowshelf';
        offlineEQ.low.frequency.value = 320;
        offlineEQ.low.gain.value = this.eq.low.gain.value;

        offlineEQ.mid.type = 'peaking';
        offlineEQ.mid.frequency.value = 1000;
        offlineEQ.mid.Q.value = 1;
        offlineEQ.mid.gain.value = this.eq.mid.gain.value;

        offlineEQ.high.type = 'highshelf';
        offlineEQ.high.frequency.value = 3200;
        offlineEQ.high.gain.value = this.eq.high.gain.value;

        // Connect EQ chain
        offlineEQ.low.connect(offlineEQ.mid);
        offlineEQ.mid.connect(offlineEQ.high);
        offlineEQ.high.connect(offlineMasterGain);

        // Parse the code using the same interpreter as the live playback
        try {
            window.codeInterpreter.parse(code);
        } catch (error) {
            console.error('Failed to parse code for export:', error);
            throw new Error('Invalid MelodiCode syntax: ' + error.message);
        }

        // Create a temporary audio engine instance for offline rendering
        const offlineEngine = this.createOfflineAudioEngine(offlineContext, offlineEQ.low);

        // Execute the code using the interpreter's actual execute method
        await this.executeCodeOffline(offlineEngine, duration);
    }

    createOfflineAudioEngine(offlineContext, outputNode) {
        // Track the current scheduling time for offline rendering
        let offlineCurrentTime = 0;

        const offlineEngine = {
            audioContext: offlineContext,
            masterGain: { gain: { value: this.masterGain.gain.value } },
            eq: { low: outputNode },
            samples: this.samples,
            noteToFrequency: this.noteToFrequency.bind(this),
            bpm: this.bpm,
            isPlaying: true,
            currentTime: 0,
            nextNoteTime: 0,
            scheduleAheadTime: 0.1,
            activeSources: new Set(),
            activeBlocks: new Map(),
            // ADD REVERB SUPPORT FOR OFFLINE
            reverb: this.reverb ? { buffer: this.reverb.buffer } : null,

            // Override the audioContext currentTime property
            audioContext: offlineContext,
            offlineCurrentTime: 0,

            playSample: (sampleName, pitch = 1, timescale = 1, when = 0, volume = 1, pan = 0, outputNode = null) => {
                // Use the offline current time plus the when parameter
                const absoluteWhen = offlineCurrentTime + when;
                console.log(`Playing sample '${sampleName}' at offline time ${absoluteWhen} (currentTime: ${offlineCurrentTime}, when: ${when})`);
                return this.playOfflineSample(sampleName, offlineContext, outputNode || offlineEngine.eq.low, absoluteWhen, pitch, timescale, volume);
            },

            generateTone: (frequency, duration = 1, waveType = 'sine', when = 0, volume = 1, pan = 0, outputNode = null) => {
                // Use the offline current time plus the when parameter, ensuring it's never negative
                const absoluteWhen = Math.max(0, offlineCurrentTime + when);
                console.log(`Generating tone ${frequency}Hz at offline time ${absoluteWhen} (currentTime: ${offlineCurrentTime}, when: ${when})`);
                return this.generateOfflineTone(frequency, duration, offlineContext, outputNode || offlineEngine.eq.low, absoluteWhen, waveType, volume);
            },

            // Mock scheduler that advances time
            scheduler: () => {
                offlineCurrentTime += 60.0 / offlineEngine.bpm / 16; // Advance by 1/16 note
                console.log(`Offline scheduler advanced time to: ${offlineCurrentTime}`);
            },

            // Mock methods that might be called
            setMasterVolume: () => { },
            setEQ: () => { },
            setCompressor: () => { },
            setLimiter: () => { },
            setReverb: () => { },
            play: () => { },
            pause: () => { },
            stop: () => { }
        };

        // Patch the interpreter's executeBlock method for offline rendering
        offlineEngine.executeBlock = async (blockName, startTime = 0, globalParams = {}) => {
            if (!window.codeInterpreter.blocks.has(blockName)) {
                console.warn(`Block '${blockName}' not found`);
                return 0;
            }

            const commands = window.codeInterpreter.blocks.get(blockName);
            let currentTime = 0;

            // --- OFFLINE EFFECT CHAIN START ---
            let effectInputNode = offlineEngine.eq.low; // Default output
            if (window.codeInterpreter.effects.has(blockName)) {
                const effects = window.codeInterpreter.effects.get(blockName);
                let currentNode = offlineEngine.eq.low; // Start with default output

                // Build effect chain from last to first (reverse order)
                for (let i = effects.length - 1; i >= 0; i--) {
                    const effect = effects[i];
                    let effectNode = null;
                    let wetGain = null;
                    let dryGain = null;

                    if (effect.type === 'reverb') {
                        effectNode = offlineContext.createConvolver();
                        if (offlineEngine.reverb && offlineEngine.reverb.buffer) {
                            effectNode.buffer = offlineEngine.reverb.buffer;
                        }

                        // Create wet/dry mix
                        wetGain = offlineContext.createGain();
                        dryGain = offlineContext.createGain();
                        const wetAmount = parseFloat(effect.params[0]) || 0.3;
                        wetGain.gain.value = wetAmount;
                        dryGain.gain.value = 1 - wetAmount;

                        // Connect: input -> [dry path, wet path] -> output
                        effectNode.connect(wetGain);
                        wetGain.connect(currentNode);
                        dryGain.connect(currentNode);

                        // Create input splitter
                        const splitter = offlineContext.createGain();
                        splitter.connect(effectNode); // to wet
                        splitter.connect(dryGain);    // to dry

                        currentNode = splitter;

                    } else if (effect.type === 'delay') {
                        effectNode = offlineContext.createDelay(1); // Max 1 second delay
                        const delayTime = parseFloat(effect.params[0]) || 0.3;
                        const feedback = parseFloat(effect.params[1]) || 0.3;
                        const wetAmount = parseFloat(effect.params[2]) || 0.3;

                        effectNode.delayTime.value = delayTime;

                        // Create feedback loop
                        const feedbackGain = offlineContext.createGain();
                        feedbackGain.gain.value = feedback;
                        effectNode.connect(feedbackGain);
                        feedbackGain.connect(effectNode);

                        // Create wet/dry mix
                        wetGain = offlineContext.createGain();
                        dryGain = offlineContext.createGain();
                        wetGain.gain.value = wetAmount;
                        dryGain.gain.value = 1 - wetAmount;

                        effectNode.connect(wetGain);
                        wetGain.connect(currentNode);
                        dryGain.connect(currentNode);

                        const splitter = offlineContext.createGain();
                        splitter.connect(effectNode);
                        splitter.connect(dryGain);

                        currentNode = splitter;

                    } else if (effect.type === 'filter') {
                        effectNode = offlineContext.createBiquadFilter();
                        const filterType = effect.params[0] || 'lowpass';
                        const frequency = parseFloat(effect.params[1]) || 1000;
                        const q = parseFloat(effect.params[2]) || 1;

                        effectNode.type = filterType;
                        effectNode.frequency.value = frequency;
                        effectNode.Q.value = q;

                        effectNode.connect(currentNode);
                        currentNode = effectNode;

                    } else if (effect.type === 'distortion') {
                        effectNode = offlineContext.createWaveShaper();
                        const amount = parseFloat(effect.params[0]) || 10;
                        const samples = 44100;
                        const curve = new Float32Array(samples);
                        const deg = Math.PI / 180;

                        for (let i = 0; i < samples; i++) {
                            const x = (i * 2) / samples - 1;
                            curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
                        }

                        effectNode.curve = curve;
                        effectNode.oversample = '4x';

                        effectNode.connect(currentNode);
                        currentNode = effectNode;

                    } else if (effect.type === 'chorus') {
                        // Simple chorus using multiple delays
                        const rate = parseFloat(effect.params[0]) || 1;
                        const depth = parseFloat(effect.params[1]) || 0.002;
                        const wetAmount = parseFloat(effect.params[2]) || 0.3;

                        const delay1 = offlineContext.createDelay(0.1);
                        const delay2 = offlineContext.createDelay(0.1);
                        const lfo1 = offlineContext.createOscillator();
                        const lfo2 = offlineContext.createOscillator();
                        const lfoGain1 = offlineContext.createGain();
                        const lfoGain2 = offlineContext.createGain();

                        lfo1.frequency.value = rate;
                        lfo2.frequency.value = rate * 1.1; // Slightly different rate
                        lfoGain1.gain.value = depth;
                        lfoGain2.gain.value = depth;

                        lfo1.connect(lfoGain1);
                        lfo2.connect(lfoGain2);
                        lfoGain1.connect(delay1.delayTime);
                        lfoGain2.connect(delay2.delayTime);

                        delay1.delayTime.value = 0.01;
                        delay2.delayTime.value = 0.015;

                        wetGain = offlineContext.createGain();
                        dryGain = offlineContext.createGain();
                        wetGain.gain.value = wetAmount;
                        dryGain.gain.value = 1 - wetAmount;

                        const chorusMix = offlineContext.createGain();
                        delay1.connect(chorusMix);
                        delay2.connect(chorusMix);
                        chorusMix.connect(wetGain);
                        wetGain.connect(currentNode);
                        dryGain.connect(currentNode);

                        const splitter = offlineContext.createGain();
                        splitter.connect(delay1);
                        splitter.connect(delay2);
                        splitter.connect(dryGain);

                        lfo1.start();
                        lfo2.start();

                        currentNode = splitter;
                    }
                }

                effectInputNode = currentNode;
            }
            // --- OFFLINE EFFECT CHAIN END ---

            // Execute block commands with effect support
            let i = 0;
            while (i < commands.length) {
                const command = commands[i];
                const parts = command.split(/\s+/);
                const cmd = parts[0];

                if (cmd === 'if') {
                    const result = await window.codeInterpreter.executeIf(parts, startTime + currentTime, commands, i);
                    currentTime += result.duration;
                    i = result.nextIndex;
                } else if (cmd === 'for') {
                    const result = await window.codeInterpreter.executeFor(parts, startTime + currentTime, commands, i);
                    currentTime += result.duration;
                    i = result.nextIndex;
                } else if (cmd === 'pattern') {
                    const duration = await window.codeInterpreter.executePattern(parts, startTime + currentTime, effectInputNode);
                    currentTime += duration;
                    i++;
                } else if (cmd === 'sequence') {
                    const duration = await window.codeInterpreter.executeSequence(parts, startTime + currentTime, effectInputNode);
                    currentTime += duration;
                    i++;
                } else {
                    // Execute command with effect input node
                    const duration = await this.executeOfflineCommand(command, startTime + currentTime, effectInputNode, offlineEngine);
                    currentTime += duration;
                    i++;
                }
            }

            offlineEngine.offlineCurrentTime += currentTime;
            return currentTime;
        };

        return offlineEngine;
    }

    async executeOfflineCommand(command, startTime, effectInputNode, offlineEngine) {
        const parts = command.split(/\s+/);
        const cmd = parts[0];

        switch (cmd) {
            case 'sample':
                const sampleName = parts[1];
                const pitch = parseFloat(parts[2]) || 1;
                const timescale = parseFloat(parts[3]) || 1;
                const volume = parseFloat(parts[4]) || 0.8;

                // Check if it's a custom sample
                if (window.codeInterpreter.customSamples.has(sampleName)) {
                    const commands = window.codeInterpreter.customSamples.get(sampleName);
                    await Promise.all(commands.map(command =>
                        this.executeOfflineCommand(command, startTime, effectInputNode, offlineEngine)
                    ));
                    return 0;
                }

                return this.playOfflineSample(sampleName, offlineEngine.audioContext, effectInputNode, startTime, pitch, timescale, volume);

            case 'tone':
                const noteOrFreq = parts[1];
                let duration = parseFloat(parts[2]) || 1;
                const waveType = parts[3] || 'sine';
                const toneVolume = parseFloat(parts[4]) || 0.8;

                // Convert duration based on BPM
                const durationInSeconds = duration * (60 / offlineEngine.bpm);

                let frequency;
                if (isNaN(noteOrFreq)) {
                    frequency = this.noteToFrequency(noteOrFreq);
                } else {
                    frequency = parseFloat(noteOrFreq);
                }

                this.generateOfflineTone(frequency, durationInSeconds, offlineEngine.audioContext, effectInputNode, startTime, waveType, toneVolume);
                return durationInSeconds;

            case 'slide':
                return this.executeOfflineSlide(parts, startTime, effectInputNode, offlineEngine);

            case 'sidechain':
                return this.executeOfflineSidechain(parts, startTime, effectInputNode, offlineEngine);

            case 'pattern':
                return this.executeOfflinePattern(parts, startTime, effectInputNode, offlineEngine);

            case 'sequence':
                return this.executeOfflineSequence(parts, startTime, effectInputNode, offlineEngine);

            case 'play':
                return this.executeOfflinePlay(parts, startTime, effectInputNode, offlineEngine);

            case 'playasync':
                return this.executeOfflinePlayAsync(parts, startTime, effectInputNode, offlineEngine);

            case 'loop':
                return this.executeOfflineLoop(parts, startTime, effectInputNode, offlineEngine);

            case 'loopasync':
                return this.executeOfflineLoopAsync(parts, startTime, effectInputNode, offlineEngine);

            case 'wait':
                const waitDuration = parseFloat(parts[1]) || 0;
                return waitDuration * (60 / offlineEngine.bpm); // Convert beats to seconds

            case 'bpm':
                offlineEngine.bpm = parseFloat(parts[1]) || 120;
                return 0;

            case 'set':
                window.codeInterpreter.variables.set(parts[1], parseFloat(parts[2]) || 0);
                return 0;

            case 'tts':
                // For offline rendering, we can't use actual TTS, so we estimate duration and add silence
                console.warn('TTS not supported in offline rendering, adding estimated silence');

                // Extract text and estimate duration (same logic as in CodeInterpreter.executeTTS)
                let text = '';
                let paramStartIndex = 1;

                if (parts[1] && parts[1].startsWith('"')) {
                    const quotedText = [];
                    for (let i = 1; i < parts.length; i++) {
                        quotedText.push(parts[i]);
                        if (parts[i].endsWith('"')) {
                            paramStartIndex = i + 1;
                            break;
                        }
                    }
                    text = quotedText.join(' ').replace(/"/g, '');
                } else {
                    text = parts[1] || 'Hello';
                    paramStartIndex = 2;
                }

                const rate = parseFloat(parts[paramStartIndex] || '1');
                const adjustedRate = rate * (offlineEngine.bpm / 120);
                const wordsPerMinute = 150 * adjustedRate;
                const wordCount = text.split(' ').length;
                const estimatedDuration = (wordCount / wordsPerMinute) * 60;

                return estimatedDuration;

            default:
                console.warn(`Unknown offline command: ${cmd}`);
                return 0;
        }
    }

    executeOfflineSlide(parts, startTime, effectInputNode, offlineEngine) {
        const key1 = parts[1];
        const key2 = parts[2];
        const timescale = parseFloat(parts[3]) || 1;
        const durationInSeconds = timescale * (60 / offlineEngine.bpm);

        // Optional: waveType, volume, pan
        const waveType = parts[4] || 'sine';
        const volume = parseFloat(parts[5]) || 0.8;
        const pan = parseFloat(parts[6]) || 0;

        // Support both note names and frequencies
        const freq1 = isNaN(key1) ? this.noteToFrequency(key1) : parseFloat(key1);
        const freq2 = isNaN(key2) ? this.noteToFrequency(key2) : parseFloat(key2);

        const ctx = offlineEngine.audioContext;
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        const panNode = ctx.createStereoPanner();

        // Schedule the oscillator frequency changes
        oscillator.type = waveType;
        oscillator.frequency.setValueAtTime(freq1, startTime);
        oscillator.frequency.linearRampToValueAtTime(freq2, startTime + durationInSeconds);

        // Schedule the pan value
        panNode.pan.setValueAtTime(Math.max(-1, Math.min(1, pan)), startTime);

        // Smooth envelope
        const fadeTime = Math.min(0.003, durationInSeconds * 0.03);
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(volume, startTime + fadeTime);
        gainNode.gain.setValueAtTime(volume, startTime + durationInSeconds - fadeTime);
        gainNode.gain.linearRampToValueAtTime(0, startTime + durationInSeconds);

        // Connect the audio graph
        oscillator.connect(gainNode);
        gainNode.connect(panNode);
        panNode.connect(effectInputNode);

        // Schedule the oscillator to start and stop
        oscillator.start(startTime);
        oscillator.stop(startTime + durationInSeconds);

        console.log(`Scheduled slide from ${freq1}Hz to ${freq2}Hz for ${durationInSeconds}s at time ${startTime}`);
        return durationInSeconds;
    }

    async executeOfflineSidechain(parts, startTime, effectInputNode, offlineEngine) {
        const block1 = parts[1]; // Block to be ducked
        const block2 = parts[2]; // Trigger block
        const amount = parseFloat(parts[3]);

        if (!window.codeInterpreter.blocks.has(block1) || !window.codeInterpreter.blocks.has(block2)) {
            console.warn(`One or both blocks not found: ${block1}, ${block2}`);
            return 0;
        }

        const ctx = offlineEngine.audioContext;

        // Create a gain node to control block1's volume
        const sidechainGain = ctx.createGain();
        sidechainGain.gain.value = 1; // Start at full volume

        // Connect sidechain gain to the output
        sidechainGain.connect(effectInputNode);

        // Calculate durations for both blocks
        const block1Duration = window.codeInterpreter.estimateDuration(block1);
        const block2Duration = window.codeInterpreter.estimateDuration(block2);

        // Use the longer duration, but ensure we have at least some playback time
        const maxDuration = Math.max(block1Duration, block2Duration, 4); // Minimum 4 seconds

        console.log(`Offline Sidechain: block1 (${block1}) duration: ${block1Duration}s, block2 (${block2}) duration: ${block2Duration}s, total: ${maxDuration}s`);

        // Get all trigger times from block2
        const triggerTimes = this.getOfflineTriggerTimes(block2, block2Duration, maxDuration, offlineEngine);
        console.log(`Offline Sidechain: Found ${triggerTimes.length} triggers at times:`, triggerTimes);

        // Schedule ducking automation
        const duckDuration = 0.15; // How long the duck lasts
        const attackTime = 0.01;   // How quickly it ducks

        triggerTimes.forEach((triggerTime, index) => {
            if (triggerTime < maxDuration) {
                const absoluteTime = startTime + triggerTime;

                console.log(`Scheduling offline duck ${index + 1} at ${triggerTime}s (absolute: ${absoluteTime}s)`);

                // Duck the gain
                sidechainGain.gain.cancelScheduledValues(absoluteTime);
                sidechainGain.gain.setValueAtTime(1, absoluteTime);
                sidechainGain.gain.linearRampToValueAtTime(1 - amount, absoluteTime + attackTime);
                sidechainGain.gain.linearRampToValueAtTime(1, absoluteTime + duckDuration);
            }
        });

        const allExecutionPromises = [];

        // Execute block1 (gets sidechained) through the sidechain gain
        if (block1Duration > 0 && block1Duration < maxDuration) {
            // Loop block1 to fill duration
            const loops = Math.ceil(maxDuration / block1Duration);
            for (let i = 0; i < loops; i++) {
                const loopStart = startTime + (i * block1Duration);
                if (loopStart < startTime + maxDuration) {
                    allExecutionPromises.push(this.executeOfflineBlock(block1, loopStart, sidechainGain, offlineEngine));
                }
            }
        } else {
            allExecutionPromises.push(this.executeOfflineBlock(block1, startTime, sidechainGain, offlineEngine));
        }

        // Execute block2 (triggers sidechain) directly to output
        if (block2Duration > 0 && block2Duration < maxDuration) {
            // Loop block2 to fill duration
            const loops = Math.ceil(maxDuration / block2Duration);
            for (let i = 0; i < loops; i++) {
                const loopStart = startTime + (i * block2Duration);
                if (loopStart < startTime + maxDuration) {
                    allExecutionPromises.push(this.executeOfflineBlock(block2, loopStart, effectInputNode, offlineEngine));
                }
            }
        } else {
            allExecutionPromises.push(this.executeOfflineBlock(block2, startTime, effectInputNode, offlineEngine));
        }

        await Promise.all(allExecutionPromises);
        return maxDuration;
    }

    getOfflineTriggerTimes(blockName, blockDuration, totalDuration, offlineEngine) {
        const commands = window.codeInterpreter.blocks.get(blockName);
        const triggers = [];

        const loopCount = blockDuration > 0 ? Math.ceil(totalDuration / blockDuration) : 1;

        for (let loop = 0; loop < loopCount; loop++) {
            const loopStart = loop * blockDuration;
            if (loopStart >= totalDuration) break;

            let time = 0;
            const beatDuration = 60 / offlineEngine.bpm;

            for (const command of commands) {
                const cmdParts = command.split(/\s+/);
                const cmd = cmdParts[0];

                if (cmd === 'sample') {
                    triggers.push(loopStart + time);
                } else if (cmd === 'tone') {
                    triggers.push(loopStart + time);
                    const duration = parseFloat(cmdParts[2] || '1') * beatDuration;
                    time += duration;
                } else if (cmd === 'slide') {
                    triggers.push(loopStart + time);
                    const duration = parseFloat(cmdParts[3] || '1') * beatDuration;
                    time += duration;
                } else if (cmd === 'wait') {
                    time += parseFloat(cmdParts[1]) * beatDuration;
                } else if (cmd === 'pattern') {
                    // Handle pattern triggers
                    for (let i = 2; i < cmdParts.length; i += 2) {
                        if (i + 1 < cmdParts.length) {
                            const patternStr = cmdParts[i + 1].replace(/"/g, '');
                            const steps = patternStr.split('-');
                            const stepDuration = beatDuration / 4;

                            for (let j = 0; j < steps.length; j++) {
                                if (steps[j].trim() === '1' || steps[j].trim() === 'x' || steps[j].trim() === 'X') {
                                    triggers.push(loopStart + time + (j * stepDuration));
                                }
                            }
                            time += steps.length * stepDuration;
                        }
                    }
                }
            }
        }

        return triggers;
    }

    async executeCodeOffline(offlineEngine, maxDuration) {
        // Temporarily replace the global audioEngine with our offline version
        const originalAudioEngine = window.audioEngine;
        const originalInterpreterEngine = window.codeInterpreter.audioEngine;
        window.audioEngine = offlineEngine;
        window.codeInterpreter.audioEngine = offlineEngine;

        try {
            console.log('Starting offline code execution...');

            // Use the interpreter's actual execute method
            if (window.codeInterpreter && typeof window.codeInterpreter.execute === 'function') {
                await window.codeInterpreter.execute();
            } else {
                console.warn('Code interpreter execute method not available');
                // Fallback: try to execute main block directly if available
                if (window.codeInterpreter && window.codeInterpreter.blocks) {
                    const mainBlock = window.codeInterpreter.blocks.get('main');
                    if (mainBlock) {
                        console.log('Executing main block as fallback');
                        await this.executeBlockFallback(mainBlock, offlineEngine);
                    }
                }
            }

            console.log('Offline code execution completed');
        } catch (error) {
            console.error('Error executing code for export:', error);
        } finally {
            // Restore the original audio engine
            window.audioEngine = originalAudioEngine;
            window.codeInterpreter.audioEngine = originalInterpreterEngine;
        }
    }

    async executeBlockFallback(block, offlineEngine) {
        console.log('Executing block fallback:', block);

        // Simple fallback - just play a test tone to verify the export works
        offlineEngine.generateTone(440, 1, 'sine', 0, 0.5);
        offlineEngine.generateTone(880, 1, 'sine', 1, 0.5);
        offlineEngine.playSample('kick', 1, 1, 2, 0.8);
    }

    async executeOfflineBlock(blockName, startTime, outputNode, offlineEngine) {
        if (!window.codeInterpreter.blocks.has(blockName)) {
            console.warn(`Block '${blockName}' not found for offline execution`);
            return 0;
        }

        const commands = window.codeInterpreter.blocks.get(blockName);
        let currentTime = 0;

        // Execute block commands
        let i = 0;
        while (i < commands.length) {
            const command = commands[i];
            const parts = command.split(/\s+/);
            const cmd = parts[0];

            if (cmd === 'if') {
                const result = await this.executeOfflineIf(parts, startTime + currentTime, commands, i, outputNode, offlineEngine);
                currentTime += result.duration;
                i = result.nextIndex;
            } else if (cmd === 'for') {
                const result = await this.executeOfflineFor(parts, startTime + currentTime, commands, i, outputNode, offlineEngine);
                currentTime += result.duration;
                i = result.nextIndex;
            } else {
                // Execute command with the specified output node
                const duration = await this.executeOfflineCommand(command, startTime + currentTime, outputNode, offlineEngine);
                currentTime += duration;
                i++;
            }
        }

        return currentTime;
    }

    async executeOfflinePattern(parts, startTime, effectInputNode, offlineEngine) {
        if (parts.length < 3 || parts.length % 2 !== 1) {
            console.warn('Pattern command requires pairs of a sample name and a pattern string.');
            return 0;
        }

        const patterns = [];
        // Loop through parts, taking a sample name and a pattern string as a pair
        for (let i = 1; i < parts.length; i += 2) {
            const sampleName = parts[i];
            const patternString = parts[i + 1].replace(/"/g, ''); // Remove quotes
            patterns.push({ name: sampleName, string: patternString });
        }

        if (patterns.length === 0) {
            return 0;
        }

        let maxLength = 0;
        const executionPromises = [];
        const stepDuration = (60 / offlineEngine.bpm) / 4; // 16th notes

        // Process each pattern definition
        for (const pattern of patterns) {
            const steps = pattern.string.split('-');
            if (steps.length > maxLength) {
                maxLength = steps.length;
            }

            for (let i = 0; i < steps.length; i++) {
                const step = steps[i].trim();
                if (step === '1' || step === 'x' || step === 'X') {
                    const hitTime = startTime + (i * stepDuration);
                    // Schedule the sample play
                    executionPromises.push(
                        this.executeOfflineCommand(`sample ${pattern.name}`, hitTime, effectInputNode, offlineEngine)
                    );
                }
            }
        }

        // Wait for all sample scheduling commands to be initiated
        await Promise.all(executionPromises);

        // The total duration is determined by the longest pattern
        return maxLength * stepDuration;
    }

    async executeOfflineSequence(parts, startTime, effectInputNode, offlineEngine) {
        const sampleName = parts[1];
        const steps = parts.slice(2);

        let currentTime = 0;
        const stepDuration = (60 / offlineEngine.bpm) / 4;

        for (let i = 0; i < steps.length; i++) {
            const step = steps[i];
            if (step !== '-' && step !== '0') {
                await this.executeOfflineCommand(`sample ${step}`, startTime + currentTime, effectInputNode, offlineEngine);
            }
            currentTime += stepDuration;
        }

        return currentTime;
    }

    async executeOfflinePlay(parts, startTime, effectInputNode, offlineEngine) {
        const blockNames = [];
        const params = {};

        // Parse block names and parameters
        for (let i = 1; i < parts.length; i++) {
            if (parts[i].includes('=')) {
                const [key, value] = parts[i].split('=');
                params[key] = parseFloat(value);
            } else {
                blockNames.push(parts[i]);
            }
        }

        if (blockNames.length === 0) {
            return 0;
        }

        // Estimate durations for all blocks
        const blockDurations = blockNames.map(name => ({
            name,
            duration: window.codeInterpreter.estimateDuration(name)
        }));

        // Find the maximum duration among all blocks
        const maxDuration = Math.max(...blockDurations.map(b => b.duration), 0);

        if (maxDuration === 0) {
            // If max duration is 0, just play all blocks once simultaneously
            const promises = blockNames.map(blockName => this.executeOfflineBlock(blockName, startTime, effectInputNode, offlineEngine));
            await Promise.all(promises);
            return 0;
        }

        const allExecutionPromises = [];

        // Schedule all block executions - shorter blocks loop to match longest
        blockDurations.forEach(blockInfo => {
            const { name, duration } = blockInfo;

            if (duration <= 0) {
                // Play once if duration is 0
                allExecutionPromises.push(this.executeOfflineBlock(name, startTime, effectInputNode, offlineEngine));
            } else {
                // Loop the block to fill the maxDuration
                const loopCount = Math.ceil(maxDuration / duration);

                for (let i = 0; i < loopCount; i++) {
                    const loopStartTime = startTime + (i * duration);
                    // Ensure we don't schedule past the max duration
                    if (loopStartTime < startTime + maxDuration) {
                        allExecutionPromises.push(this.executeOfflineBlock(name, loopStartTime, effectInputNode, offlineEngine));
                    }
                }
            }
        });

        // Wait for all scheduled blocks to complete their execution logic
        await Promise.all(allExecutionPromises);

        // The total duration of the play command is the duration of the longest block
        return maxDuration;
    }

    async executeOfflinePlayAsync(parts, startTime, effectInputNode, offlineEngine) {
        // For offline rendering, playasync behaves the same as play since we're not in real-time
        return this.executeOfflinePlay(parts, startTime, effectInputNode, offlineEngine);
    }

    async executeOfflineLoop(parts, startTime, effectInputNode, offlineEngine) {
        const count = parseInt(parts[1]);
        const blockNames = parts.slice(2);

        // Validate block names
        for (const blockName of blockNames) {
            if (!window.codeInterpreter.blocks.has(blockName)) {
                console.warn(`Block '${blockName}' not found`);
                return 0;
            }
        }

        // Estimate durations for all blocks
        const blockDurations = blockNames.map(name => ({
            name,
            duration: window.codeInterpreter.estimateDuration(name)
        }));

        // Find the maximum duration among all blocks in one iteration
        const maxIterationDuration = Math.max(...blockDurations.map(b => b.duration), 0);

        if (maxIterationDuration === 0) {
            // If all blocks have 0 duration, just play them count times
            let totalDuration = 0;
            for (let i = 0; i < count; i++) {
                const promises = blockNames.map(blockName =>
                    this.executeOfflineBlock(blockName, startTime + totalDuration, effectInputNode, offlineEngine)
                );
                await Promise.all(promises);
            }
            return 0;
        }

        const allExecutionPromises = [];
        let totalDuration = 0;

        // For each iteration of the loop
        for (let iteration = 0; iteration < count; iteration++) {
            const iterationStartTime = startTime + totalDuration;

            // Schedule all blocks for this iteration - shorter blocks loop within the iteration
            blockDurations.forEach(blockInfo => {
                const { name, duration } = blockInfo;

                if (duration <= 0) {
                    // Play once if duration is 0
                    allExecutionPromises.push(this.executeOfflineBlock(name, iterationStartTime, effectInputNode, offlineEngine));
                } else {
                    // Loop the block to fill the maxIterationDuration
                    const loopCount = Math.ceil(maxIterationDuration / duration);

                    for (let i = 0; i < loopCount; i++) {
                        const loopStartTime = iterationStartTime + (i * duration);
                        // Ensure we don't schedule past the iteration's max duration
                        if (loopStartTime < iterationStartTime + maxIterationDuration) {
                            allExecutionPromises.push(this.executeOfflineBlock(name, loopStartTime, effectInputNode, offlineEngine));
                        }
                    }
                }
            });

            totalDuration += maxIterationDuration;
        }

        // Wait for all scheduled blocks to complete their execution logic
        await Promise.all(allExecutionPromises);

        return totalDuration;
    }

    async executeOfflineLoopAsync(parts, startTime, effectInputNode, offlineEngine) {
        // For offline rendering, loopasync behaves the same as loop since we're not in real-time
        return this.executeOfflineLoop(parts, startTime, effectInputNode, offlineEngine);
    }

    async executeOfflineIf(parts, startTime, commands, currentIndex, effectInputNode, offlineEngine) {
        const variable = parts[1];
        const operator = parts[2];
        const value = window.codeInterpreter.parseValue(parts[3]);
        const varValue = window.codeInterpreter.parseValue(variable);

        let condition = false;
        switch (operator) {
            case '>': condition = varValue > value; break;
            case '<': condition = varValue < value; break;
            case '==': condition = varValue == value; break;
            case '!=': condition = varValue != value; break;
            case '>=': condition = varValue >= value; break;
            case '<=': condition = varValue <= value; break;
        }

        // Find matching endif
        let endifIndex = this.findMatchingEndOffline(commands, currentIndex, 'if', 'endif');

        if (condition) {
            // Execute commands between if and endif
            return await this.executeOfflineCommandBlock(commands, currentIndex + 1, endifIndex, startTime, effectInputNode, offlineEngine);
        }

        return { duration: 0, nextIndex: endifIndex + 1 };
    }

    async executeOfflineFor(parts, startTime, commands, currentIndex, effectInputNode, offlineEngine) {
        const variable = parts[1];
        const start = window.codeInterpreter.parseValue(parts[2]);
        const end = window.codeInterpreter.parseValue(parts[3]);

        let totalDuration = 0;
        const endforIndex = this.findMatchingEndOffline(commands, currentIndex, 'for', 'endfor');

        for (let i = start; i <= end; i++) {
            window.codeInterpreter.variables.set(variable, i);
            const result = await this.executeOfflineCommandBlock(commands, currentIndex + 1, endforIndex, startTime + totalDuration, effectInputNode, offlineEngine);
            totalDuration += result.duration;
        }

        return { duration: totalDuration, nextIndex: endforIndex + 1 };
    }

    async executeOfflineCommandBlock(commands, startIndex, endIndex, startTime, effectInputNode, offlineEngine) {
        let currentTime = 0;
        let i = startIndex;

        while (i < endIndex) {
            const command = commands[i];
            const parts = command.split(/\s+/);
            const cmd = parts[0];

            // Handle control flow commands
            if (cmd === 'if') {
                const result = await this.executeOfflineIf(parts, startTime + currentTime, commands, i, effectInputNode, offlineEngine);
                currentTime += result.duration;
                i = result.nextIndex;
            } else if (cmd === 'for') {
                const result = await this.executeOfflineFor(parts, startTime + currentTime, commands, i, effectInputNode, offlineEngine);
                currentTime += result.duration;
                i = result.nextIndex;
            } else if (cmd === 'endif' || cmd === 'endfor') {
                // These should be handled by their respective start commands
                i++;
            } else {
                // Regular commands
                const duration = await this.executeOfflineCommand(command, startTime + currentTime, effectInputNode, offlineEngine);
                currentTime += duration;
                i++;
            }
        }

        return { duration: currentTime };
    }

    findMatchingEndOffline(commands, startIndex, startKeyword, endKeyword) {
        let depth = 1;
        for (let i = startIndex + 1; i < commands.length; i++) {
            const cmd = commands[i].split(/\s+/)[0];
            if (cmd === startKeyword) depth++;
            if (cmd === endKeyword) depth--;
            if (depth === 0) return i;
        }
        return commands.length - 1;
    }

    async playOfflineSample(sampleName, offlineContext, outputNode, when, pitch = 1, timescale = 1, volume = 1) {
        if (!this.samples.has(sampleName)) {
            console.warn(`Sample '${sampleName}' not found for export`);
            return;
        }

        const buffer = this.samples.get(sampleName);
        const source = offlineContext.createBufferSource();
        const gainNode = offlineContext.createGain();

        source.buffer = buffer;
        source.playbackRate.value = pitch * timescale;
        gainNode.gain.value = volume;

        source.connect(gainNode);
        gainNode.connect(outputNode);

        // Schedule the sample to start at the specified time
        source.start(when);

        console.log(`Scheduled sample '${sampleName}' at time ${when} with pitch ${pitch} and timescale ${timescale}`);
        return source;
    }

    generateOfflineTone(frequency, duration, offlineContext, outputNode, when, waveType = 'sine', volume = 1) {
        const oscillator = offlineContext.createOscillator();
        const gainNode = offlineContext.createGain();

        oscillator.type = waveType;
        oscillator.frequency.value = frequency;
        gainNode.gain.value = 0;

        oscillator.connect(gainNode);
        gainNode.connect(outputNode);

        // Ensure startTime is never negative
        const startTime = Math.max(0, when);
        const endTime = startTime + duration;

        // ADSR envelope with safe time values
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(volume * 0.5, Math.max(startTime + 0.01, startTime + duration * 0.1));
        gainNode.gain.linearRampToValueAtTime(volume * 0.4, Math.max(startTime + 0.1, endTime - duration * 0.1));
        gainNode.gain.setValueAtTime(volume * 0.3, Math.max(endTime - 0.1, endTime - duration * 0.1));
        gainNode.gain.exponentialRampToValueAtTime(0.001, endTime);

        // Schedule the tone to start and stop at the specified times
        oscillator.start(startTime);
        oscillator.stop(endTime);

        console.log(`Scheduled tone ${frequency}Hz for ${duration}s at time ${startTime}`);
        return oscillator;
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
