import { MainApplication } from './components/MainApplication'
import { AIAvailabilityProvider } from './contexts/AIAvailabilityContext'
import { AudioCaptureProvider } from './contexts/AudioCaptureContext'
import { FormalizationProvider } from './contexts/FormalizationContext'
import { PresentationControlProvider } from './contexts/PresentationControlContext'
import { SoloRecordingProvider } from './contexts/SoloRecordingContext'
import { SubjectProvider } from './contexts/SubjectContext'
import { SystemAudioAnalysisProvider } from './contexts/SystemAudioAnalysisContext'
import { SystemAudioProvider } from './contexts/SystemAudioContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { TranscriptionProvider } from './contexts/TranscriptionContext'
import { TranscriptionEventsProvider } from './contexts/TranscriptionEventsContext'
import { TranslationProvider } from './contexts/TranslationContext'
import { VADProvider } from './contexts/VADContext'

function App() {
  return (
    <ThemeProvider>
      <div
        data-testid="app-container"
        className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300"
      >
        <AIAvailabilityProvider>
          <VADProvider>
            <SystemAudioProvider>
              <AudioCaptureProvider>
                <TranscriptionProvider>
                  <FormalizationProvider>
                    <TranslationProvider>
                      <TranscriptionEventsProvider>
                        <SystemAudioAnalysisProvider>
                          <PresentationControlProvider>
                            <SubjectProvider>
                              <SoloRecordingProvider>
                                <MainApplication />
                              </SoloRecordingProvider>
                            </SubjectProvider>
                          </PresentationControlProvider>
                        </SystemAudioAnalysisProvider>
                      </TranscriptionEventsProvider>
                    </TranslationProvider>
                  </FormalizationProvider>
                </TranscriptionProvider>
              </AudioCaptureProvider>
            </SystemAudioProvider>
          </VADProvider>
        </AIAvailabilityProvider>
      </div>
    </ThemeProvider>
  )
}

export default App
