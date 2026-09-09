export type ChallengeScope = 'ui' | 'api' | 'mobile' | 'hybrid';
export type ScenarioPriority = 'critical' | 'high' | 'medium' | 'low';

export interface ChallengeRequirement {
  id: string;
  title: string;
  scope: ChallengeScope;
  priority: ScenarioPriority;
  evidence: string;
  sourceKeywords: string[];
}

export interface ChallengeScenario {
  id: string;
  requirementId: string;
  title: string;
  scope: ChallengeScope;
  priority: ScenarioPriority;
  tags: string[];
  preconditions: string[];
  steps: string[];
  expectedResults: string[];
}

export interface ChallengePlan {
  generatedAt: string;
  sourceFile: string;
  scope: ChallengeScope;
  requirements: ChallengeRequirement[];
  scenarios: ChallengeScenario[];
}