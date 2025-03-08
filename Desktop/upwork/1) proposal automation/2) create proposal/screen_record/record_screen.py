import cv2
import numpy as np
import mss
import time
from datetime import datetime
import subprocess
import argparse
import shlex
import sys
import threading
import signal

def record_screen(output_filename='screen_recording.mp4', fps=20.0, show_preview=False, stop_event=None):
    """
    Records the screen until a stop event is set.

    :param output_filename: Name of the output video file.
    :param fps: Frames per second for the output video.
    :param show_preview: If True, displays a preview window while recording.
    :param stop_event: threading.Event object to signal when to stop recording.
    """
    with mss.mss() as sct:
        # Get information of monitor 1
        monitor = sct.monitors[1]  # 0 is all monitors, 1 is the first monitor

        # Define the codec and create VideoWriter object
        # For MP4, 'mp4v' is commonly supported. Alternatively, 'X264' can be used if available.
        fourcc = cv2.VideoWriter_fourcc(*"mp4v")
        width = monitor["width"]
        height = monitor["height"]
        out = cv2.VideoWriter(output_filename, fourcc, fps, (width, height))

        print(f"Recording started. Saving to {output_filename}")
        if show_preview:
            print("Preview window is enabled.")

        try:
            while not (stop_event and stop_event.is_set()):
                # Capture the screen
                img = sct.grab(monitor)

                # Convert to a format suitable for OpenCV
                frame = np.array(img)
                # Convert from BGRA to BGR
                frame = cv2.cvtColor(frame, cv2.COLOR_BGRA2BGR)

                # Write the frame to the video file
                out.write(frame)

                if show_preview:
                    cv2.imshow("Screen Recording - Press 'q' to stop", frame)
                    # If 'q' is pressed in the preview window, stop recording
                    if cv2.waitKey(1) & 0xFF == ord('q'):
                        print("Recording stopped by user via preview window.")
                        if stop_event:
                            stop_event.set()
                        break

                # To control the recording frame rate
                time.sleep(1 / fps)

        except Exception as e:
            print(f"An error occurred during recording: {e}")

        finally:
            # Release the VideoWriter and close any OpenCV windows
            out.release()
            if show_preview:
                cv2.destroyAllWindows()
            print(f"Video saved as {output_filename}")

def run_command(command, stop_event):
    """
    Runs a shell command and sets the stop_event when done.

    :param command: The command to execute as a string.
    :param stop_event: threading.Event object to signal when to stop recording.
    """
    print(f"Executing command: {command}")
    try:
        # Use shell=True to execute shell commands
        # For security reasons, it's better to pass a list of arguments
        # Here, we'll use shlex.split to handle it properly
        args = shlex.split(command)
        subprocess.run(args)
    except Exception as e:
        print(f"An error occurred while executing the command: {e}")
    finally:
        if stop_event:
            stop_event.set()
        print("Command execution completed.")

def signal_handler(sig, frame):
    """Handle SIGINT signal (Ctrl+C) to stop recording gracefully"""
    print("\nReceived interrupt signal. Stopping recording...")
    if main.stop_event:
        main.stop_event.set()
    else:
        sys.exit(0)

def main():
    parser = argparse.ArgumentParser(description="Screen Recorder that runs a command and records the screen during its execution.")
    parser.add_argument('--command', '-c', type=str, help='The command to execute and record its screen activity.')
    parser.add_argument('--output', '-o', type=str, default=None, help='Output video filename. Defaults to screen_recording_<timestamp>.mp4')
    parser.add_argument('--fps', '-f', type=float, default=20.0, help='Frames per second for the recording.')
    parser.add_argument('--preview', '-p', action='store_true', help='Show a live preview window during recording.')
    parser.add_argument('--duration', '-d', type=int, default=0, help='Duration in seconds to record. Default is 0 (unlimited).')

    args = parser.parse_args()

    # Determine the output filename
    if args.output:
        output_filename = args.output
        if not output_filename.lower().endswith('.mp4'):
            print("Output filename does not end with .mp4. Appending .mp4 extension.")
            output_filename += '.mp4'
    else:
        timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
        output_filename = f"screen_recording_{timestamp}.mp4"

    # Create a stop event
    main.stop_event = threading.Event()
    
    # Set up signal handler for graceful shutdown
    signal.signal(signal.SIGINT, signal_handler)

    # Create a recording thread
    recording_thread = threading.Thread(
        target=record_screen, 
        args=(output_filename, args.fps, args.preview, main.stop_event)
    )
    recording_thread.daemon = True
    recording_thread.start()

    if args.command:
        # If a command is provided, run it and record during its execution
        run_command(args.command, main.stop_event)
    elif args.duration > 0:
        # If duration is provided, record for the specified duration
        print(f"Recording for {args.duration} seconds...")
        time.sleep(args.duration)
        main.stop_event.set()
    else:
        # If no command or duration provided, record until interrupted
        print("Recording until manually stopped. Press Ctrl+C to stop.")
        try:
            while not main.stop_event.is_set():
                time.sleep(0.5)
        except KeyboardInterrupt:
            print("Recording stopped by user via keyboard interrupt.")
            main.stop_event.set()

    # Wait for the recording thread to finish
    recording_thread.join()
    print("Recording completed.")

if __name__ == "__main__":
        main()
