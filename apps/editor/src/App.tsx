import { MainApplication } from './components/MainApplication'
import { AIAvailabilityProvider } from './contexts/AIAvailabilityContext'
import { AudioCaptureProvider } from './contexts/AudioCaptureContext'
import { SubjectProvider } from './contexts/SubjectContext'
import { TranscriptionProvider } from './contexts/TranscriptionContext'
import { TranscriptionEventsProvider } from './contexts/TranscriptionEventsContext'
import { TranslationProvider } from './contexts/TranslationContext'
import { VADProvider } from './contexts/VADContext'

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <AIAvailabilityProvider>
        <VADProvider>
          <AudioCaptureProvider>
            <TranscriptionProvider>
              <TranslationProvider>
                <TranscriptionEventsProvider>
                  <SubjectProvider>
                    <MainApplication />
                  </SubjectProvider>
                </TranscriptionEventsProvider>
              </TranslationProvider>
            </TranscriptionProvider>
          </AudioCaptureProvider>
        </VADProvider>
      </AIAvailabilityProvider>
    </div>
  )
}

export default App
