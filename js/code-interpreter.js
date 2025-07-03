class CodeInterpreter {
    constructor(audioEngine) {
        this.audioEngine = audioEngine;
        this.blocks = new Map();
        this.globalCommands = [];
        this.variables = new Map();
        this.isRunning = false;
        this.currentPosition = 0;
        this.loopStacks = new Map();
        this.effects = new Map();
        this.customSamples = new Map();
        this.activeUtterances = [];

        // Default values
        this.defaultVolume = 0.8;
        this.defaultPan = 0;
        this.defaultPitch = 1;
        this.defaultTimescale = 1;
        this.bpm = 120; // Default BPM
        this.beatDuration = 60 / this.bpm;

        this.forLoopStacks = new Map();
        this.conditionalBlocks = new Map();
    }

    parse(code) {
        try {
            this.blocks.clear();
            this.globalCommands = [];
            this.variables.clear();
            this.customSamples.clear();
            this.effects.clear();

            // Remove comments (everything after // on each line)
            const lines = code.split('\n')
                .map(line => {
                    const idx = line.indexOf('//');
                    if (idx !== -1) {
                        return line.slice(0, idx).trim();
                    }
                    return line.trim();
                })
                .filter(line => line); // Remove empty lines

            // Split each line by semicolons and flatten into a single array of commands
            const allCommands = [];
            for (const line of lines) {
                if (line.startsWith('[') || line.startsWith('<') || line === '[end]' || line === '<end>') {
                    // Don't split block headers/endings by semicolon
                    allCommands.push(line);
                } else {
                    // Split by semicolon and add each non-empty command
                    const commands = line.split(';').map(cmd => cmd.trim()).filter(cmd => cmd);
                    allCommands.push(...commands);
                }
            }

            let currentBlock = null;
            let blockContent = [];
            let inCustomSample = false;
            let customSampleName = '';
            let blockEffects = [];

            for (let i = 0; i < allCommands.length; i++) {
                const line = allCommands[i].trim();

                // Custom sample block start: <blockName>
                if (line.startsWith('<') && line.endsWith('>') && line !== '<end>') {
                    inCustomSample = true;
                    customSampleName = line.slice(1, -1);
                    blockContent = [];
                    currentBlock = null; // Ensure we are not in a regular block
                    continue;
                }

                // Universal block end: handles both [end] and <end> for any block type
                if (line === '[end]' || line === '<end>') {
                    if (inCustomSample && customSampleName) {
                        this.customSamples.set(customSampleName, blockContent.slice());
                        inCustomSample = false;
                        customSampleName = '';
                        blockContent = [];
                    } else if (currentBlock) {
                        this.blocks.set(currentBlock, blockContent);
                        currentBlock = null;
                        blockContent = [];
                    }
                    continue;
                }

                if (inCustomSample) {
                    blockContent.push(line);
                    continue;
                }

                // Block start with effects: [block] (effect...) (effect2...)
                const blockHeaderMatch = line.match(/^\[([^\]]+)\](.*)$/);
                if (blockHeaderMatch && blockHeaderMatch[1].trim() !== 'end') {
                    const blockName = blockHeaderMatch[1].trim();
                    const effectsPart = blockHeaderMatch[2].trim();
                    blockEffects = [];
                    // Find all (effect ...) groups
                    const effectRegex = /\(([^\)]+)\)/g;
                    let match;
                    while ((match = effectRegex.exec(effectsPart)) !== null) {
                        const effectParts = match[1].trim().split(/\s+/);
                        const effectType = effectParts[0];
                        const params = effectParts.slice(1);
                        blockEffects.push({ type: effectType, params });
                    }
                    if (blockEffects.length > 0) {
                        this.effects.set(blockName, blockEffects);
                    }
                    currentBlock = blockName;
                    blockContent = [];
                    inCustomSample = false; // Ensure we are not in a custom sample block
                    continue;
                }

                // Block content or global command
                if (currentBlock) {
                    blockContent.push(line);
                } else {
                    this.globalCommands.push(line);
                }
            }

            return { success: true, message: 'Code parsed successfully' };
        } catch (error) {
            return { success: false, message: `Parse error: ${error.message}` };
        }
    }

    validate() {
        const errors = [];

        // Check for main block
        if (!this.blocks.has('main')) {
            errors.push('Warning: No [main] block found');
        }

        // Validate block syntax
        for (const [blockName, commands] of this.blocks) {
            for (let i = 0; i < commands.length; i++) {
                const command = commands[i];
                const validation = this.validateCommand(command);
                if (!validation.valid) {
                    errors.push(`Block '${blockName}', line ${i + 1}: ${validation.error}`);
                }
            }
        }

        // Validate global commands
        for (let i = 0; i < this.globalCommands.length; i++) {
            const command = this.globalCommands[i];
            const validation = this.validateCommand(command);
            if (!validation.valid) {
                errors.push(`Global command line ${i + 1}: ${validation.error}`);
            }
        }

        return {
            valid: errors.length === 0,
            errors: errors
        };
    }

    validateCommand(command) {
        const parts = command.split(/\s+/);
        const cmd = parts[0];

        switch (cmd) {
            case 'sample':
                if (parts.length < 2) {
                    return { valid: false, error: 'sample command requires at least sample name' };
                }
                break;
            case 'tone':
                if (parts.length < 2) {
                    return { valid: false, error: 'tone command requires at least frequency/note' };
                }
                break;
            case 'slide':
                if (parts.length < 4) {
                    return { valid: false, error: 'slide command requires key1, key2, and timescale' };
                }
                break;
            case 'sidechain':
                if (parts.length < 4) {
                    return { valid: false, error: 'sidechain command requires block1, block2, and amount' };
                }
                if (isNaN(parseFloat(parts[3])) || parseFloat(parts[3]) < 0 || parseFloat(parts[3]) > 1) {
                    return { valid: false, error: 'sidechain amount must be between 0 and 1' };
                }
                break;
            case 'wait':
                if (parts.length < 2) {
                    return { valid: false, error: 'wait command requires duration' };
                }
                if (isNaN(parseFloat(parts[1]))) {
                    return { valid: false, error: 'wait duration must be a number' };
                }
                break;
            case 'play':
            case 'playasync':
                if (parts.length < 2) {
                    return { valid: false, error: 'play command requires at least one block name' };
                }
                break;
            case 'bpm':
                if (parts.length < 2) {
                    return { valid: false, error: 'bpm command requires BPM value' };
                }
                if (isNaN(parseFloat(parts[1])) || parseFloat(parts[1]) <= 0) {
                    return { valid: false, error: 'BPM must be a positive number' };
                }
                break;
            case 'loop':
            case 'loopasync':
                if (parts.length < 3) {
                    return { valid: false, error: 'loop command requires count and at least one block name' };
                }
                if (isNaN(parseInt(parts[1]))) {
                    return { valid: false, error: 'loop count must be a number' };
                }
                break;
            case 'pattern':
                if (parts.length < 3) {
                    return { valid: false, error: 'pattern command requires name and pattern string' };
                }
                break;
            case 'sequence':
                if (parts.length < 3) {
                    return { valid: false, error: 'sequence command requires name and step pattern' };
                }
                break;
            case 'set':
                if (parts.length < 3) {
                    return { valid: false, error: 'set command requires variable name and value' };
                }
                break;
            case 'effect':
                if (parts.length < 3) {
                    return { valid: false, error: 'effect command requires effect type and parameters' };
                }
                const effectType = parts[1];
                const validEffects = ['reverb', 'delay', 'filter', 'distortion', 'chorus'];
                if (!validEffects.includes(effectType)) {
                    return { valid: false, error: `Unknown effect type: ${effectType}. Valid effects: ${validEffects.join(', ')}` };
                }
                break;
            case 'if':
                if (parts.length < 4) {
                    return { valid: false, error: 'if statement requires variable, operator, and value' };
                }
                break;
            case 'for':
                if (parts.length < 4) {
                    return { valid: false, error: 'for loop requires variable, start, and end values' };
                }
                break;
            case 'endif':
            case 'endfor':
                // No additional validation needed
                break;
            case 'tts':
                if (parts.length < 2) {
                    return { valid: false, error: 'tts command requires text' };
                }
                // Check if speechSynthesis is available
                if (typeof speechSynthesis === 'undefined') {
                    return { valid: false, error: 'Text-to-speech not supported in this browser' };
                }
                break;
            default:
                return { valid: false, error: `Unknown command: ${cmd}` };
        }

        return { valid: true };
    }

    async execute() {
        if (!this.audioEngine) {
            throw new Error('Audio engine not available');
        }

        this.isRunning = true;
        this.currentPosition = 0;

        try {
            // Execute global commands first
            for (const command of this.globalCommands) {
                if (!this.isRunning) break;
                await this.executeCommand(command, 0);
            }

            // If no global play commands, try to play main block
            if (this.globalCommands.length === 0 && this.blocks.has('main')) {
                await this.executeBlock('main', 0);
            }

        } catch (error) {
            console.error('Execution error:', error);
            throw error;
        }
    }

    async executeCommand(command, startTime, effectNodes = []) {
        const parts = command.split(/\s+/);
        const cmd = parts[0];

        switch (cmd) {
            case 'sample':
                return this.executeSample(parts, startTime, effectNodes);
            case 'tone':
                return this.executeTone(parts, startTime, effectNodes);
            case 'slide':
                return this.executeSlide(parts, startTime);
            case 'sidechain':
                return this.executeSidechain(parts, startTime);
            case 'wait':
                return this.executeWait(parts, startTime);
            case 'play':
                return this.executePlay(parts, startTime);
            case 'playasync':
                return this.executePlayAsync(parts, startTime);
            case 'loopasync':
                return this.executeLoopAsync(parts, startTime);
            case 'loop':
                return this.executeLoop(parts, startTime);
            case 'set':
                return this.executeSet(parts);
            case 'effect':
                return this.executeEffect(parts, startTime);
            case 'bpm':
                return this.executeBPM(parts);
            case 'pattern':
                return this.executePattern(parts, startTime);
            case 'sequence':
                return this.executeSequence(parts, startTime);
            case 'tts':
                return this.executeTTS(parts, startTime);
            default:
                console.warn(`Unknown command: ${cmd}`);
                return 0;
        }
    }

    executeBPM(parts) {
        const newBPM = parseFloat(parts[1]);
        this.bpm = newBPM;
        this.beatDuration = 60 / this.bpm;
        console.log(`BPM set to ${this.bpm}, beat duration: ${this.beatDuration}s`);
        return 0;
    }

    async executePattern(parts, startTime, effectNodes = []) {
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
        const stepDuration = this.beatDuration / 4; // 16th notes

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
                    // Schedule the sample play, and run them in parallel
                    executionPromises.push(
                        this.executeCommand(`sample ${pattern.name}`, hitTime, effectNodes)
                    );
                }
            }
        }

        // Wait for all sample scheduling commands to be initiated
        await Promise.all(executionPromises);

        // The total duration is determined by the longest pattern
        return maxLength * stepDuration;
    }

    async executeSequence(parts, startTime, effectNodes = []) {
        const sampleName = parts[1];
        const steps = parts.slice(2);

        let currentTime = 0;
        const stepDuration = this.beatDuration / 4;

        for (let i = 0; i < steps.length; i++) {
            const step = steps[i];
            if (step !== '-' && step !== '0') {
                await this.executeCommand(`sample ${step}`, startTime + currentTime, effectNodes);
            }
            currentTime += stepDuration;
        }

        return currentTime;
    }

    async executeIf(parts, startTime, commands, currentIndex) {
        const variable = parts[1];
        const operator = parts[2];
        const value = this.parseValue(parts[3]);
        const varValue = this.parseValue(variable);

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
        let endifIndex = this.findMatchingEnd(commands, currentIndex, 'if', 'endif');

        if (condition) {
            // Execute commands between if and endif
            return await this.executeCommandBlock(commands, currentIndex + 1, endifIndex, startTime);
        }

        return { duration: 0, nextIndex: endifIndex + 1 };
    }

    async executeFor(parts, startTime, commands, currentIndex) {
        const variable = parts[1];
        const start = this.parseValue(parts[2]);
        const end = this.parseValue(parts[3]);

        let totalDuration = 0;
        const endforIndex = this.findMatchingEnd(commands, currentIndex, 'for', 'endfor');

        for (let i = start; i <= end; i++) {
            this.variables.set(variable, i);
            const result = await this.executeCommandBlock(commands, currentIndex + 1, endforIndex, startTime + totalDuration);
            totalDuration += result.duration;
        }

        return { duration: totalDuration, nextIndex: endforIndex + 1 };
    }

    async executeTTS(parts, startTime) {
        // Check if we're in offline rendering mode
        if (this.audioEngine && this.audioEngine.audioContext && this.audioEngine.audioContext.constructor.name === 'OfflineAudioContext') {
            // In offline mode, just return estimated duration without actual TTS
            console.warn('TTS not supported in offline rendering mode');

            // Extract text and estimate duration (same logic as below)
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

            const rate = this.parseValue(parts[paramStartIndex] || '1');
            const adjustedRate = rate * (this.bpm / 120);
            const wordsPerMinute = 150 * adjustedRate;
            const wordCount = text.split(' ').length;
            const estimatedDuration = (wordCount / wordsPerMinute) * 60;

            return estimatedDuration;
        }

        // Extract text (handle quoted strings)
        let text = '';
        let paramStartIndex = 1;

        // If text starts with quote, find the closing quote
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
            // Single word
            text = parts[1] || 'Hello';
            paramStartIndex = 2;
        }

        const rate = this.parseValue(parts[paramStartIndex] || '1');     // Speed (0.1 to 10)
        const pitch = this.parseValue(parts[paramStartIndex + 1] || '1'); // Pitch (0 to 2)
        const voiceIndex = parseInt(parts[paramStartIndex + 2] || '0');   // Voice ID

        // Adjust rate based on BPM if needed
        const adjustedRate = rate * (this.bpm / 120); // Scale with BPM

        // Create speech synthesis utterance
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = Math.max(0.1, Math.min(10, adjustedRate));
        utterance.pitch = Math.max(0, Math.min(2, pitch));

        // Set voice if available
        const voices = speechSynthesis.getVoices();
        if (voices.length > 0 && voiceIndex < voices.length) {
            utterance.voice = voices[voiceIndex];
        }

        // --- STABILITY FIX START ---
        // The SpeechSynthesis API can be unstable. Holding a reference to the
        // utterance object and managing its lifecycle helps prevent issues
        // like repeated, cut-off, or dropped lines.
        const cleanup = () => {
            const index = this.activeUtterances.indexOf(utterance);
            if (index > -1) {
                this.activeUtterances.splice(index, 1);
            }
        };

        utterance.onend = cleanup;
        utterance.onerror = (event) => {
            console.error(`SpeechSynthesis error for "${text}": ${event.error}`);
            cleanup();
        };

        this.activeUtterances.push(utterance);
        // --- STABILITY FIX END ---

        // --- TIMING FIX START ---
        // Schedule the speech relative to the audio context's clock for precision.
        const delayInSeconds = startTime - this.audioEngine.audioContext.currentTime;
        const delayInMilliseconds = Math.max(0, delayInSeconds * 1000);

        setTimeout(() => {
            if (this.isRunning) { // Only speak if execution hasn't been stopped
                speechSynthesis.speak(utterance);
            } else {
                // If execution was stopped before this timeout fired, ensure cleanup.
                cleanup();
            }
        }, delayInMilliseconds);
        // --- TIMING FIX END ---

        // Estimate duration (rough calculation)
        const wordsPerMinute = 150 * utterance.rate;
        const wordCount = text.split(' ').length;
        const estimatedDuration = (wordCount / wordsPerMinute) * 60;

        return estimatedDuration;
    }

    findMatchingEnd(commands, startIndex, startKeyword, endKeyword) {
        let depth = 1;
        for (let i = startIndex + 1; i < commands.length; i++) {
            const cmd = commands[i].split(/\s+/)[0];
            if (cmd === startKeyword) depth++;
            if (cmd === endKeyword) depth--;
            if (depth === 0) return i;
        }
        return commands.length - 1;
    }

    async executeCommandBlock(commands, startIndex, endIndex, startTime) {
        let currentTime = 0;
        let i = startIndex;

        while (i < endIndex) {
            const command = commands[i];
            const parts = command.split(/\s+/);
            const cmd = parts[0];

            // Handle control flow commands here, not in executeCommand
            if (cmd === 'if') {
                const result = await this.executeIf(parts, startTime + currentTime, commands, i);
                currentTime += result.duration;
                i = result.nextIndex;
            } else if (cmd === 'for') {
                const result = await this.executeFor(parts, startTime + currentTime, commands, i);
                currentTime += result.duration;
                i = result.nextIndex;
            } else if (cmd === 'endif' || cmd === 'endfor') {
                // These should be handled by their respective start commands
                i++;
            } else {
                // Regular commands
                const duration = await this.executeCommand(command, startTime + currentTime);
                currentTime += duration;
                i++;
            }
        }

        return { duration: currentTime };
    }

    async executeSample(parts, startTime, effectNodes = []) {
        const sampleName = parts[1];
        const pitch = this.parseValue(parts[2] || '1');
        const timescale = this.parseValue(parts[3] || '1');
        const volume = this.parseValue(parts[4] || this.defaultVolume);
        const pan = this.parseValue(parts[5] || this.defaultPan);

        // Parse additional parameters
        const params = this.parseParameters(parts.slice(6));

        // If sampleName is a custom sample block, play all commands in the block simultaneously
        if (this.customSamples.has(sampleName)) {
            const commands = this.customSamples.get(sampleName);
            // Run all commands in parallel at the same startTime
            await Promise.all(commands.map(command =>
                this.executeCommand(command, startTime, effectNodes)
            ));
            return 0;
        }

        // Connect to effect chain if present, otherwise use default output
        let outputNode = this.audioEngine.eq.low;
        if (effectNodes && typeof effectNodes.connect === 'function') {
            outputNode = effectNodes;
        } else if (effectNodes && effectNodes.length > 0) {
            outputNode = effectNodes[0];
        }

        this.audioEngine.playSample(
            sampleName,
            pitch,
            timescale,
            startTime,
            Math.max(0.001, Number(volume) * (params.volume || 1)),
            pan + (params.pan || 0),
            outputNode
        );

        return 0; // Samples don't add to timing by default
    }

    executeTone(parts, startTime, effectNodes = []) {
        const noteOrFreq = parts[1];
        let duration = this.parseValue(parts[2] || '1');
        const volume = this.parseValue(parts[4] || this.defaultVolume);
        const pan = this.parseValue(parts[5] || this.defaultPan);
        const waveType = parts[3] || 'sine';

        // Convert duration based on BPM (treat duration as beats)
        const durationInSeconds = duration * this.beatDuration;

        // Parse additional parameters
        const params = this.parseParameters(parts.slice(6));

        let frequency;
        if (isNaN(noteOrFreq)) {
            frequency = this.audioEngine.noteToFrequency(noteOrFreq);
        } else {
            frequency = parseFloat(noteOrFreq);
        }

        // Connect to effect chain if present, otherwise use default output
        let outputNode = this.audioEngine.eq.low;
        if (effectNodes && typeof effectNodes.connect === 'function') {
            outputNode = effectNodes;
        } else if (effectNodes && effectNodes.length > 0) {
            outputNode = effectNodes[0];
        }

        // Create oscillator and gain node for smooth envelope
        const ctx = this.audioEngine.audioContext;
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        const panNode = ctx.createStereoPanner();

        oscillator.type = waveType;
        oscillator.frequency.value = frequency;
        panNode.pan.value = Math.max(-1, Math.min(1, pan + (params.pan || 0)));

        // Connect audio graph
        oscillator.connect(gainNode);
        gainNode.connect(panNode);
        panNode.connect(outputNode);

        // Calculate timing
        const s = ctx.currentTime + startTime;
        const e = s + durationInSeconds;

        // Smooth envelope to prevent clicks
        const fadeTime = Math.min(0.005, durationInSeconds * 0.1); // 5ms or 10% of duration, whichever is smaller
        const targetVolume = volume * (params.volume || 1);

        gainNode.gain.setValueAtTime(0, s);
        gainNode.gain.linearRampToValueAtTime(targetVolume, s + fadeTime);
        gainNode.gain.setValueAtTime(targetVolume, e - fadeTime);
        gainNode.gain.linearRampToValueAtTime(0, e);

        // Start and stop oscillator
        oscillator.start(s);
        oscillator.stop(e);

        // Track active sources
        this.audioEngine.activeSources.add(oscillator);
        oscillator.addEventListener('ended', () => {
            this.audioEngine.activeSources.delete(oscillator);
        });

        return durationInSeconds;
    }

    async executeSlide(parts, startTime) {
        const key1 = parts[1];
        const key2 = parts[2];
        const timescale = this.parseValue(parts[3] || '1');
        const durationInSeconds = timescale * this.beatDuration;

        // Optional: waveType, volume, pan
        const waveType = parts[4] || 'sine';
        const volume = this.parseValue(parts[5] || this.defaultVolume);
        const pan = this.parseValue(parts[6] || this.defaultPan);

        // Support both note names and frequencies
        const freq1 = isNaN(key1) ? this.audioEngine.noteToFrequency(key1) : parseFloat(key1);
        const freq2 = isNaN(key2) ? this.audioEngine.noteToFrequency(key2) : parseFloat(key2);

        const ctx = this.audioEngine.audioContext;
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        const panNode = ctx.createStereoPanner();

        // Define the absolute start and end times for all scheduling
        const s = ctx.currentTime + startTime;
        const e = s + durationInSeconds;

        // Schedule the oscillator frequency changes
        oscillator.type = waveType;
        oscillator.frequency.setValueAtTime(freq1, s);
        oscillator.frequency.linearRampToValueAtTime(freq2, e);

        // Schedule the pan value
        panNode.pan.setValueAtTime(Math.max(-1, Math.min(1, pan)), s);

        // Smooth envelope - shorter fade times for slides
        const fadeTime = Math.min(0.003, durationInSeconds * 0.03); // 3ms or 3% of duration

        gainNode.gain.setValueAtTime(0, s);
        gainNode.gain.linearRampToValueAtTime(volume, s + fadeTime);
        gainNode.gain.setValueAtTime(volume, e - fadeTime);
        gainNode.gain.linearRampToValueAtTime(0, e);

        // Connect the audio graph
        oscillator.connect(gainNode);
        gainNode.connect(panNode);
        panNode.connect(this.audioEngine.eq.low);

        // Schedule the oscillator to start and stop
        oscillator.start(s);
        oscillator.stop(e);

        // Track active sources for stopping
        this.audioEngine.activeSources.add(oscillator);
        oscillator.addEventListener('ended', () => {
            this.audioEngine.activeSources.delete(oscillator);
        });

        return durationInSeconds;
    }

    async executeSidechain(parts, startTime) {
        const block1 = parts[1]; // Block to be ducked
        const block2 = parts[2]; // Trigger block
        const amount = parseFloat(parts[3]);

        if (!this.blocks.has(block1) || !this.blocks.has(block2)) {
            console.warn(`One or both blocks not found: ${block1}, ${block2}`);
            return 0;
        }

        const ctx = this.audioEngine.audioContext;
        
        // Create a gain node to control block1's volume
        const sidechainGain = ctx.createGain();
        sidechainGain.gain.value = 1; // Start at full volume

        // Create a compressor for more realistic sidechain effect
        const compressor = ctx.createDynamicsCompressor();
        compressor.threshold.value = -50;
        compressor.knee.value = 40;
        compressor.ratio.value = 20;
        compressor.attack.value = 0.003;
        compressor.release.value = 0.1;

        // Connect sidechain gain to compressor to output
        sidechainGain.connect(compressor);
        compressor.connect(this.audioEngine.eq.low);

        // Calculate durations for both blocks
        const block1Duration = this.estimateDuration(block1);
        const block2Duration = this.estimateDuration(block2);
        
        // Use the longer duration, but ensure we have at least some playback time
        const maxDuration = Math.max(block1Duration, block2Duration, 4); // Minimum 4 seconds

        console.log(`Sidechain: block1 (${block1}) duration: ${block1Duration}s, block2 (${block2}) duration: ${block2Duration}s, total: ${maxDuration}s`);

        // Override methods to route audio properly
        const originalPlaySample = this.audioEngine.playSample.bind(this.audioEngine);
        const originalExecuteTone = this.executeTone.bind(this);
        
        let currentExecutingBlock = null;

        // Create routing methods
        const sidechainPlaySample = (sampleName, pitch, timescale, when, volume, pan, outputNode) => {
            if (currentExecutingBlock === block1) {
                // Route block1 through sidechain gain
                return originalPlaySample(sampleName, pitch, timescale, when, volume, pan, sidechainGain);
            } else {
                // Block2 goes directly to output
                return originalPlaySample(sampleName, pitch, timescale, when, volume, pan, this.audioEngine.eq.low);
            }
        };

        const sidechainExecuteTone = (parts, startTime, effectNodes) => {
            if (currentExecutingBlock === block1) {
                // Route block1 tones through sidechain gain
                return originalExecuteTone.call(this, parts, startTime, [sidechainGain]);
            } else {
                // Block2 tones go directly to output
                return originalExecuteTone.call(this, parts, startTime, [this.audioEngine.eq.low]);
            }
        };

        // Analyze block2 for trigger detection
        const getTriggerTimes = (blockName, blockDuration, totalDuration) => {
            const commands = this.blocks.get(blockName);
            const triggers = [];
            
            const loopCount = blockDuration > 0 ? Math.ceil(totalDuration / blockDuration) : 1;
            
            for (let loop = 0; loop < loopCount; loop++) {
                const loopStart = loop * blockDuration;
                if (loopStart >= totalDuration) break;
                
                let time = 0;
                
                for (const command of commands) {
                    const cmdParts = command.split(/\s+/);
                    const cmd = cmdParts[0];

                    if (cmd === 'sample') {
                        triggers.push(loopStart + time);
                    } else if (cmd === 'tone') {
                        triggers.push(loopStart + time);
                        const duration = this.parseValue(cmdParts[2] || '1') * this.beatDuration;
                        time += duration;
                    } else if (cmd === 'slide') {
                        triggers.push(loopStart + time);
                        const duration = this.parseValue(cmdParts[3] || '1') * this.beatDuration;
                        time += duration;
                    } else if (cmd === 'wait') {
                        time += this.parseValue(cmdParts[1]) * this.beatDuration;
                    } else if (cmd === 'pattern') {
                        // Handle pattern triggers
                        for (let i = 2; i < cmdParts.length; i += 2) {
                            if (i + 1 < cmdParts.length) {
                                const patternStr = cmdParts[i + 1].replace(/"/g, '');
                                const steps = patternStr.split('-');
                                const stepDuration = this.beatDuration / 4;
                                
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
        };

        // Get all trigger times from block2
        const triggerTimes = getTriggerTimes(block2, block2Duration, maxDuration);
        console.log(`Sidechain: Found ${triggerTimes.length} triggers at times:`, triggerTimes);

        // Schedule ducking automation
        const duckDuration = 0.15; // How long the duck lasts
        const attackTime = 0.01;   // How quickly it ducks

        triggerTimes.forEach((triggerTime, index) => {
            if (triggerTime < maxDuration) {
                const absoluteTime = ctx.currentTime + startTime + triggerTime;
                
                console.log(`Scheduling duck ${index + 1} at ${triggerTime}s (absolute: ${absoluteTime}s)`);
                
                // Duck the gain
                sidechainGain.gain.cancelScheduledValues(absoluteTime);
                sidechainGain.gain.setValueAtTime(1, absoluteTime);
                sidechainGain.gain.linearRampToValueAtTime(1 - amount, absoluteTime + attackTime);
                sidechainGain.gain.linearRampToValueAtTime(1, absoluteTime + duckDuration);
            }
        });

        // Override the audio methods
        this.audioEngine.playSample = sidechainPlaySample;
        this.executeTone = sidechainExecuteTone;

        try {
            const promises = [];

            // Execute block1 (gets sidechained)
            currentExecutingBlock = block1;
            if (block1Duration > 0 && block1Duration < maxDuration) {
                // Loop block1 to fill duration
                const loops = Math.ceil(maxDuration / block1Duration);
                for (let i = 0; i < loops; i++) {
                    const loopStart = startTime + (i * block1Duration);
                    if (loopStart < startTime + maxDuration) {
                        promises.push(this.executeBlock(block1, loopStart));
                    }
                }
            } else {
                promises.push(this.executeBlock(block1, startTime));
            }
            
            // Execute block2 (triggers sidechain)
            currentExecutingBlock = block2;
            if (block2Duration > 0 && block2Duration < maxDuration) {
                // Loop block2 to fill duration
                const loops = Math.ceil(maxDuration / block2Duration);
                for (let i = 0; i < loops; i++) {
                    const loopStart = startTime + (i * block2Duration);
                    if (loopStart < startTime + maxDuration) {
                        promises.push(this.executeBlock(block2, loopStart));
                    }
                }
            } else {
                promises.push(this.executeBlock(block2, startTime));
            }

            await Promise.all(promises);
            return maxDuration;

        } finally {
            // Restore original methods
            this.audioEngine.playSample = originalPlaySample;
            this.executeTone = originalExecuteTone;
            currentExecutingBlock = null;
        }
    }

    executeWait(parts, startTime) {
        let duration = this.parseValue(parts[1]);
        // Convert wait duration based on BPM (treat as beats)
        return duration * this.beatDuration;
    }

    async executePlay(parts, startTime) {
        const blockNames = [];
        const params = {};

        // Parse block names and parameters
        for (let i = 1; i < parts.length; i++) {
            if (parts[i].includes('=')) {
                const [key, value] = parts[i].split('=');
                params[key] = this.parseValue(value);
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
            duration: this.estimateDuration(name)
        }));

        // Find the maximum duration among all blocks
        const maxDuration = Math.max(...blockDurations.map(b => b.duration), 0);

        if (maxDuration === 0) {
            // If max duration is 0, just play all blocks once simultaneously
            const promises = blockNames.map(blockName => this.executeBlock(blockName, startTime, params));
            await Promise.all(promises);
            return 0;
        }

        const allExecutionPromises = [];

        // Schedule all block executions - shorter blocks loop to match longest
        blockDurations.forEach(blockInfo => {
            const { name, duration } = blockInfo;

            if (duration <= 0) {
                // Play once if duration is 0
                allExecutionPromises.push(this.executeBlock(name, startTime, params));
            } else {
                // Loop the block to fill the maxDuration
                const loopCount = Math.ceil(maxDuration / duration);

                for (let i = 0; i < loopCount; i++) {
                    if (!this.isRunning) break;
                    const loopStartTime = startTime + (i * duration);
                    // Ensure we don't schedule past the max duration
                    if (loopStartTime < startTime + maxDuration) {
                        allExecutionPromises.push(this.executeBlock(name, loopStartTime, params));
                    }
                }
            }
        });

        // Wait for all scheduled blocks to complete their execution logic
        await Promise.all(allExecutionPromises);

        // The total duration of the play command is the duration of the longest block
        return maxDuration;
    }

    async executePlayAsync(parts, startTime) {
        const blockNames = [];
        const params = {};

        // Parse block names and parameters
        for (let i = 1; i < parts.length; i++) {
            if (parts[i].includes('=')) {
                const [key, value] = parts[i].split('=');
                params[key] = this.parseValue(value);
            } else {
                blockNames.push(parts[i]);
            }
        }

        if (blockNames.length === 0) {
            return 0;
        }

        // Start all blocks immediately without waiting for their completion
        // This runs asynchronously and doesn't block the timeline
        Promise.all(blockNames.map(blockName => 
            this.executeBlock(blockName, startTime, params)
        )).catch(error => {
            console.error('Async play error:', error);
        });

        // Return 0 duration so execution continues immediately
        return 0;
    }

    async executeLoopAsync(parts, startTime) {
        const count = parseInt(parts[1]);
        const blockNames = parts.slice(2);

        // Validate block names
        for (const blockName of blockNames) {
            if (!this.blocks.has(blockName)) {
                console.warn(`Block '${blockName}' not found`);
                return 0;
            }
        }

        // Start the async loop without waiting for completion
        // This runs asynchronously and doesn't block the timeline
        this.executeAsyncLoop(count, blockNames, startTime).catch(error => {
            console.error('Async loop error:', error);
        });

        // Return 0 duration so execution continues immediately
        return 0;
    }

    async executeAsyncLoop(count, blockNames, startTime) {
        // Estimate durations for all blocks
        const blockDurations = blockNames.map(name => ({
            name,
            duration: this.estimateDuration(name)
        }));

        // Find the maximum duration among all blocks in one iteration
        const maxIterationDuration = Math.max(...blockDurations.map(b => b.duration), 0);

        if (maxIterationDuration === 0) {
            // If all blocks have 0 duration, just play them count times
            for (let i = 0; i < count; i++) {
                if (!this.isRunning) break;
                const promises = blockNames.map(blockName =>
                    this.executeBlock(blockName, startTime)
                );
                await Promise.all(promises);
            }
            return;
        }

        const allExecutionPromises = [];
        let totalDuration = 0;

        // For each iteration of the loop
        for (let iteration = 0; iteration < count; iteration++) {
            if (!this.isRunning) break;

            const iterationStartTime = startTime + totalDuration;

            // Schedule all blocks for this iteration - shorter blocks loop within the iteration
            blockDurations.forEach(blockInfo => {
                const { name, duration } = blockInfo;

                if (duration <= 0) {
                    // Play once if duration is 0
                    allExecutionPromises.push(this.executeBlock(name, iterationStartTime));
                } else {
                    // Loop the block to fill the maxIterationDuration
                    const loopCount = Math.ceil(maxIterationDuration / duration);

                    for (let i = 0; i < loopCount; i++) {
                        if (!this.isRunning) break;
                        const loopStartTime = iterationStartTime + (i * duration);
                        // Ensure we don't schedule past the iteration's max duration
                        if (loopStartTime < iterationStartTime + maxIterationDuration) {
                            allExecutionPromises.push(this.executeBlock(name, loopStartTime));
                        }
                    }
                }
            });

            totalDuration += maxIterationDuration;
        }

        // Wait for all scheduled blocks to complete their execution logic
        await Promise.all(allExecutionPromises);
    }

    async executeLoop(parts, startTime) {
        const count = parseInt(parts[1]);
        const blockNames = parts.slice(2);

        // Validate block names
        for (const blockName of blockNames) {
            if (!this.blocks.has(blockName)) {
                console.warn(`Block '${blockName}' not found`);
                return 0;
            }
        }

        // Estimate durations for all blocks
        const blockDurations = blockNames.map(name => ({
            name,
            duration: this.estimateDuration(name)
        }));

        // Find the maximum duration among all blocks in one iteration
        const maxIterationDuration = Math.max(...blockDurations.map(b => b.duration), 0);

        if (maxIterationDuration === 0) {
            // If all blocks have 0 duration, just play them count times
            let totalDuration = 0;
            for (let i = 0; i < count; i++) {
                if (!this.isRunning) break;
                const promises = blockNames.map(blockName =>
                    this.executeBlock(blockName, startTime + totalDuration)
                );
                await Promise.all(promises);
            }
            return 0;
        }

        const allExecutionPromises = [];
        let totalDuration = 0;

        // For each iteration of the loop
        for (let iteration = 0; iteration < count; iteration++) {
            if (!this.isRunning) break;

            const iterationStartTime = startTime + totalDuration;

            // Schedule all blocks for this iteration - shorter blocks loop within the iteration
            blockDurations.forEach(blockInfo => {
                const { name, duration } = blockInfo;

                if (duration <= 0) {
                    // Play once if duration is 0
                    allExecutionPromises.push(this.executeBlock(name, iterationStartTime));
                } else {
                    // Loop the block to fill the maxIterationDuration
                    const loopCount = Math.ceil(maxIterationDuration / duration);

                    for (let i = 0; i < loopCount; i++) {
                        if (!this.isRunning) break;
                        const loopStartTime = iterationStartTime + (i * duration);
                        // Ensure we don't schedule past the iteration's max duration
                        if (loopStartTime < iterationStartTime + maxIterationDuration) {
                            allExecutionPromises.push(this.executeBlock(name, loopStartTime));
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

    executeSet(parts) {
        const varName = parts[1];
        const value = this.parseValue(parts[2]);
        this.variables.set(varName, value);
        return 0;
    }

    executeEffect(parts, startTime) {
        const effectType = parts[1];
        const blockName = parts[2];
        const params = this.parseParameters(parts.slice(3));

        // Store effect for later application
        if (!this.effects.has(blockName)) {
            this.effects.set(blockName, []);
        }
        this.effects.get(blockName).push({ type: effectType, params: params });

        return 0;
    }

    async executeBlock(blockName, startTime, globalParams = {}) {
        if (!this.blocks.has(blockName)) {
            console.warn(`Block '${blockName}' not found`);
            return 0;
        }

        const commands = this.blocks.get(blockName);
        let currentTime = 0;

        // --- EFFECT CHAIN PATCH START ---
        let effectInputNode = this.audioEngine.eq.low; // Default output
        if (this.effects.has(blockName) && this.audioEngine) {
            const ctx = this.audioEngine.audioContext;
            const effects = this.effects.get(blockName);
            let currentNode = this.audioEngine.eq.low; // Start with default output

            // Build effect chain from last to first (reverse order)
            for (let i = effects.length - 1; i >= 0; i--) {
                const effect = effects[i];
                let effectNode = null;
                let wetGain = null;
                let dryGain = null;

                if (effect.type === 'reverb') {
                    effectNode = ctx.createConvolver();
                    if (this.audioEngine.reverb && this.audioEngine.reverb.buffer) {
                        effectNode.buffer = this.audioEngine.reverb.buffer;
                    }

                    // Create wet/dry mix
                    wetGain = ctx.createGain();
                    dryGain = ctx.createGain();
                    const wetAmount = parseFloat(effect.params[0]) || 0.3;
                    wetGain.gain.value = wetAmount;
                    dryGain.gain.value = 1 - wetAmount;

                    // Connect: input -> [dry path, wet path] -> output
                    effectNode.connect(wetGain);
                    wetGain.connect(currentNode);
                    dryGain.connect(currentNode);

                    // Create input splitter
                    const splitter = ctx.createGain();
                    splitter.connect(effectNode); // to wet
                    splitter.connect(dryGain);    // to dry

                    currentNode = splitter;

                } else if (effect.type === 'delay') {
                    effectNode = ctx.createDelay(1); // Max 1 second delay
                    const delayTime = parseFloat(effect.params[0]) || 0.3;
                    const feedback = parseFloat(effect.params[1]) || 0.3;
                    const wetAmount = parseFloat(effect.params[2]) || 0.3;

                    effectNode.delayTime.value = delayTime;

                    // Create feedback loop
                    const feedbackGain = ctx.createGain();
                    feedbackGain.gain.value = feedback;
                    effectNode.connect(feedbackGain);
                    feedbackGain.connect(effectNode);

                    // Create wet/dry mix
                    wetGain = ctx.createGain();
                    dryGain = ctx.createGain();
                    wetGain.gain.value = wetAmount;
                    dryGain.gain.value = 1 - wetAmount;

                    effectNode.connect(wetGain);
                    wetGain.connect(currentNode);
                    dryGain.connect(currentNode);

                    const splitter = ctx.createGain();
                    splitter.connect(effectNode);
                    splitter.connect(dryGain);

                    currentNode = splitter;

                } else if (effect.type === 'filter') {
                    effectNode = ctx.createBiquadFilter();
                    const filterType = effect.params[0] || 'lowpass';
                    const frequency = parseFloat(effect.params[1]) || 1000;
                    const q = parseFloat(effect.params[2]) || 1;

                    effectNode.type = filterType;
                    effectNode.frequency.value = frequency;
                    effectNode.Q.value = q;

                    effectNode.connect(currentNode);
                    currentNode = effectNode;

                } else if (effect.type === 'distortion') {
                    effectNode = ctx.createWaveShaper();
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

                    const delay1 = ctx.createDelay(0.1);
                    const delay2 = ctx.createDelay(0.1);
                    const lfo1 = ctx.createOscillator();
                    const lfo2 = ctx.createOscillator();
                    const lfoGain1 = ctx.createGain();
                    const lfoGain2 = ctx.createGain();

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

                    wetGain = ctx.createGain();
                    dryGain = ctx.createGain();
                    wetGain.gain.value = wetAmount;
                    dryGain.gain.value = 1 - wetAmount;

                    const chorusMix = ctx.createGain();
                    delay1.connect(chorusMix);
                    delay2.connect(chorusMix);
                    chorusMix.connect(wetGain);
                    wetGain.connect(currentNode);
                    dryGain.connect(currentNode);

                    const splitter = ctx.createGain();
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
        // --- EFFECT CHAIN PATCH END ---

        // Store original BPM to restore later
        const originalBPM = this.bpm;
        const originalBeatDuration = this.beatDuration;

        try {
            // Process commands with control flow awareness
            let i = 0;
            while (i < commands.length) {
                const command = commands[i];
                const parts = command.split(/\s+/);
                const cmd = parts[0];

                if (cmd === 'if') {
                    const result = await this.executeIf(parts, startTime + currentTime, commands, i);
                    currentTime += result.duration;
                    i = result.nextIndex;
                } else if (cmd === 'for') {
                    const result = await this.executeFor(parts, startTime + currentTime, commands, i);
                    currentTime += result.duration;
                    i = result.nextIndex;
                } else if (cmd === 'pattern') {
                    const duration = await this.executePattern(parts, startTime + currentTime, effectInputNode);
                    currentTime += duration;
                    i++;
                } else if (cmd === 'sequence') {
                    const duration = await this.executeSequence(parts, startTime + currentTime, effectInputNode);
                    currentTime += duration;
                    i++;
                } else {
                    const duration = await this.executeCommand(command, startTime + currentTime, effectInputNode);
                    currentTime += duration;
                    i++;
                }
            }
        } finally {
            // Restore original BPM after block execution
            this.bpm = originalBPM;
            this.beatDuration = originalBeatDuration;
        }

        return currentTime;
    }

    findMatchingEndInArray(commands, startIndex, startKeyword, endKeyword) {
        let depth = 1;
        for (let i = startIndex + 1; i < commands.length; i++) {
            const parts = commands[i].split(/\s+/);
            const cmd = parts[0];
            if (cmd === startKeyword) depth++;
            if (cmd === endKeyword) depth--;
            if (depth === 0) return i;
        }
        return commands.length - 1;
    }

    parseValue(value) {
        if (typeof value === 'number') return value;
        if (typeof value !== 'string') return 0;

        // Check if it's a variable
        if (this.variables.has(value)) {
            return this.variables.get(value);
        }

        // Try to parse as number
        const num = parseFloat(value);
        return isNaN(num) ? 0 : num;
    }

    parseParameters(parts) {
        const params = {};
        for (const part of parts) {
            if (part.includes('=')) {
                const [key, value] = part.split('=');
                params[key] = this.parseValue(value);
            }
        }
        return params;
    }

    stop() {
        this.isRunning = false;
        this.currentPosition = 0;
        this.activeUtterances.length = 0; // Clear any referenced utterances

        // Stop audio engine
        if (this.audioEngine) {
            this.audioEngine.stop();
        }

        // Stop text-to-speech when stopping code execution
        if (typeof speechSynthesis !== 'undefined') {
            speechSynthesis.cancel();
        }
    }

    getBlockInfo(blockName) {
        if (!this.blocks.has(blockName)) {
            return null;
        }

        const commands = this.blocks.get(blockName);
        const info = {
            name: blockName,
            commands: commands.length,
            samples: [],
            tones: [],
            duration: 0
        };

        let estimatedDuration = 0;
        for (const command of commands) {
            const parts = command.split(/\s+/);
            const cmd = parts[0];

            switch (cmd) {
                case 'sample':
                    info.samples.push(parts[1]);
                    break;
                case 'tone':
                    info.tones.push(parts[1]);
                    const duration = this.parseValue(parts[2] || '1');
                    estimatedDuration += duration;
                    break;
                case 'wait':
                    estimatedDuration += this.parseValue(parts[1]);
                    break;
            }
        }

        info.duration = estimatedDuration;
        return info;
    }

    estimateDuration(blockName = 'main', visited = new Set()) {
        if (!this.blocks.has(blockName)) return 0;
        if (visited.has(blockName)) return 0;
        visited.add(blockName);

        let totalBeats = 0;
        let bpm = this.bpm;
        let beatDuration = 60 / bpm;

        const commands = this.blocks.get(blockName);
        for (let i = 0; i < commands.length; i++) {
            const command = commands[i];
            const parts = command.split(/\s+/);
            const cmd = parts[0];

            switch (cmd) {
                case 'wait':
                    totalBeats += parseFloat(parts[1]) || 0;
                    break;
                case 'tone':
                case 'slide':
                    totalBeats += parseFloat(parts[2]) || 1;
                    break;
                case 'bpm':
                    bpm = parseFloat(parts[1]) || bpm;
                    beatDuration = 60 / bpm;
                    break;
                case 'play': {
                    let maxDuration = 0;
                    for (let j = 1; j < parts.length; j++) {
                        if (!parts[j].includes('=')) {
                            const blockDuration = this.estimateDuration(parts[j], new Set(visited));
                            maxDuration = Math.max(maxDuration, blockDuration);
                        }
                    }
                    totalBeats += maxDuration / beatDuration;
                    break;
                }
                case 'loop': {
                    const count = parseInt(parts[1]) || 1;
                    let maxIterationDuration = 0;
                    for (let j = 2; j < parts.length; j++) {
                        const blockDuration = this.estimateDuration(parts[j], new Set(visited));
                        maxIterationDuration = Math.max(maxIterationDuration, blockDuration);
                    }
                    totalBeats += (maxIterationDuration / beatDuration) * count;
                    break;
                }
                case 'pattern':
                    const patternSteps = parts.slice(2).join(' ').split('-').length;
                    totalBeats += (patternSteps * 0.25); // 16th notes
                    break;
                case 'sequence':
                    const sequenceSteps = parts.length - 2;
                    totalBeats += (sequenceSteps * 0.25); // 16th notes
                    break;
                case 'if':
                    // Find matching endif and estimate inner block duration
                    const endifIdx = this.findMatchingEnd(commands, i, 'if', 'endif');
                    // Rough estimation - assume condition is true
                    for (let j = i + 1; j < endifIdx; j++) {
                        const innerCmd = commands[j].split(/\s+/)[0];
                        if (innerCmd === 'wait') {
                            totalBeats += parseFloat(commands[j].split(/\s+/)[1]) || 0;
                        } else if (innerCmd === 'tone' || innerCmd === 'slide') {
                            totalBeats += parseFloat(commands[j].split(/\s+/)[2]) || 1;
                        }
                    }
                    i = endifIdx; // Skip to endif
                    break;
                case 'for':
                    const forStart = parseInt(parts[2]) || 1;
                    const forEnd = parseInt(parts[3]) || 1;
                    const iterations = Math.max(1, forEnd - forStart + 1);
                    const endforIdx = this.findMatchingEnd(commands, i, 'for', 'endfor');
                    // Estimate inner block duration and multiply by iterations
                    let forDuration = 0;
                    for (let j = i + 1; j < endforIdx; j++) {
                        const innerCmd = commands[j].split(/\s+/)[0];
                        if (innerCmd === 'wait') {
                            forDuration += parseFloat(commands[j].split(/\s+/)[1]) || 0;
                        } else if (innerCmd === 'tone' || innerCmd === 'slide') {
                            forDuration += parseFloat(commands[j].split(/\s+/)[2]) || 1;
                        }
                    }
                    totalBeats += forDuration * iterations;
                    i = endforIdx; // Skip to endfor
                    break;
            }
        }
        return totalBeats * beatDuration;
    }

    getAllBlocks() {
        const blocks = [];
        for (const [name, commands] of this.blocks) {
            blocks.push(this.getBlockInfo(name));
        }
        return blocks;
    }

    beatsToSeconds(beats) {
        return beats * this.beatDuration;
    }

    formatCode() {
        let formatted = '';

        // Format global commands
        if (this.globalCommands.length > 0) {
            formatted += '// Global Commands\n';
            for (const command of this.globalCommands) {
                formatted += command + '\n';
            }
            formatted += '\n';
        }

        // Format blocks
        for (const [blockName, commands] of this.blocks) {
            formatted += `[${blockName}]\n`;
            for (const command of commands) {
                formatted += '    ' + command + '\n';
            }
            formatted += '[end]\n\n';
        }

        return formatted.trim();
    }

    getDocumentation() {
        return `
MelodiCode Syntax Reference:

BLOCKS:
[block_name]
    commands...
[end]

<sample_block_name>
    commands...
<end>

COMMANDS:
sample <name> [pitch] [timescale] [volume] [pan] [params...]
    - Play an audio sample
    - pitch: playback speed multiplier (default: 1)
    - timescale: time stretch (default: 1)
    - volume: 0-1 (default: 0.8)
    - pan: -1 to 1 (default: 0)

tone <frequency|note> [duration] [waveType] [volume] [pan]
    - Generate a tone
    - frequency: Hz or note (C4, A#3, etc.)
    - duration: beats (default: 1)
    - waveType: sine, square, sawtooth, triangle (default: sine)
    - volume: 0-1 (default: 0.8)
    - pan: -1 to 1 (default: 0)

slide <key1> <key2> <timescale> [waveType] [volume] [pan]
    - Play a tone at key1 and slide to key2 over timescale beats (BPM-based)
    - Example: slide C4 G4 2 sawtooth 0.7 0

wait <duration>
    - Pause for specified seconds

bpm <value>
    - Set the tempo in beats per minute (default: 120)
    - Example: bpm 140

play <block1> [block2...] [params...]
    - Play one or more blocks simultaneously
    - params: volume=0.8, pan=0, etc.

loop <count> <block_name>
    - Repeat a block specified number of times

set <variable> <value>
    - Set a variable value

effect <type> <block> [params...]
    - Apply effect to a block

TIMING HELPERS:
- Use beatsToSeconds() method in custom code
- BPM affects overall timing calculations

EXAMPLES:
[main]
bpm 130
sample kick 1 1
wait 0.5
tone C4 0.5
slide C4 G4 2
[end]

play main volume=0.8 pan=0
        `;
    }
}

// Global code interpreter instance
window.codeInterpreter = new CodeInterpreter(window.audioEngine);
