# ⬡ My Personal Dashboard

A fast, beautiful, fully client-side personal productivity hub. No backend, no dependencies (except Google Fonts).

## Features

- 🔐 Password lock screen (casual protection)
- ⏰ Real-time clock + date
- 🌗 Dark / Light theme toggle
- ⚡ Quick access links (Sheets, Notion, Drive, GitHub)
- ⌨️ Coding section with compiler links + copy-able code snippets
- 🛠 Clipboard & Notes with localStorage persistence
- 📖 Study resource links
- ◎ Focus mode (hides everything except coding essentials)
- 🔍 Live search/filter across all links and snippets

## Keyboard Shortcuts

| Key     | Action              |
|---------|---------------------|
| `/`     | Focus search bar    |
| `F`     | Toggle focus mode   |
| `T`     | Toggle theme        |
| `Esc`   | Clear search        |

## Setup

1. Clone or download this repo
2. Open `index.html` in any browser — done!

## Customise

| What               | Where                           |
|--------------------|---------------------------------|
| Password           | `script.js` → `CONFIG.PASSWORD` |
| Clock format (12h) | `script.js` → `CONFIG.CLOCK_24H`|
| Your links         | `index.html` → update `href` values |
| Add snippets       | `index.html` → copy a `.snippet-card` block |
| Colors / fonts     | `style.css` → `:root` variables  |

## Deploy to GitHub Pages

1. Push all three files (`index.html`, `style.css`, `script.js`) to a GitHub repo
2. Go to **Settings → Pages**
3. Set source to **main branch / root**
4. Your dashboard will be live at `https://yourusername.github.io/repo-name`

> ⚠️ The password is visible in `script.js` — this is intentional casual protection only. Don't store sensitive data here.

## File Structure

```
dashboard/
├── index.html   ← structure & content
├── style.css    ← all styling + responsive
└── script.js    ← all logic + localStorage
```
