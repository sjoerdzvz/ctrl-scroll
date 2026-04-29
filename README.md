# Zzinnovate: Command+Scroll Zoom v2

Zoom web pages smoothly using **Cmd+Scroll** on macOS or **Ctrl+Scroll** on Windows/Linux. With settings and per-site zoom memory.

## Install

1. Open `chrome://extensions/` (or `edge://extensions/`)
2. Enable **Developer mode** (top right)
3. Click **Load unpacked** → Select this folder

## Use

- **macOS:** Hold **Cmd** (⌘) + Scroll wheel (default)
- **Windows/Linux:** Hold **Ctrl** + Scroll wheel (default)
- **Customize:** Change modifier key in settings (Ctrl, Alt, or Cmd)

## Features

- Smooth 60fps animations (no stuttering)
- Works on Mac, Windows, and Linux
- Remembers zoom level per website
- Fully customizable (range, speed, modifier key)
- No data collection, runs entirely in-browser  

## Settings

Right-click the extension icon and select **"Options"** to customize:

- **Zoom Range** - Set minimum and maximum zoom (10% - 500%)
- **Zoom Step** - How much zoom changes per scroll tick
- **Animation** - Control smoothing speed
- **Per-site Memory** - Remember zoom for each website

## How It Works

1. **Detects your platform** - Cmd on macOS, Ctrl on Windows/Linux
2. **Listens for scroll events** - Only when modifier key is held
3. **Animates smoothly** - Using requestAnimationFrame
4. **Saves per-site** - Remembers zoom for each domain
5. **Syncs settings** - All tabs get your settings instantly

## Project Structure

```
├── manifest.json      # Extension config (Manifest v3)
├── background.js      # Service worker + zoom storage
├── content.js         # Detects Cmd/Ctrl+Scroll, applies zoom
├── options.html       # Settings UI
├── options.js         # Settings handler
├── assets/            # Zzinnovate icons
└── README.md          # This file
```

## The Story

I've been a Windows power user since 1995. **1995.** I built my first PC at home with a Pentium at 166Mhz. I know many Windows shortcut muscle-memory can teach. I've survived Windows XP without irony. My hands literally know `Ctrl+Alt+Delete` better than my own face.

Then I switched to macOS. Everything is different. The modifier keys mock me. Nothing is where it should be. And zooming? *Zooming?* Apple gave us `Cmd++` and `Cmd+-`? That's how they zoom? You have to lift your fingers off the mouse, find keys on opposite ends of the keyboard, and… press? No fluid scrolling? No *zen*?

So I built this. Because a Windows power user's hands remember: **hold modifier, scroll wheel, move on with your life.**

The default is smart:
- **Mac** → Cmd+Scroll (because you're on Mac now, embrace it... mostly)
- **Windows/Linux** → Ctrl+Scroll (the one constant since 1995)

But here's the twist: if your muscle memory is stronger than your willpower, **use settings to swap it**. Use Ctrl on Mac. Or Alt. Or Cmd on Windows. We don't judge. 

*This extension is a love letter to Windows users everywhere learning Mac. It says: "I understand your pain. We can customize this."*

## License

GPL-3.0

---

By **Zzinnovate** — [zzinnovate.com](https://zzinnovate.com)  
Where ideas get engineered.
