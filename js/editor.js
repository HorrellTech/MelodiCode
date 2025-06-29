let editor;

function getCurrentWord(cm) {
    const cursor = cm.getCursor();
    const line = cm.getLine(cursor.line);
    // Get word at cursor
    const start = line.lastIndexOf(' ', cursor.ch - 1) + 1;
    const end = line.indexOf(' ', cursor.ch);
    let word = line.substring(start, end === -1 ? line.length : end);

    // If not found, try first word on the line
    if (!word || !melodicodeKeywords[word]) {
        const firstWord = line.trim().split(/\s+/)[0];
        if (melodicodeKeywords[firstWord]) {
            word = firstWord;
        } else {
            // Try partial match for prediction
            const partial = word || firstWord;
            const match = Object.keys(melodicodeKeywords).find(k => k.startsWith(partial));
            if (match) word = match;
        }
    }
    return word;
}

function showHint(word) {
    const hintPanel = document.getElementById('codeHintPanel');
    const code = window.editor ? window.editor.getValue() : '';
    if (!code.trim()) {
        hintPanel.innerHTML = `<span>Start typing to see MelodiCode hints and suggestions here.</span>`;
        hintPanel.classList.add('empty');
        return;
    }
    const info = melodicodeKeywords[word];
    if (info) {
        hintPanel.innerHTML = `
            <strong>${word}</strong>: ${info.description}<br>
            <code>${info.usage}</code>
            <ul>
                ${info.params.map(p => `<li><b>${p.name}</b>: ${p.desc}</li>`).join('')}
            </ul>
        `;
        hintPanel.classList.remove('empty');
    } else {
        hintPanel.innerHTML = `<span>No hint available for this word.</span>`;
        hintPanel.classList.add('empty');
    }
}

function onCursorActivity(cm) {
    const word = getCurrentWord(cm);
    showHint(word);
}

// Get sample names from audio engine or hardcode as fallback
const sampleNames = (window.audioEngine && window.audioEngine.getBuiltInSampleNames)
    ? window.audioEngine.getBuiltInSampleNames()
    : [
        'kick', 'snare', 'hihat', 'hihat_open', 'crash', 'ride',
        'tom_high', 'tom_mid', 'tom_low', 'clap', 'triangle',
        'bass_low', 'bass_mid', 'bass_high', 'sub_bass', 'bass_pluck',
        'lead_1', 'lead_2', 'lead_bright', 'lead_soft',
        'pad_1', 'pad_warm', 'pad_strings', 'pad_choir',
        'shaker', 'tambourine', 'cowbell', 'woodblock',
        'whoosh', 'zap', 'drop', 'rise'
    ];
const sampleRegex = new RegExp("\\b(" + sampleNames.join("|") + ")\\b", "i");

function getDefinedBlocks() {
    // Use codeInterpreter to get current block names
    if (window.codeInterpreter && window.editor) {
        window.codeInterpreter.parse(window.editor.getValue());
        return Array.from(window.codeInterpreter.blocks.keys());
    }
    return [];
}

CodeMirror.defineSimpleMode("melodicode", {
    start: [
        // Highlight [block] and [end]
        { regex: /\[[^\]]+\]/, token: "block" },

        // Highlight keywords
        {
            regex: new RegExp("\\b(" + Object.keys(melodicodeKeywords).join("|") + ")\\b"),
            token: "keyword"
        },

        // Highlight sample names (with underscores)
        {
            regex: sampleRegex,
            token: "sample"
        },

        // Highlight block references (e.g. play main)
        {
            regex: /\b(play|loop|effect)\s+([a-zA-Z0-9_]+)/,
            token: function(stream) {
                // Extract block name after command
                const match = stream.match(/\b(play|loop|effect)\s+([a-zA-Z0-9_]+)/, false);
                if (match) {
                    const definedBlocks = getDefinedBlocks();
                    // Move stream to after command
                    stream.match(/\b(play|loop|effect)\s+/, true);
                    const blockName = stream.match(/[a-zA-Z0-9_]+/, true);
                    if (blockName && definedBlocks.includes(blockName[0])) {
                        return ["keyword", "block"];
                    } else {
                        return ["keyword", null];
                    }
                }
                stream.next();
                return null;
            }
        },

        // Highlight numbers only if not attached to a word (not part of e.g. C4)
        {
            regex: /(?<![a-zA-Z_])\b\d+(\.\d+)?\b(?![a-zA-Z_])/,
            token: "number"
        },

        // Strings
        { regex: /"(?:[^\\]|\\.)*?"/, token: "string" },

        // Comments
        { regex: /\/\/.*/, token: "comment" },

        // Operators
        { regex: /[+\-*/=<>!]+/, token: "operator" },

        // Brackets and punctuation
        { regex: /[\[\]{}();,.]/, token: "bracket" }
    ],
    meta: {
        lineComment: "//"
    }
});

function setupEditor(callback) {
    editor = CodeMirror(document.getElementById('codeEditor'), {
        value: '',
        mode: 'melodicode',
        lineNumbers: true,
        theme: 'material-darker',
        scrollbarStyle: 'native'
    });
    window.editor = editor;

    editor.on('cursorActivity', onCursorActivity);

    editor.on('change', () => {
        if (window.uiManager && typeof window.uiManager.updateBlockInspector === 'function') {
            window.uiManager.updateBlockInspector();
        }
    });

    if (typeof callback === 'function') callback();
}

window.setupEditor = setupEditor;

//window.addEventListener('DOMContentLoaded', setupEditor);