import { Icon } from '@iconify/react'
import { useState } from 'react'
import { ThemeToggleButton } from './ThemeToggleButton'

export type Language = 'english' | 'spanish' | 'japanese'

export type PresentationMode =
  | 'transcription-only'
  | 'local-only'
  | 'both-speakers'

interface WelcomeScreenProps {
  onStartRecording: (
    speakerLanguage: Language,
    otherPartyLanguage: Language,
    presentationMode: PresentationMode
  ) => void
  isInitializing: boolean
  onOpenHelp?: () => void
}

export function WelcomeScreen({
  onStartRecording,
  isInitializing,
  onOpenHelp,
}: WelcomeScreenProps) {
  const [speakerLanguage, setSpeakerLanguage] = useState<Language>('english')
  const [otherPartyLanguage, setOtherPartyLanguage] =
    useState<Language>('japanese')
  const [presentationMode, setPresentationMode] =
    useState<PresentationMode>('both-speakers')

  const languageOptions = [
    { value: 'english', label: 'English' },
    { value: 'spanish', label: 'Spanish' },
    { value: 'japanese', label: 'Japanese' },
  ]

  const presentationModeOptions = [
    {
      value: 'transcription-only' as PresentationMode,
      label: 'Transcription & Translation Only',
      description: 'No presentation mode, focus on transcription',
    },
    {
      value: 'local-only' as PresentationMode,
      label: 'Presentation from Your Speech',
      description: 'Only your voice creates presentation content',
    },
    {
      value: 'both-speakers' as PresentationMode,
      label: 'Presentation from Both Speakers',
      description: 'Both you and the other party influence the presentation',
    },
  ]

  const handleStartRecording = () => {
    onStartRecording(speakerLanguage, otherPartyLanguage, presentationMode)
  }
  return (
    <div
      data-testid="welcome-screen"
      className="flex flex-col items-center justify-center min-h-screen transition-colors duration-300"
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
          className="text-6xl font-bold text-gray-900 dark:text-gray-100 mb-4 transition-colors duration-300"
        >
          FittyFiritti
        </h1>
      </div>

      {/* Language Settings */}
      <div
        data-testid="language-settings-panel"
        className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 mb-12 w-full max-w-md transition-colors duration-300"
      >
        <div className="space-y-6">
          {/* Speaker Language */}
          <div data-testid="speaker-language-section">
            <label
              htmlFor="speaker-language"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-300"
            >
              Your Language (Speaker)
            </label>
            <select
              id="speaker-language"
              data-testid="speaker-language-select"
              value={speakerLanguage}
              onChange={e => setSpeakerLanguage(e.target.value as Language)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors duration-300"
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
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-300"
            >
              Other Party Language
            </label>
            <select
              id="other-party-language"
              data-testid="other-party-language-select"
              value={otherPartyLanguage}
              onChange={e => setOtherPartyLanguage(e.target.value as Language)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors duration-300"
            >
              {languageOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Presentation Mode */}
          <div data-testid="presentation-mode-section">
            <label
              htmlFor="presentation-mode"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-300"
            >
              Presentation Mode
            </label>
            <select
              id="presentation-mode"
              data-testid="presentation-mode-select"
              value={presentationMode}
              onChange={e =>
                setPresentationMode(e.target.value as PresentationMode)
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors duration-300"
            >
              {presentationModeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p
              data-testid="presentation-mode-description"
              className="text-xs text-gray-500 dark:text-gray-400 mt-1 transition-colors duration-300"
            >
              {
                presentationModeOptions.find(
                  opt => opt.value === presentationMode
                )?.description
              }
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

      {/* Bottom Left Buttons */}
      <div className="fixed bottom-8 left-8 flex gap-3 z-50">
        {/* Theme Toggle Button */}
        <ThemeToggleButton />

        {/* Help Button */}
        {onOpenHelp && (
          <button
            data-testid="help-button"
            onClick={onOpenHelp}
            className="w-14 h-14 bg-gray-700 hover:bg-gray-800 dark:bg-gray-600 dark:hover:bg-gray-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group"
            title="Help & Setup Guide"
          >
            <Icon
              icon="mdi:help-circle"
              className="w-8 h-8 group-hover:scale-110 transition-transform"
            />
          </button>
        )}

        {/* GitHub Button */}
        <a
          data-testid="github-button"
          href="https://github.com/SIOCODE-Open/fittyfiritti"
          target="_blank"
          rel="noopener noreferrer"
          className="w-14 h-14 bg-gray-700 hover:bg-gray-800 dark:bg-gray-600 dark:hover:bg-gray-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group"
          title="View on GitHub"
        >
          <Icon
            icon="mdi:github"
            className="w-8 h-8 group-hover:scale-110 transition-transform"
          />
        </a>
      </div>

      {/* Created by SIOCODE - Fixed to bottom-right corner */}
      <div
        data-testid="siocode-attribution"
        className="fixed bottom-8 right-8 z-50"
      >
        <a
          href="https://siocode.hu"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors duration-300 group"
        >
          <span className="text-sm font-medium">Created by</span>
          <span className="text-sm font-bold group-hover:underline">
            SIOCODE
          </span>
        </a>
      </div>
    </div>
  )
}
