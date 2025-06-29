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
        // Highlight [block] and <block>
        { regex: /(\[[^\]]+\]|<[^>]+>)/, token: "block" },

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

        // Highlight tones (notes like c4, a#3, g#5, etc.)
        {
            // Matches: C4, c4, A#3, g#5, etc.
            regex: /\b([a-gA-G])(#|b)?[0-8]\b/,
            token: "tone"
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
        { regex: /[+\-*/=!]+/, token: "operator" },

        // Brackets and punctuation
        { regex: /[\[\]{}();,.\<>]/, token: "bracket" }
    ],
    meta: {
        lineComment: "//"
    }
});

function setupEditor(callback) {
    editor = CodeMirror(document.getElementById('codeEditor'), {
        value: `// MelodiCode Example
// This is a simple song structure using MelodiCode syntax
// It shows tone generation, slides, samples, and a basic song structure

bpm 140 // Set the tempo to 140 beats per minute

<bass_drum> // Define a custom bass drum sample
    tone c2 0.2 sine 0.8 // A low sine wave
    tone c3 0.1 square 0.3 // A higher square wave for attack
<end>

<snare_drum> // Define a custom snare drum sample
    tone d3 0.1 triangle 0.5 // A mid-range triangle wave
    tone g3 0.05 square 0.2 // A higher square wave for snap
    tone a3 0.05 sawtooth 0.3 // A sawtooth wave for body
<end>

[intro_melody] // Block for the intro melody
    tone c4 0.5 sine 0.7 // C4 for half a beat, sine wave
    tone d4 0.5 sine 0.7 // D4 for half a beat, sine wave
    tone e4 0.5 sine 0.7 // E4 for half a beat, sine wave
    tone g4 0.5 sine 0.7 // G4 for half a beat, sine wave
[end]

[verse_melody] // Block for the verse melody
    tone g4 0.5 sine 0.6 // G4 for half a beat, sine wave
    slide g4 a4 0.25 sine 0.6 // Slide from G4 to A4
    tone b4 0.5 sine 0.6 // B4 for half a beat, sine wave
    tone g4 0.25 sine 0.6 // G4 for a quarter of a beat, sine wave
    tone e4 0.5 sine 0.6 // E4 for half a beat, sine wave
    slide e4 f4 0.25 sine 0.6 // Slide from E4 to F4
    tone g4 0.5 sine 0.6 // G4 for half a beat, sine wave
    wait 0.25 // Rest for a quarter of a beat
[end]

[chorus_melody] // Block for the chorus melody
    tone c5 0.5 sawtooth 0.8 // C5 for half a beat, sawtooth wave
    tone g4 0.5 sawtooth 0.8 // G4 for half a beat, sawtooth wave
    tone a4 0.5 sawtooth 0.8 // A4 for half a beat, sawtooth wave
    slide a4 g4 0.5 sawtooth 0.8 // Slide from A4 to G4
    tone f4 0.5 sawtooth 0.8 // F4 for half a beat, sawtooth wave
    tone g4 0.5 sawtooth 0.8 // G4 for half a beat, sawtooth wave
[end]

[drums] // Block for the basic drum beat
    sample bass_drum // Play the bass drum sample
    wait 0.5 // Wait for half a beat
    sample snare_drum // Play the snare drum sample
    wait 0.5 // Wait for half a beat
[end]

[main] // Main block to orchestrate the song
    play intro_melody // Play the intro melody once
    loop 4 verse_melody drums // Loop the verse melody and drums 4 times
    loop 2 chorus_melody drums // Loop the chorus melody and drums 2 times
    loop 4 verse_melody drums // Loop the verse melody and drums 4 times
    play chorus_melody // Play the chorus melody once more
[end]

play main // Start the song
        `,
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