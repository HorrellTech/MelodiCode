const melodicodeExamples = {
    "Simple Beat": `// Simple drum beat example
bpm 120

[drums]
    sample kick
    wait 0.5
    sample snare
    wait 0.5
[end]

[main]
    loop 4 drums
[end]

play main`,

    "Melody with Chords": `// Melody and chord progression
bpm 130

[melody]
    tone C4 0.5 sine 0.7
    tone E4 0.5 sine 0.7
    tone G4 0.5 sine 0.7
    tone C5 1 sine 0.7
    wait 0.5
[end]

[chords]
    tone C3 2 sawtooth 0.5
    tone E3 2 sawtooth 0.5
    tone G3 2 sawtooth 0.5
[end]

[main]
    play melody chords
    wait 2
    play melody chords
[end]

play main`,

    "Sidechain Example": `// Sidechain compression demo
bpm 128

[bass]
    tone C2 4 sawtooth 0.8
[end]

[kick]
    sample kick
    wait 1
[end]

[main]
    sidechain bass kick 0.7
[end]

play main`,

    "Pattern Beat": `// Using patterns for drum programming
bpm 140

[drums]
    pattern kick "1-0-1-0-1-0-1-0-"
    pattern snare "0-0-1-0-0-0-1-0-"
    pattern hihat "1-1-1-1-1-1-1-1-"
[end]

[main]
    loop 8 drums
[end]

play main`,

    "Slide Effects": `// Pitch slides and effects
bpm 120

[lead]
    slide C4 G4 1 sawtooth 0.8
    wait 0.5
    slide G4 C5 1 sawtooth 0.8
    wait 0.5
    slide C5 C4 2 sawtooth 0.8
[end]

[bass]
    tone C2 4 sine 0.6
[end]

[main]
    play lead bass
[end]

play main`,

    "Text-to-Speech Song": `// Song with vocals using TTS
bpm 120

[intro]
    tts "Welcome to my song" 1 1 0
    wait 3
[end]

[verse]
    tts "Making music with code" 1.2 0.9 1
    wait 2
    sample kick
    wait 0.5
    sample snare
    wait 0.5
[end]

[main]
    play intro
    loop 2 verse
[end]

play main`,

    "Custom Samples": `// Creating custom sample blocks
bpm 130

<kick_drum>
    tone C2 0.2 sine 0.9
    tone C3 0.1 square 0.4
<end>

<snare_drum>
    tone D3 0.15 triangle 0.7
    tone G3 0.1 square 0.3
    tone A3 0.05 sawtooth 0.2
<end>

[beat]
    sample kick_drum
    wait 0.5
    sample snare_drum
    wait 0.5
[end]

[main]
    loop 8 beat
[end]

play main`,

    "Effects Demo": `// Block effects demonstration
bpm 120

[clean_melody]
    tone C4 0.5 sine 0.7
    tone E4 0.5 sine 0.7
    tone G4 1 sine 0.7
[end]

[reverb_melody] (reverb 0.6)
    tone C5 0.5 sine 0.6
    tone E5 0.5 sine 0.6
    tone G5 1 sine 0.6
[end]

[distorted_bass] (distortion 8) (filter lowpass 400 2)
    tone C2 2 sawtooth 0.8
[end]

[main]
    play clean_melody
    wait 2
    play reverb_melody distorted_bass
[end]

play main`,

    "Complex Arrangement": `// Multi-section song structure
bpm 128

set volume 0.8

[kick_pattern]
    pattern kick "1-0-1-0-1-0-1-0-"
[end]

[snare_pattern]
    pattern snare "0-0-1-0-0-0-1-0-"
[end]

[hihat_pattern]
    pattern hihat "1-1-0-1-1-1-0-1-"
[end]

[drums]
    play kick_pattern snare_pattern hihat_pattern
[end]

[bass_line]
    tone C2 0.5 sawtooth volume
    tone C2 0.25 sawtooth volume
    tone G2 0.25 sawtooth volume
    tone F2 0.5 sawtooth volume
    wait 0.5
[end]

[melody] (delay 0.3 0.2 0.3)
    tone C4 0.25 square volume
    tone E4 0.25 square volume
    tone G4 0.5 square volume
    tone A4 0.25 square volume
    tone G4 0.25 square volume
    tone E4 0.5 square volume
[end]

[verse]
    play drums bass_line
[end]

[chorus]
    play drums bass_line melody
[end]

[main]
    loop 2 verse
    loop 2 chorus
    loop 2 verse
    loop 4 chorus
[end]

play main`,

    "Experimental Sounds": `// Experimental electronic sounds
bpm 90

[ambient_pad] (reverb 0.8) (chorus 0.5 0.003 0.4)
    tone C3 8 sine 0.3
    tone E3 8 sine 0.3
    tone G3 8 sine 0.3
[end]

[glitch_sequence]
    for i 1 16
        tone 200 0.05 square 0.5
        tone 400 0.05 sawtooth 0.3
        wait 0.05
    endfor
[end]

[bass_wobble]
    slide C1 C2 2 sawtooth 0.7
    slide C2 C1 2 sawtooth 0.7
[end]

[main]
    playasync ambient_pad
    wait 2
    play glitch_sequence bass_wobble
    wait 4
    play glitch_sequence
[end]

play main`,
"Happy Birthday Basic": `// Basic Happy Birthday melody
bpm 120

[birthday_melody]
    tone C4 0.75 sine 0.8
    tone C4 0.25 sine 0.8
    tone D4 1 sine 0.8
    tone C4 1 sine 0.8
    tone F4 1 sine 0.8
    tone E4 2 sine 0.8
    wait 0.5
    
    tone C4 0.75 sine 0.8
    tone C4 0.25 sine 0.8
    tone D4 1 sine 0.8
    tone C4 1 sine 0.8
    tone G4 1 sine 0.8
    tone F4 2 sine 0.8
    wait 0.5
    
    tone C4 0.75 sine 0.8
    tone C4 0.25 sine 0.8
    tone C5 1 sine 0.8
    tone A4 1 sine 0.8
    tone F4 1 sine 0.8
    tone E4 1 sine 0.8
    tone D4 1 sine 0.8
    wait 0.5
    
    tone Bb4 0.75 sine 0.8
    tone Bb4 0.25 sine 0.8
    tone A4 1 sine 0.8
    tone F4 1 sine 0.8
    tone G4 1 sine 0.8
    tone F4 2 sine 0.8
[end]

[main]
    play birthday_melody
[end]

play main`,

    "Happy Birthday Party": `// Happy Birthday with full arrangement
bpm 110

[birthday_melody] (reverb 0.3)
    tone C4 0.75 sine 0.7
    tone C4 0.25 sine 0.7
    tone D4 1 sine 0.7
    tone C4 1 sine 0.7
    tone F4 1 sine 0.7
    tone E4 2 sine 0.7
    wait 0.5
    
    tone C4 0.75 sine 0.7
    tone C4 0.25 sine 0.7
    tone D4 1 sine 0.7
    tone C4 1 sine 0.7
    tone G4 1 sine 0.7
    tone F4 2 sine 0.7
    wait 0.5
    
    tone C4 0.75 sine 0.7
    tone C4 0.25 sine 0.7
    tone C5 1 sine 0.7
    tone A4 1 sine 0.7
    tone F4 1 sine 0.7
    tone E4 1 sine 0.7
    tone D4 1 sine 0.7
    wait 0.5
    
    tone Bb4 0.75 sine 0.7
    tone Bb4 0.25 sine 0.7
    tone A4 1 sine 0.7
    tone F4 1 sine 0.7
    tone G4 1 sine 0.7
    tone F4 2 sine 0.7
[end]

[drums]
    pattern kick "1-0-0-0-1-0-0-0-"
    pattern snare "0-0-1-0-0-0-1-0-"
    pattern hihat "1-1-1-1-1-1-1-1-"
[end]

[bass_line]
    tone F2 1 sawtooth 0.6
    tone F2 1 sawtooth 0.6
    tone Bb2 1 sawtooth 0.6
    tone F2 1 sawtooth 0.6
    tone C3 1 sawtooth 0.6
    tone Bb2 2 sawtooth 0.6
    wait 0.5
[end]

[finale]
    sample crash
    tone F4 4 triangle 0.9
    tone A4 4 triangle 0.9
    tone C5 4 triangle 0.9
[end]

[main]
    tts "Happy Birthday to you" 1 1 0
    wait 3
    loop 4 drums
    play birthday_melody bass_line drums
    wait 1
    play finale
[end]

play main`,

    "Simple Dubstep": `// Basic dubstep track
bpm 140

[dubstep_kick]
    sample kick 1 1 0.9
    wait 1
    sample kick 1 1 0.9
    wait 1
[end]

[snare_pattern]
    wait 1
    sample snare 1 1 0.8
    wait 1
    sample snare 1 1 0.8
[end]

[wobble_bass] (filter lowpass 800 3) (distortion 4)
    slide C2 G2 0.25 sawtooth 0.8
    slide G2 C2 0.25 sawtooth 0.8
    slide C2 F2 0.25 sawtooth 0.8
    slide F2 C2 0.25 sawtooth 0.8
[end]

[buildup]
    for i 1 8
        tone 200 0.125 square 0.6
        wait 0.125
    endfor
[end]

[drop]
    tts "Drop it" 1.5 0.8 0
    play dubstep_kick snare_pattern wobble_bass
[end]

[main]
    play buildup
    loop 4 drop
[end]

play main`,

    "Advanced Dubstep": `// Complex dubstep with sidechain and effects
bpm 140

set energy 0.8

<dubstep_kick>
    tone C1 0.1 sine 1.0
    tone C2 0.05 square 0.6
<end>

[kick_pattern]
    sample dubstep_kick
    wait 0.5
    sample dubstep_kick
    wait 0.5
    sample dubstep_kick
    wait 1
[end]

[snare_clap]
    sample snare 1 1 energy
    sample clap 1 1 0.4
    wait 2
[end]

[wobble_bass] (filter lowpass 600 4) (distortion 6)
    slide C2 G2 0.125 sawtooth energy
    slide G2 C3 0.125 sawtooth energy
    slide C3 F2 0.125 sawtooth energy
    slide F2 C2 0.125 sawtooth energy
    slide C2 Bb2 0.125 sawtooth energy
    slide Bb2 F2 0.125 sawtooth energy
    slide F2 G2 0.125 sawtooth energy
    slide G2 C2 0.125 sawtooth energy
[end]

[lead_synth] (delay 0.25 0.3 0.4) (reverb 0.3)
    tone C5 0.25 square 0.6
    tone G5 0.25 square 0.6
    tone F5 0.5 square 0.6
    tone C5 0.5 square 0.6
    wait 0.5
[end]

[buildup] (filter highpass 100 1)
    for i 1 16
        tone 100 0.0625 square 0.5
        tone 200 0.0625 sawtooth 0.3
        wait 0.125
    endfor
    tts "Here we go" 1.8 0.7 1
[end]

[drop_section]
    sidechain wobble_bass kick_pattern 0.8
    playasync lead_synth
    play snare_clap
[end]

[breakdown] (reverb 0.6)
    tone C4 2 sine 0.4
    tone E4 2 sine 0.4
    tone G4 2 sine 0.4
    wait 2
[end]

[main]
    play buildup
    loop 2 drop_section
    play breakdown
    loop 4 drop_section
[end]

play main`,

    "Simple Drum and Bass": `// Basic DnB track
bpm 174

[amen_break]
    pattern kick "1-0-0-0-0-0-1-0-"
    pattern snare "0-0-1-0-1-1-0-1-"
    pattern hihat "1-1-0-1-1-0-1-0-"
[end]

[bass_line]
    tone C2 0.5 sawtooth 0.8
    tone G2 0.25 sawtooth 0.8
    tone F2 0.25 sawtooth 0.8
    tone C2 0.5 sawtooth 0.8
    tone Bb2 0.5 sawtooth 0.8
[end]

[pad] (reverb 0.4)
    tone C4 4 sine 0.3
    tone E4 4 sine 0.3
    tone G4 4 sine 0.3
[end]

[main]
    playasync pad
    loop 8 amen_break
    play amen_break bass_line
[end]

play main`,

    "Advanced Drop Song": `// Complex DnB with multiple elements
bpm 86

// ===== CUSTOM SAMPLES =====

<tight_kick>
    tone C1 0.08 sine 1.0
    tone C2 0.04 square 0.6
    tone A1 0.02 triangle 0.4
<end>

<crisp_snare>
    tone D3 0.05 triangle 0.8
    tone G3 0.03 square 0.5
    tone A4 0.02 sawtooth 0.3
<end>

<rolling_snare>
    tone D3 0.03 triangle 0.6
    tone F3 0.02 square 0.4
<end>

<sub_kick>
    tone C0 0.12 sine 0.9
    tone C1 0.06 sawtooth 0.5
<end>

// ===== ATMOSPHERIC ELEMENTS =====

[intro_pad] (reverb 0.7) (filter lowpass 800 1.5)
    tone C3 8 sine 0.3
    tone E3 8 sine 0.25
    tone G3 8 sine 0.2
[end]

[dark_pad] (reverb 0.6) (filter lowpass 600 2) (chorus 0.5 0.003 0.4)
    tone A2 4 sawtooth 0.4
    tone C3 4 sawtooth 0.35
    tone E3 4 sawtooth 0.3
[end]

// ===== BASS SEQUENCES =====

[main_bass] (filter lowpass 1200 1.8) (distortion 3)
    // Rolling bassline pattern
    tone C2 0.125 sawtooth 0.85
    tone C2 0.125 sawtooth 0.7
    slide C2 G2 0.25 sawtooth 0.8
    tone F2 0.125 sawtooth 0.75
    tone C2 0.125 sawtooth 0.8
    slide C2 A2 0.25 sawtooth 0.85
    
    tone D2 0.125 sawtooth 0.8
    tone D2 0.125 sawtooth 0.65
    slide D2 F2 0.25 sawtooth 0.75
    tone C2 0.125 sawtooth 0.8
    tone C2 0.125 sawtooth 0.7
    slide C2 G2 0.25 sawtooth 0.85
[end]

[bass_drop] (filter lowpass 1000 2.5) (distortion 5)
    // Heavy drop bassline
    tone C1 0.25 sawtooth 0.95
    wait 0.125
    tone C2 0.125 sawtooth 0.8
    slide C2 G2 0.5 sawtooth 0.9
    
    tone F1 0.25 sawtooth 0.9
    wait 0.125
    tone F2 0.125 sawtooth 0.75
    slide F2 C3 0.5 sawtooth 0.85
[end]

[sub_bass] (filter lowpass 200 1)
    tone C1 2 sine 0.7
    tone F1 2 sine 0.65
[end]

// ===== DRUM PATTERNS =====

[intro_drums]
    sample tight_kick
    wait 1
    sample crisp_snare
    wait 1
[end]

[buildup_drums]
    pattern tight_kick "1-0-0-0-1-0-0-0-"
    pattern crisp_snare "0-0-1-0-0-0-1-0-"
    pattern rolling_snare "0-0-0-1-0-1-0-1-"
[end]

[complex_break]
    // Signature D&B Amen-style break
    sample tight_kick
    wait 0.25
    sample rolling_snare 1.2 1 0.6
    wait 0.125
    sample rolling_snare 0.8 1 0.4
    wait 0.125
    sample crisp_snare
    wait 0.25
    sample rolling_snare 1.1 1 0.5
    wait 0.125
    sample tight_kick
    wait 0.125
    
    sample rolling_snare 0.9 1 0.6
    wait 0.125
    sample rolling_snare 1.3 1 0.7
    wait 0.125
    sample crisp_snare
    wait 0.25
    sample rolling_snare 0.7 1 0.4
    wait 0.125
    sample rolling_snare 1.1 1 0.6
    wait 0.125
    sample tight_kick
    wait 0.25
[end]

[drop_drums]
    pattern sub_kick "1-0-0-0-1-0-0-0-"
    pattern crisp_snare "0-0-1-0-0-0-1-0-"
    pattern rolling_snare "0-1-0-1-0-1-1-0-"
[end]

// ===== MELODIC ELEMENTS =====

[pluck_melody] (filter highpass 300 1) (delay 0.125 0.3 0.2)
    tone C5 0.125 square 0.6
    wait 0.125
    tone E5 0.125 square 0.5
    wait 0.125
    tone G5 0.25 square 0.7
    wait 0.25
    tone F5 0.125 square 0.6
    wait 0.125
    tone D5 0.25 square 0.8
    wait 0.5
    
    tone A4 0.125 square 0.6
    wait 0.125
    tone C5 0.125 square 0.7
    wait 0.125
    tone E5 0.25 square 0.8
    wait 0.25
    slide E5 C5 0.5 square 0.6
    wait 0.25
[end]

[stab_chord] (filter bandpass 800 3) (reverb 0.3)
    tone C4 0.125 sawtooth 0.8
    tone E4 0.125 sawtooth 0.7
    tone G4 0.125 sawtooth 0.6
[end]

// ===== EFFECTS & SWEEPS =====

[noise_sweep] (filter highpass 2000 0.5) (reverb 0.8)
    tone A6 2 triangle 0.3 -0.5
    slide A6 A3 2 triangle 0.4 0.5
[end]

[reverse_cymbal] (reverb 0.9) (delay 0.0625 0.6 0.4)
    tone A5 1 triangle 0.4
    slide A5 A2 1 triangle 0.2
[end]

// ===== SONG STRUCTURE =====

[intro]
    play intro_pad
    wait 4
    play intro_drums
    wait 4
[end]

[buildup]
    for i 1 2
        sidechain intro_pad buildup_drums 0.3
        play pluck_melody
        wait 2
    endfor
    
    play noise_sweep
    wait 2
[end]

[first_drop]
    sidechain dark_pad drop_drums 0.7
    sidechain sub_bass drop_drums 0.5
    
    for i 1 4
        play complex_break bass_drop
        wait 0.5
        play stab_chord
        wait 1.5
    endfor
[end]

[breakdown]
    play dark_pad
    wait 2
    play pluck_melody
    wait 2
    play reverse_cymbal
    wait 2
[end]

[second_drop]
    sidechain dark_pad drop_drums 0.8
    sidechain main_bass drop_drums 0.6
    
    for i 1 6
        play complex_break main_bass
        if i == 3
            play stab_chord
        endif
        if i == 5
            play pluck_melody
        endif
        wait 2
    endfor
[end]

[outro]
    sidechain intro_pad intro_drums 0.4
    play pluck_melody
    wait 4
    
    play outro_filtered
    wait 4
[end]
    
// Fade with filtered elements
[outro_filtered] (filter lowpass 400 1) (reverb 0.8)
    tone C3 4 sine 0.2
    tone E3 4 sine 0.15
[end]

// ===== MAIN ARRANGEMENT =====

[main]
    tts "Liquid vibes incoming" 1.2 0.8 0
    wait 2
    
    play intro
    play buildup
    
    tts "Drop it" 1.5 1.2 1
    wait .25
    
    play first_drop
    play breakdown
    play second_drop
    play outro
[end]

play main`,

    "90s House Classic": `// Classic 90s house track
bpm 128

[four_on_floor]
    pattern kick "1-0-0-0-1-0-0-0-1-0-0-0-1-0-0-0-"
    pattern hihat "0-0-1-0-0-0-1-0-0-0-1-0-0-0-1-0-"
    pattern openhat "0-0-0-0-0-0-0-0-1-0-0-0-0-0-0-0-"
[end]

[piano_stabs] (reverb 0.3)
    tone C4 0.125 square 0.7
    tone E4 0.125 square 0.7
    tone G4 0.125 square 0.7
    wait 1.625
    tone F4 0.125 square 0.7
    tone A4 0.125 square 0.7
    tone C5 0.125 square 0.7
    wait 1.625
[end]

[bass_line] (filter lowpass 800 1)
    tone C2 0.5 sawtooth 0.8
    wait 0.5
    tone C2 0.25 sawtooth 0.8
    wait 0.25
    tone G2 0.5 sawtooth 0.8
    wait 0.5
    tone F2 0.5 sawtooth 0.8
    wait 0.5
[end]

[vocal_sample]
    tts "Music is the answer" 1.2 1.1 0
    wait 4
[end]

[main]
    play vocal_sample
    loop 2 four_on_floor
    play four_on_floor bass_line
    loop 2 four_on_floor bass_line piano_stabs
[end]

play main`,

    "Ambient Meditation": `// Peaceful ambient soundscape
bpm 60

[drone_pad] (reverb 0.8) (chorus 1.2 0.005 0.6)
    tone C3 16 sine 0.2
    tone E3 16 sine 0.2
    tone G3 16 sine 0.2
[end]

[gentle_bells] (delay 0.5 0.3 0.7) (reverb 0.9)
    tone C5 2 triangle 0.3
    wait 2
    tone E5 2 triangle 0.3
    wait 2
    tone G5 2 triangle 0.3
    wait 2
    tone C6 2 triangle 0.3
    wait 2
[end]

[nature_sounds]
    tts "Breathe in" 0.8 0.9 0
    wait 4
    tts "Breathe out" 0.8 0.9 0
    wait 4
[end]

[water_drops]
    for i 1 8
        tone 800 0.1 sine 0.2
        wait 1.9
    endfor
[end]

[main]
    playasync drone_pad
    play gentle_bells nature_sounds water_drops
[end]

play main`
};

// Make examples available globally
window.melodicodeExamples = melodicodeExamples;