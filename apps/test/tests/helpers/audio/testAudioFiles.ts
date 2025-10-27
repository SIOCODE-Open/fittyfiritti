/**
 * Pre-generated test audio files
 * These WAV files are committed to the repository for testing transcription
 */

import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const TEST_AUDIO_DIR = path.resolve(__dirname, '../../../test-audio-files');

export interface TestAudioFile {
  /** Path to the WAV file */
  path: string;
  /** The exact text that was synthesized */
  text: string;
  /** Normalized version for comparison */
  normalized: string;
}

/**
 * Pre-generated test audio files with their ground truth text
 */
export const TEST_AUDIO_FILES: Record<string, TestAudioFile> = {
  // English files (short tests)
  'test-hello-en': {
    path: path.join(TEST_AUDIO_DIR, 'test-hello-en.wav'),
    text: 'Hello, this is a test. Hello, this is a test.',
    normalized: 'hello this is a test hello this is a test',
  },
  'test-agreement-en': {
    path: path.join(TEST_AUDIO_DIR, 'test-agreement-en.wav'),
    text: 'Yes, I agree. Yes, I agree.',
    normalized: 'yes i agree yes i agree',
  },
  'test-pangram-en': {
    path: path.join(TEST_AUDIO_DIR, 'test-pangram-en.wav'),
    text: 'The quick brown fox jumps over the lazy dog.',
    normalized: 'the quick brown fox jumps over the lazy dog',
  },
  'test-technical-en': {
    path: path.join(TEST_AUDIO_DIR, 'test-technical-en.wav'),
    text: 'Machine learning is transforming artificial intelligence.',
    normalized: 'machine learning is transforming artificial intelligence',
  },
  
  // Spanish files (short tests)
  'test-hello-es': {
    path: path.join(TEST_AUDIO_DIR, 'test-hello-es.wav'),
    text: 'Hola, esto es una prueba. Hola, esto es una prueba.',
    normalized: 'hola esto es una prueba hola esto es una prueba',
  },
  'test-agreement-es': {
    path: path.join(TEST_AUDIO_DIR, 'test-agreement-es.wav'),
    text: 'Sí, estoy de acuerdo. Sí, estoy de acuerdo.',
    normalized: 'si estoy de acuerdo si estoy de acuerdo',
  },
  'test-pangram-es': {
    path: path.join(TEST_AUDIO_DIR, 'test-pangram-es.wav'),
    text: 'El veloz murciélago hindú comía feliz cardillo y kiwi.',
    normalized: 'el veloz murcielago hindu comia feliz cardillo y kiwi',
  },
  'test-technical-es': {
    path: path.join(TEST_AUDIO_DIR, 'test-technical-es.wav'),
    text: 'El aprendizaje automático está transformando la inteligencia artificial.',
    normalized: 'el aprendizaje automatico esta transformando la inteligencia artificial',
  },
  
  // Japanese files (short tests)
  'test-hello-ja': {
    path: path.join(TEST_AUDIO_DIR, 'test-hello-ja.wav'),
    text: 'こんにちは、これはテストです。こんにちは、これはテストです。',
    normalized: 'こんにちは これはテストです こんにちは これはテストです',
  },
  'test-agreement-ja': {
    path: path.join(TEST_AUDIO_DIR, 'test-agreement-ja.wav'),
    text: 'はい、同意します。はい、同意します。',
    normalized: 'はい 同意します はい 同意します',
  },
  'test-pangram-ja': {
    path: path.join(TEST_AUDIO_DIR, 'test-pangram-ja.wav'),
    text: 'いろはにほへと ちりぬるを わかよたれそ つねならむ',
    normalized: 'いろはにほへと ちりぬるを わかよたれそ つねならむ',
  },
  'test-technical-ja': {
    path: path.join(TEST_AUDIO_DIR, 'test-technical-ja.wav'),
    text: '機械学習は人工知能を変革しています。',
    normalized: '機械学習は人工知能を変革しています',
  },
  
  // Long tests (5-6 sentences)
  'test-long-en': {
    path: path.join(TEST_AUDIO_DIR, 'test-long-en.wav'),
    text: 'The purple elephant danced on the rainbow while juggling bananas. Suddenly, a flying toaster appeared and sang opera. The confused penguin wore a top hat and recited poetry backwards. Meanwhile, the cheese started learning quantum physics. A bicycle decided to become a professional musician. Finally, the clouds began painting abstract art in the sky.',
    normalized: 'the purple elephant danced on the rainbow while juggling bananas suddenly a flying toaster appeared and sang opera the confused penguin wore a top hat and recited poetry backwards meanwhile the cheese started learning quantum physics a bicycle decided to become a professional musician finally the clouds began painting abstract art in the sky',
  },
  'test-long-es': {
    path: path.join(TEST_AUDIO_DIR, 'test-long-es.wav'),
    text: 'El elefante morado bailó sobre el arcoíris mientras hacía malabares con plátanos. De repente, apareció una tostadora voladora y cantó ópera. El pingüino confundido llevaba un sombrero de copa y recitaba poesía al revés. Mientras tanto, el queso comenzó a aprender física cuántica. Una bicicleta decidió convertirse en músico profesional. Finalmente, las nubes empezaron a pintar arte abstracto en el cielo.',
    normalized: 'el elefante morado bailo sobre el arcoiris mientras hacia malabares con platanos de repente aparecio una tostadora voladora y canto opera el pinguino confundido llevaba un sombrero de copa y recitaba poesia al reves mientras tanto el queso comenzo a aprender fisica cuantica una bicicleta decidio convertirse en musico profesional finalmente las nubes empezaron a pintar arte abstracto en el cielo',
  },
  'test-long-ja': {
    path: path.join(TEST_AUDIO_DIR, 'test-long-ja.wav'),
    text: '紫色の象が虹の上で踊りながらバナナでジャグリングしました。突然、飛んでいるトースターが現れてオペラを歌いました。混乱したペンギンはシルクハットをかぶって詩を逆に暗唱しました。その間、チーズは量子物理学を学び始めました。自転車はプロのミュージシャンになることを決めました。最後に、雲が空に抽象芸術を描き始めました。',
    normalized: '紫色の象が虹の上で踊りながらバナナでジャグリングしました 突然 飛んでいるトースターが現れてオペラを歌いました 混乱したペンギンはシルクハットをかぶって詩を逆に暗唱しました その間 チーズは量子物理学を学び始めました 自転車はプロのミュージシャンになることを決めました 最後に 雲が空に抽象芸術を描き始めました',
  },
};

/**
 * Get a specific test audio file by key
 */
export function getTestAudio(key: keyof typeof TEST_AUDIO_FILES): TestAudioFile {
  const file = TEST_AUDIO_FILES[key];
  if (!file) {
    throw new Error(`Test audio file not found: ${key}`);
  }
  return file;
}
