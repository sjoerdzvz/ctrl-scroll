# Command || Control || Alt + Scroll = Zoom

Zoom web pages smoothly using `Cmd+Scroll` on macOS, or set it to use `Ctrl+Scroll`. This extension comes with more settings like per-site zoom memory and other customizations.

## Why?

As a Windows user switching to MacOS (or the other way around), everything is different. The modifier keys mock you. Nothing is where it should be. And zooming in the browser? Chromium browsers gave us `Cmd++` and `Cmd+-`. (Yes, there is the "pinch to zoom"), but...  

I've been a Windows power user since 1995. I built my first PC at home with a Pentium at 166 MHz. I know many Windows shortcuts—muscle-memory can teach you plenty. I've survived Windows XP without irony. My hands literally know `Ctrl+Alt+Delete` better than my own face. 

So I built this. Because a Windows power user's hands remember: **hold modifier, scroll wheel, zoom and move on with your life.**

For those whose muscle memory is stronger than their willpower, **use settings to swap it**. Use Ctrl on Mac. Or Alt. Or Cmd on Windows. We don't judge. 

*This extension is a love letter to Windows users everywhere learning Mac. It says: "I understand your pain. We can customize this."*


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


## License

GPL-3.0

---

By **Zzinnovate** — [zzinnovate.com](https://zzinnovate.com)  
Where ideas get engineered.
