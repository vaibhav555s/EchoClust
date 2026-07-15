import numpy as np
from scipy.io import wavfile
import os

def generate_tone(freq, duration=1.0, sr=22050):
    t = np.linspace(0, duration, int(sr * duration), False)
    tone = np.sin(freq * t * 2 * np.pi)
    # Normalize to 16-bit range
    audio = tone * (2**15 - 1) / np.max(np.abs(tone))
    return audio.astype(np.int16)

def main():
    out_dir = os.path.join(os.path.dirname(__file__), '../test_audio')
    os.makedirs(out_dir, exist_ok=True)
    
    # Generate low frequency files (Cluster 1)
    for i in range(5):
        audio = generate_tone(150 + (i*10), duration=2.0)
        wavfile.write(os.path.join(out_dir, f'low_freq_{i+1}.wav'), 22050, audio)

    # Generate high frequency files (Cluster 2)
    for i in range(5):
        audio = generate_tone(1200 + (i*50), duration=2.0)
        wavfile.write(os.path.join(out_dir, f'high_freq_{i+1}.wav'), 22050, audio)
        
    print(f"Generated 10 test audio files in {out_dir}")

if __name__ == "__main__":
    main()
