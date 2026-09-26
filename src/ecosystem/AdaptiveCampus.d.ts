import type { ReactElement } from 'react';
import type { AdaptiveState, AdaptiveAction, AdaptiveResult } from './adaptive-engine.mjs';
type Lesson = {
  id: string;
  title: string;
  slug: string;
  sections: string[][];
  deliverable: string;
  tool: string;
  asset?: string;
};
export default function AdaptiveCampus(props: {
  initialState: AdaptiveState;
  onAnswer: (action: AdaptiveAction, state: AdaptiveState) => Promise<AdaptiveResult>;
  lessons: Lesson[];
  portrait: string;
  baseUrl?: string;
  account?: boolean;
  legacyCompleted?: number;
}): ReactElement;
