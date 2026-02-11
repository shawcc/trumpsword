import dotenv from 'dotenv';
dotenv.config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o';

export const llmService = {
  async analyzeEvent(data: any) {
    // If no API key, fallback to simple rule-based mock logic
    if (!OPENAI_API_KEY) {
      let type = 'legislative';
      if (data.type === 'HR' || data.type === 'S') {
          type = 'legislative';
      } else if (data.title && data.title.toLowerCase().includes('executive order')) {
          type = 'executive';
      } else if (data.title && (data.title.toLowerCase().includes('nomination') || data.title.toLowerCase().includes('appoint'))) {
          type = 'appointment';
      }
      
      return {
        type,
        confidence: 0.85,
        summary: `[MOCK] Auto-generated summary for ${data.title}`,
        extracted_entities: ['Trump', 'Senate']
      };
    }

    try {
      const response = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: OPENAI_MODEL,
          messages: [
            {
              role: 'system',
              content: `You are a political analyst. Analyze the following text and categorize it into one of three types: 
              1. 'legislative' (Bills, Laws)
              2. 'executive' (Executive Orders, Memorandums)
              3. 'appointment' (Nominations, Personnel)
              
              Also provide a brief summary and extract key entities.
              Return JSON only: { "type": "...", "confidence": 0.0-1.0, "summary": "...", "extracted_entities": [...] }`
            },
            {
              role: 'user',
              content: `Title: ${data.title}\nContent: ${data.description || data.raw_data?.content || ''}`
            }
          ],
          response_format: { type: "json_object" }
        })
      });

      if (!response.ok) {
        throw new Error(`LLM API Error: ${response.statusText}`);
      }

      const result = await response.json();
      const content = result.choices[0].message.content;
      return JSON.parse(content);
      
    } catch (error) {
      console.error('LLM Analysis Failed:', error);
      // Fallback to mock on error
      return {
        type: 'legislative',
        confidence: 0.5,
        summary: `Analysis failed, defaulting. Error: ${error}`,
        extracted_entities: []
      };
    }
  }
};
