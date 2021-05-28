import * as Tone from 'tone'

const WALLET_ADDRESS = '0x963CFC0Bfb272BA9512621a677A31884c5c2A4DB' // Vijay's Metamask wallet
const DEFAULT_BPM = 60
const DEFAULT_SEQUENCE = ['*', '*', '*', '*']

const casioKeys = new Tone.Players({
    urls: {
        0: "A1.mp3",
        1: "Cs2.mp3",
        2: "E2.mp3",
        3: "Fs2.mp3",
    },
    fadeOut: "64n",
    baseUrl: "https://tonejs.github.io/audio/casio/"
}).toDestination()

const salamanderKeys = new Tone.Sampler({
	urls: {
		"C1": "C1.mp3",
		"C2": "C2.mp3",
		"C3": "C3.mp3",
		"C4": "C4.mp3",
		"D#4": "Ds4.mp3",
		"F#4": "Fs4.mp3",
		"A4": "A4.mp3",
	},
    volume: -5,
	release: 1,
	baseUrl: "https://tonejs.github.io/audio/salamander/",
}).toDestination();

const drumCompress = new Tone.Compressor({
    threshold: -30,
    ratio: 10,
    attack: 0.01,
    release: 0.2
}).toDestination();

const distortion = new Tone.Distortion({
    distortion: 0.4,
    wet: 0.4
});

const snare = new Tone.Player({
    url: "https://tonejs.github.io/audio/drum-samples/CR78/snare.mp3",
    volume: -20,
    fadeOut: 0.1
}).chain(distortion, drumCompress);

const hats = new Tone.Player({
    url: "https://tonejs.github.io/audio/drum-samples/CR78/hihat.mp3",
    volume: -10,
    fadeOut: 0.01
}).chain(distortion, drumCompress);

const kick = new Tone.MembraneSynth({
    pitchDecay: 0.02,
    octaves: 6,
    oscillator: {
        type: "square4"
    },
    envelope: {
        attack: 0.001,
        decay: 0.2,
        sustain: 0
    },
    volume: -10,
}).connect(drumCompress);

const bass = new Tone.FMSynth({
    harmonicity: 1,
    modulationIndex: 3.5,
    oscillator: {
        type: "custom",
        partials: [0, 1, 0, 2]
    },
    envelope: {
        attack: 0.08,
        decay: 0.3,
        sustain: 0,
    },
    modulation: {
        type: "square"
    },
    modulationEnvelope: {
        attack: 0.1,
        decay: 0.2,
        sustain: 0.3,
        release: 0.01
    },
}).toDestination();
const monoBass = new Tone.MonoSynth({
    volume: -10,
    envelope: {
        attack: 0.1,
        decay: 0.3,
        release: 2,
    },
    filterEnvelope: {
        attack: 0.001,
        decay: 0.01,
        sustain: 0.5,
        baseFrequency: 200,
        octaves: 2.6
    }
}).toDestination();

/*
An ethereum address has 40 characters that can be a hex value (0-9 + abcdef)

We want to generate a looping bar of "music"

That's 5 groups of 8 characters
Then the 5 groups can set the parameters for the kick, snare, hihat, keys, bass

So the kick group has parameters set by 8 hex characters


*/

const segmentDrumChars = (char) => {
    switch (char) {
        case '0':
        case '1':
        case '2':
        case '3':
            return ['-', '-'];
        case '4':
        case '5':
        case '6':
        case '7':
            return ['*', '-'];
        case '8':
        case '9':
        case 'a':
        case 'b':
            return ['-', '*'];
        case 'c':
        case 'd':
        case 'e':
        case 'f':
            return ['*', '*'];
        default:
            return -1;
    }
}

const segmentKeyChars = (char) => {
    switch (char) {
        case '0':
        case '1':
            return ['', ''];
        case '2':
            return ['C3', ''];
        case '3':
            return ['D3', ''];
        case '4':
            return ['E3', ''];
        case '5':
            return ['F3', ''];
        case '6':
            return ['G3', ''];
        case '7':
            return ['A3', ''];
        case '8':
            return ['', 'C3'];
        case '9':
            return ['', 'D3'];
        case 'a':
            return ['', 'E3'];
        case 'b':
            return ['', 'F3'];
        case 'c':
            return ['G3', 'C3'];
        case 'd':
            return ['A3', 'D3'];
        case 'e':
            return ['B3', 'E3'];
        case 'f':
            return ['C4', 'F3'];
        default:
            return -1;
    }
}

const segmentBassChars = (char) => {
    switch (char) {
        case '0':
        case '1':
            return ['', ''];
        case '2':
            return ['C1', ''];
        case '3':
            return ['D1', ''];
        case '4':
            return ['E1', ''];
        case '5':
            return ['F1', ''];
        case '6':
            return ['G1', ''];
        case '7':
            return ['A1', ''];
        case '8':
            return ['', 'C1'];
        case '9':
            return ['', 'D1'];
        case 'a':
            return ['', 'E1'];
        case 'b':
            return ['', 'F1'];
        case 'c':
            return ['G1', 'C1'];
        case 'd':
            return ['A1', 'D1'];
        case 'e':
            return ['B1', 'E1'];
        case 'f':
            return ['C1', 'F1'];
        default:
            return -1;
    }
}

const charsToDrumInput = (charStr) => {
    const output = [[], [], [], []]
    let counter = 0
    for (const idx in charStr) {
        const char = charStr[idx]
        const pair = segmentDrumChars(char)
        output[counter].push(...pair)
        if ((idx % 2) === 1) {
            counter++;
        }
    }

    return output
}

const charsToKeysInput = (charStr) => {
    const output = [[], [], [], []]
    let counter = 0
    for (const idx in charStr) {
        const char = charStr[idx]
        const pair = segmentKeyChars(char)
        output[counter].push(...pair)
        if ((idx % 2) === 1) {
            counter++;
        }
    }

    return output
}

const charsToBassInput = (charStr) => {
    const output = [[], [], [], []]
    let counter = 0
    for (const idx in charStr) {
        const char = charStr[idx]
        const pair = segmentBassChars(char)
        output[counter].push(...pair)
        if ((idx % 2) === 1) {
            counter++;
        }
    }

    return output
}

export const generateAudioFromWallet = (address = WALLET_ADDRESS) => {
    const splitArr = address.split('x')
    const fortyChars = splitArr[1].toLowerCase()

    console.log('fortyChars', fortyChars, fortyChars.length)

    const kickInput = charsToDrumInput(fortyChars.substring(0, 8))
    console.log('kickInput', kickInput)
    const kickSeq = new Tone.Sequence((time, note) => {
        if (note === '*') {
            kick.triggerAttack("C1", time);
        }
        //synth.triggerAttackRelease(note, 0.1, time);
        // subdivisions are given as subarrays
    }, kickInput).start(0);

    const snareInput = charsToDrumInput(fortyChars.substring(8, 16))
    console.log('snareInput', snareInput)
    const snareSeq = new Tone.Sequence((time, note) => {
        if (note === '*') {
            snare.start(time);
        }
    }, snareInput).start(0);

    const hihatInput = charsToDrumInput(fortyChars.substring(16, 24))
    console.log('hihatInput', hihatInput)
    const hihatSeq = new Tone.Sequence((time, note) => {
        if (note === '*') {
            hats.start(time);
        }
    }, hihatInput).start(0);

    const keysInput = charsToKeysInput(fortyChars.substring(24, 32))
    console.log('keysInput', keysInput)
    const keysSeq = new Tone.Sequence((time, note) => {
        if (note !== '') {
            console.log('time', time, note)
            salamanderKeys.triggerAttackRelease(note, '8n')
        }
    }, keysInput).start(0);

    const bassInput = charsToBassInput(fortyChars.substring(32, 40))
    console.log('bassInput', bassInput)
    const bassSeq = new Tone.Sequence((time, note) => {
        if (note !== '') {
            console.log('time', time, note)
            monoBass.triggerAttackRelease(note, '16n')
        }
    }, bassInput).start(0);

    /*
    const loop = new Tone.Loop((time) => {
        // triggered every eighth note.
        console.log(time)
        casioKeys.player(0).start(time, 0, "16n");
    }, "16n").start(0)
    */

    Tone.Transport.bpm.value = DEFAULT_BPM
    Tone.Transport.start()
}

let isInitialized = false
let isPlaying = false
document.addEventListener('click', () => {
    if (!isInitialized) {
        Tone.start()
        generateAudioFromWallet()
        isInitialized = true
        isPlaying = true
        console.log("context started")
    } else {
        if (isPlaying) {
            console.log('STOP')
            Tone.Transport.stop()
            isPlaying = false
        } else {
            console.log('START')
            Tone.Transport.start()
            isPlaying = true
        }
    }
}, false);