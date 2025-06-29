class UIManager {
    constructor() {
        this.currentTheme = 'dark';
        this.isPlaying = false;
        this.currentTime = 0;
        this.totalTime = 0;
        this.waveformCanvas = null;
        this.waveformContext = null;
        this.animationFrame = null;
        
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

        // Master controls
        document.getElementById('masterVolume').addEventListener('input', (e) => {
            const value = e.target.value;
            document.getElementById('masterVolumeValue').textContent = value + '%';
            window.audioEngine.setMasterVolume(value);
        });

        // Effects controls
        this.setupEffectsControls();

        // File import
        document.getElementById('importAudio').addEventListener('click', () => {
            document.getElementById('audioFileInput').click();
        });

        document.getElementById('audioFileInput').addEventListener('change', (e) => {
            this.handleFileImport(e.target.files);
        });

        // Settings and modals
        document.getElementById('settingsBtn').addEventListener('click', () => this.showSettings());
        document.getElementById('geminiBtn').addEventListener('click', () => this.showGemini());
        document.getElementById('closeSettings').addEventListener('click', () => this.hideSettings());
        document.getElementById('closeGemini').addEventListener('click', () => this.hideGemini());
        document.getElementById('saveSettings').addEventListener('click', () => this.saveSettings());

        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        // Theme controls
        document.getElementById('themeSelect').addEventListener('change', (e) => {
            this.setTheme(e.target.value);
        });

        document.getElementById('accentColor').addEventListener('change', (e) => {
            this.setAccentColor(e.target.value);
        });

        // Code editor
        /*document.getElementById('codeInput').addEventListener('input', () => {
            this.updateBlockInspector();
        });*/

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));

        // Window resize
        window.addEventListener('resize', () => this.handleResize());
    }

    setupEffectsControls() {
        // Compressor
        document.getElementById('compressorThreshold').addEventListener('input', (e) => {
            const value = e.target.value;
            e.target.nextElementSibling.textContent = value + 'dB';
            window.audioEngine.setCompressor(value);
        });

        // Limiter
        document.getElementById('limiterThreshold').addEventListener('input', (e) => {
            const value = e.target.value;
            e.target.nextElementSibling.textContent = value + 'dB';
            window.audioEngine.setLimiter(value);
        });

        // Reverb
        document.getElementById('reverbWet').addEventListener('input', (e) => {
            const value = e.target.value;
            e.target.nextElementSibling.textContent = value + '%';
            window.audioEngine.setReverb(value);
        });

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
            document.getElementById(id).addEventListener('input', (e) => {
                const value = e.target.value;
                e.target.nextElementSibling.textContent = value + 'dB';
                const band = id.replace('eq', '').toLowerCase();
                window.audioEngine.setEQ(band, value);
            });
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
        const parseResult = window.codeInterpreter.parse(code);
        
        if (parseResult.success) {
            const formatted = window.codeInterpreter.formatCode();
            window.editor.setValue(formatted);
            this.updateStatus('Code formatted');
        } else {
            this.showError('Cannot format invalid code');
        }
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
        try {
            /*this.updateStatus('Exporting WAV...');
            const duration = 30; // seconds
            const wavBlob = await window.audioEngine.exportWAV(duration);
            
            const url = URL.createObjectURL(wavBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'melodicode-export.wav';
            a.click();
            URL.revokeObjectURL(url);
            
            this.updateStatus('WAV exported');*/
            this.showError('WAV export is not yet implemented');
        } catch (error) {
            this.showError('Export failed: ' + error.message);
        }
    }

    showSettings() {
        document.getElementById('settingsModal').classList.add('show');
    }

    hideSettings() {
        document.getElementById('settingsModal').classList.remove('show');
    }

    showGemini() {
        document.getElementById('geminiModal').classList.add('show');
    }

    hideGemini() {
        document.getElementById('geminiModal').classList.remove('show');
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
}

// Initialize UI when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.uiManager = new UIManager();
});
