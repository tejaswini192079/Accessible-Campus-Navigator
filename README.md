# ♿ Accessible Campus Navigator

A mobile application concept that helps **wheelchair users** and **visually impaired students** find their way around the college campus. It helps students find classrooms, libraries and other buildings using **accessible routes**.

**Our aim:** make travelling around campus easy and safe for everyone.

This repository contains the project website, including a working prototype of the route planner.

---

## The Problem

Students don't know which path is safe and accessible for them.

1. Wheelchair users cannot easily use stairs.
2. Students don't know where ramps and lifts are available.
3. Visually impaired students may find it difficult to find classrooms.
4. Sometimes lifts stop working, and students don't know about it.

## Our Solution

A mobile application that shows students the correct path to reach their destination.

| Feature | Description |
|---|---|
| Fastest route | The route that takes less time |
| Step-free route | A route without stairs |
| Voice directions | The app tells students where to go |
| Landmark directions | Instructions using places like reception, lifts and entrances |
| Report broken lift | Students can report if a lift is not working |
| Route updates | The app suggests another route if a lift is broken (after the issue is verified) |

---

## Website Features

- Responsive, colorful design with light and dark mode
- **Live route planner** on a sample campus map (fastest or step-free)
- **Voice navigation** using the browser's Web Speech API (read aloud, next step, stop)
- **Landmark-based** step-by-step directions
- **Lift status board and reporting**. A report is verified when staff confirm it or when 2 students report the same lift. Routes then avoid the broken lift automatically
- Feature tabs, FAQ accordion, contact form with validation, mobile menu, scroll animations

## Project Structure

```
├── index.html   # Page structure and content
├── style.css    # Styling, themes, animations, responsive layout
├── script.js    # Route planner, voice, lift reports, interactivity
└── README.md
```

## How to Run

No build step or installation is needed.

1. Download or clone this repository.
2. Keep `index.html`, `style.css` and `script.js` in the same folder.
3. Open `index.html` in a browser.

To publish it, upload the three files to any static host, such as GitHub Pages or Netlify.

> Voice directions work best in Chrome or Edge. Fonts load from Google Fonts, so an internet connection is needed for the intended look.

## Try the Demo

1. Open the **Live Demo** section.
2. Choose **From: Main Gate** and **To: Classroom Block A**.
3. Select **Step-free** and press **Find Route**.
4. Go to **Lift Status**, report the *Science Block Lift* twice, then return to the demo to see the route change.

## Customizing the Campus

Edit the `NODES` (buildings) and `EDGES` (paths: `path`, `ramp`, `stairs`, `lift`) lists near the top of `script.js` to match your real campus.

## Limitations

- This is a front-end prototype. Lift reports are stored in the visitor's own browser (`localStorage`) and are not shared between users.
- The contact form does not send messages anywhere yet.
- The map shows a sample campus, not real campus data.

## Future Work

- Real campus map data and indoor navigation
- Shared backend for lift reports and staff verification
- Native mobile app with GPS and haptic or audio guidance
- Real-time lift status integration

## Tech Stack

HTML5, CSS3, vanilla JavaScript (no frameworks or dependencies)
