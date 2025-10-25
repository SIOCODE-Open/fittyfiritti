// Deprecated shim: Use TranscriptionService instead
import { TranscriptionService } from '../types'
import { TranscriptionServiceImpl } from './TranscriptionService'

export type SystemTranscriptionService = TranscriptionService
export class SystemTranscriptionServiceImpl extends TranscriptionServiceImpl {}
