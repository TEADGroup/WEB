import type { ProjectSectionsResult } from '@tea/shared';

export interface ParseParams {
  text: string;
  language: 'vi' | 'en';
  /** Optional user-provided instruction to guide the AI parser. */
  customPrompt?: string;
}

export interface AiProvider {
  readonly name: string;
  /** Parse document text into structured sections. */
  parseDocument(params: ParseParams): Promise<ProjectSectionsResult>;
  /** Health check -- can the provider be reached? */
  ping(): Promise<boolean>;
}
