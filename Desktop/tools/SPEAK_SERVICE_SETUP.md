# Speak Service Setup Instructions

Follow these steps to create a macOS service that speaks selected text:

## 1. Open Automator
- Launch Automator (search for it in Spotlight)
- Choose "Quick Action" when prompted for document type

## 2. Configure the Quick Action
- At the top, set:
  - "Workflow receives current" → **text**
  - "in" → **any application**

## 3. Add the Shell Script Action
- In the actions library on the left, search for "Run Shell Script"
- Drag "Run Shell Script" to the workflow area
- Configure it:
  - Shell: **/bin/bash**
  - Pass input: **as arguments**
  - Replace the script content with:

```bash
/Users/Mike/Desktop/tools/speak_service_gui.py "$@"
```

## 4. Save the Quick Action
- File → Save
- Name it: **Speak Text**
- It will be saved to ~/Library/Services/

## 5. Enable the Service
- Go to System Preferences → Keyboard → Shortcuts → Services
- Find "Speak Text" under the Text section
- Check the box to enable it
- Optionally, assign a keyboard shortcut

## Usage
1. Select any text in any application
2. Right-click → Services → Speak Text
3. The text will be spoken using the OpenAI TTS voice
4. A small window will appear in the bottom-left corner with a Stop button

## Stopping Playback
You can stop the speech at any time by:
- Clicking the "Stop" button in the window
- Pressing Command+. (Cmd+Period)
- Pressing Escape
- Closing the window

## Testing
You can test the script directly from Terminal:
```bash
echo "Hello, this is a test" | /Users/Mike/Desktop/tools/speak_service_gui.py
# or
/Users/Mike/Desktop/tools/speak_service_gui.py "Hello, this is a test"
```

## Customization
To change the default speed, edit `DEFAULT_SPEED` in speak_service_gui.py (current: 2.0x)