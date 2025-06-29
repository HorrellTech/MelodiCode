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
    // Documentation Modal logic
    const docsBtn = document.getElementById('docsBtn');
    const docsModal = document.getElementById('docsModal');
    const closeDocs = document.getElementById('closeDocs');
    const docsContent = document.getElementById('docsContent');

    function renderDocs() {
        const keywords = window.melodicodeKeywords;
        let html = '<div class="docs-keyword-list">';
        Object.entries(keywords).forEach(([key, info]) => {
            html += `
                <div class="docs-keyword-card">
                    <h4>${key}</h4>
                    <div><code>${info.usage}</code></div>
                    <div>${info.description}</div>
                    ${info.params && info.params.length ? `
                        <ul>
                            ${info.params.map(p => `<li><b>${p.name}</b>: ${p.desc}</li>`).join('')}
                        </ul>
                    ` : ''}
                </div>
            `;
        });
        html += '</div>';
        docsContent.innerHTML = html;
    }

    docsBtn.addEventListener('click', () => {
        renderDocs();
        docsModal.classList.add('show');
    });

    closeDocs.addEventListener('click', () => {
        docsModal.classList.remove('show');
    });

    // Optional: close modal on outside click
    docsModal.addEventListener('click', (e) => {
        if (e.target === docsModal) docsModal.classList.remove('show');
    });
});

// Make app available globally for debugging
window.MelodiCode = {
    app: window.melodiCodeApp,
    version: window.melodiCodeApp?.version || '1.0.0',
    debug: () => window.melodiCodeApp?.debug() || 'Not initialized'
};
