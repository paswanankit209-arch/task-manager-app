# OmniCalc — Precision Scientific & Standard Calculator

A high-accuracy arithmetic and scientific calculation engine created by **Ankit Paswan** with vanilla JavaScript and tactile editorial UI.

## Features
- **Standard & Scientific Modes**: Instant mode toggling with trigonometric functions (`sin`, `cos`, `tan`), logarithms (`ln`, `log`), roots (`√`), powers (`x²`, `xʸ`), factorial (`n!`), and constants (`π`, `e`).
- **Angle Unit System**: Switch between Degrees (`DEG`) and Radians (`RAD`).
- **Floating-Point Normalization**: Eliminates IEEE 754 precision quirks (e.g. `0.1 + 0.2 = 0.3`).
- **Physical Keyboard Mapping**: Seamless hands-on-keyboard execution for numbers, operators, Enter, Backspace, and Escape.
- **Memory Operations**: Hardware-style memory registers (`MC`, `MR`, `M+`, `M-`, `MS`) with active visual indicator.
- **Persistent History Tape**: Tracks calculation tape with timestamps and 1-click historical value restoration.
- **Result Clipboard**: 1-click copy to clipboard with toast notification.

## Running Locally
Open `index.html` in your browser or run:
```bash
npx serve .
```
