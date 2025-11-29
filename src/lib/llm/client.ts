// =============================================
// LLM Client - OpenAI Integration
// =============================================

import OpenAI from 'openai';

let _openai: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!_openai) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key not found. Please set OPENAI_API_KEY environment variable.');
    }
    _openai = new OpenAI({ apiKey });
  }
  return _openai;
}

export interface LLMRequest {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
}

export interface LLMResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export async function generateWithLLM(request: LLMRequest): Promise<string> {
  try {
    const openai = getOpenAI();

    const response = await openai.chat.completions.create({
      model: 'gpt-4.1-mini', // Use gpt-4o-mini for better results and cost savings
      messages: [
        { role: 'system', content: request.systemPrompt },
        { role: 'user', content: request.userPrompt }
      ],
      temperature: request.temperature ?? 0.3,
      max_tokens: request.maxTokens ?? 2000,
      response_format: { type: 'json_object' }
    });

    return response.choices[0].message.content || '{}';
  } catch (error) {
    console.error('LLM Error:', error);
    throw error;
  }
}

// Extended function for detailed reasoning
export async function generateWithDetailedReasoning(request: LLMRequest): Promise<{
  content: string;
  thinkingProcess: string;
}> {
  const enhancedSystemPrompt = `${request.systemPrompt}

คุณต้องแสดงกระบวนการคิดอย่างละเอียด:
1. แสดง "thinking_rounds" - แต่ละรอบของการคิด มี thought, observation, conclusion
2. แสดง "decision_path" - ทางเลือกที่พิจารณา พร้อม pros/cons และ score
3. แสดง "final_reasoning" - สรุปเหตุผลการตัดสินใจ`;

  try {
    const openai = getOpenAI();

    const response = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        { role: 'system', content: enhancedSystemPrompt },
        { role: 'user', content: request.userPrompt }
      ],
      temperature: request.temperature ?? 0.3,
      max_tokens: request.maxTokens ?? 3000,
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0].message.content || '{}';

    return {
      content,
      thinkingProcess: content // Full content includes thinking
    };
  } catch (error) {
    console.error('LLM Error:', error);
    throw error;
  }
}
