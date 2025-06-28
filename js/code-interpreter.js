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
        
        // Default values
        this.defaultVolume = 0.8;
        this.defaultPan = 0;
        this.defaultPitch = 1;
        this.defaultTimescale = 1;
        this.bpm = 120; // Default BPM
        this.beatDuration = 60 / this.bpm;
    }

    parse(code) {
        try {
            this.blocks.clear();
            this.globalCommands = [];
            this.variables.clear();

            const lines = code.split('\n').map(line => line.trim()).filter(line => line && !line.startsWith('//'));
            
            let currentBlock = null;
            let blockContent = [];

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];

                // Block start
                if (line.startsWith('[') && line.endsWith(']') && !line.includes('end')) {
                    const blockName = line.slice(1, -1);
                    currentBlock = blockName;
                    blockContent = [];
                    continue;
                }

                // Block end
                if (line === '[end]') {
                    if (currentBlock) {
                        this.blocks.set(currentBlock, blockContent);
                        currentBlock = null;
                        blockContent = [];
                    }
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
            case 'wait':
                if (parts.length < 2) {
                    return { valid: false, error: 'wait command requires duration' };
                }
                if (isNaN(parseFloat(parts[1]))) {
                    return { valid: false, error: 'wait duration must be a number' };
                }
                break;
            case 'play':
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
                if (parts.length < 3) {
                    return { valid: false, error: 'loop command requires count and block name' };
                }
                if (isNaN(parseInt(parts[1]))) {
                    return { valid: false, error: 'loop count must be a number' };
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

    async executeCommand(command, startTime) {
        const parts = command.split(/\s+/);
        const cmd = parts[0];

        switch (cmd) {
            case 'sample':
                return this.executeSample(parts, startTime);
            case 'tone':
                return this.executeTone(parts, startTime);
            case 'wait':
                return this.executeWait(parts, startTime);
            case 'play':
                return this.executePlay(parts, startTime);
            case 'loop':
                return this.executeLoop(parts, startTime);
            case 'set':
                return this.executeSet(parts);
            case 'effect':
                return this.executeEffect(parts, startTime);
            case 'bpm':
                return this.executeBPM(parts);
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

    executeSample(parts, startTime) {
        const sampleName = parts[1];
        const pitch = this.parseValue(parts[2] || '1');
        const timescale = this.parseValue(parts[3] || '1');
        const volume = this.parseValue(parts[4] || this.defaultVolume);
        const pan = this.parseValue(parts[5] || this.defaultPan);

        // Parse additional parameters
        const params = this.parseParameters(parts.slice(6));

        this.audioEngine.playSample(
            sampleName,
            pitch,
            timescale,
            startTime,
            volume * (params.volume || 1),
            pan + (params.pan || 0)
        );

        return 0; // Samples don't add to timing by default
    }

    executeTone(parts, startTime) {
        const noteOrFreq = parts[1];
        let duration = this.parseValue(parts[2] || '1');
        const volume = this.parseValue(parts[3] || this.defaultVolume);
        const pan = this.parseValue(parts[4] || this.defaultPan);
        const waveType = parts[5] || 'sine';

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

        this.audioEngine.generateTone(
            frequency,
            durationInSeconds,
            waveType,
            startTime,
            volume * (params.volume || 1),
            pan + (params.pan || 0)
        );

        return durationInSeconds;
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
            const part = parts[i];
            if (part.includes('=')) {
                const [key, value] = part.split('=');
                params[key] = this.parseValue(value);
            } else {
                blockNames.push(part);
            }
        }

        // Play blocks simultaneously
        const promises = blockNames.map(blockName => {
            if (this.blocks.has(blockName)) {
                return this.executeBlock(blockName, startTime, params);
            } else {
                console.warn(`Block '${blockName}' not found`);
                return Promise.resolve(0);
            }
        });

        const durations = await Promise.all(promises);
        return Math.max(...durations, 0);
    }

    async executeLoop(parts, startTime) {
        const count = parseInt(parts[1]);
        const blockName = parts[2];
        
        if (!this.blocks.has(blockName)) {
            console.warn(`Block '${blockName}' not found`);
            return 0;
        }

        let totalDuration = 0;
        for (let i = 0; i < count; i++) {
            if (!this.isRunning) break;
            const duration = await this.executeBlock(blockName, startTime + totalDuration);
            totalDuration += duration;
        }

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

        for (const command of commands) {
            if (!this.isRunning) break;

            const duration = await this.executeCommand(command, startTime + currentTime);
            currentTime += duration;
        }

        return currentTime;
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
        
        // Stop audio engine
        if (this.audioEngine) {
            this.audioEngine.stop();
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

COMMANDS:
sample <name> [pitch] [timescale] [volume] [pan] [params...]
    - Play an audio sample
    - pitch: playback speed multiplier (default: 1)
    - timescale: time stretch (default: 1)
    - volume: 0-1 (default: 0.8)
    - pan: -1 to 1 (default: 0)

tone <frequency|note> [duration] [volume] [pan] [waveType]
    - Generate a tone
    - frequency: Hz or note (C4, A#3, etc.)
    - duration: seconds (default: 1)
    - waveType: sine, square, sawtooth, triangle

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
[end]

play main volume=0.8 pan=0
        `;
    }
}

// Global code interpreter instance
window.codeInterpreter = new CodeInterpreter(window.audioEngine);
