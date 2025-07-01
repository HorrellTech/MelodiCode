/*
    * MelodiCode Keywords
    * This file contains the definitions and usage of all MelodiCode keywords.
    * Each keyword has a description, usage example, and parameters.
    * 
    * <> means required, [] means optional.
*/
window.melodicodeKeywords = {
    main_block: {
        description: "Define the main block of commands.",
        usage: "[ main ]\n    ...commands...\n[ end ]\n\nplay main",
        params: [
            { name: "blockName", desc: "Name of the main block" },
            { name: "commands", desc: "Commands to execute in the main block" }
        ]
    },
    custom_block: {
        description: "Define a custom block of commands.",
        usage: "[ blockName ]\n    ...commands...\n[ end ]",
        params: [
            { name: "blockName", desc: "Name of the custom block" },
            { name: "commands", desc: "Commands to execute in the block" }
        ]
    },
    custom_sample: {
        description: "Define a custom sample block. Sample blocks play all at once when triggered. Like normal blocks, but contain inside <> instead of []",
        usage: "(< sampleName >\n    ...commands...\n< end >)",
        params: [
            { name: "sampleName", desc: "Name of the custom sample" },
            { name: "commands", desc: "Commands to generate the sample" }
        ]
    },
    sample: {
        description: "Play a built-in or imported sample.",
        usage: "sample < name > [pitch] [timescale] [volume] [pan]",
        params: [
            { name: "name", desc: "Sample name (kick, snare, etc.)" },
            { name: "pitch", desc: "Playback speed multiplier (default: 1)" },
            { name: "timescale", desc: "Time stretch factor (default: 1)" },
            { name: "volume", desc: "Volume 0-1 (default: 0.8)" },
            { name: "pan", desc: "Stereo position -1 to 1 (default: 0)" }
        ]
    },
    tone: {
        description: "Generate a tone at a given frequency or note.",
        usage: "tone < frequency|note > [duration] [wavetype] [volume] [pan]",
        params: [
            { name: "frequency|note", desc: "Frequency in Hz or note name (C4, A#3, etc.)" },
            { name: "duration", desc: "Length in seconds (default: 1)" },
            { name: "volume", desc: "Volume 0-1 (default: 0.8)" },
            { name: "pan", desc: "Stereo position -1 to 1 (default: 0)" },
            { name: "waveType", desc: "sine, square, sawtooth, triangle (default: sine)" }
        ]
    },
    slide: {
        description: "Slide between two notes over a duration.",
        usage: "slide < startNote > < endNote > [ duration ] [wavetype] [volume] [pan]",
        params: [
            { name: "startNote", desc: "Starting note (C4, A#3, etc.)" },
            { name: "endNote", desc: "Ending note (C4, A#3, etc.)" },
            { name: "duration", desc: "Slide duration in seconds" },
            { name: "volume", desc: "Volume 0-1 (default: 0.8)" },
            { name: "pan", desc: "Stereo position -1 to 1 (default: 0)" },
            { name: "waveType", desc: "sine, square, sawtooth, triangle (default: sine)" }
        ]
    },
    /*sidechain: {
        description: "Apply sidechain compression to a block.",
        usage: "sidechain <block1> <block2> <amount> [volume] [pan]",
        params: [
            { name: "block1", desc: "Block to apply sidechain to" },
            { name: "block2", desc: "Block to use as sidechain trigger" },
            { name: "amount", desc: "Compression amount (0-1)" },
            { name: "volume", desc: "Volume 0-1 (default: 0.8)" },
            { name: "pan", desc: "Stereo position -1 to 1 (default: 0)" }
        ]
    },*/
    pattern: {
        description: "Create a rhythmic pattern using 1/0 or x/- notation.",
        usage: "pattern < sampleName > < pattern >",
        params: [
            { name: "sampleName", desc: "Sample to trigger on pattern hits" },
            { name: "pattern", desc: "Pattern string like '1-0-1-0-' or 'x-x---x-'" }
        ]
    },
    sequence: {
        description: "Sequence different samples as steps.",
        usage: "sequence < baseName > < sample1 > < sample2 > ...",
        params: [
            { name: "baseName", desc: "Base name for the sequence" },
            { name: "samples", desc: "Sample names for each step, use '-' for silence" }
        ]
    },
    if: {
        description: "Conditional execution based on variable comparison.",
        usage: "if < variable > < operator > < value >\n    ...commands...\nendif",
        params: [
            { name: "variable", desc: "Variable name to check" },
            { name: "operator", desc: "Comparison operator: >, <, ==, !=, >=, <=" },
            { name: "value", desc: "Value to compare against" }
        ]
    },
    for: {
        description: "Loop with counter variable.",
        usage: "for < variable > < start > < end >\n    ...commands...\nendfor",
        params: [
            { name: "variable", desc: "Counter variable name" },
            { name: "start", desc: "Starting value" },
            { name: "end", desc: "Ending value (inclusive)" }
        ]
    },
    endif: {
        description: "End an if statement block.",
        usage: "endif",
        params: []
    },
    endfor: {
        description: "End a for loop block.",
        usage: "endfor", 
        params: []
    },
    wait: {
        description: "Pause for a given duration.",
        usage: "wait < duration >",
        params: [
            { name: "duration", desc: "Time to wait in seconds" }
        ]
    },
    play: {
        description: "Play one or more blocks simultaneously.",
        usage: "play < block1 > [ block2... ] [ parameters... ]",
        params: [
            { name: "block1", desc: "Block name" },
            { name: "parameters", desc: "volume=0.8, pan=0, etc." }
        ]
    },
    loop: {
        description: "Repeat a block a number of times.",
        usage: "loop < count > < block_name >",
        params: [
            { name: "count", desc: "Number of repetitions" },
            { name: "block_name", desc: "Block to repeat" }
        ]
    },
    set: {
        description: "Set a variable for reuse.",
        usage: "set <variable> <value>",
        params: [
            { name: "variable", desc: "Variable name" },
            { name: "value", desc: "Value to set" }
        ]
    },
    bpm: {
        description: "Set the tempo in beats per minute.",
        usage: "bpm <value>",
        params: [
            { name: "value", desc: "BPM value (number)" }
        ]
    },

    // Effect keywords
    reverb: {
        description: "Apply reverb effect to a block.",
        usage: "[blockName] (reverb < wetAmount >)",
        params: [
            { name: "wetAmount", desc: "Reverb wet/dry mix amount (0-1, default: 0.3)" }
        ]
    },
    delay: {
        description: "Apply delay effect to a block.",
        usage: "[blockName] (delay < delayTime > < feedback > < wetAmount >)",
        params: [
            { name: "delayTime", desc: "Delay time in seconds (default: 0.3)" },
            { name: "feedback", desc: "Feedback amount (0-1, default: 0.3)" },
            { name: "wetAmount", desc: "Delay wet/dry mix amount (0-1, default: 0.3)" }
        ]
    },
    filter: {
        description: "Apply filter effect to a block.",
        usage: "[blockName] (filter < type > < frequency > < Q >)",
        params: [
            { name: "type", desc: "Filter type: lowpass, highpass, bandpass, notch (default: lowpass)" },
            { name: "frequency", desc: "Cutoff frequency in Hz (default: 1000)" },
            { name: "Q", desc: "Filter Q/resonance (default: 1)" }
        ]
    },
    distortion: {
        description: "Apply distortion effect to a block.",
        usage: "[blockName] (distortion < amount >)",
        params: [
            { name: "amount", desc: "Distortion amount (default: 10)" }
        ]
    },
    chorus: {
        description: "Apply chorus effect to a block.",
        usage: "[blockName] (chorus < rate > < depth > < wetAmount >)",
        params: [
            { name: "rate", desc: "LFO rate in Hz (default: 1)" },
            { name: "depth", desc: "Modulation depth (default: 0.002)" },
            { name: "wetAmount", desc: "Chorus wet/dry mix amount (0-1, default: 0.3)" }
        ]
    },
    tts: {
        description: "Generate text-to-speech audio.",
        usage: 'tts "< text >" [speed] [pitch] [voice_id]',
        params: [
            { name: "text", desc: "Text to speak (use quotes for multiple words)" },
            { name: "speed", desc: "Speech rate (0.1-10, default: 1)" },
            { name: "pitch", desc: "Voice pitch (0-2, default: 1)" },
            { name: "voice_id", desc: "Voice index (0-N, default: 0)" }
        ]
    }
    // Add more as needed
};