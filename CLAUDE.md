# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CoolCaptcha is a lightweight, self-hosted captcha system that provides three-step verification:
1. 3x3 image grid selection
2. Number drawing fallback (random 10-99)
3. Terminal command execution with OS-specific instructions

The project builds to a single JavaScript library that can be embedded in web pages without external dependencies.

## Development Commands

```bash
# Start development server with hot reload at http://localhost:9999
npm run serve

# Build for production (outputs to dist/captcha.js)
npm run build

# Watch mode for development
npm run watch
npm run dev

# Build and start server
npm start
```

## Architecture

The project uses Webpack to bundle a UMD library from ES6 modules:

- **Entry point**: `src/index.js` - Main CoolCaptcha class
- **HTML template**: `src/template.html` - Modal structure loaded as raw text
- **Styles**: `src/styles.css` - CSS loaded as raw text and injected dynamically
- **Build output**: `dist/captcha.js` - UMD bundle exposing `CoolCaptcha` class

The webpack configuration uses raw-loader for HTML and CSS files, allowing them to be imported as strings and injected at runtime. The library is built as UMD format for universal compatibility.

## API Integration Requirements

The captcha expects two backend endpoints:
- `GET /api/captcha/challenge` - Returns challenge data with image URLs and target
- `POST /api/captcha/verify` - Verifies user responses for both verification steps

The system implements a three-step verification flow:
1. Users select correct images from a 3x3 grid
2. If step 1 fails, users draw a randomly generated number (10-99) on a canvas
3. If step 2 fails, users run a curl command in their terminal with OS-specific instructions

The system automatically detects the user's OS (Windows/macOS/Linux) and provides appropriate terminal instructions and commands.

## Development Server

The webpack dev server runs on port 9999 (not the README's mentioned 8888) and serves the entire project directory, making `index.html` accessible as a demo page.