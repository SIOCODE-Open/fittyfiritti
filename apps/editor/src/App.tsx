import { MainApplication } from './components/MainApplication'
import { AIAvailabilityProvider } from './contexts/AIAvailabilityContext'
import { AudioCaptureProvider } from './contexts/AudioCaptureContext'
import { TranscriptionProvider } from './contexts/TranscriptionContext'
import { TranslationProvider } from './contexts/TranslationContext'

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <AIAvailabilityProvider>
        <AudioCaptureProvider>
          <TranscriptionProvider>
            <TranslationProvider>
              <MainApplication />
            </TranslationProvider>
          </TranscriptionProvider>
        </AudioCaptureProvider>
      </AIAvailabilityProvider>
    </div>
  )
}

export default App
