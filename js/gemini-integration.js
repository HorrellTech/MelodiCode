class GeminiIntegration {
    constructor() {
        this.apiKey = '';
        this.model = 'gemini-2.0-flash';
        this.conversationHistory = [];
        this.isConfigured = false;
        this.setupEventListeners();
        this.loadConfiguration();
    }

    setupEventListeners() {
        const sendBtn = document.getElementById('sendChat');
        const chatInput = document.getElementById('chatInput');
        const clearBtn = document.getElementById('clearGeminiChat');
        const exportBtn = document.getElementById('exportGeminiChat');

        sendBtn.addEventListener('click', () => this.sendMessage());

        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                if (confirm('Clear the entire conversation? This cannot be undone.')) {
                    this.clearConversation();
                }
            });
        }

        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportConversation());
        }
    }

    loadConfiguration() {
        const settings = JSON.parse(localStorage.getItem('melodicode-settings') || '{}');

        if (settings.geminiApiKey) {
            this.apiKey = settings.geminiApiKey;
            this.isConfigured = true;
        }

        if (settings.geminiModel) {
            // Validate the model name and use default if invalid
            const validModels = ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'];
            if (validModels.includes(settings.geminiModel)) {
                this.model = settings.geminiModel;
            } else {
                // Invalid model found, reset to default
                this.model = 'gemini-2.0-flash';
                // Update localStorage with correct default
                settings.geminiModel = 'gemini-2.0-flash';
                localStorage.setItem('melodicode-settings', JSON.stringify(settings));
            }
        }
    }

    resetToDefaults() {
        this.model = 'gemini-2.0-flash';
        const settings = JSON.parse(localStorage.getItem('melodicode-settings') || '{}');
        settings.geminiModel = 'gemini-2.0-flash';
        localStorage.setItem('melodicode-settings', JSON.stringify(settings));
        console.log('Gemini settings reset to defaults');
    }

    configure(apiKey, model = 'gemini-2.0-flash') {
        this.apiKey = apiKey;
        this.model = model;
        this.isConfigured = !!apiKey;

        // Save to settings
        const settings = JSON.parse(localStorage.getItem('melodicode-settings') || '{}');
        settings.geminiApiKey = apiKey;
        settings.geminiModel = model;
        localStorage.setItem('melodicode-settings', JSON.stringify(settings));
    }

    async sendMessage() {
        const chatInput = document.getElementById('chatInput');
        const message = chatInput.value.trim();

        if (!message) return;

        if (!this.isConfigured) {
            this.showError('Please configure your Gemini API key in settings first. If you have already configured it, please reload the page.');
            return;
        }

        // Add user message to chat
        this.addMessageToChat(message, 'user');
        chatInput.value = '';

        // Show typing indicator
        this.showTypingIndicator();

        try {
            const response = await this.generateResponse(message);
            this.hideTypingIndicator();
            this.addMessageToChat(response, 'ai');
        } catch (error) {
            this.hideTypingIndicator();
            this.showError('Failed to get response: ' + error.message);
        }
    }

    async generateResponse(userMessage) {
        const context = this.buildContext();
        const prompt = this.buildPrompt(userMessage, context);

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 1024,
                }
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'API request failed');
        }

        const data = await response.json();
        let generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!generatedText) {
            throw new Error('No response generated');
        }

        // Extract code from the response and fix invalid notes
        const codeMatch = generatedText.match(/```[\s\S]*?```/);
        if (codeMatch) {
            let code = codeMatch[0].replace(/```/g, '').trim();

            // Fix invalid notes
            const fixedCode = this.fixInvalidNotes(code);
            if (fixedCode !== code) {
                console.log('Fixed invalid notes in generated code');
                generatedText = generatedText.replace(codeMatch[0], '```\n' + fixedCode + '\n```');
                code = fixedCode;
            }

            const validation = this.validateGeneratedCode(code);

            if (!validation.valid) {
                console.warn('Generated code validation issues:', validation.issues);
                // Optionally, you could try to fix common issues automatically
                if (!code.includes('play main')) {
                    generatedText = generatedText.replace(/```$/, '\nplay main\n```');
                }
            }
        }

        // Store in conversation history
        this.conversationHistory.push({
            user: userMessage,
            ai: generatedText,
            timestamp: new Date()
        });

        return generatedText;
    }

    buildContext() {
        const sendCode = document.getElementById('sendCurrentCodeToGemini');
        const includeCode = sendCode ? sendCode.checked : true;

        const context = {
            // Only include current code if checkbox is checked
            currentCode: includeCode ? (window.editor.getValue() || '') : '',

            // Available samples
            availableSamples: this.getAvailableSamples(),

            // Current blocks
            blocks: this.getCurrentBlocks(),

            // Current BPM
            currentBPM: this.getCurrentBPM(),

            // Project info
            projectStats: window.fileManager ? window.fileManager.getProjectStats() : null
        };

        return context;
    }

    buildPrompt(userMessage, context) {
        const systemPrompt = `You are a MelodiCode music programming assistant.

SYNTAX(Remember the order of the parameters, DO NOT MIX THEM UP):
- Blocks: [name] commands [end]
- Commands: set <variable> <value>,
    *sample <name> [pitch] [timescale] [volume] [pan], 
    *tone <frequency|note> [duration] [waveType(sine, sawtooth, triangle, square)] [volume] [pan], 
    *slide <startNote> <endNote> <duration> [waveType(sine, sawtooth, triangle, square)] [volume] [pan],
    *wait <duration>, 
    *bpm <value>,
    *pattern <sampleName> <pattern> (e.g., pattern kick "1-0-1-0-" or "x-x---x-"),
    *sequence <baseName> <sample1> <sample2> ... (e.g., sequence drums kick snare hihat snare),
    *if <variable> <operator> <value> ... endif,
    *for <variable> <start> <end> ... endfor

- Play: play <block1> [block2...] [parameters...(volume=0.8, pan=0, etc.)]
- Loop: loop <count> <block_name> [block2...] (Make sure not to use the same name as an existing sample or block, use a different name)

***LOOPS ARE USED THE SAME AS PLAY COMMANDS, BUT THEY REPEAT THE BLOCKS A NUMBER OF TIMES. LOOPS ALSO CAN NOT REFERENCE SAMPLES, ONLY BLOCKS***

- You can define custom samples using <sampleName> ... <end> blocks. Use these when asked to create or use custom samples. 
All commands inside a sample block play simultaneously when triggered with sample <sampleName>. 

When I ask for a sample block, 
only give me that block with <>, not the full code. And dont use samples in the <sample> block, only use tones and their wavetypes.

SAMPLES: ${context.availableSamples.join(', ')}

CURRENT: ${context.currentCode ? context.currentCode.substring(0, 200) + '...' : 'Empty'}

REQUIREMENTS:
1. Wrap code in \`\`\`
2. Include bpm command
3. End with "play main" outside blocks
4. Use [main] block structure. Make sure [main] block exists and plays the blocks simultaneously.
5. Make it as complex as you want but ensure it is valid MelodiCode syntax.
6. When using drums etc, ensure they are played with the other blocks when required, and make sure the drums length matches the melody.
7. If I ask for only a block, only give me a block, not the full code. If I dont ask for a block specifically, give me the full code. 
If its a sample block, use <> instead of [], also with the <end>.
8. Take into account BPM when setting not durations

**Comment parts of the code with // so I can understand what each part does. Not too much text**

TEMPLATE:
\`\`\`
bpm 120
<kick_drum>
    tone c2 0.5 sine
    tone e2 0.5 square 0.3
    tone g2 0.5 sawtooth 0.6
<end>

[drums]
    sample kick_drum
    wait 0.5
[end]

[melody]
    tone c4 0.5
    tone e4 0.5
    tone g4 0.5
    slide c5 d4 0.5
[end]

[main]
    play melody // Can play items by themselves
    play melody drums // Can play items together
    loop 4 drums melody // Can play drums along with melody, looped 4 times
[end]

play main 
\`\`\`

Request: ${userMessage}`;

        return systemPrompt;
    }

    /*buildPrompt(userMessage, context) {
        const systemPrompt = `
You are a MelodiCode music programming assistant.

SYNTAX:
- Blocks: [name] ... [end]
- Custom samples: <sampleName> ... <end>
- Commands:
    set <var> <value>
    sample <name> [pitch] [timescale] [volume] [pan]
    tone <note|freq> [duration] [waveType] [volume] [pan]
    slide <startNote> <endNote> <duration> [waveType] [volume] [pan]
    sidechain <block1> <block2> <amount>
    wait <duration>
    bpm <value>
    play <block1> [block2...]
    loop <count> <block1> [block2...] **LOOP IS NOT A BLOCK, LOOP IS USED LIKE PLAY BUT REPEATS BLOCKS**

RULES:
- Always include a bpm command.
- Always use a [main] block and end with play main (outside blocks).
- Use play for parallel, loop for repeated blocks (not samples).
- Custom samples (<sampleName>) use only tone commands.
- Comment code with // for clarity.
- If asked for a block, only return that block.

SAMPLES: ${context.availableSamples.join(', ')}
CURRENT: ${context.currentCode ? context.currentCode.substring(0, 200) + '...' : 'Empty'}

TEMPLATE:
\`\`\`
bpm 120
<kick_drum>
    tone c2 0.5 sine
<end>

[drums]
    sample kick_drum
    wait 0.5
[end]

[main]
    loop 4 drums
[end]

play main
\`\`\`

Request: ${userMessage}
`;

        return systemPrompt;
    }*/

    validateGeneratedCode(code) {
        const issues = [];

        // Check for main block
        if (!code.includes('[main]')) {
            issues.push('Missing [main] block');
        }

        // Check for global play command
        if (!code.includes('play main')) {
            issues.push('Missing global "play main" command');
        }

        // Check for BPM
        if (!code.includes('bpm ')) {
            issues.push('Missing BPM setting');
        }

        // Check for proper block endings
        const blockStarts = (code.match(/\[[\w]+\]/g) || []).filter(match => !match.includes('end'));
        const blockEnds = (code.match(/\[end\]/g) || []).length;

        if (blockStarts.length !== blockEnds) {
            issues.push('Mismatched block start/end pairs');
        }

        // Check and fix invalid notes
        const invalidNotes = this.findInvalidNotes(code);
        if (invalidNotes.length > 0) {
            issues.push(`Invalid notes found: ${invalidNotes.join(', ')}`);
        }

        return {
            valid: issues.length === 0,
            issues: issues
        };
    }

    translateNote(note) {
        // Handle flat notes (bb, db, eb, gb, ab)
        const noteTranslations = {
            'bb': 'a#',  // Bb -> A#
            'db': 'c#',  // Db -> C#
            'eb': 'd#',  // Eb -> D#
            'gb': 'f#',  // Gb -> F#
            'ab': 'g#'   // Ab -> G#
        };

        // Extract note name and octave
        const match = note.toLowerCase().match(/^([a-g]b?)(\d+)?$/);
        if (!match) return note; // Return original if no match

        const noteName = match[1];
        const octave = match[2] || '';

        // Translate if needed
        const translatedNote = noteTranslations[noteName] || noteName;

        return translatedNote + octave;
    }

    findInvalidNotes(code) {
        const validNotes = ['c', 'd', 'e', 'f', 'g', 'a', 'b', 'c#', 'd#', 'f#', 'g#', 'a#'];
        const invalidNotes = [];

        // Find all tone commands
        const toneMatches = code.match(/tone\s+([a-g]b?\d*)/gi);
        if (toneMatches) {
            toneMatches.forEach(match => {
                const noteMatch = match.match(/tone\s+([a-g]b?\d*)/i);
                if (noteMatch) {
                    const fullNote = noteMatch[1].toLowerCase();
                    const noteOnly = fullNote.replace(/\d+$/, ''); // Remove octave number

                    if (!validNotes.includes(noteOnly) && noteOnly.includes('b')) {
                        invalidNotes.push(fullNote);
                    }
                }
            });
        }

        return [...new Set(invalidNotes)]; // Remove duplicates
    }

    fixInvalidNotes(code) {
        // Replace invalid flat notes with their sharp equivalents
        return code.replace(/tone\s+([a-g]b)(\d*)/gi, (match, note, octave) => {
            const translatedNote = this.translateNote(note + octave);
            return `tone ${translatedNote}`;
        });
    }

    getAvailableSamples() {
        const samples = [];

        // List all built-in samples here:
        const builtInSamples = [
            'kick', 'snare', 'hihat', 'hihat_open', 'crash', 'ride',
            'tom_high', 'tom_mid', 'tom_low', 'clap', 'triangle',
            'bass_low', 'bass_mid', 'bass_high', 'sub_bass', 'bass_pluck',
            'lead_1', 'lead_2', 'lead_bright', 'lead_soft', 'synth_pluck',
            'pad_1', 'pad_warm', 'pad_strings', 'pad_choir',
            'shaker', 'tambourine', 'cowbell', 'woodblock',
            'whoosh', 'zap', 'drop', 'rise'
        ];
        samples.push(...builtInSamples);

        // Add imported samples
        if (window.audioEngine && window.audioEngine.samples) {
            for (const sampleName of window.audioEngine.samples.keys()) {
                if (!builtInSamples.includes(sampleName)) {
                    samples.push(sampleName);
                }
            }
        }

        return samples;
    }

    getCurrentBlocks() {
        if (!window.codeInterpreter) return [];

        try {
            const code = window.editor.getValue() || '';
            window.codeInterpreter.parse(code);
            return Array.from(window.codeInterpreter.blocks.keys());
        } catch (error) {
            return [];
        }
    }

    addMessageToChat(message, sender) {
        const chatHistory = document.getElementById('chatHistory');
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${sender}`;

        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content selectable-text';

        if (sender === 'ai') {
            // Process potential code blocks
            const processedMessage = this.processAIMessage(message);
            contentDiv.innerHTML = processedMessage;

            // Add event listeners for copy buttons
            contentDiv.querySelectorAll('.copy-code-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const codeBlock = btn.closest('.code-block');
                    if (codeBlock) {
                        const originalCode = this.unescapeHtml(codeBlock.getAttribute('data-original-code'));
                        this.copyToEditor(originalCode);
                    }
                });
            });

            // Add copy message button
            const copyBtn = document.createElement('button');
            copyBtn.className = 'copy-message-btn';
            copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
            copyBtn.title = 'Copy message';
            copyBtn.addEventListener('click', () => this.copyMessageToClipboard(message));
            contentDiv.appendChild(copyBtn);
        } else {
            contentDiv.textContent = message;

            // Add copy message button for user messages too
            const copyBtn = document.createElement('button');
            copyBtn.className = 'copy-message-btn';
            copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
            copyBtn.title = 'Copy message';
            copyBtn.addEventListener('click', () => this.copyMessageToClipboard(message));
            contentDiv.appendChild(copyBtn);
        }

        messageDiv.appendChild(contentDiv);
        chatHistory.appendChild(messageDiv);

        // Scroll to bottom
        chatHistory.scrollTop = chatHistory.scrollHeight;
    }

    async copyMessageToClipboard(message) {
        try {
            await navigator.clipboard.writeText(message);
            // Show brief feedback
            if (window.uiManager) {
                window.uiManager.updateStatus('Message copied to clipboard');
            }
        } catch (err) {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = message;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);

            if (window.uiManager) {
                window.uiManager.updateStatus('Message copied to clipboard');
            }
        }
    }

    async copyConversationToClipboard() {
        const conversation = this.conversationHistory.map(entry =>
            `User: ${entry.user}\n\nAI: ${entry.ai}\n\n${'='.repeat(50)}\n\n`
        ).join('');

        try {
            await navigator.clipboard.writeText(conversation);
            if (window.uiManager) {
                window.uiManager.updateStatus('Conversation copied to clipboard');
            }
        } catch (err) {
            console.error('Failed to copy conversation:', err);
        }
    }

    processAIMessage(message) {
        // Convert code blocks to formatted HTML, but preserve original code separately
        let processed = message.replace(/```[\s\S]*?```/g, (match) => {
            const code = match.replace(/```/g, '').trim();
            return `<pre><code>${this.escapeHtml(code)}</code></pre>`;
        });

        // Convert inline code
        processed = processed.replace(/`([^`]+)`/g, '<code>$1</code>');

        // Convert line breaks
        processed = processed.replace(/\n/g, '<br>');

        // Add copy button for code blocks - store original code in data attribute
        processed = processed.replace(/<pre><code>([\s\S]*?)<\/code><\/pre>/g, (match, escapedCode) => {
            const originalCode = this.unescapeHtml(escapedCode);
            const codeId = 'code-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
            return `
                <div class="code-block" data-original-code="${this.escapeHtml(originalCode)}">
                    <div class="code-header">
                        <span>MelodiCode</span>
                        <button class="copy-code-btn" data-code-id="${codeId}">
                            <i class="fas fa-copy"></i> Copy to Editor
                        </button>
                    </div>
                    <pre><code id="${codeId}" class="selectable-code">${escapedCode}</code></pre>
                </div>
            `;
        });

        return processed;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    unescapeHtml(html) {
        const div = document.createElement('div');
        div.innerHTML = html;
        return div.textContent || div.innerText;
    }

    escapeForJs(text) {
        return text.replace(/'/g, "\\'").replace(/\n/g, '\\n').replace(/\r/g, '\\r');
    }

    copyToEditor(code) {
        if (confirm('Replace current code with generated code?')) {
            window.editor.setValue(code);
            if (window.uiManager) {
                window.uiManager.updateBlockInspector();
                window.uiManager.updateStatus('Code copied from Gemini');
            }
        }
    }

    showTypingIndicator() {
        const chatHistory = document.getElementById('chatHistory');
        const indicator = document.createElement('div');
        indicator.className = 'chat-message ai typing-indicator';
        indicator.innerHTML = `
            <div class="message-content">
                <div class="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;
        indicator.id = 'typing-indicator';
        chatHistory.appendChild(indicator);
        chatHistory.scrollTop = chatHistory.scrollHeight;
    }

    hideTypingIndicator() {
        const indicator = document.getElementById('typing-indicator');
        if (indicator) {
            indicator.remove();
        }
    }

    showError(message) {
        this.addMessageToChat(`Error: ${message}`, 'ai');
    }

    clearConversation() {
        const chatHistory = document.getElementById('chatHistory');
        chatHistory.innerHTML = `
            <div class="chat-message ai">
                <div class="message-content">
                    Hello! I'm here to help you create music with MelodiCode. I understand the block-based syntax and can generate code for songs. What would you like to create?
                </div>
            </div>
        `;
        this.conversationHistory = [];

        if (window.uiManager) {
            window.uiManager.updateStatus('Gemini conversation cleared');
        }
    }

    refreshContext() {
        return this.buildContext();
    }

    exportConversation() {
        const conversation = {
            timestamp: new Date(),
            history: this.conversationHistory,
            context: this.buildContext()
        };

        const blob = new Blob([JSON.stringify(conversation, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = 'melodicode-conversation.json';
        a.click();

        URL.revokeObjectURL(url);
    }

    // Quick generation methods
    async generateDrumPattern(style = 'basic') {
        const message = `Generate a ${style} drum pattern using available drum samples (kick, snare, hihat). Make it 4 beats long with proper timing.`;
        return await this.generateResponse(message);
    }

    async generateMelody(key = 'C', scale = 'major') {
        const message = `Create a simple melody in ${key} ${scale} using tone commands. Make it 8 notes long with good rhythm.`;
        return await this.generateResponse(message);
    }

    async generateBassline(key = 'C', style = 'simple') {
        const message = `Generate a ${style} bassline in ${key} using low frequency tones or bass samples. Make it complement a 4/4 rhythm.`;
        return await this.generateResponse(message);
    }

    async generateWithTempo(style, bpm) {
        const message = `Create a ${style} music pattern at ${bpm} BPM. Include the bpm command and appropriate timing for this tempo.`;
        return await this.generateResponse(message);
    }

    async suggestImprovement() {
        const currentCode = window.editor.getValue() || '';
        if (!currentCode.trim()) {
            throw new Error('No code to improve');
        }

        const message = `Analyze my current MelodiCode and suggest improvements for better musicality, structure, or creativity.`;
        return await this.generateResponse(message);
    }

    async explainCode() {
        const currentCode = window.editor.getValue() || '';
        if (!currentCode.trim()) {
            throw new Error('No code to explain');
        }

        const message = `Explain what my current MelodiCode does musically and how it works.`;
        return await this.generateResponse(message);
    }

    getCurrentBPM() {
        if (!window.codeInterpreter) return 120; // default

        try {
            const code = window.editor.getValue() || '';
            window.codeInterpreter.parse(code);
            return window.codeInterpreter.bpm || 120;
        } catch (error) {
            return 120;
        }
    }
}

// Add some CSS for the chat enhancements
const geminiStyles = `
.typing-indicator .message-content {
    padding: 15px;
}

.typing-dots {
    display: flex;
    gap: 4px;
}

.typing-dots span {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: var(--text-secondary);
    animation: typing 1.4s infinite ease-in-out;
}

.typing-dots span:nth-child(1) { animation-delay: -0.32s; }
.typing-dots span:nth-child(2) { animation-delay: -0.16s; }

@keyframes typing {
    0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
    40% { transform: scale(1); opacity: 1; }
}

.code-block {
    margin: 10px 0;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    overflow: hidden;
}

.code-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    background-color: var(--tertiary-bg);
    border-bottom: 1px solid var(--border-color);
    font-size: 12px;
}

.copy-code-btn {
    background: var(--accent-color);
    color: white;
    border: none;
    padding: 4px 8px;
    border-radius: 3px;
    cursor: pointer;
    font-size: 11px;
    transition: background-color 0.2s;
}

.copy-code-btn:hover {
    background: var(--accent-hover);
}

.code-block pre {
    margin: 0;
    padding: 12px;
    background-color: var(--primary-bg);
    overflow-x: auto;
}

.code-block code {
    font-family: var(--font-family-mono);
    font-size: 13px;
    line-height: 1.4;
}

/* Enable text selection in chat */
.selectable-text {
    user-select: text;
    -webkit-user-select: text;
    -moz-user-select: text;
    -ms-user-select: text;
}

.selectable-code {
    user-select: text;
    -webkit-user-select: text;
    -moz-user-select: text;
    -ms-user-select: text;
    white-space: pre-wrap;
}

/* Chat message styling improvements */
.chat-message {
    user-select: text;
    -webkit-user-select: text;
    -moz-user-select: text;
    -ms-user-select: text;
}

.chat-message .message-content {
    position: relative;
}

/* Add copy message button */
.chat-message:hover .copy-message-btn {
    opacity: 1;
}

.copy-message-btn {
    position: absolute;
    top: 5px;
    right: 5px;
    background: var(--secondary-bg);
    border: 1px solid var(--border-color);
    border-radius: 3px;
    padding: 2px 6px;
    font-size: 10px;
    cursor: pointer;
    opacity: 0;
    transition: opacity 0.2s;
}

.copy-message-btn:hover {
    background: var(--tertiary-bg);
}

/* Improve code block selection */
.code-block pre code {
    display: block;
    white-space: pre-wrap;
    word-wrap: break-word;
}
`;

// Inject styles
const styleSheet = document.createElement('style');
styleSheet.textContent = geminiStyles;
document.head.appendChild(styleSheet);

// Initialize Gemini integration
window.geminiIntegration = new GeminiIntegration();
