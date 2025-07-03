<!-- YOUTUBE_VIDEO: eSzeYRZbuXw -->
# MelodiCode Programming Guide

MelodiCode lets you create music using a simple, block-based code language. This guide covers everything from basic syntax to advanced features like slides, effects, and multi-block arrangements.

---

## 📦 Block Structure

Blocks group related commands. Each block starts with `[block_name]` and ends with `[end]`. You can define as many blocks as you want.

```melodicode
[melody]
    // Your tones, samples etc here to be played one after another
[end]

[main]
    // Your music commands here
    play melody
[end]

play main
```

---

## 🎛️ Sample Block Structure

Sample blocks group related commands to be played all at once. Each sample block starts with `<block_name>` and ends with `<end>`. You can define as many sample blocks as you want.

### NOTE: You can NOT nest blocks inside other blocks at this time!

```melodicode
<kick_hard>
    // Your tones, samples etc here to be played together, generating a unique sample
<end>

[main]
    // Your music commands here
    sample kick_hard
[end]

play main
```

---

## 🎛️ Pattern & Sequence Commands

### **Pattern**

Create rhythmic patterns using simple notation:

```melodicode
pattern <sampleName> <pattern>
```

- Use `1`, `x`, or `X` for hits
- Use `0` or `-` for silence
- Each step is a 16th note

**Example:**
```melodicode
pattern kick "1-0-1-0-"
pattern hihat "x-x-x-x-"
```

---

### **Sequence**

Play different samples in sequence:

```melodicode
sequence <baseName> <sample1> <sample2> ...
```

**Example:**
```melodicode
sequence drums kick snare hihat snare
```

---

## 🔧 Control Flow

### **Variables**

Set and use variables:

```melodicode
set volume 0.8
set note C4
tone note 1 sine volume
```

---

### **Conditional Statements**

Execute commands based on conditions:

```melodicode
if <variable> <operator> <value>
    ...commands...
endif
```

**Operators:** `>`, `<`, `==`, `!=`, `>=`, `<=`

**Example:**
```melodicode
set count 5
if count > 3
    tone C4 1
    wait 1
endif
```

---

### **For Loops**

Repeat commands with a counter:

```melodicode
for <variable> <start> <end>
    ...commands...
endfor
```

**Example:**
```melodicode
for i 1 4
    tone C4 0.5
    wait 0.5
endfor
```

---

## 🎛️ Effects

Apply audio effects to blocks by adding them in parentheses after the block definition. Effects process all audio within that block.

### **Effect Syntax**

```melodicode
[block_name] (effect_type param1 param2...)
    // Block commands here
[end]
```

You can chain multiple effects:

```melodicode
[block_name] (reverb 0.4) (delay 0.3 0.2 0.3)
    // Block commands here
[end]
```

### **Available Effects**

**Reverb:**
```melodicode
[melody] (reverb <wetAmount>)
    tone C4 1 sine 0.8
[end]
```
- `wetAmount`: Reverb intensity (0-1, default: 0.3)

**Delay:**
```melodicode
[melody] (delay <delayTime> <feedback> <wetAmount>)
    tone C4 1 sine 0.8
[end]
```
- `delayTime`: Delay time in seconds (default: 0.3)
- `feedback`: Echo feedback amount (0-1, default: 0.3)
- `wetAmount`: Delay mix level (0-1, default: 0.3)

**Filter:**
```melodicode
[melody] (filter <type> <frequency> <Q>)
    tone C4 1 sine 0.8
[end]
```
- `type`: lowpass, highpass, bandpass, notch (default: lowpass)
- `frequency`: Cutoff frequency in Hz (default: 1000)
- `Q`: Filter resonance (default: 1)

**Distortion:**
```melodicode
[melody] (distortion <amount>)
    tone C4 1 sine 0.8
[end]
```
- `amount`: Distortion intensity (default: 10)

**Chorus:**
```melodicode
[melody] (chorus <rate> <depth> <wetAmount>)
    tone C4 1 sine 0.8
[end]
```
- `rate`: LFO rate in Hz (default: 1)
- `depth`: Modulation depth (default: 0.002)
- `wetAmount`: Chorus mix level (0-1, default: 0.3)

### **Effects Example**

```melodicode
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

[filtered_bass] (filter lowpass 400 2) (distortion 5)
    tone C2 2 sawtooth 0.8
[end]

[main]
    play clean_melody
    wait 2
    play reverb_melody filtered_bass
[end]

play main
```

---

## 🚀 Advanced Example: Pattern-based Song

```melodicode
bpm 128

set volume 0.8

[drums]
    pattern kick "1-0-1-0-"
    pattern snare "0-0-1-0-"
    pattern hihat "1-1-1-1-"
[end]

[melody]
    for i 1 4
        tone C4 0.25 sine volume
        tone E4 0.25 sine volume
        tone G4 0.25 sine volume
        wait 0.25
    endfor
[end]

[main]
    if volume > 0.5
        play drums melody
    endif
[end]

play main
```

---

## 🎵 Basic Commands

### 1. **Sample Playback**

Play built-in or custom samples (drums, percussion, etc.):

```melodicode
sample <name> [pitch] [timescale] [volume] [pan]
```

- `name`: Sample name (e.g., kick, snare)
- `pitch`: Playback speed (default: 1)
- `timescale`: Time stretch (default: 1)
- `volume`: 0-1 (default: 0.8)
- `pan`: -1 (left) to 1 (right, default: 0)

**Example:**
```melodicode
sample kick 1 1 0.9
wait 0.5
sample snare 1 1 0.7
wait 0.5
```

---

### 2. **Tone Generation**

Generate a tone at a specific note or frequency:

```melodicode
tone <frequency|note> [duration] [waveType] [volume] [pan]
```

- `frequency|note`: e.g., C4, A#3, 440
- `duration`: Beats (default: 1)
- `waveType`: sine, square, sawtooth, triangle (default: sine)
- `volume`: 0-1 (default: 0.8)
- `pan`: -1 to 1 (default: 0)

**Example:**
```melodicode
tone C4 0.5 sine 0.8
wait 0.5
tone E4 0.5 square 0.7
wait 0.5
```

---

### 3. **Slides (Pitch Bends)**

Slide smoothly between two notes:

```melodicode
slide <startNote> <endNote> <duration> [waveType] [volume] [pan]
```

**Example:**
```melodicode
slide G4 C5 1 sawtooth 0.7 0
wait 0.5
```

---

### 4. **Wait (Rest)**

Pause for a number of beats:

```melodicode
wait <duration>
```

---

### 5. **Tempo**

Set the tempo in beats per minute:

```melodicode
bpm <value>
```

---



### 6. **Text-to-Speech**

Generate spoken audio using the browser's built-in text-to-speech:

```melodicode
tts "<text>" [speed] [pitch] [voice_id]
```

- `text`: Text to speak (use quotes for multiple words)
- `speed`: Speech rate 0.1-10 (default: 1, scales with BPM)
- `pitch`: Voice pitch 0-2 (default: 1)
- `voice_id`: Voice index 0-N (default: 0)

**Examples:**
```melodicode
tts "Hello world" 1.2 1.1 0
tts "Drop the beat" 1.5 0.8 1
tts Welcome 0.8 1.2 0  // Single word doesn't need quotes
```

**TTS in Songs:**
```melodicode
bpm 120

[intro]
    tts "Welcome to my song" 1 1 0
    wait 3
    tts "Let the music begin" 1.2 0.9 1
    wait 2
[end]

[main]
    play intro
    sample kick
    tts "Drop it" 1.5 1.2 0
    sample snare
[end]

play main
```

---

## 🧩 Arranging Music

### **Playing Blocks Together**

Use `play` to play singular or multiple blocks at once:

```melodicode
play <block1> [block2...] [parameters...]
```

**Example:**
```melodicode
play drums bass
```

---

### **Loops**

Repeat blocks a number of times:

```melodicode
loop <count> <block1> [block2...]
```

**Example:**
```melodicode
loop 4 verse drums
```

---

### **Custom Samples**

Define your own sample blocks using `<sampleName>` and `<end>`. All commands inside play simultaneously when triggered.

```melodicode
<bass_drum>
    tone C2 0.2 sine 0.8
    tone C3 0.1 square 0.3
<end>
```

Use with:
```melodicode
sample bass_drum
```

---

### 7. **Sidechain Compression**

Create classic sidechain compression effects where one block ducks the volume of another:

```melodicode
sidechain <block1> <block2> <amount>
```

- `block1`: The block that gets ducked (volume reduced)
- `block2`: The trigger block that causes the ducking
- `amount`: Ducking intensity 0-1 (0 = no effect, 1 = full duck)

**How it works:**
- When `block2` plays samples or tones, `block1`'s volume gets temporarily reduced
- Creates the classic "pumping" effect common in electronic music
- `block1` audio is routed through a compressor for realistic ducking

**Examples:**
```melodicode
bpm 128

[bass]
    tone C2 2 sawtooth 0.8
    tone F2 2 sawtooth 0.8
[end]

[kick]
    sample kick
    wait 1
    sample kick
    wait 1
[end]

[main]
    sidechain bass kick 0.7  // Duck bass by 70% when kick hits
[end]

play main
```

**Advanced Sidechain Example:**
```melodicode
bpm 130

[pad] (reverb 0.4)
    tone C4 4 sine 0.6
    tone E4 4 sine 0.6
    tone G4 4 sine 0.6
[end]

[drums]
    pattern kick "1-0-1-0-"
    pattern snare "0-0-1-0-"
[end]

[main]
    sidechain pad drums 0.8  // Heavy sidechain on pad from drums
[end]

play main
```

**Sidechain Tips:**
- Use values between 0.5-0.8 for subtle pumping
- Values above 0.8 create dramatic ducking effects
- Works great with sustained sounds (pads, bass) triggered by percussive elements
- The ducking duration is automatically calculated (about 0.1 seconds)

---

## 🏁 Full Example: Simple Tune

```melodicode
bpm 120

[melody]
    tone C4 0.5
    wait 0.25
    tone E4 0.5
    wait 0.25
    tone G4 1
[end]

play melody
```

---

## 🚀 Advanced Example: Multi-block Song with Slides

```melodicode
bpm 140

<snare_drum>
    tone D3 0.1 triangle 0.5
    tone G3 0.05 square 0.2
    tone A3 0.05 sawtooth 0.3
<end>

[drums]
    sample kick 1 1 0.8
    wait 0.5
    sample snare_drum
    wait 0.5
[end]

[bass]
    tone C2 0.5 sawtooth 0.7
    wait 0.5
    slide C2 G2 0.5 sawtooth 0.7
    wait 0.5
[end]

[lead]
    tone C4 0.25 square 0.8
    slide C4 E4 0.25 square 0.8
    tone G4 0.5 square 0.8
    wait 0.25
[end]

[main]
    play drums bass lead
    loop 2 lead
[end]

play main
```

---

## 📝 Tips

- Use comments (`// ...`) to annotate your code.
- Always define a `[main]` block and end with `play main` for best results.
- Use `bpm` at the top to set your song’s tempo.
- Use `wait` to control rhythm and rests.
- Use `slide` for expressive melodies.
- You can create samples to be used similar to the way you create `[block]` blocks by using `<block>` instead, and it will play all tones within the block simutaniously.

---

For more details, see the in-app documentation or the [README.md](README.md).