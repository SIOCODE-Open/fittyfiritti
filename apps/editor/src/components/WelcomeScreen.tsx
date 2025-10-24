import { Icon } from '@iconify/react'
import { useState } from 'react'

export type Language = 'english' | 'spanish' | 'japanese'

interface WelcomeScreenProps {
  onStartRecording: (
    speakerLanguage: Language,
    otherPartyLanguage: Language
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

  const languageOptions = [
    { value: 'english', label: 'English' },
    { value: 'spanish', label: 'Spanish' },
    { value: 'japanese', label: 'Japanese' },
  ]

  const handleStartRecording = () => {
    onStartRecording(speakerLanguage, otherPartyLanguage)
  }
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="text-center mb-12">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">DiAI</h1>
      </div>

      {/* Language Settings */}
      <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200 mb-12 w-full max-w-md">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">
          Language Settings
        </h2>

        <div className="space-y-6">
          {/* Speaker Language */}
          <div>
            <label
              htmlFor="speaker-language"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Your Language (Speaker)
            </label>
            <select
              id="speaker-language"
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
          <div>
            <label
              htmlFor="other-party-language"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Other Party Language
            </label>
            <select
              id="other-party-language"
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
        </div>
      </div>

      <button
        onClick={handleStartRecording}
        disabled={isInitializing}
        className="w-32 h-32 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-full transition-all duration-200 shadow-2xl hover:shadow-3xl hover:scale-105 flex items-center justify-center group"
      >
        {isInitializing ? (
          <Icon icon="mdi:loading" className="w-12 h-12 animate-spin" />
        ) : (
          <Icon
            icon="mdi:microphone"
            className="w-16 h-16 group-hover:scale-110 transition-transform"
          />
        )}
      </button>
    </div>
  )
}
