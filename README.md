# DiAI

**Real-time AI Transcription & Note-Taking**

A modern web application that provides real-time audio transcription and intelligent note organization using Chrome's Built-in AI API (Gemini Nano). The app listens to your microphone, transcribes speech in real-time, and automatically organizes content into structured notes with multi-level categorization and Japanese translation.

## Features

- 🎙️ **Real-time Audio Transcription**: Continuous microphone capture with sliding window processing
- 🧠 **Intent Recognition**: AI-powered detection of subject changes and content organization
- 📝 **Hierarchical Notes**: 3-level note structure (Topics → Cards → Bullet Points)  
- 🌐 **Bilingual Support**: Automatic English to Japanese translation
- ⚡ **On-Device AI**: Uses Chrome's Built-in AI API (Gemini Nano) - no external API calls
- 🎯 **Smart Transitions**: Recognizes transitional phrases and context shifts

## How It Works

1. **Level 1 Changes**: Complete subject changes (clears screen, new topic)
2. **Level 2 Changes**: New aspects of current subject (creates new cards with titles)
3. **Level 3 Changes**: Continuous bullet points within current card
4. **Transitional States**: Temporary messages for subject transitions ("Moving on...", etc.)

## Requirements

- Node.js 18+
- PNPM 9.12.3+
- Chrome Browser with Built-in AI enabled
- Microphone access

## Getting Started

```bash
# Install dependencies
pnpm install

# Build the project
pnpm build

# Start development server
pnpm dev
```

## Chrome AI Setup

This app requires Chrome's Built-in AI API. See `CHROME_AI_SETUP.md` for configuration instructions.