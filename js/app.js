class MelodiCodeApp {
    constructor() {
        this.version = '1.0.0';
        this.isInitialized = false;
        this.components = {};

        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initialize());
        } else {
            this.initialize();
        }
    }

    async initialize() {
        try {
            console.log(`MelodiCode v${this.version} - Initializing...`);

            // Show loading indicator
            this.showLoadingScreen();

            // Initialize components in order
            await this.initializeAudio();
            await this.initializeInterpreter();
            await this.initializeFileManager();
            await this.initializeUI();
            await this.initializeGemini();

            // Setup global error handling
            this.setupErrorHandling();

            // Setup performance monitoring
            this.setupPerformanceMonitoring();

            // Initialize CodeMirror, then load auto-save
            await new Promise(resolve => {
                window.setupEditor(() => {
                    resolve();
                });
            });

            // Now CodeMirror is ready
            await this.loadAutoSave();

            // Hide loading screen
            this.hideLoadingScreen();

            this.isInitialized = true;
            console.log('MelodiCode initialized successfully!');

            // Show welcome message
            this.showWelcomeMessage();

        } catch (error) {
            console.error('Failed to initialize MelodiCode:', error);
            this.showFatalError(error);
        }
    }

    showLoadingScreen() {
        const loadingHTML = `
            <div id="loadingScreen" style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: var(--primary-bg);
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                z-index: 10000;
                color: var(--text-primary);
            ">
                <div style="text-align: center;">
                    <i class="fas fa-music" style="font-size: 3rem; color: var(--accent-color); margin-bottom: 1rem;"></i>
                    <h1 style="margin: 0 0 0.5rem 0; font-size: 2rem;">MelodiCode</h1>
                    <p style="margin: 0 0 2rem 0; color: var(--text-secondary);">Loading audio engine...</p>
                    <div class="loading-spinner" style="
                        width: 40px;
                        height: 40px;
                        border: 3px solid var(--border-color);
                        border-top: 3px solid var(--accent-color);
                        border-radius: 50%;
                        animation: spin 1s linear infinite;
                        margin: 0 auto;
                    "></div>
                </div>
            </div>
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        `;

        document.body.insertAdjacentHTML('beforeend', loadingHTML);
    }

    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.style.opacity = '0';
            loadingScreen.style.transition = 'opacity 0.5s ease';
            setTimeout(() => loadingScreen.remove(), 500);
        }
    }

    async initializeAudio() {
        // Audio engine should already be initialized from the script
        if (!window.audioEngine) {
            throw new Error('Audio engine failed to initialize');
        }

        // Wait for audio context to be ready
        if (window.audioEngine.audioContext && window.audioEngine.audioContext.state === 'suspended') {
            // Will be resumed on first user interaction
        }

        this.components.audioEngine = window.audioEngine;
        console.log('Audio engine initialized');
    }

    async initializeInterpreter() {
        if (!window.codeInterpreter) {
            throw new Error('Code interpreter failed to initialize');
        }

        this.components.codeInterpreter = window.codeInterpreter;
        console.log('Code interpreter initialized');
    }

    async initializeFileManager() {
        if (!window.fileManager) {
            throw new Error('File manager failed to initialize');
        }

        this.components.fileManager = window.fileManager;
        console.log('File manager initialized');
    }

    async initializeUI() {
        if (!window.uiManager) {
            throw new Error('UI manager failed to initialize');
        }

        this.components.uiManager = window.uiManager;
        console.log('UI manager initialized');
    }

    async initializeGemini() {
        if (!window.geminiIntegration) {
            throw new Error('Gemini integration failed to initialize');
        }

        this.components.geminiIntegration = window.geminiIntegration;
        console.log('Gemini integration initialized');
    }

    async loadAutoSave() {
        try {
            const autoSave = this.components.fileManager.loadAutoSave();
            if (autoSave && autoSave.code && autoSave.code.trim()) {
                const shouldLoad = confirm(
                    `Found auto-saved work from ${new Date(autoSave.modified).toLocaleString()}. Load it?`
                );

                if (shouldLoad) {
                    window.editor.setValue(autoSave.code);
                    this.components.uiManager.updateBlockInspector();
                    this.components.uiManager.updateStatus('Auto-saved project loaded');
                }
            }
        } catch (error) {
            console.warn('Failed to load auto-save:', error);
        }
    }

    setupErrorHandling() {
        // Global error handler
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
            this.handleError(event.error, 'Global Error');
        });

        // Unhandled promise rejection handler
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            this.handleError(event.reason, 'Promise Rejection');
        });

        // Audio context error handling
        if (this.components.audioEngine && this.components.audioEngine.audioContext) {
            this.components.audioEngine.audioContext.addEventListener('statechange', () => {
                if (this.components.audioEngine.audioContext.state === 'interrupted') {
                    this.components.uiManager.updateStatus('Audio interrupted - click play to resume');
                }
            });
        }
    }

    setupPerformanceMonitoring() {
        // Monitor memory usage
        if ('memory' in performance) {
            setInterval(() => {
                const memory = performance.memory;
                const usedPercent = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;

                if (usedPercent > 80) {
                    console.warn('High memory usage detected:', usedPercent.toFixed(2) + '%');
                }
            }, 30000); // Check every 30 seconds
        }

        // Monitor frame rate
        let lastTime = performance.now();
        let frameCount = 0;

        const checkFrameRate = (currentTime) => {
            frameCount++;

            if (currentTime - lastTime >= 1000) {
                const fps = frameCount;
                frameCount = 0;
                lastTime = currentTime;

                if (fps < 30) {
                    console.warn('Low frame rate detected:', fps + ' fps');
                }
            }

            requestAnimationFrame(checkFrameRate);
        };

        requestAnimationFrame(checkFrameRate);
    }

    handleError(error, context = 'Unknown') {
        // Don't overwhelm the user with too many error dialogs
        if (this.lastErrorTime && Date.now() - this.lastErrorTime < 5000) {
            console.error(`[${context}]`, error);
            return;
        }

        this.lastErrorTime = Date.now();

        const errorMessage = error instanceof Error ? error.message : String(error);

        // Show user-friendly error message
        if (this.components.uiManager) {
            this.components.uiManager.showError(`${context}: ${errorMessage}`);
        } else {
            alert(`Error: ${errorMessage}`);
        }

        // Log detailed error info
        console.error(`[${context}]`, error);
    }

    showFatalError(error) {
        const errorHTML = `
            <div style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: #1a1a1a;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                z-index: 10001;
                color: #ffffff;
                text-align: center;
                padding: 2rem;
            ">
                <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #ff4757; margin-bottom: 1rem;"></i>
                <h1 style="margin: 0 0 1rem 0; color: #ff4757;">Initialization Failed</h1>
                <p style="margin: 0 0 1rem 0; color: #b0b0b0; max-width: 500px;">
                    MelodiCode failed to initialize properly. This could be due to browser compatibility issues or missing resources.
                </p>
                <code style="
                    background-color: #2d2d2d;
                    padding: 1rem;
                    border-radius: 4px;
                    color: #ff6b6b;
                    margin-bottom: 1rem;
                    max-width: 600px;
                    word-break: break-word;
                ">${error.message}</code>
                <button onclick="location.reload()" style="
                    background-color: #00d4ff;
                    color: #1a1a1a;
                    border: none;
                    padding: 0.5rem 1rem;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 1rem;
                ">Reload Page</button>
            </div>
        `;

        document.body.innerHTML = errorHTML;
    }

    showWelcomeMessage() {
        const isFirstVisit = !localStorage.getItem('melodicode-visited');

        if (isFirstVisit) {
            localStorage.setItem('melodicode-visited', 'true');

            setTimeout(() => {
                this.components.uiManager.updateStatus('Welcome to MelodiCode! Try the example code or ask Gemini for help.');

                // Optionally show a welcome tour or tutorial
                if (confirm('Welcome to MelodiCode! Would you like to see a quick tutorial?')) {
                    this.showTutorial();
                }
            }, 1000);
        }
    }

    showTutorial() {
        const tutorialSteps = [
            {
                element: '#codeInput',
                title: 'Code Editor',
                content: 'Write your music code here using blocks like [main] ... [end]'
            },
            {
                element: '#playBtn',
                title: 'Play Button',
                content: 'Click to play your music code'
            },
            {
                element: '#builtinSamples',
                title: 'Samples',
                content: 'Click the play buttons to preview built-in samples'
            },
            {
                element: '#geminiBtn',
                title: 'AI Assistant',
                content: 'Get help from Gemini to generate music code'
            }
        ];

        // Simple tutorial implementation
        let currentStep = 0;

        const showStep = () => {
            if (currentStep >= tutorialSteps.length) return;

            const step = tutorialSteps[currentStep];
            const element = document.querySelector(step.element);

            if (element) {
                // Highlight element
                element.style.outline = '2px solid var(--accent-color)';
                element.style.outlineOffset = '4px';

                // Show tooltip
                alert(`${step.title}: ${step.content}`);

                // Remove highlight
                element.style.outline = '';
                element.style.outlineOffset = '';
            }

            currentStep++;
            if (currentStep < tutorialSteps.length) {
                setTimeout(showStep, 500);
            }
        };

        showStep();
    }

    // Public API methods
    getVersion() {
        return this.version;
    }

    getComponents() {
        return this.components;
    }

    isReady() {
        return this.isInitialized;
    }

    // Development helpers
    debug() {
        return {
            version: this.version,
            initialized: this.isInitialized,
            components: Object.keys(this.components),
            audioContext: this.components.audioEngine?.audioContext?.state,
            samples: this.components.audioEngine?.samples?.size,
            blocks: this.components.codeInterpreter?.blocks?.size
        };
    }

    // Cleanup method
    cleanup() {
        if (this.components.fileManager) {
            this.components.fileManager.cleanup();
        }

        if (this.components.audioEngine && this.components.audioEngine.audioContext) {
            this.components.audioEngine.audioContext.close();
        }

        console.log('MelodiCode cleaned up');
    }
}

// Initialize the application
window.melodiCodeApp = new MelodiCodeApp();

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.melodiCodeApp) {
        window.melodiCodeApp.cleanup();
    }
});

window.addEventListener('DOMContentLoaded', async () => {
    // Wait for built-in samples to load
    if (window.audioEngine && window.audioEngine.loadBuiltInSamples) {
        await window.audioEngine.loadBuiltInSamples();
    }
    if (window.uiManager && window.uiManager.populateBuiltInSamplesPanel) {
        window.uiManager.populateBuiltInSamplesPanel();
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const docsBtn = document.getElementById('docsBtn');
    const docsModal = document.getElementById('docsModal');
    const closeDocs = document.getElementById('closeDocs');
    const docsContent = document.getElementById('docsContent');

    // Helper to load and render markdown into the docs modal
    async function loadMarkdown(file) {
        try {
            const md = await fetch(file).then(r => r.text());
            docsContent.innerHTML = marked.parse(md);
            if (md.includes('<!-- YOUTUBE_VIDEO: eSzeYRZbuXw -->')) {
                const iframe = document.createElement('iframe');
                iframe.width = "100%";
                iframe.height = "315";
                iframe.src = "https://www.youtube.com/embed/eSzeYRZbuXw?si=MW3OzgpRRH4sbmcn";
                iframe.title = "YouTube video player";
                iframe.frameBorder = "0";
                iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
                iframe.referrerPolicy = "strict-origin-when-cross-origin";
                iframe.allowFullscreen = true;

                // Insert at the top of the docs modal content
                docsContent.insertBefore(iframe, docsContent.firstChild);
            }

            docsContent.classList.add('welcome-modal-body');
            // Intercept README.md and documentation.md links
            docsContent.querySelectorAll('a').forEach(a => {
                const href = a.getAttribute('href');
                if (href && (href.endsWith('README.md') || href.endsWith('documentation.md'))) {
                    a.addEventListener('click', (e) => {
                        e.preventDefault();
                        loadMarkdown(href);
                    });
                }
            });
        } catch {
            docsContent.innerHTML = '<p>Documentation not found.</p>';
        }
    }

    // MIDI Import
    // Add MIDI Import button click handler (this was missing)
    document.getElementById('importMidi').addEventListener('click', () => {
        document.getElementById('midiFileInput').click();
    });

    // MIDI Import file handler (already exists but let's improve it)
    document.getElementById('importMidi').addEventListener('click', () => {
        document.getElementById('midiFileInput').click();
    });

    document.getElementById('midiFileInput').addEventListener('change', async (e) => {
        //alert('Importing MIDI is still work in progress. Please check back later.');
        //return;
        const file = e.target.files[0];
        if (!file) return;

        try {
            console.log('Starting MIDI import...', file.name);
            window.uiManager.updateStatus('Importing MIDI file...');

            const arrayBuffer = await file.arrayBuffer();
            console.log('File loaded, parsing MIDI...');

            // Check if Midi library is loaded
            if (typeof Midi === 'undefined') {
                throw new Error('MIDI library not loaded. Please refresh the page.');
            }

            const midi = new Midi(arrayBuffer);
            console.log('MIDI parsed:', midi);

            // Start building MelodiCode
            let code = `// Imported from ${file.name}\n`;

            // Set BPM from MIDI
            if (midi.header.tempos && midi.header.tempos.length > 0) {
                code += `bpm ${Math.round(midi.header.tempos[0].bpm)}\n\n`;
            } else {
                code += `bpm 120\n\n`;
            }

            // Convert tracks with notes
            let trackFound = false;
            console.log('Processing tracks...', midi.tracks.length);

            for (let i = 0; i < midi.tracks.length; i++) {
                const track = midi.tracks[i];
                console.log(`Track ${i}:`, {
                    name: track.name,
                    notes: track.notes?.length || 0
                });

                if (track.notes && track.notes.length > 0) {
                    console.log(`Processing track ${i} with ${track.notes.length} notes`);
                    code += `[track_${i}]\n`;

                    // Sort notes by time
                    const sortedNotes = track.notes.sort((a, b) => a.time - b.time);
                    let lastTime = 0;

                    for (const note of sortedNotes) {
                        // Add wait if there's a gap
                        if (note.time > lastTime) {
                            const waitTime = note.time - lastTime;
                            if (waitTime > 0.01) {
                                code += `    wait ${waitTime.toFixed(3)}\n`;
                            }
                        }

                        // Add the tone
                        const duration = note.duration || 0.5;
                        const velocity = note.velocity || 0.8;
                        code += `    tone ${note.name} ${duration.toFixed(3)} sine ${velocity.toFixed(2)}\n`;

                        lastTime = note.time + duration;
                    }

                    code += `[end]\n\n`;
                    trackFound = true;
                    break; // Only import first track with notes
                }
            }

            if (!trackFound) {
                throw new Error('No notes found in MIDI file. This might be a drum pattern or contain only control changes.');
            }

            // Add main block to play the imported track
            code += `[main]\n    play track_0\n[end]\n\nplay main`;

            console.log('Generated code length:', code.length);

            // Set the code in the editor
            window.editor.setValue(code);
            window.uiManager.updateBlockInspector();
            window.uiManager.updateStatus(`MIDI file "${file.name}" imported successfully`);

        } catch (error) {
            console.error('MIDI import error:', error);
            window.uiManager.updateStatus('MIDI import failed: ' + error.message);
            alert('Failed to import MIDI: ' + error.message);
        } finally {
            e.target.value = '';
        }
    });

    // MIDI Export - Complete the function
    document.getElementById('exportMidi').addEventListener('click', async () => {
        alert('Exporting MIDI is still work in progress. Please check back later.');
        return;
        try {
            console.log('Starting MIDI export...');
            window.uiManager.updateStatus('Exporting MIDI...');

            // Check if Midi library is loaded
            if (typeof Midi === 'undefined') {
                throw new Error('MIDI library not loaded. Please refresh the page.');
            }

            // Parse the current code
            const code = window.editor.getValue();
            if (!code.trim()) {
                throw new Error('No code to export');
            }

            const parseResult = window.codeInterpreter.parse(code);
            if (!parseResult.success) {
                throw new Error('Invalid code: ' + parseResult.message);
            }

            console.log('Available blocks:', Array.from(window.codeInterpreter.blocks.keys()));

            // Create new MIDI file
            const midi = new Midi();
            const track = midi.addTrack();

            // Set BPM (default 120 if not specified)
            let currentBPM = 120;

            // Look for BPM in the code
            const lines = code.split('\n');
            for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed.startsWith('bpm ')) {
                    const bpmValue = parseFloat(trimmed.split(' ')[1]);
                    if (!isNaN(bpmValue)) {
                        currentBPM = bpmValue;
                        break;
                    }
                }
            }

            // Set tempo
            midi.header.setTempo(0, currentBPM);
            console.log('Set BPM to:', currentBPM);

            // Helper function to convert frequency to MIDI note
            const frequencyToMidiNote = (frequency) => {
                const A4 = 440;
                const C4 = A4 * Math.pow(2, -9 / 12);

                if (frequency <= 0) return 60;

                const halfStepsFromC4 = 12 * Math.log2(frequency / C4);
                return Math.round(60 + halfStepsFromC4);
            };

            // Helper function to convert MIDI note to note name
            const midiToNoteName = (midiNote) => {
                const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
                const octave = Math.floor(midiNote / 12) - 1;
                const noteIndex = midiNote % 12;
                return noteNames[noteIndex] + octave;
            };

            // Fixed function to collect tones - prevents infinite loops
            const collectTonesFromBlock = (blockName, startTime = 0, visitedBlocks = new Set()) => {
                // Prevent infinite recursion
                if (visitedBlocks.has(blockName)) {
                    console.warn(`Circular reference detected for block "${blockName}", skipping`);
                    return startTime;
                }

                const block = window.codeInterpreter.blocks.get(blockName);
                if (!block) {
                    console.warn(`Block "${blockName}" not found`);
                    return startTime;
                }

                // Add current block to visited set
                visitedBlocks.add(blockName);

                console.log(`Processing block "${blockName}" with ${block.length} lines`);
                let time = startTime;

                for (const line of block) {
                    const parts = line.trim().split(/\s+/);
                    if (parts.length === 0) continue;

                    try {
                        if (parts[0] === 'tone') {
                            const noteOrFreq = parts[1];
                            const duration = parseFloat(parts[2]) || 1;
                            const volume = parseFloat(parts[4]) || 0.8;

                            let noteName;
                            if (!isNaN(parseFloat(noteOrFreq))) {
                                // Convert frequency to note name
                                const freq = parseFloat(noteOrFreq);
                                const midiNumber = frequencyToMidiNote(freq);
                                noteName = midiToNoteName(midiNumber);
                            } else {
                                // Already a note name
                                noteName = noteOrFreq;
                            }

                            console.log(`Adding note: ${noteName}, duration: ${duration}, time: ${time}`);

                            try {
                                track.addNote({
                                    name: noteName,
                                    time: time,
                                    duration: duration,
                                    velocity: Math.min(1, Math.max(0, volume))
                                });
                            } catch (noteError) {
                                console.warn(`Failed to add note ${noteName}:`, noteError);
                            }

                            time += duration;

                        } else if (parts[0] === 'slide') {
                            const startNote = parts[1];
                            const endNote = parts[2];
                            const duration = parseFloat(parts[3]) || 1;
                            const volume = parseFloat(parts[5]) || 0.8;

                            // Add start note
                            try {
                                track.addNote({
                                    name: startNote,
                                    time: time,
                                    duration: duration * 0.5,
                                    velocity: Math.min(1, Math.max(0, volume))
                                });

                                // Add end note
                                track.addNote({
                                    name: endNote,
                                    time: time + duration * 0.5,
                                    duration: duration * 0.5,
                                    velocity: Math.min(1, Math.max(0, volume))
                                });
                            } catch (slideError) {
                                console.warn(`Failed to add slide notes:`, slideError);
                            }

                            time += duration;

                        } else if (parts[0] === 'wait') {
                            const waitTime = parseFloat(parts[1]) || 0;
                            time += waitTime;

                        } else if (parts[0] === 'play') {
                            // Handle play commands - process referenced blocks sequentially, not recursively
                            for (let i = 1; i < parts.length; i++) {
                                const referencedBlock = parts[i];
                                if (window.codeInterpreter.blocks.has(referencedBlock)) {
                                    console.log(`Processing referenced block: ${referencedBlock}`);
                                    // Create a new visited set for each play command to allow proper block reuse
                                    const newVisited = new Set(visitedBlocks);
                                    const blockDuration = collectTonesFromBlock(referencedBlock, time, newVisited);
                                    // Don't advance time for play commands - they should play simultaneously
                                    // unless you want sequential playback, then uncomment the next line:
                                    // time = blockDuration;
                                }
                            }

                        } else if (parts[0] === 'loop') {
                            const count = parseInt(parts[1]) || 1;
                            const loopBlock = parts[2];

                            if (window.codeInterpreter.blocks.has(loopBlock)) {
                                for (let i = 0; i < Math.min(count, 100); i++) { // Limit loops to prevent freezing
                                    const newVisited = new Set(visitedBlocks);
                                    time = collectTonesFromBlock(loopBlock, time, newVisited);
                                }
                            }
                        }
                    } catch (error) {
                        console.warn(`Error processing line "${line}":`, error);
                        // Continue processing other lines
                    }
                }

                // Remove current block from visited set when done
                visitedBlocks.delete(blockName);
                return time;
            };

            // Start with the main block if it exists, otherwise use the first available block
            let startBlock = 'main';
            if (!window.codeInterpreter.blocks.has('main')) {
                const availableBlocks = Array.from(window.codeInterpreter.blocks.keys());
                if (availableBlocks.length === 0) {
                    throw new Error('No blocks found in the code');
                }
                startBlock = availableBlocks[0];
                console.log(`No main block found, using "${startBlock}"`);
            }

            // Process the blocks with timeout protection
            const processingPromise = new Promise((resolve, reject) => {
                try {
                    collectTonesFromBlock(startBlock, 0, new Set());
                    resolve();
                } catch (error) {
                    reject(error);
                }
            });

            // Add timeout to prevent infinite processing
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('MIDI export timed out - code may contain infinite loops')), 10000);
            });

            await Promise.race([processingPromise, timeoutPromise]);

            console.log('Total notes added to MIDI:', track.notes.length);

            if (track.notes.length === 0) {
                throw new Error('No tones found to export. Make sure your code contains tone commands.');
            }

            // Export the MIDI file
            const midiArray = midi.toArray();
            const blob = new Blob([midiArray], { type: 'audio/midi' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'melodicode-export.mid';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            window.uiManager.updateStatus(`MIDI file exported successfully with ${track.notes.length} notes`);
            console.log('MIDI export completed successfully');

        } catch (error) {
            console.error('MIDI export error:', error);
            alert('Failed to export MIDI: ' + error.message);
            window.uiManager.updateStatus('MIDI export failed: ' + error.message);
        }
    });

    docsBtn.addEventListener('click', async () => {
        await loadMarkdown('documentation.md');
        docsModal.classList.add('show');
    });

    closeDocs.addEventListener('click', () => {
        docsModal.classList.remove('show');
    });

    docsModal.addEventListener('click', (e) => {
        if (e.target === docsModal) docsModal.classList.remove('show');
    });
});

// Show Gemini modal on button tap/click
document.addEventListener('DOMContentLoaded', () => {
    const geminiBtn = document.getElementById('geminiBtn');
    const geminiModal = document.getElementById('geminiModal');
    if (geminiBtn && geminiModal) {
        geminiBtn.addEventListener('click', () => {
            geminiModal.classList.add('active');
            geminiModal.style.display = 'flex'; // Use flex for centering
        });
    }
    // Optional: close modal on background tap
    geminiModal?.addEventListener('click', (e) => {
        if (e.target === geminiModal) {
            geminiModal.classList.remove('active');
            geminiModal.style.display = 'none';
        }
    });
});

// Close Gemini modal on close button
document.getElementById('closeGemini')?.addEventListener('click', () => {
    const geminiModal = document.getElementById('geminiModal');
    geminiModal.classList.remove('active');
    geminiModal.style.display = 'none';
});

// Make app available globally for debugging
window.MelodiCode = {
    app: window.melodiCodeApp,
    version: window.melodiCodeApp?.version || '1.0.0',
    debug: () => window.melodiCodeApp?.debug() || 'Not initialized'
};
