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

    "Advanced Drum and Bass": `// Complex DnB with multiple elements
bpm 174

set groove 0.9

<amen_kick>
    tone C1 0.08 sine 1.0
    tone C2 0.04 square 0.7
<end>

<amen_snare>
    tone D3 0.12 triangle groove
    tone G3 0.08 square 0.5
    sample snare 0.8 1 0.6
<end>

[complex_break]
    sample amen_kick
    wait 0.25
    sample hihat 1 1 0.4
    wait 0.125
    sample amen_snare
    wait 0.125
    sample hihat 1 1 0.3
    wait 0.125
    sample amen_snare
    wait 0.125
    sample amen_kick
    wait 0.125
    sample amen_snare
    wait 0.125
[end]

[rolling_bass] (filter lowpass 1200 2) (distortion 3)
    for i 1 8
        tone C2 0.125 sawtooth groove
        tone G2 0.125 sawtooth groove
    endfor
[end]

[sub_bass]
    tone C1 1 sine 0.7
    tone F1 0.5 sine 0.7
    tone G1 0.5 sine 0.7
    tone C1 1 sine 0.7
    tone Bb1 1 sine 0.7
[end]

[atmospheric_pad] (reverb 0.7) (chorus 0.8 0.004 0.5)
    tone C4 8 sine 0.25
    tone Eb4 8 sine 0.25
    tone G4 8 sine 0.25
    tone Bb4 8 sine 0.25
[end]

[lead_stab] (delay 0.125 0.4 0.6)
    tone C5 0.25 square 0.8
    wait 0.25
    tone G5 0.25 square 0.8
    wait 0.5
    tone F5 0.25 square 0.8
    wait 0.5
    tone Bb5 0.25 square 0.8
    wait 0.25
[end]

[breakdown] (filter highpass 400 2)
    tone C3 2 sawtooth 0.6
    wait 2
[end]

[drop_section]
    sidechain atmospheric_pad complex_break 0.6
    play rolling_bass sub_bass lead_stab
[end]

[main]
    playasync atmospheric_pad
    loop 2 complex_break
    loop 2 drop_section
    play breakdown
    loop 4 drop_section
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