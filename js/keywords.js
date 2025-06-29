window.melodicodeKeywords = {
    main_block: {
        description: "Define the main block of commands.",
        usage: "[main]\n    ...commands...\n[end]\n\nplay main",
        params: [
            { name: "blockName", desc: "Name of the main block" },
            { name: "commands", desc: "Commands to execute in the main block" }
        ]
    },
    custom_block: {
        description: "Define a custom block of commands.",
        usage: "[--blockName--]\n    ...commands...\n[end]",
        params: [
            { name: "blockName", desc: "Name of the custom block" },
            { name: "commands", desc: "Commands to execute in the block" }
        ]
    },
    custom_sample: {
        description: "Define a custom sample block. Sample blocks play all at once when triggered. Like normal blocks, but contain inside <> instead of []",
        usage: "(<--sampleName-->\n    ...commands...\n<--end-->)",
        params: [
            { name: "sampleName", desc: "Name of the custom sample" },
            { name: "commands", desc: "Commands to generate the sample" }
        ]
    },
    sample: {
        description: "Play a built-in or imported sample.",
        usage: "sample <name> [pitch] [timescale] [volume] [pan]",
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
        usage: "tone <frequency|note> [duration] [wavetype] [volume] [pan]",
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
        usage: "slide <startNote> <endNote> <duration> [wavetype] [volume] [pan]",
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
    wait: {
        description: "Pause for a given duration.",
        usage: "wait <duration>",
        params: [
            { name: "duration", desc: "Time to wait in seconds" }
        ]
    },
    play: {
        description: "Play one or more blocks simultaneously.",
        usage: "play <block1> [block2...] [parameters...]",
        params: [
            { name: "block1", desc: "Block name" },
            { name: "parameters", desc: "volume=0.8, pan=0, etc." }
        ]
    },
    loop: {
        description: "Repeat a block a number of times.",
        usage: "loop <count> <block_name>",
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
    }
    // Add more as needed
};