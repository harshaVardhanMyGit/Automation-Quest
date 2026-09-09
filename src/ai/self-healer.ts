import { Page } from '@playwright/test';
import { AIClient } from './ai-client';
import { sanitizeForAI } from '../utils/sanitize';

const SYSTEM_PROMPT = `You are a Playwright automation expert. Given an HTML DOM snippet and a failed CSS/XPath locator, suggest alternative locators that would work. Return a JSON array of alternative locators, ordered by reliability:

[
  { "locator": "css=...", "strategy": "id-based", "confidence": 0.95 },
  { "locator": "text=...", "strategy": "text-based", "confidence": 0.85 }
]

Prefer: data-testid > id > aria-label > text > css class > xpath. Always return at least 3 alternatives.`;

export interface HealingSuggestion {
  locator: string;
  strategy: string;
  confidence: number;
}

export class SelfHealer {
  private ai: AIClient;
  private healingLog: { original: string; healed: string; timestamp: string }[] = [];
  private minimumConfidence = Number(process.env.HEALING_MIN_CONFIDENCE || '0.7');

  constructor() {
    this.ai = new AIClient();
  }

  async heal(page: Page, failedLocator: string): Promise<string | null> {
    try {
      const domSnippet = sanitizeForAI(await page.evaluate(() => document.body.innerHTML), 5000);

      const response = await this.ai.prompt(
        `Failed locator: "${sanitizeForAI(failedLocator, 500)}"\n\nDOM snippet:\n${domSnippet}`,
        SYSTEM_PROMPT
      );

      const jsonMatch = response.content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) return null;

      const suggestions: HealingSuggestion[] = JSON.parse(jsonMatch[0]);

      for (const suggestion of suggestions) {
        try {
          if (suggestion.confidence < this.minimumConfidence) continue;
          const locator = suggestion.locator.replace(/^(css|xpath)=/, '');
          const element = page.locator(locator);
          if (await element.count() === 1 && await element.isVisible({ timeout: 2000 })) {
            this.healingLog.push({
              original: failedLocator,
              healed: locator,
              timestamp: new Date().toISOString(),
            });
            console.log(`Self-healed: "${failedLocator}" -> "${locator}" (${suggestion.strategy})`);
            return locator;
          }
        } catch {
          continue;
        }
      }
    } catch (error) {
      console.warn('Self-healing failed:', error);
    }
    return null;
  }

  getHealingLog() {
    return this.healingLog;
  }
}
