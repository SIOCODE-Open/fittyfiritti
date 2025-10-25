# DiAI

**Real-time AI-Powered Transcription & Intelligent Note Organization**

A modern web application that provides real-time audio transcription from multiple sources with intelligent note organization using Chrome's Built-in AI API (Gemini Nano). The app captures speech from your microphone and/or system audio (screen sharing), transcribes it in real-time with streaming output, automatically organizes content into structured hierarchical notes, and provides bidirectional translation between multiple languages—all powered by on-device AI with no external API calls.

---

## ✨ Core Features

### 🎙️ Multi-Source Audio Capture
- **Voice Activity Detection (VAD)**: Intelligent voice activity detection using `@ricky0123/vad-web` that automatically captures speech segments when you speak
- **Microphone Capture**: Continuous microphone audio capture with automatic speech segmentation
- **System Audio Capture**: Screen sharing with system audio capture to transcribe other party's speech (e.g., video calls, presentations)
- **Dual-Stream Processing**: Capture and process both your voice and system audio simultaneously
- **Smart Segmentation**: Automatic audio segmentation based on speech detection (VAD-based for microphone, time-based for system audio)

### 🧠 AI-Powered Transcription
- **Real-time Streaming**: Streaming transcription output as audio is processed—see transcription text appear word-by-word
- **Multi-Language Support**: Transcribe audio in English, Spanish, or Japanese with language-specific prompts and models
- **On-Device Processing**: Uses Chrome's Built-in AI API (Gemini Nano) for audio-to-text conversion—completely private, no cloud APIs
- **Multi-Modal AI**: Leverages Chrome's multi-modal language model with audio input support
- **Parallel Processing**: Multiple transcription cards can be processed simultaneously
- **Optimized Prompts**: Language-specific system prompts for accurate transcription

### 📝 Intelligent Subject Detection & Organization
- **AI Intent Recognition**: Automatic detection of when the speaker changes topics or adds details to the current topic
- **Hierarchical Note Structure**: Organizes transcriptions into:
  - **Subjects/Topics**: Top-level topic cards with descriptive titles
  - **Bullet Points**: Key information extracted from transcriptions
- **State-Based Detection**: Different detection logic for paused vs. running presentation states
- **Smart Actions**:
  - `pausePresentation`: Explicit computer commands to pause analysis
  - `resumePresentation`: Explicit computer commands to resume analysis
  - `changeSubject`: Detects when speaker starts a new topic
  - `addBulletPoint`: Extracts key information for the current topic
  - `noOperation`: Filters out small talk and casual conversation
- **Context-Aware**: Maintains transcription history (last 10 items) to understand context
- **Title Generation**: AI-generated descriptive titles for each new subject
- **Bullet Point Extraction**: AI-generated concise summaries (5-15 words) of key information
- **Configurable Analysis**: Choose whether system audio (other party) influences subject organization

### 🌐 Bidirectional Translation
- **Multi-Language Translation**: Translate between English, Spanish, and Japanese
- **Streaming Translation**: See translations appear in real-time as they're generated
- **Dual Translation Services**:
  - **Speaker → Other Party**: Translate your transcriptions to the other party's language
  - **Other Party → Speaker**: Translate system audio transcriptions to your language
- **Smart Translation API**: Uses Chrome's native Translation API when available, falls back to prompt-based translation
- **Subject Title Translation**: Translates subject titles in addition to bullet points

### 🎨 Modern User Interface
- **Dual-Panel Layout**: 
  - Left panel: Real-time transcription stream with cards for each audio segment
  - Right panel: Organized subject hierarchy with titles and bullet points
- **Welcome Screen**: Language configuration before starting:
  - Select your language (English, Spanish, Japanese)
  - Select other party's language
  - Toggle whether system audio influences analysis
- **Recording Control Panel**:
  - Start/stop microphone recording
  - Start/stop system audio capture
  - End session and return to welcome screen
  - Visual indicators for active recording and system capture
  - Real-time user speech detection indicator
- **Transcription Cards**:
  - Timestamp display
  - Streaming transcription text
  - Streaming translation (when applicable)
  - Distinct styling for microphone vs. system audio
- **Subject Cards**:
  - Collapsible/expandable design
  - Subject titles with translations
  - Bullet points with translations
  - Timestamp information
  - Navigation between subject history
- **Error Handling**: User-friendly error messages for permissions and API issues
- **Loading States**: Clear loading indicators during initialization

---

## 🏗️ Architecture

### Service Layer

#### **TranscriptionService** (`TranscriptionServiceImpl`)
- Creates multi-modal AI sessions with audio input enabled
- Configures language-specific prompts and expected I/O
- Provides streaming transcription via `transcribeAudioStreaming()`
- Handles abort signals for cancellation
- Manages session lifecycle (initialize, destroy)
- Temperature: 0.3, TopK: 5 for consistent transcription

#### **SubjectDetectionService**
- Manages 4 separate AI sessions:
  - `actionSessionPaused`: Detects resume commands when paused
  - `actionSessionRunning`: Detects actions when running (pause, changeSubject, addBulletPoint, noOperation)
  - `titleSession`: Generates descriptive titles for new subjects
  - `bulletPointSession`: Extracts concise bullet points
- Maintains transcription history (last 10 items) for context
- Uses structured JSON output with JSON schemas for reliable parsing
- Tracks presentation state (paused/running)
- Provides confidence scores for detection results

#### **TranslationService** (`TranslationServiceImpl`)
- Dual translation services for bidirectional translation
- Uses Chrome's Translation API when available
- Falls back to prompt-based streaming translation
- Configurable source and target languages
- Streaming translation output

#### **AudioCaptureService** (`AudioCaptureServiceImpl`)
- Captures microphone audio with echo cancellation and noise suppression
- Creates MediaRecorder with WebM/Opus codec
- Sample rate: 16kHz (optimized for speech)
- Provides segment completion mechanism
- Callback-based architecture for audio chunks

#### **SystemAudioCaptureService**
- Captures system audio via screen sharing (getDisplayMedia)
- Extracts audio tracks from display stream
- Includes audio analysis with Web Audio API
- Provides waveform data for visualization
- Handles screen sharing lifecycle
- Callback-based architecture for audio chunks

### Context Architecture

The application uses React Context for state management and dependency injection:

- **AIAvailabilityContext**: Checks Chrome Built-in AI availability on startup
- **AudioCaptureContext**: Manages microphone capture service
- **SystemAudioContext**: Manages system audio capture service
- **TranscriptionContext**: Provides transcription service
- **TranslationContext**: Provides both translation services
- **SubjectContext**: Manages subject hierarchy, history, and presentation state
- **VADContext**: Manages voice activity detection
- **TranscriptionEventsContext**: Event bus for completed transcriptions
- **SystemAudioAnalysisContext**: Manages whether system audio influences analysis

### Component Structure

- **MainApplication**: Root component orchestrating all features
- **WelcomeScreen**: Language selection and configuration
- **RecordingControlPanel**: Recording controls and status indicators
- **TranscriptionStream**: Displays transcription cards
- **TranscriptionCard**: Individual transcription with streaming text and translation
- **SubjectDisplay**: Displays organized subject hierarchy
- **SubjectCard**: Individual subject with title, translation, and bullet points
- **BulletPoint**: Individual bullet point with translation
- **ErrorDisplay**: User-friendly error messages

---

## 🚀 Getting Started

### Prerequisites

- **Node.js 18+**
- **PNPM 9.12.3+**
- **Chrome Browser** (Version 141+ recommended) with Built-in AI enabled
- **Microphone access** (required for voice capture)
- **Screen sharing permission** (optional, for system audio capture)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/diai.git
cd diai

# Install dependencies
pnpm install

# Build all packages
pnpm build
```

### Development

```bash
# Start development server
pnpm dev

# The app will be available at http://localhost:5173
```

### Production Build

```bash
# Build for production
pnpm build

# The built files will be in apps/editor/dist
```

### Quality Checks

```bash
# Run all quality checks (lint, format, type-check, build)
pnpm quality-check

# Individual checks
pnpm lint
pnpm format
pnpm type-check
```

---

## 🔧 Chrome AI Setup

This application requires Chrome's Built-in AI API (Gemini Nano) to be enabled.

**Required Chrome Flags:**

Navigate to `chrome://flags` and enable the following:

1. **Optimization Guide On Device Model** (`#optimization-guide-on-device-model`) → **Enabled BypassPerfRequirement**
2. **Prompt API for Gemini Nano** (`#prompt-api-for-gemini-nano`) → **Enabled**
3. **Translation API for Gemini Nano** (`#translation-api`) → **Enabled**

After enabling these flags, restart Chrome. The Gemini Nano model will download automatically on first use.

---

## 📖 Usage Guide

### Starting a Session

1. **Launch the Application**: Open the app in Chrome
2. **Configure Languages**:
   - Select your language (speaker)
   - Select other party's language
   - Toggle system audio analysis (whether other party's speech creates subjects/bullets)
3. **Click the Microphone Button**: Initializes AI services and starts VAD
4. **Grant Permissions**: Allow microphone access when prompted

### Recording Your Voice

- **Automatic Detection**: VAD automatically detects when you start and stop speaking
- **Visual Feedback**: Blue indicator shows when your voice is detected
- **Transcription Cards**: Each speech segment creates a new card on the left
- **Subject Analysis**: Your transcriptions influence the subject organization on the right

### Capturing System Audio

1. **Click "Start System Capture"**: Initiates screen sharing
2. **Select Window/Tab**: Choose the window with audio (e.g., video call)
3. **Enable Audio**: Make sure "Share system audio" is checked
4. **Grant Permission**: Allow screen sharing
5. **System Cards**: System audio transcriptions appear in gray on the left

### Understanding Subject Organization

- **Paused State**: Default state, waiting for "Hey computer, start presentation"
- **Running State**: Actively analyzing transcriptions and organizing content
- **Subject Changes**: New topics create new subject cards with AI-generated titles
- **Bullet Points**: Key information is extracted as bullet points under each subject
- **Translations**: All content is translated to the configured languages

### Voice Commands

- **"Hey computer, start/begin presentation"**: Resume subject analysis
- **"Hey computer, pause/stop presentation"**: Pause subject analysis

### Ending a Session

- **Stop Recording**: Click "Stop Recording" to pause microphone capture
- **Stop System Capture**: Click "Stop System Capture" to end screen sharing
- **End Session**: Click "End Session" to return to welcome screen and clear all data

---

## 🎯 Use Cases

- **📹 Video Call Translation**: Transcribe and translate both sides of a video call in real-time
- **🎓 Lecture Note-Taking**: Automatically organize lecture content into structured notes
- **🎤 Presentation Analysis**: Analyze your presentation structure and organization
- **📝 Interview Transcription**: Capture and organize interview conversations
- **🌐 Language Learning**: Practice conversations with real-time translation
- **💼 Meeting Notes**: Automatic meeting minutes with structured topics
- **🎙️ Podcast Transcription**: Transcribe podcast audio with speaker separation
- **👥 Multilingual Conversations**: Facilitate conversations between speakers of different languages

---

## 🛠️ Technical Details

### Chrome Built-in AI API Integration

- **Language Model API**: Uses global `LanguageModel` interface (not `window.ai`)
- **Multi-Modal Support**: Audio + text input, text output
- **Session Management**: Efficient session creation and caching
- **Structured Output**: JSON schema constraints for reliable parsing
- **Streaming Responses**: Real-time token streaming for transcription and translation
- **Translation API**: Uses native `Translator` API with prompt-based fallback

### Audio Processing

- **VAD Library**: `@ricky0123/vad-web` v0.0.27 with ONNX runtime
- **Sample Rate**: 16kHz (optimized for speech recognition)
- **Codec**: WebM with Opus audio codec
- **Audio Format**: Float32Array for VAD, Blob for transcription
- **Noise Suppression**: Enabled for microphone capture
- **Echo Cancellation**: Enabled for microphone capture

### Performance Optimizations

- **Parallel Processing**: Multiple transcription cards process simultaneously
- **Streaming Output**: Token-by-token streaming for immediate feedback
- **Session Caching**: Efficient AI session reuse (currently disabled, pending fix)
- **Context Window**: Limited history (10 items) for efficient processing

---

**Built with ❤️ using Chrome's Built-in AI API (Gemini Nano)**