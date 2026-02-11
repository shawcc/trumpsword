import dotenv from 'dotenv';
dotenv.config();

export const llmService = {
  async analyzeEvent(data: any) {
    // In real app, call OpenAI API here to analyze the text content
    // const completion = await openai.chat.completions.create({...})
    
    // Simple rule-based mock logic for demonstration
    let type = 'legislative';
    if (data.type === 'HR' || data.type === 'S') {
        type = 'legislative';
    } else if (data.title && data.title.toLowerCase().includes('executive order')) {
        type = 'executive';
    } else if (data.title && (data.title.toLowerCase().includes('nomination') || data.title.toLowerCase().includes('appoint'))) {
        type = 'appointment';
    }
    
    // Simulate API latency
    await new Promise(resolve => setTimeout(resolve, 100));

    return {
      type,
      confidence: 0.95,
      summary: `Auto-generated summary for ${data.title}`,
      extracted_entities: ['Trump', 'Senate']
    };
  }
};
