import dotenv from 'dotenv';
dotenv.config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o';

export const llmService = {
  async analyzeEvent(data: any, source?: string) {
    // 0. Force-classify based on source BEFORE calling LLM
    // This overrides any AI hallucination or text-based misclassification
    const safeSource = (source || data.source || '').toLowerCase();
    if (safeSource === 'truth_social' || safeSource === 'x') {
        return {
            type: 'social_post',
            confidence: 1.0,
            summary: data.content || data.title, // Social posts are short, use content as summary
            extracted_entities: [] // Can be enhanced later
        };
    }

    // If no API key, fallback to simple rule-based mock logic
    if (!OPENAI_API_KEY) {
      let type = 'legislative'; // Default
      
      // Strict rule-based classification based on title and metadata
      const title = (data.title || '').toLowerCase();
      const rawType = (data.type || '').toString().toLowerCase(); // e.g. 'hr', 's' from Congress API
      const safeSource = (source || data.source || '').toLowerCase();

      if (safeSource === 'truth_social' || safeSource === 'x' || rawType === 'social_post') {
          type = 'social_post';
      } else if (rawType === 'hr' || rawType === 's' || rawType === 'legislative' || title.includes('h.r.') || title.includes('s.')) {
          type = 'legislative';
      } else if (title.includes('executive order') || title.includes('proclamation') || title.includes('memorandum')) {
          type = 'executive';
      } else if (title.includes('nomination') || title.includes('appoint') || title.includes('confirm')) {
          type = 'appointment';
      } else {
          // Fallback based on Source if available in raw_data
          // Note: raw_data might not be fully populated here depending on caller, but usually is.
          // This is a safety net.
          if (data.url && data.url.includes('congress.gov')) {
              type = 'legislative';
          } else if (data.url && data.url.includes('whitehouse.gov')) {
              type = 'executive';
          }
      }
      
      return {
        type,
        confidence: 0.9, // Higher confidence for rule-based
        summary: data.summary || `Auto-generated summary for ${data.title}`,
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
              content: `You are a political analyst. Analyze the following text and categorize it into one of four types: 
              1. 'legislative' (Bills, Laws)
              2. 'executive' (Executive Orders, Memorandums)
              3. 'appointment' (Nominations, Personnel)
              4. 'social_post' (Social Media Posts, Tweets, Truths)
              
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
