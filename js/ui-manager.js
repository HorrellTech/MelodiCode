class UIManager {
    constructor() {
        this.currentTheme = 'dark';
        this.isPlaying = false;
        this.currentTime = 0;
        this.totalTime = 0;
        this.waveformCanvas = null;
        this.waveformContext = null;
        this.animationFrame = null;

        // Visualizer properties
        this.currentVisualizerIndex = 0;
        this.visualizers = [
            { name: 'Spectrum', draw: this.drawSpectrum.bind(this) },
            { name: 'Circular', draw: this.drawCircular.bind(this) },
            { name: 'Waveform', draw: this.drawWaveform.bind(this) },
            { name: 'Oscilloscope', draw: this.drawOscilloscope.bind(this) },
            { name: 'Tree', draw: this.drawTree.bind(this) },
            { name: 'Particles', draw: this.drawParticles.bind(this) },
            { name: 'Spiral', draw: this.drawSpiral.bind(this) },
            { name: 'Matrix', draw: this.drawMatrix.bind(this) }
        ];

        // Tree visualizer properties
        this.treeState = {
            branches: [],
            swayOffset: 0,
            pulsePhase: 0,
            lastUpdate: 0
        };

        // Particles visualizer properties
        this.particles = [];
        this.particleCount = 50;

        // Initialize particles
        this.initParticles();

        this.initializeUI();
        this.setupEventListeners();
        this.initializeWaveform();
        this.updateTimeDisplay();
    }

    initializeUI() {
        // Set initial theme
        document.documentElement.setAttribute('data-theme', this.currentTheme);

        // Initialize tooltips and other UI components
        this.initializeFileTree();
        this.setupModals();
        this.loadSettings();
        this.populateExamplesDropdown();
    }

    initializeWaveform() {
        this.waveformCanvas = document.getElementById('waveformCanvas');
        this.waveformContext = this.waveformCanvas.getContext('2d');
        this.updateVisualizerName();
        this.startWaveformAnimation();
    }

    setupEventListeners() {
        // Transport controls
        document.getElementById('playBtn').addEventListener('click', () => this.play());
        document.getElementById('pauseBtn').addEventListener('click', () => this.pause());
        document.getElementById('stopBtn').addEventListener('click', () => this.stop());

        // Project controls
        document.getElementById('newProject').addEventListener('click', () => this.newProject());
        document.getElementById('openProject').addEventListener('click', () => this.openProject());
        document.getElementById('saveProject').addEventListener('click', () => this.saveProject());
        document.getElementById('exportWav').addEventListener('click', () => this.exportWAV());

        // Code editor controls
        document.getElementById('formatCode').addEventListener('click', () => this.formatCode());
        document.getElementById('validateCode').addEventListener('click', () => this.validateCode());

        // Insert dropdown
        const insertDropdown = document.getElementById('insertDropdown');
        if (insertDropdown) {
            insertDropdown.addEventListener('change', (e) => this.insertCodeSnippet(e.target.value));
        }

        // Examples dropdown - handle gracefully if not found
        const examplesDropdown = document.getElementById('examplesDropdown');
        if (examplesDropdown) {
            examplesDropdown.addEventListener('change', (e) => this.loadExample(e.target.value));
        }

        // Master controls
        const masterVolume = document.getElementById('masterVolume');
        if (masterVolume) {
            masterVolume.addEventListener('input', (e) => {
                const value = e.target.value;
                document.getElementById('masterVolumeValue').textContent = value + '%';
                window.audioEngine.setMasterVolume(value);
            });
        }

        // Visualizer controls
        const prevVisualizer = document.getElementById('prevVisualizer');
        const nextVisualizer = document.getElementById('nextVisualizer');

        if (prevVisualizer) {
            prevVisualizer.addEventListener('click', () => this.switchVisualizer(-1));
        }

        if (nextVisualizer) {
            nextVisualizer.addEventListener('click', () => this.switchVisualizer(1));
        }

        // Effects controls
        this.setupEffectsControls();

        // File import
        const importAudio = document.getElementById('importAudio');
        if (importAudio) {
            importAudio.addEventListener('click', () => {
                document.getElementById('audioFileInput').click();
            });
        }

        const audioFileInput = document.getElementById('audioFileInput');
        if (audioFileInput) {
            audioFileInput.addEventListener('change', (e) => {
                this.handleFileImport(e.target.files);
            });
        }

        // Settings and modals
        const settingsBtn = document.getElementById('settingsBtn');
        const geminiBtn = document.getElementById('geminiBtn');
        const closeSettings = document.getElementById('closeSettings');
        const closeGemini = document.getElementById('closeGemini');
        const saveSettings = document.getElementById('saveSettings');

        if (settingsBtn) settingsBtn.addEventListener('click', () => this.showSettings());
        if (geminiBtn) geminiBtn.addEventListener('click', () => this.showGemini());
        if (closeSettings) closeSettings.addEventListener('click', () => this.hideSettings());
        if (closeGemini) closeGemini.addEventListener('click', () => this.hideGemini());
        if (saveSettings) saveSettings.addEventListener('click', () => this.saveSettings());

        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        // Theme controls
        const themeSelect = document.getElementById('themeSelect');
        const accentColor = document.getElementById('accentColor');

        if (themeSelect) {
            themeSelect.addEventListener('change', (e) => {
                this.setTheme(e.target.value);
            });
        }

        if (accentColor) {
            accentColor.addEventListener('change', (e) => {
                this.setAccentColor(e.target.value);
            });
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));

        // Window resize
        window.addEventListener('resize', () => this.handleResize());
    }

    setupEffectsControls() {
        // Compressor
        const compressorThreshold = document.getElementById('compressorThreshold');
        if (compressorThreshold) {
            compressorThreshold.addEventListener('input', (e) => {
                const value = e.target.value;
                e.target.nextElementSibling.textContent = value + 'dB';
                window.audioEngine.setCompressor(value);
            });
        }

        // Limiter
        const limiterThreshold = document.getElementById('limiterThreshold');
        if (limiterThreshold) {
            limiterThreshold.addEventListener('input', (e) => {
                const value = e.target.value;
                e.target.nextElementSibling.textContent = value + 'dB';
                window.audioEngine.setLimiter(value);
            });
        }

        // Reverb
        const reverbWet = document.getElementById('reverbWet');
        if (reverbWet) {
            reverbWet.addEventListener('input', (e) => {
                const value = e.target.value;
                e.target.nextElementSibling.textContent = value + '%';
                window.audioEngine.setReverb(value);
            });
        }

        document.querySelectorAll('input[type="range"]').forEach(slider => {
            const updateSliderProgress = () => {
                const value = (slider.value - slider.min) / (slider.max - slider.min) * 100;
                slider.style.setProperty('--slider-progress', `${value}%`);
            };

            slider.addEventListener('input', updateSliderProgress);
            updateSliderProgress(); // Set initial value
        });

        // EQ
        ['eqHigh', 'eqMid', 'eqLow'].forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('input', (e) => {
                    const value = e.target.value;
                    e.target.nextElementSibling.textContent = value + 'dB';
                    const band = id.replace('eq', '').toLowerCase();
                    window.audioEngine.setEQ(band, value);
                });
            }
        });
    }

    initializeFileTree() {
        // File tree folder toggles
        document.querySelectorAll('.tree-folder').forEach(folder => {
            const toggle = folder.querySelector('.toggle');
            const folderItem = folder.querySelector('.tree-item.folder');

            folderItem.addEventListener('click', () => {
                folder.classList.toggle('collapsed');
            });
        });

        // Sample play buttons
        document.querySelectorAll('.play-sample').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const sampleName = btn.dataset.sample;
                this.playSample(sampleName);
            });
        });
    }

    setupModals() {
        // Close modals when clicking outside
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('show');
                }
            });
        });
    }

    initializeWaveform() {
        this.waveformCanvas = document.getElementById('waveformCanvas');
        this.waveformContext = this.waveformCanvas.getContext('2d');
        this.startWaveformAnimation();
    }

    populateExamplesDropdown() {
        const dropdown = document.getElementById('examplesDropdown');
        if (!dropdown || !window.melodicodeExamples) return;

        // Clear existing options except the first one
        dropdown.innerHTML = '<option value="">Load Example...</option>';

        // Add examples
        for (const [name, code] of Object.entries(window.melodicodeExamples)) {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            dropdown.appendChild(option);
        }
    }

    loadExample(exampleName) {
        if (!exampleName || !window.melodicodeExamples) return;

        const exampleCode = window.melodicodeExamples[exampleName];
        if (!exampleCode) return;

        // Check if there's existing code
        const currentCode = window.editor ? window.editor.getValue() : '';

        if (currentCode.trim()) {
            const shouldReplace = confirm(
                `Loading "${exampleName}" will replace your current code. Do you want to continue?\n\n` +
                `Tip: Save your current work first if you want to keep it.`
            );

            if (!shouldReplace) {
                // Reset dropdown to default
                const dropdown = document.getElementById('examplesDropdown');
                if (dropdown) dropdown.value = '';
                return;
            }
        }

        // Load the example
        if (window.editor) {
            window.editor.setValue(exampleCode);
            this.updateBlockInspector();
            this.updateStatus(`Loaded example: ${exampleName}`);

            // Reset dropdown to default
            const dropdown = document.getElementById('examplesDropdown');
            if (dropdown) dropdown.value = '';

            // Show success message
            this.showSuccess(`Example "${exampleName}" loaded successfully!`);
        }
    }

    populateBuiltInSamplesPanel() {
        const panel = document.getElementById('builtinSamples');
        if (!panel || !window.audioEngine) return;

        // Clear existing content
        panel.innerHTML = '';

        // Group samples by category
        const categories = {
            Drums: ['kick', 'snare', 'hihat', 'hihat_open', 'crash', 'ride', 'tom_high', 'tom_mid', 'tom_low', 'clap'],
            Bass: ['bass_low', 'bass_mid', 'bass_high', 'sub_bass', 'bass_pluck'],
            Synth: ['lead_1', 'lead_2', 'lead_bright', 'lead_soft', 'pad_1', 'pad_warm', 'pad_strings', 'pad_choir'],
            Percussion: ['shaker', 'tambourine', 'cowbell', 'woodblock'],
            FX: ['whoosh', 'zap', 'drop', 'rise']
        };

        for (const [cat, sampleNames] of Object.entries(categories)) {
            const folder = document.createElement('div');
            folder.className = 'tree-folder';
            folder.innerHTML = `
                <div class="tree-item folder">
                    <i class="fas fa-folder"></i>
                    <span>${cat}</span>
                    <i class="fas fa-chevron-down toggle"></i>
                </div>
                <div class="tree-children"></div>
            `;
            const children = folder.querySelector('.tree-children');
            for (const name of sampleNames) {
                if (window.audioEngine.samples.has(name)) {
                    const item = document.createElement('div');
                    item.className = 'tree-item file';
                    item.dataset.sample = name;
                    item.innerHTML = `
                        <i class="fas fa-file-audio"></i>
                        <span>${name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                        <button class="play-sample" data-sample="${name}">
                            <i class="fas fa-play"></i>
                        </button>
                    `;
                    // Play button event
                    item.querySelector('.play-sample').onclick = () => window.audioEngine.playSample(name, 1, 1, 0, 0.8, 0);
                    children.appendChild(item);
                }
            }
            panel.appendChild(folder);
        }
    }

    startWaveformAnimation() {
        const animate = () => {
            this.drawWaveform();
            this.animationFrame = requestAnimationFrame(animate);
        };
        animate();
    }

    drawWaveform() {
        const canvas = this.waveformCanvas;
        const ctx = this.waveformContext;
        const width = canvas.width;
        const height = canvas.height;

        // Clear canvas
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--primary-bg');
        ctx.fillRect(0, 0, width, height);

        if (!window.audioEngine || !window.audioEngine.audioContext) return;

        try {
            const analyserData = window.audioEngine.getAnalyserData();
            if (!analyserData) return;

            const barWidth = width / analyserData.length;
            const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent-color');

            ctx.fillStyle = accentColor;

            for (let i = 0; i < analyserData.length; i++) {
                const barHeight = (analyserData[i] / 255) * height;
                const x = i * barWidth;
                const y = height - barHeight;

                ctx.fillRect(x, y, barWidth - 1, barHeight);
            }
        } catch (error) {
            // Silently handle errors
        }
    }

    async play() {
        try {
            this.stop(); // Stop any previous playback
            this.updateStatus('Parsing code...');

            const code = window.editor.getValue() || '';
            const parseResult = window.codeInterpreter.parse(code);

            if (!parseResult.success) {
                this.showError(parseResult.message);
                return;
            }

            const validation = window.codeInterpreter.validate();
            if (!validation.valid) {
                this.showWarning('Code has warnings:\n' + validation.errors.join('\n'));
            }

            this.updateStatus('Playing...');
            this.isPlaying = true;
            this.updateTransportButtons();

            window.audioEngine.play();
            await window.codeInterpreter.execute();

        } catch (error) {
            this.showError('Playback error: ' + error.message);
            this.stop();
        }
    }

    pause() {
        this.isPlaying = false;
        this.updateTransportButtons();
        window.audioEngine.pause();
        window.codeInterpreter.stop();
        this.updateStatus('Paused');
    }

    stop() {
        this.isPlaying = false;
        this.currentTime = 0;
        this.updateTransportButtons();
        this.updateTimeDisplay();
        window.audioEngine.stop();
        window.codeInterpreter.stop();
        this.updateStatus('Stopped');
    }

    updateTransportButtons() {
        const playBtn = document.getElementById('playBtn');
        const pauseBtn = document.getElementById('pauseBtn');

        if (this.isPlaying) {
            playBtn.classList.remove('active');
            pauseBtn.classList.add('active');
        } else {
            playBtn.classList.add('active');
            pauseBtn.classList.remove('active');
        }
    }

    updateTimeDisplay() {
        const formatTime = (seconds) => {
            const mins = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        };

        document.getElementById('currentTime').textContent = formatTime(this.currentTime);
        document.getElementById('totalTime').textContent = formatTime(this.totalTime);
    }

    playSample(sampleName) {
        window.audioEngine.playSample(sampleName, 1, 1, 0, 0.8, 0);
        this.updateStatus(`Playing sample: ${sampleName}`);
    }

    async handleFileImport(files) {
        for (const file of files) {
            if (file.type.startsWith('audio/')) {
                try {
                    this.updateStatus(`Loading ${file.name}...`);
                    const sampleName = await window.audioEngine.loadAudioFile(file);
                    this.addImportedSample(sampleName, file.name);
                    this.updateStatus(`Loaded ${file.name}`);
                } catch (error) {
                    this.showError(`Failed to load ${file.name}: ${error.message}`);
                }
            }
        }
    }

    addImportedSample(sampleName, fileName) {
        const projectFiles = document.getElementById('projectFiles');
        const sampleItem = document.createElement('div');
        sampleItem.className = 'tree-item file';
        sampleItem.innerHTML = `
            <i class="fas fa-file-audio"></i>
            <span>${fileName}</span>
            <button class="play-sample" data-sample="${sampleName}">
                <i class="fas fa-play"></i>
            </button>
        `;

        const playBtn = sampleItem.querySelector('.play-sample');
        playBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.playSample(sampleName);
        });

        projectFiles.appendChild(sampleItem);
    }

    formatCode() {
        const code = window.editor.getValue() || '';
        if (!code.trim()) {
            this.showError('No code to format');
            return;
        }

        // Simple indentation formatter - preserves structure, only fixes indentation
        const lines = code.split('\n');
        let formattedLines = [];
        let indentLevel = 0;
        const indentSize = 4; // 4 spaces per indent level

        for (let line of lines) {
            const trimmedLine = line.trim();

            // Skip empty lines and comments - preserve as is
            if (!trimmedLine || trimmedLine.startsWith('//')) {
                formattedLines.push(line);
                continue;
            }

            // Decrease indent for block endings
            if (trimmedLine === '[end]' || trimmedLine === '<end>') {
                indentLevel = Math.max(0, indentLevel - 1);
            }

            // Apply current indentation
            const indent = ' '.repeat(indentLevel * indentSize);
            formattedLines.push(indent + trimmedLine);

            // Increase indent for block starts (including those with effects)
            // Check for [blockname] or [blockname] (effect...) but not [end]
            if (trimmedLine.startsWith('[') && !trimmedLine.includes('end')) {
                // Find the closing bracket for the block name
                const closingBracket = trimmedLine.indexOf(']');
                if (closingBracket !== -1) {
                    const blockPart = trimmedLine.substring(0, closingBracket + 1);
                    // Make sure it's a proper block declaration like [blockname]
                    if (blockPart.length > 2) {
                        indentLevel++;
                    }
                }
            }
            // Check for <blockname> or <blockname> (effect...) but not <end>
            else if (trimmedLine.startsWith('<') && !trimmedLine.includes('end')) {
                // Find the closing bracket for the block name
                const closingBracket = trimmedLine.indexOf('>');
                if (closingBracket !== -1) {
                    const blockPart = trimmedLine.substring(0, closingBracket + 1);
                    // Make sure it's a proper block declaration like <blockname>
                    if (blockPart.length > 2) {
                        indentLevel++;
                    }
                }
            }
        }

        const formattedCode = formattedLines.join('\n');
        window.editor.setValue(formattedCode);
        this.updateBlockInspector();
        this.updateStatus('Code formatted');
    }

    validateCode() {
        const code = window.editor.getValue() || '';
        const parseResult = window.codeInterpreter.parse(code);

        if (!parseResult.success) {
            this.showError(parseResult.message);
            return;
        }

        const validation = window.codeInterpreter.validate();
        if (validation.valid) {
            this.showSuccess('Code is valid!');
        } else {
            this.showWarning('Code validation warnings:\n' + validation.errors.join('\n'));
        }
    }

    updateBlockInspector() {
        const code = window.editor ? window.editor.getValue() : '';
        const parseResult = window.codeInterpreter.parse(code);

        const inspector = document.getElementById('blockInspector');

        if (!parseResult.success) {
            inspector.innerHTML = '<p style="color: var(--error-color);">Parse Error</p>';
            return;
        }

        const blocks = window.codeInterpreter.getAllBlocks();

        if (blocks.length === 0) {
            inspector.innerHTML = '<p>No blocks found</p>';
            return;
        }

        let html = '';
        for (const block of blocks) {
            html += `
                <div class="block-info">
                    <h4>${block.name}</h4>
                    <p>Commands: ${block.commands}</p>
                    <p>Duration: ${block.duration.toFixed(2)}s</p>
                    ${block.samples.length > 0 ? `<p>Samples: ${block.samples.join(', ')}</p>` : ''}
                    ${block.tones.length > 0 ? `<p>Tones: ${block.tones.join(', ')}</p>` : ''}
                </div>
            `;
        }

        inspector.innerHTML = html;
    }

    switchVisualizer(direction) {
        this.currentVisualizerIndex += direction;

        if (this.currentVisualizerIndex < 0) {
            this.currentVisualizerIndex = this.visualizers.length - 1;
        } else if (this.currentVisualizerIndex >= this.visualizers.length) {
            this.currentVisualizerIndex = 0;
        }

        this.updateVisualizerName();
        this.updateStatus(`Switched to ${this.visualizers[this.currentVisualizerIndex].name} visualizer`);
    }

    updateVisualizerName() {
        const nameElement = document.getElementById('visualizerName');
        if (nameElement) {
            nameElement.textContent = this.visualizers[this.currentVisualizerIndex].name;
        }
    }

    startWaveformAnimation() {
        const animate = () => {
            this.drawCurrentVisualizer();
            this.animationFrame = requestAnimationFrame(animate);
        };
        animate();
    }

    drawCurrentVisualizer() {
        const visualizer = this.visualizers[this.currentVisualizerIndex];
        if (visualizer && visualizer.draw) {
            visualizer.draw();
        }
    }

    // Original spectrum visualizer (renamed from drawWaveform)
    drawSpectrum() {
        const canvas = this.waveformCanvas;
        const ctx = this.waveformContext;
        const width = canvas.width;
        const height = canvas.height;

        // Clear canvas
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--primary-bg');
        ctx.fillRect(0, 0, width, height);

        if (!window.audioEngine || !window.audioEngine.audioContext) return;

        try {
            const analyserData = window.audioEngine.getAnalyserData();
            if (!analyserData) return;

            const barWidth = width / analyserData.length;
            const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent-color');

            ctx.fillStyle = accentColor;

            for (let i = 0; i < analyserData.length; i++) {
                const barHeight = (analyserData[i] / 255) * height;
                const x = i * barWidth;
                const y = height - barHeight;

                ctx.fillRect(x, y, barWidth - 1, barHeight);
            }
        } catch (error) {
            // Silently handle errors
        }
    }

    // Circular visualizer
    drawCircular() {
        const canvas = this.waveformCanvas;
        const ctx = this.waveformContext;
        const width = canvas.width;
        const height = canvas.height;
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) / 3;

        // Clear canvas
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--primary-bg');
        ctx.fillRect(0, 0, width, height);

        if (!window.audioEngine || !window.audioEngine.audioContext) return;

        try {
            const analyserData = window.audioEngine.getAnalyserData();
            if (!analyserData) return;

            const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent-color');
            ctx.strokeStyle = accentColor;
            ctx.lineWidth = 2;

            ctx.beginPath();
            for (let i = 0; i < analyserData.length; i++) {
                const angle = (i / analyserData.length) * Math.PI * 2;
                const amplitude = (analyserData[i] / 255) * radius;
                const x = centerX + Math.cos(angle) * (radius + amplitude);
                const y = centerY + Math.sin(angle) * (radius + amplitude);

                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.closePath();
            ctx.stroke();

            // Draw center circle
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius * 0.1, 0, Math.PI * 2);
            ctx.fill();
        } catch (error) {
            // Silently handle errors
        }
    }

    // Waveform line visualizer
    drawWaveform() {
        const canvas = this.waveformCanvas;
        const ctx = this.waveformContext;
        const width = canvas.width;
        const height = canvas.height;

        // Clear canvas
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--primary-bg');
        ctx.fillRect(0, 0, width, height);

        if (!window.audioEngine || !window.audioEngine.audioContext) return;

        try {
            const analyserData = window.audioEngine.getWaveformData();
            if (!analyserData) return;

            const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent-color');
            ctx.strokeStyle = accentColor;
            ctx.lineWidth = 2;

            ctx.beginPath();
            const sliceWidth = width / analyserData.length;
            let x = 0;

            for (let i = 0; i < analyserData.length; i++) {
                const v = analyserData[i] / 128.0;
                const y = v * height / 2;

                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }

                x += sliceWidth;
            }

            ctx.stroke();
        } catch (error) {
            // Silently handle errors
        }
    }

    // Oscilloscope visualizer
    drawOscilloscope() {
        const canvas = this.waveformCanvas;
        const ctx = this.waveformContext;
        const width = canvas.width;
        const height = canvas.height;

        // Clear canvas
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--primary-bg');
        ctx.fillRect(0, 0, width, height);

        if (!window.audioEngine || !window.audioEngine.audioContext) return;

        try {
            const analyserData = window.audioEngine.getWaveformData();
            if (!analyserData) return;

            const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent-color');
            ctx.strokeStyle = accentColor;
            ctx.lineWidth = 1;

            // Draw grid
            ctx.globalAlpha = 0.2;
            ctx.beginPath();
            for (let i = 0; i <= 10; i++) {
                const x = (i / 10) * width;
                const y = (i / 10) * height;
                ctx.moveTo(x, 0);
                ctx.lineTo(x, height);
                ctx.moveTo(0, y);
                ctx.lineTo(width, y);
            }
            ctx.stroke();

            // Draw waveform
            ctx.globalAlpha = 1;
            ctx.lineWidth = 2;
            ctx.beginPath();
            const sliceWidth = width / analyserData.length;
            let x = 0;

            for (let i = 0; i < analyserData.length; i++) {
                const v = (analyserData[i] - 128) / 128.0;
                const y = (v * height / 2) + (height / 2);

                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }

                x += sliceWidth;
            }

            ctx.stroke();
        } catch (error) {
            // Silently handle errors
        }
    }

    // Tree visualizer
    drawTree() {
        const canvas = this.waveformCanvas;
        const ctx = this.waveformContext;
        const width = canvas.width;
        const height = canvas.height;
        const now = Date.now();

        // Clear canvas
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--primary-bg');
        ctx.fillRect(0, 0, width, height);

        if (!window.audioEngine || !window.audioEngine.audioContext) return;

        try {
            const analyserData = window.audioEngine.getAnalyserData();
            if (!analyserData) return;

            const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent-color');

            // Calculate average volume and frequency distribution - increased caps for fuller tree
            const avgVolume = analyserData.reduce((sum, val) => sum + val, 0) / analyserData.length;
            const volumeIntensity = Math.min(avgVolume / 255, 0.8); // Increased from 0.5
            const lowFreq = Math.min(analyserData.slice(0, 8).reduce((sum, val) => sum + val, 0) / 8 / 255, 0.6); // Increased from 0.3
            const midFreq = Math.min(analyserData.slice(8, 16).reduce((sum, val) => sum + val, 0) / 8 / 255, 0.7); // Increased from 0.4
            const highFreq = Math.min(analyserData.slice(16, 24).reduce((sum, val) => sum + val, 0) / 8 / 255, 0.6); // Increased from 0.3

            // Initialize smooth animation values if not present
            if (!this.treeState.smoothSway) {
                this.treeState.smoothSway = 0;
                this.treeState.targetSway = 0;
                this.treeState.smoothPulse = 0;
                this.treeState.targetPulse = 0;
            }

            // Very smooth animation state updates
            this.treeState.swayOffset += 0.003; // Slower base oscillation
            this.treeState.pulsePhase += 0.008; // Slower pulse

            // Calculate target sway based on natural sine wave + audio influence
            const baseSway = Math.sin(this.treeState.swayOffset) * 2; // Gentle base sway
            const audioSway = Math.sin(this.treeState.swayOffset * 0.7) * lowFreq * 4; // Audio-influenced sway
            this.treeState.targetSway = baseSway + audioSway;

            // Smooth interpolation towards target sway (reduces snapping)
            const swayLerpFactor = 0.05; // How quickly to approach target (lower = smoother)
            this.treeState.smoothSway += (this.treeState.targetSway - this.treeState.smoothSway) * swayLerpFactor;

            // Tree base position
            const baseX = width / 2;
            const baseY = height - 10;

            // Use smooth sway value
            const swayAmount = this.treeState.smoothSway;

            // Draw the tree recursively with better proportions
            this.drawTreeBranch(ctx, baseX, baseY, -Math.PI / 2, height * 0.23, 6, 0, swayAmount, volumeIntensity, midFreq, highFreq, accentColor);

            // Draw ground line
            ctx.strokeStyle = this.adjustBrightness(accentColor, -40);
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, baseY);
            ctx.lineTo(width, baseY);
            ctx.stroke();

            // Smooth pulsing aura around tree base
            this.treeState.targetPulse = 12 + Math.sin(this.treeState.pulsePhase) * 4 * volumeIntensity;
            this.treeState.smoothPulse += (this.treeState.targetPulse - this.treeState.smoothPulse) * 0.1;

            ctx.strokeStyle = accentColor;
            ctx.globalAlpha = 0.15 * volumeIntensity;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(baseX, baseY - 20, this.treeState.smoothPulse, 0, Math.PI * 2);
            ctx.stroke();
            ctx.globalAlpha = 1;

        } catch (error) {
            // Silently handle errors
        }
    }

    drawTreeBranch(ctx, x, y, angle, length, thickness, depth, swayAmount, volumeIntensity, midFreq, highFreq, accentColor) {
        // Maximum recursion depth - increased for fuller tree
        if (depth > 7 || length < 3) return;

        // Calculate branch end position with smooth sway
        const swayFactor = Math.pow(0.9, depth); // Gentler sway reduction with depth
        const actualSway = swayAmount * swayFactor;

        // Add secondary sway motion for more natural movement
        const secondarySway = Math.sin(this.treeState.swayOffset * 1.3 + depth * 0.5) * swayFactor * 0.5;
        const totalSway = actualSway + secondarySway;

        const endX = x + Math.cos(angle) * length + totalSway;
        const endY = y + Math.sin(angle) * length;

        // Branch thickness with subtle volume reaction
        const branchThickness = Math.max(1, thickness * (0.85 + volumeIntensity * 0.15));

        // Draw the branch
        ctx.strokeStyle = depth === 0 ? this.adjustBrightness(accentColor, -30) : accentColor;
        ctx.lineWidth = branchThickness;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        // Create sub-branches with better conditions for fuller tree
        if (length > 10 && depth < 6) {
            // More branches for fuller tree - base minimum of 2, up to 4
            const baseBranchCount = depth === 0 ? 2 : 2; // At least 2 branches
            const audioBranchCount = Math.floor(midFreq * 3); // 0-3 additional branches based on audio
            const branchCount = Math.min(4, baseBranchCount + audioBranchCount);

            for (let i = 0; i < branchCount; i++) {
                // Branch angles spread out more naturally
                let branchAngle;
                if (depth === 0) {
                    // Main trunk splits into primary branches
                    branchAngle = angle + (i === 0 ? -Math.PI / 5 : Math.PI / 5);
                } else {
                    // Sub-branches spread more evenly
                    const angleSpread = Math.PI / 3 + midFreq * Math.PI / 6;
                    branchAngle = angle + (i - (branchCount - 1) / 2) * angleSpread / (branchCount - 1);
                }

                // Branch length with better proportions
                const branchLength = length * (0.7 + highFreq * 0.15); // Increased from 0.65 + 0.1

                // Minimal randomization for smoother look
                const randomOffset = (Math.random() - 0.5) * 0.01;
                branchAngle += randomOffset;

                // Recursively draw sub-branches
                this.drawTreeBranch(
                    ctx,
                    endX,
                    endY,
                    branchAngle,
                    branchLength,
                    branchThickness * 0.75, // Less aggressive thickness reduction
                    depth + 1,
                    swayAmount,
                    volumeIntensity,
                    midFreq,
                    highFreq,
                    accentColor
                );
            }
        }

        // Draw leaves more generously
        if (depth >= 2 && highFreq > 0.2) { // Lowered threshold from 0.3
            const leafCount = Math.floor(highFreq * 3 + 1); // More leaves
            for (let i = 0; i < leafCount; i++) {
                const leafX = endX + (Math.random() - 0.5) * 8;
                const leafY = endY + (Math.random() - 0.5) * 8;
                const leafSize = 1 + highFreq * 2;

                ctx.fillStyle = accentColor;
                ctx.globalAlpha = 0.5 + highFreq * 0.4;
                ctx.beginPath();
                ctx.arc(leafX, leafY, leafSize, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1;
            }
        }

        // Draw flowers/buds more generously
        if (depth >= 2 && highFreq > 0.4) { // Lowered threshold from 0.6
            ctx.fillStyle = this.adjustBrightness(accentColor, 20);
            ctx.globalAlpha = highFreq * 0.8;
            ctx.beginPath();
            ctx.arc(endX, endY, 2 + highFreq * 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }
    }

    // Initialize particles
    initParticles() {
        for (let i = 0; i < this.particleCount; i++) {
            this.particles.push({
                x: Math.random() * 300,
                y: Math.random() * 150,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                life: 1,
                size: Math.random() * 3 + 1
            });
        }
    }

    // Particles visualizer
    drawParticles() {
        const canvas = this.waveformCanvas;
        const ctx = this.waveformContext;
        const width = canvas.width;
        const height = canvas.height;

        // Clear canvas with fade effect
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--primary-bg') + '20';
        ctx.fillRect(0, 0, width, height);

        if (!window.audioEngine || !window.audioEngine.audioContext) return;

        try {
            const analyserData = window.audioEngine.getAnalyserData();
            if (!analyserData) return;

            const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent-color');
            const avgVolume = analyserData.reduce((sum, val) => sum + val, 0) / analyserData.length;
            const volumeIntensity = avgVolume / 255;

            // Update and draw particles
            for (let i = 0; i < this.particles.length; i++) {
                const particle = this.particles[i];
                const dataIndex = Math.floor((i / this.particles.length) * analyserData.length);
                const intensity = analyserData[dataIndex] / 255;

                // Update particle position
                particle.x += particle.vx * (1 + intensity);
                particle.y += particle.vy * (1 + intensity);

                // Bounce off walls
                if (particle.x < 0 || particle.x > width) particle.vx *= -1;
                if (particle.y < 0 || particle.y > height) particle.vy *= -1;

                // Keep particles in bounds
                particle.x = Math.max(0, Math.min(width, particle.x));
                particle.y = Math.max(0, Math.min(height, particle.y));

                // Draw particle
                const size = particle.size * (1 + intensity);
                ctx.fillStyle = accentColor;
                ctx.globalAlpha = intensity * 0.8;
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, size, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1;
            }
        } catch (error) {
            // Silently handle errors
        }
    }

    // Spiral visualizer
    drawSpiral() {
        const canvas = this.waveformCanvas;
        const ctx = this.waveformContext;
        const width = canvas.width;
        const height = canvas.height;
        const centerX = width / 2;
        const centerY = height / 2;

        // Clear canvas
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--primary-bg');
        ctx.fillRect(0, 0, width, height);

        if (!window.audioEngine || !window.audioEngine.audioContext) return;

        try {
            const analyserData = window.audioEngine.getAnalyserData();
            if (!analyserData) return;

            const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent-color');
            ctx.strokeStyle = accentColor;
            ctx.lineWidth = 2;

            ctx.beginPath();
            for (let i = 0; i < analyserData.length; i++) {
                const angle = (i / analyserData.length) * Math.PI * 8; // Multiple spirals
                const radius = (i / analyserData.length) * Math.min(width, height) / 2;
                const amplitude = (analyserData[i] / 255) * 20;

                const x = centerX + Math.cos(angle) * (radius + amplitude);
                const y = centerY + Math.sin(angle) * (radius + amplitude);

                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.stroke();
        } catch (error) {
            // Silently handle errors
        }
    }

    // Matrix-style visualizer
    drawMatrix() {
        const canvas = this.waveformCanvas;
        const ctx = this.waveformContext;
        const width = canvas.width;
        const height = canvas.height;

        // Initialize matrix state if not exists
        if (!this.matrixState) {
            this.matrixState = {
                drops: [],
                characters: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZアイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン',
                fontSize: 14,
                columns: 0,
                lastUpdate: 0
            };
        }

        // Calculate columns based on font size
        const fontSize = this.matrixState.fontSize;
        const columns = Math.floor(width / fontSize);

        // Initialize drops if columns changed
        if (this.matrixState.columns !== columns) {
            this.matrixState.columns = columns;
            this.matrixState.drops = [];
            for (let i = 0; i < columns; i++) {
                this.matrixState.drops.push({
                    y: Math.random() * height,
                    speed: Math.random() * 3 + 1,
                    length: Math.random() * 20 + 5,
                    lastChar: 0,
                    chars: []
                });
            }
        }

        // Semi-transparent black background for trailing effect
        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        ctx.fillRect(0, 0, width, height);

        if (!window.audioEngine || !window.audioEngine.audioContext) {
            // Still animate without audio
            this.animateMatrixDrops(ctx, width, height, fontSize, 0.1);
            return;
        }

        try {
            const analyserData = window.audioEngine.getAnalyserData();
            if (!analyserData) {
                this.animateMatrixDrops(ctx, width, height, fontSize, 0.1);
                return;
            }

            const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent-color');
            const avgVolume = analyserData.reduce((sum, val) => sum + val, 0) / analyserData.length;
            const volumeIntensity = avgVolume / 255;

            // Animate drops based on audio
            this.animateMatrixDrops(ctx, width, height, fontSize, volumeIntensity, accentColor, analyserData);

        } catch (error) {
            // Silently handle errors
        }
    }

    animateMatrixDrops(ctx, width, height, fontSize, volumeIntensity, accentColor = '#00ff00', analyserData = null) {
        const now = Date.now();
        const deltaTime = now - this.matrixState.lastUpdate;
        this.matrixState.lastUpdate = now;

        ctx.font = `${fontSize}px 'Courier New', monospace`;
        ctx.textAlign = 'center';

        for (let i = 0; i < this.matrixState.drops.length; i++) {
            const drop = this.matrixState.drops[i];
            const x = i * fontSize + fontSize / 2;

            // Get frequency intensity for this column
            const freqIndex = Math.floor((i / this.matrixState.columns) * (analyserData?.length || 32));
            const freqIntensity = analyserData ? analyserData[freqIndex] / 255 : 0.3;

            // Adjust speed based on audio
            const speedMultiplier = 1 + (volumeIntensity * 2) + (freqIntensity * 3);
            drop.speed = (Math.random() * 2 + 1) * speedMultiplier;

            // Update character change rate based on audio
            const charChangeRate = 100 - (freqIntensity * 80); // Faster changes with higher frequencies

            // Draw the trail
            for (let j = 0; j < drop.length; j++) {
                const charY = drop.y - (j * fontSize);

                if (charY > 0 && charY < height) {
                    // Calculate alpha based on position in trail
                    const alpha = Math.max(0, 1 - (j / drop.length));

                    // Leading character is brightest (white/bright accent)
                    if (j === 0) {
                        ctx.fillStyle = accentColor || '#ffffff';
                        ctx.globalAlpha = 1;
                    } else {
                        // Trail characters fade from accent color to darker
                        const color = this.hexToRgb(accentColor || '#00ff00');
                        const intensity = alpha * (0.3 + freqIntensity * 0.7);
                        ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${intensity})`;
                        ctx.globalAlpha = 1;
                    }

                    // Get or generate character for this position
                    if (!drop.chars[j] || (Math.random() * charChangeRate < deltaTime)) {
                        drop.chars[j] = this.matrixState.characters.charAt(
                            Math.floor(Math.random() * this.matrixState.characters.length)
                        );
                    }

                    ctx.fillText(drop.chars[j], x, charY);
                }
            }

            // Move drop down
            drop.y += drop.speed * (deltaTime / 16); // Normalize for ~60fps

            // Reset drop when it goes off screen
            if (drop.y > height + (drop.length * fontSize)) {
                drop.y = -drop.length * fontSize;
                drop.speed = Math.random() * 2 + 1;
                drop.length = Math.random() * 15 + 10 + (volumeIntensity * 20); // Longer trails with more audio
                drop.chars = []; // Clear characters for new drop

                // Sometimes start drops from random positions for more chaos
                if (Math.random() < 0.1 + (volumeIntensity * 0.3)) {
                    drop.y = Math.random() * height;
                }
            }
        }

        ctx.globalAlpha = 1; // Reset alpha
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 0, g: 255, b: 0 }; // Default to green
    }

    newProject() {
        if (confirm('Create new project? This will clear your current work.')) {
            window.editor.setValue(`// Welcome to MelodiCode!
// Create music using block-based code

[main]
sample kick 1 1
wait 0.5
sample snare 1 1
wait 0.5
[end]

// Play the main block
play main`);
            this.updateBlockInspector();
            this.updateStatus('New project created');
        }
    }

    openProject() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.mcode,.txt';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    window.editor.setValue(e.target.result);
                    this.updateBlockInspector();
                    this.updateStatus('Project opened');
                };
                reader.readAsText(file);
            }
        };
        input.click();
    }

    saveProject() {
        const code = window.editor.getValue() || '';
        const blob = new Blob([code], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'melodicode-project.mcode';
        a.click();
        URL.revokeObjectURL(url);
        this.updateStatus('Project saved');
    }

    async exportWAV() {
        // Check if code contains TTS
        const code = window.editor.getValue();
        if (code.includes('tts ')) {
            const proceed = confirm(
                'Your code contains TTS commands. WAV export will:\n' +
                '• Attempt to capture TTS audio (may be silent)\n' +
                '• Include estimated timing for TTS\n' +
                '• Work best in Chrome/Edge browsers\n' +
                'This may add silence where TTS is called.\n\n' +
                'Continue with export?'
            );
            if (!proceed) return;
        }

        try {
            this.updateStatus('Exporting WAV...');
            const duration = 30; // seconds, or make this user-configurable
            const result = await window.fileManager.exportAudio('wav', duration);

            if (result.success) {
                this.updateStatus('WAV exported');
            } else {
                this.showError(result.message);
            }
        } catch (error) {
            this.showError('Export failed: ' + error.message);
        }
    }

    async exportStems() {
        try {
            this.updateStatus('Preparing stems export...');
            const result = await window.fileManager.exportStems();

            if (result.success) {
                this.updateStatus(result.message);
                this.showSuccess(result.message);
            } else {
                this.showError(result.message);
            }
        } catch (error) {
            this.showError('Stems export failed: ' + error.message);
        }
    }

    showSettings() {
        const modal = document.getElementById('settingsModal');
        modal.classList.add('show');
        modal.style.display = 'flex'; // Ensure it's visible
    }

    hideSettings() {
        const modal = document.getElementById('settingsModal');
        modal.classList.remove('show');
        // Don't set display: none immediately on mobile
        if (window.innerWidth > 768) {
            modal.style.display = 'none';
        }
    }

    showGemini() {
        const modal = document.getElementById('geminiModal');
        modal.classList.add('show');
        modal.style.display = 'flex'; // Ensure it's visible
    }

    hideGemini() {
        const modal = document.getElementById('geminiModal');
        modal.classList.remove('show');
        // Don't set display: none immediately on mobile
        if (window.innerWidth > 768) {
            modal.style.display = 'none';
        }
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(tabName + 'Tab').classList.add('active');
    }

    setTheme(theme) {
        this.currentTheme = theme;
        document.documentElement.setAttribute('data-theme', theme);
        this.updateStatus(`Theme changed to ${theme}`);
    }

    setAccentColor(color) {
        document.documentElement.style.setProperty('--accent-color', color);
        // Calculate hover color (slightly darker)
        const hoverColor = this.adjustBrightness(color, -20);
        document.documentElement.style.setProperty('--accent-hover', hoverColor);
        this.updateStatus('Accent color updated');
    }

    adjustBrightness(hex, percent) {
        const num = parseInt(hex.replace("#", ""), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    }

    loadSettings() {
        const settings = JSON.parse(localStorage.getItem('melodicode-settings') || '{}');

        if (settings.theme) {
            document.getElementById('themeSelect').value = settings.theme;
            this.setTheme(settings.theme);
        }

        if (settings.accentColor) {
            document.getElementById('accentColor').value = settings.accentColor;
            this.setAccentColor(settings.accentColor);
        }

        if (settings.geminiApiKey) {
            document.getElementById('geminiApiKey').value = settings.geminiApiKey;
        }
    }

    saveSettings() {
        const settings = {
            theme: document.getElementById('themeSelect').value,
            accentColor: document.getElementById('accentColor').value,
            geminiApiKey: document.getElementById('geminiApiKey').value,
            geminiModel: document.getElementById('geminiModel').value,
            sampleRate: document.getElementById('sampleRate').value,
            bufferSize: document.getElementById('bufferSize').value
        };

        localStorage.setItem('melodicode-settings', JSON.stringify(settings));
        this.hideSettings();
        this.updateStatus('Settings saved');
    }

    handleKeyboardShortcuts(e) {
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case ' ':
                    e.preventDefault();
                    if (this.isPlaying) {
                        this.pause();
                    } else {
                        this.play();
                    }
                    break;
                case 's':
                    e.preventDefault();
                    this.saveProject();
                    break;
                case 'o':
                    e.preventDefault();
                    this.openProject();
                    break;
                case 'n':
                    e.preventDefault();
                    this.newProject();
                    break;
            }
        }
    }

    handleResize() {
        if (this.waveformCanvas) {
            const rect = this.waveformCanvas.getBoundingClientRect();
            this.waveformCanvas.width = rect.width;
            this.waveformCanvas.height = rect.height;
        }
    }

    updateStatus(message) {
        document.getElementById('statusMessage').textContent = message;
        this.logOutput(message);
    }

    showError(message) {
        this.updateStatus('Error: ' + message);
        this.logOutput(message, 'error');
        console.error(message);
    }

    showWarning(message) {
        this.updateStatus('Warning: ' + message);
        this.logOutput(message, 'warning');
        console.warn(message);
    }

    showSuccess(message) {
        this.updateStatus(message);
        this.logOutput(message, 'success');
    }

    logOutput(message, type = '') {
        const outputLog = document.getElementById('outputLog');
        const entry = document.createElement('div');
        entry.className = `log-entry ${type}`;
        entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;

        outputLog.appendChild(entry);
        outputLog.scrollTop = outputLog.scrollHeight;

        // Keep only last 100 entries
        while (outputLog.children.length > 100) {
            outputLog.removeChild(outputLog.firstChild);
        }
    }

    insertCodeSnippet(snippetType) {
        if (!snippetType || !window.editor) return;

        const cursor = window.editor.getCursor();
        const templates = {
            // Blocks
            block: `[block_name]
    // Add your commands here
    
[end]
`,

            sample_block: `<sample_name>
    // Custom sample - all commands play simultaneously
    
<end>
`,

            main_block: `[main]
    // Main block to orchestrate your music
    
[end]

play main`,

            // Commands
            tone: `tone C4 0.5 sine 0.8`,
            sample: `sample kick 1 1 0.8 0`,
            slide: `slide C4 G4 1 sine 0.8`,
            wait: `wait 0.5`,
            bpm: `bpm 120`,

            // Control Flow
            if_block: `if variable == value
    // Commands to execute if condition is true
    
endif`,

            for_loop: `for i 1 4
    // Commands to repeat
    
endfor`,

            play: `play block_name volume=0.8 pan=0`,
            loop: `loop 4 block_name`,
            playasync: `playasync block_name`,

            // Patterns
            pattern: `pattern kick "1-0-1-0-"`,
            sequence: `sequence drums kick snare hihat snare`,
            sidechain: `sidechain block1 block2 0.8`,

            // Effects
            reverb_effect: `[block_name] (reverb 0.3)
    // Block content with reverb effect
    
[end]`,

            delay_effect: `[block_name] (delay 0.3 0.3 0.3)
    // Block content with delay effect
    
[end]`,

            filter_effect: `[block_name] (filter lowpass 1000 1)
    // Block content with filter effect
    
[end]`,

            distortion_effect: `[block_name] (distortion 10)
    // Block content with distortion effect
    
[end]`,

            // Templates
            drum_pattern: `[drums]
    sample kick
    wait 0.5
    sample snare
    wait 0.5
    sample hihat
    wait 0.25
    sample hihat
    wait 0.25
[end]`,

            melody_template: `[melody]
    // Simple melody pattern
    tone C4 0.5 sine 0.7
    tone D4 0.5 sine 0.7
    tone E4 0.5 sine 0.7
    tone F4 0.5 sine 0.7
    tone G4 1.0 sine 0.7
[end]`,

            bass_template: `[bass]
    // Bass line pattern
    tone C2 0.5 sawtooth 0.8
    wait 0.5
    tone G2 0.5 sawtooth 0.8
    wait 0.5
    tone F2 0.5 sawtooth 0.8
    wait 0.5
    tone E2 0.5 sawtooth 0.8
    wait 0.5
[end]`,

            full_song: `// Full song structure template
bpm 120

// Custom samples
<kick_drum>
    tone C2 0.2 sine 0.9
    tone C3 0.1 square 0.3
<end>

<snare_drum>
    tone D3 0.1 triangle 0.7
    tone G3 0.05 square 0.4
<end>

// Music blocks
[intro]
    play melody
[end]

[verse]
    play melody bass drums
[end]

[chorus]
    play chorus_melody bass drums
[end]

[melody]
    tone C4 0.5 sine 0.7
    tone D4 0.5 sine 0.7
    tone E4 0.5 sine 0.7
    tone G4 1.0 sine 0.7
[end]

[chorus_melody]
    tone C5 0.5 sawtooth 0.8
    tone G4 0.5 sawtooth 0.8
    tone A4 0.5 sawtooth 0.8
    tone G4 1.0 sawtooth 0.8
[end]

[bass]
    tone C2 0.5 sawtooth 0.8
    wait 0.5
    tone G2 0.5 sawtooth 0.8
    wait 0.5
[end]

[drums]
    sample kick_drum
    wait 0.5
    sample snare_drum
    wait 0.5
[end]

[main]
    play intro
    loop 2 verse
    play chorus
    loop 2 verse
    play chorus
[end]

play main`
        };

        const template = templates[snippetType];
        if (template) {
            // Get current line to check indentation
            const currentLine = window.editor.getLine(cursor.line);
            const leadingWhitespace = currentLine.match(/^\s*/)[0];

            // Apply indentation to each line of the template
            const indentedTemplate = template.split('\n').map((line, index) => {
                if (index === 0) return line; // Don't indent first line
                return leadingWhitespace + line;
            }).join('\n');

            // Insert the template at cursor position
            window.editor.replaceSelection(indentedTemplate);

            // Update UI
            this.updateBlockInspector();
            this.updateStatus(`Inserted ${snippetType} template`);
        }

        // Reset dropdown
        const dropdown = document.getElementById('insertDropdown');
        if (dropdown) dropdown.value = '';
    }
}

// Initialize UI when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.uiManager = new UIManager();
});
