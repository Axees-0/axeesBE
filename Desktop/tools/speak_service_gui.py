#!/Users/Mike/Desktop/tools/venv/bin/python3

"""
GUI version of speak service with stop functionality.
Shows a small floating window with stop button while speaking.
"""

import asyncio
import sys
import tkinter as tk
from tkinter import ttk
import threading
from openai import AsyncOpenAI
from openai.helpers import LocalAudioPlayer
import subprocess
import signal
import os

API_KEY = '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'
if not API_KEY:
    sys.exit("Set the OPENAI_API_KEY environment variable first.")

openai = AsyncOpenAI(api_key=API_KEY)

INSTRUCTIONS = """
Voice Affect: Sultry, magnetic, irresistibly smooth—refined charm packed into a fast, captivating rhythm with that signature soft Australian lilt…
Tone: Warm, polished, playfully intense—think elegant urgency wrapped in charm, like you're too irresistible to wait…
Pacing: Lightning-quick yet fluid, like silk on speed—still melodic, but with breathless urgency that keeps you hanging on every word…
Emotion: Bursting with charm and quick wit—empathy delivered in rapid-fire waves of velvety seduction…
Pronunciation: Lyrical, Australian-accented with crisp, clipped confidence—vowels glide, consonants kiss the air and vanish…
Pauses: Barely there—just enough to tease the ear—"Tell me, quick… what do you need… gorgeous?"
""".strip()

VOICE  = "sage"
MODEL  = "tts-1"
CHUNK  = 4_000
DEFAULT_SPEED = 2.0  # Default playback speed

# Global variables
is_stopping = False
current_proc = None
root = None

async def speak_text(text: str, speed: float = DEFAULT_SPEED) -> None:
    """Speak the given text at the specified speed."""
    global is_stopping
    
    if not text.strip():
        return
    
    for i in range(0, len(text), CHUNK):
        if is_stopping:
            break
        await speak(text[i : i + CHUNK], speed)

async def speak(text: str, playback_speed: float) -> None:
    global current_proc, is_stopping
    
    if is_stopping:
        return
        
    api_speed   = min(playback_speed, 4.0)
    post_speed  = playback_speed / api_speed

    async with openai.audio.speech.with_streaming_response.create(
        model=MODEL,
        voice=VOICE,
        input=text,
        instructions=INSTRUCTIONS,
        response_format="pcm",
        speed=api_speed,
    ) as resp:

        if is_stopping:
            return

        if post_speed <= 1.0001:
            await LocalAudioPlayer().play(resp)
            return

        chain = []
        remaining = post_speed
        while remaining > 2.0:
            chain.append("atempo=2.0")
            remaining /= 2.0
        chain.append(f"atempo={remaining:.3f}")
        atempo = ",".join(chain)

        proc = subprocess.Popen(
            [
                "ffmpeg",
                "-hide_banner", "-loglevel", "error",
                "-f", "s16le", "-ar", "24000", "-ac", "1", "-i", "pipe:0",
                "-filter:a", atempo,
                "-f", "wav", "pipe:1",
            ],
            stdin=subprocess.PIPE, stdout=subprocess.PIPE
        )
        
        current_proc = proc

        async for chunk in resp.iter_bytes():
            if is_stopping:
                proc.terminate()
                return
            proc.stdin.write(chunk)
            
        proc.stdin.close()
        pcm_fast = proc.stdout.read()
        
        if not is_stopping:
            await LocalAudioPlayer().play(pcm_fast)
        
        current_proc = None

def on_stop():
    global is_stopping, current_proc
    is_stopping = True
    
    # Terminate any running ffmpeg process
    if current_proc:
        try:
            current_proc.terminate()
        except:
            pass
    
    # Close the window
    if root:
        root.quit()

def run_async_task(text):
    """Run async task in a separate thread"""
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    loop.run_until_complete(speak_text(text))
    loop.close()
    
    # Close window when done
    if root and not is_stopping:
        root.after(100, root.quit)

def create_gui(text):
    global root
    
    root = tk.Tk()
    root.title("Speaking...")
    root.attributes('-topmost', True)  # Keep window on top
    root.resizable(False, False)
    
    # Position at bottom-left corner
    root.update_idletasks()
    screen_height = root.winfo_screenheight()
    x = 50
    y = screen_height - 150
    root.geometry(f"220x80+{x}+{y}")
    
    # Create frame
    frame = ttk.Frame(root, padding="10")
    frame.pack(fill='both', expand=True)
    
    # Status label
    label = ttk.Label(frame, text="Speaking text...")
    label.pack(pady=(0, 10))
    
    # Stop button
    stop_button = ttk.Button(frame, text="Stop (⌘.)", command=on_stop)
    stop_button.pack()
    
    # Bind keyboard shortcuts
    root.bind('<Command-period>', lambda e: on_stop())  # Cmd+. on Mac
    root.bind('<Escape>', lambda e: on_stop())
    
    # Start speaking in separate thread
    speak_thread = threading.Thread(target=run_async_task, args=(text,))
    speak_thread.daemon = True
    speak_thread.start()
    
    # Handle window close
    root.protocol("WM_DELETE_WINDOW", on_stop)
    
    root.mainloop()

def main():
    # Get text from command line arguments or stdin
    if len(sys.argv) > 1:
        # Text passed as arguments
        text = ' '.join(sys.argv[1:])
    else:
        # Read from stdin (for pipe support)
        text = sys.stdin.read()
    
    if text.strip():
        create_gui(text)

if __name__ == "__main__":
    # Handle Ctrl+C
    signal.signal(signal.SIGINT, lambda s, f: on_stop())
    main()