import { MainApplication } from './components/MainApplication'
import { AIAvailabilityProvider } from './contexts/AIAvailabilityContext'
import { AudioCaptureProvider } from './contexts/AudioCaptureContext'
import { SubjectProvider } from './contexts/SubjectContext'
import { SystemAudioAnalysisProvider } from './contexts/SystemAudioAnalysisContext'
import { SystemAudioProvider } from './contexts/SystemAudioContext'
import { SystemTranscriptionProvider } from './contexts/SystemTranscriptionContext'
import { SystemTranslationProvider } from './contexts/SystemTranslationContext'
import { TranscriptionProvider } from './contexts/TranscriptionContext'
import { TranscriptionEventsProvider } from './contexts/TranscriptionEventsContext'
import { TranslationProvider } from './contexts/TranslationContext'
import { VADProvider } from './contexts/VADContext'

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <AIAvailabilityProvider>
        <VADProvider>
          <SystemAudioProvider>
            <AudioCaptureProvider>
              <TranscriptionProvider>
                <SystemTranscriptionProvider>
                  <TranslationProvider>
                    <SystemTranslationProvider>
                      <TranscriptionEventsProvider>
                        <SystemAudioAnalysisProvider>
                          <SubjectProvider>
                            <MainApplication />
                          </SubjectProvider>
                        </SystemAudioAnalysisProvider>
                      </TranscriptionEventsProvider>
                    </SystemTranslationProvider>
                  </TranslationProvider>
                </SystemTranscriptionProvider>
              </TranscriptionProvider>
            </AudioCaptureProvider>
          </SystemAudioProvider>
        </VADProvider>
      </AIAvailabilityProvider>
    </div>
  )
}

export default App
