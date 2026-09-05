"""Generate original demo music with oscillators only; no third-party samples."""
from array import array
from math import sin, pi, exp
from pathlib import Path
import sys
import wave

RATE = 22050
SECONDS = 48
OUTPUT = Path(__file__).resolve().parents[1] / 'public' / 'audio'
SCORES = {
    'blue-hour': [[48, 55, 60, 64], [45, 52, 57, 60], [41, 48, 53, 57], [43, 50, 55, 59]],
    'window-light': [[53, 60, 65, 69], [48, 55, 60, 64], [50, 57, 62, 65], [46, 53, 58, 62]],
    'night-walk': [[45, 52, 57, 60], [41, 48, 53, 57], [48, 55, 60, 64], [43, 50, 55, 59]],
}

OUTPUT.mkdir(parents=True, exist_ok=True)
for name, score in SCORES.items():
    samples = array('h')
    for i in range(RATE * SECONDS):
        t = i / RATE
        bar = int(t / 6)
        chord = score[bar % len(score)]
        phase = (t % 6) / 6
        envelope = sin(pi * phase) ** .6
        pad = sum(sin(2 * pi * 440 * 2 ** ((n - 69) / 12) * t) for n in chord) / 4
        beat = t % .75
        note = chord[int(t / .75) % 4] + 12
        freq = 440 * 2 ** ((note - 69) / 12)
        pluck = (sin(2 * pi * freq * beat) + .2 * sin(4 * pi * freq * beat)) * exp(-beat * 7) * min(1, beat * 100)
        fade = min(1, t / 2, (SECONDS - t) / 3)
        value = (pad * envelope * .28 + pluck * .13) * fade
        samples.append(round(value * 32767))
    if sys.byteorder != 'little':
        samples.byteswap()
    with wave.open(str(OUTPUT / f'{name}.wav'), 'wb') as output:
        output.setnchannels(1)
        output.setsampwidth(2)
        output.setframerate(RATE)
        output.writeframes(samples.tobytes())
    print(f'{name}: {SECONDS}s, {len(samples)} samples')
