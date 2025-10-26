import { Icon } from '@iconify/react'
import { useState } from 'react'

export type Language = 'english' | 'spanish' | 'japanese'

interface WelcomeScreenProps {
  onStartRecording: (
    speakerLanguage: Language,
    otherPartyLanguage: Language,
    includeSystemAudioInAnalysis: boolean
  ) => void
  isInitializing: boolean
}

export function WelcomeScreen({
  onStartRecording,
  isInitializing,
}: WelcomeScreenProps) {
  const [speakerLanguage, setSpeakerLanguage] = useState<Language>('english')
  const [otherPartyLanguage, setOtherPartyLanguage] =
    useState<Language>('japanese')
  const [includeSystemAudioInAnalysis, setIncludeSystemAudioInAnalysis] =
    useState<boolean>(true)

  const languageOptions = [
    { value: 'english', label: 'English' },
    { value: 'spanish', label: 'Spanish' },
    { value: 'japanese', label: 'Japanese' },
  ]

  const handleStartRecording = () => {
    onStartRecording(
      speakerLanguage,
      otherPartyLanguage,
      includeSystemAudioInAnalysis
    )
  }
  return (
    <div
      data-testid="welcome-screen"
      className="flex flex-col items-center justify-center min-h-screen"
    >
      {/* Logo */}
      <div
        data-testid="welcome-logo-section"
        className="mb-12 flex flex-row items-center space-x-4"
      >
        <img
          data-testid="welcome-logo-image"
          src="/logo.png"
          alt="FittyFiritti Logo"
          className="w-32 h-32 mx-auto"
        />
        <h1
          data-testid="welcome-title"
          className="text-6xl font-bold text-gray-900 mb-4"
        >
          FittyFiritti
        </h1>
      </div>

      {/* Language Settings */}
      <div
        data-testid="language-settings-panel"
        className="bg-white p-8 rounded-xl shadow-lg border border-gray-200 mb-12 w-full max-w-md"
      >
        <div className="space-y-6">
          {/* Speaker Language */}
          <div data-testid="speaker-language-section">
            <label
              htmlFor="speaker-language"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Your Language (Speaker)
            </label>
            <select
              id="speaker-language"
              data-testid="speaker-language-select"
              value={speakerLanguage}
              onChange={e => setSpeakerLanguage(e.target.value as Language)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {languageOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Other Party Language */}
          <div data-testid="other-party-language-section">
            <label
              htmlFor="other-party-language"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Other Party Language
            </label>
            <select
              id="other-party-language"
              data-testid="other-party-language-select"
              value={otherPartyLanguage}
              onChange={e => setOtherPartyLanguage(e.target.value as Language)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {languageOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* System Audio Analysis Setting */}
          <div data-testid="system-audio-analysis-section">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                data-testid="include-system-audio-checkbox"
                checked={includeSystemAudioInAnalysis}
                onChange={e =>
                  setIncludeSystemAudioInAnalysis(e.target.checked)
                }
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
              />
              <span className="text-sm font-medium text-gray-700">
                Include other party's speech in analysis
              </span>
            </label>
            <p
              data-testid="system-audio-analysis-description"
              className="text-xs text-gray-500 mt-1 ml-7"
            >
              When checked, both your voice and the other party's voice will
              influence the right-side content organization. When unchecked,
              only your voice will create title changes and bullet points.
            </p>
          </div>
        </div>
      </div>

      <button
        data-testid="start-recording-button"
        onClick={handleStartRecording}
        disabled={isInitializing}
        className="w-32 h-32 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-full transition-all duration-200 shadow-2xl hover:shadow-3xl hover:scale-105 flex items-center justify-center group"
      >
        {isInitializing ? (
          <Icon
            data-testid="start-recording-loading-icon"
            icon="mdi:loading"
            className="w-12 h-12 animate-spin"
          />
        ) : (
          <Icon
            data-testid="start-recording-microphone-icon"
            icon="mdi:microphone"
            className="w-16 h-16 group-hover:scale-110 transition-transform"
          />
        )}
      </button>
    </div>
  )
}
