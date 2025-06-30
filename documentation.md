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