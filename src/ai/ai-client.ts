import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';

dotenv.config();

export type AIProvider = 'openai' | 'anthropic';

export interface AIResponse {
  content: string;
  provider: AIProvider;
  model: string;
  tokensUsed?: number;
}

export class AIClient {
  private openai: OpenAI | null = null;
  private anthropic: Anthropic | null = null;
  private provider: AIProvider;

  constructor(provider?: AIProvider) {
    this.provider = (provider || process.env.AI_PROVIDER || 'openai') as AIProvider;

    if (this.provider === 'openai' && process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
    if (this.provider === 'anthropic' && process.env.ANTHROPIC_API_KEY) {
      this.anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    }
  }

  async prompt(userMessage: string, systemPrompt?: string): Promise<AIResponse> {
    if (this.provider === 'anthropic' && this.anthropic) {
      return this.promptClaude(userMessage, systemPrompt);
    }
    return this.promptOpenAI(userMessage, systemPrompt);
  }

  private async promptOpenAI(userMessage: string, systemPrompt?: string): Promise<AIResponse> {
    if (!this.openai) throw new Error('OpenAI client not initialized. Set OPENAI_API_KEY.');

    const messages: OpenAI.ChatCompletionMessageParam[] = [];
    if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
    messages.push({ role: 'user', content: userMessage });

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      temperature: 0.3,
    });

    return {
      content: response.choices[0]?.message?.content || '',
      provider: 'openai',
      model: 'gpt-4o',
      tokensUsed: response.usage?.total_tokens,
    };
  }

  private async promptClaude(userMessage: string, systemPrompt?: string): Promise<AIResponse> {
    if (!this.anthropic) throw new Error('Anthropic client not initialized. Set ANTHROPIC_API_KEY.');

    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: systemPrompt || '',
      messages: [{ role: 'user', content: userMessage }],
    });

    const content = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('\n');

    return {
      content,
      provider: 'anthropic',
      model: 'claude-sonnet-4-20250514',
      tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
    };
  }
}
