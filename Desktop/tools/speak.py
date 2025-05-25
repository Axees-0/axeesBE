#!/usr/bin/env python3

"""
Clipboard‑to‑speech player with UI.
Watches the clipboard and streams any new text through OpenAI TTS
in a sultry, smooth Australian voice, with playback speed control.
"""

import asyncio
import os
import sys
import pyperclip
import tkinter as tk
from tkinter import ttk
from openai import AsyncOpenAI
from openai.helpers import LocalAudioPlayer
import subprocess
import threading

API_KEY = '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'
if not API_KEY:
    sys.exit("Set the OPENAI_API_KEY environment variable first.")

openai = AsyncOpenAI(api_key=API_KEY)

INSTRUCTIONS = """
Voice Affect: Sultry, magnetic, irresistibly smooth—refined charm packed into a fast, captivating rhythm with that signature soft Australian lilt…
Tone: Warm, polished, playfully intense—think elegant urgency wrapped in charm, like you’re too irresistible to wait…
Pacing: Lightning-quick yet fluid, like silk on speed—still melodic, but with breathless urgency that keeps you hanging on every word…
Emotion: Bursting with charm and quick wit—empathy delivered in rapid-fire waves of velvety seduction…
Pronunciation: Lyrical, Australian-accented with crisp, clipped confidence—vowels glide, consonants kiss the air and vanish…
Pauses: Barely there—just enough to tease the ear—“Tell me, quick… what do you need… gorgeous?”
""".strip()

VOICE  = "sage"
MODEL  = "tts-1" #gpt-4o-mini-tts
CHUNK  = 4_000

playback_speed = 2
current_task = None
current_proc = None
is_stopping = False

async def play_clipboard():
    """Speak whatever is currently in the clipboard (once)."""
    global is_stopping
    clip = pyperclip.paste().strip()
    if not clip:
        return
    for i in range(0, len(clip), CHUNK):
        if is_stopping:
            break
        await speak(clip[i : i + CHUNK])

async def speak(text: str) -> None:
    global current_proc, is_stopping
    
    if is_stopping:
        return
        
    # use the slider value
    api_speed   = min(playback_speed, 4.0)          # model max :contentReference[oaicite:0]{index=0}
    post_speed  = playback_speed / api_speed        # >1.0 if we still need extra speed

    async with openai.audio.speech.with_streaming_response.create(
        model=MODEL,
        voice=VOICE,
        input=text,
        instructions=INSTRUCTIONS,
        response_format="pcm",                      # raw 16-bit PCM :contentReference[oaicite:1]{index=1}
        speed=api_speed,
    ) as resp:

        if is_stopping:
            return

        # no extra boost needed – play directly
        if post_speed <= 1.0001:
            await LocalAudioPlayer().play(resp)
            return

        # build an atempo chain (each filter ∈ [0.5, 2.0]) :contentReference[oaicite:2]{index=2}
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
                "-f", "s16le", "-ar", "24000", "-ac", "1", "-i", "pipe:0",   # tell ffmpeg the stream format :contentReference[oaicite:3]{index=3}
                "-filter:a", atempo,                                         # extra speed
                "-f", "wav", "pipe:1",
            ],
            stdin=subprocess.PIPE, stdout=subprocess.PIPE
        )
        
        current_proc = proc

        async for chunk in resp.iter_bytes():                                # streaming PCM :contentReference[oaicite:4]{index=4}
            if is_stopping:
                proc.terminate()
                return
            proc.stdin.write(chunk)
        proc.stdin.close()
        pcm_fast = proc.stdout.read()
        
        if not is_stopping:
            await LocalAudioPlayer().play(pcm_fast)
        
        current_proc = None



def run_async_task(coro):
    """Run async task in a separate thread"""
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    loop.run_until_complete(coro)
    loop.close()

def on_play():
    global current_task, is_stopping
    is_stopping = False
    play_button.config(state='disabled')
    stop_button.config(state='normal')
    
    # Run in separate thread to avoid blocking UI
    current_task = threading.Thread(target=run_async_task, args=(play_clipboard(),))
    current_task.start()
    
    # Check if task is done
    root.after(100, check_task_done)

def on_stop():
    global is_stopping, current_proc
    is_stopping = True
    
    # Terminate any running ffmpeg process
    if current_proc:
        try:
            current_proc.terminate()
        except:
            pass
    
    play_button.config(state='normal')
    stop_button.config(state='disabled')

def check_task_done():
    global current_task
    if current_task and current_task.is_alive():
        root.after(100, check_task_done)
    else:
        play_button.config(state='normal')
        stop_button.config(state='disabled')

def on_speed_change(val):
    global playback_speed
    playback_speed = float(val)
    speed_value_label.config(text=f"{playback_speed:.1f}x")

if __name__ == "__main__":
    root = tk.Tk()
    root.title("Clipboard Speaker")

    ttk.Label(root, text="Playback Speed:").pack(pady=5)
    speed_value_label = ttk.Label(root, text="2.0x")
    speed_value_label.pack()
    speed_slider = ttk.Scale(root, from_=1, to=3, value=2, command=on_speed_change)
    speed_slider.pack(pady=5, fill='x', padx=20)

    # Button frame
    button_frame = ttk.Frame(root)
    button_frame.pack(pady=10)
    
    play_button = ttk.Button(button_frame, text="Start Speaking", command=on_play)
    play_button.pack(side='left', padx=5)
    
    stop_button = ttk.Button(button_frame, text="Stop", command=on_stop, state='disabled')
    stop_button.pack(side='left', padx=5)

    root.mainloop()
