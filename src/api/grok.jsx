import axios from 'axios';

const GROQ_API_KEY = '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'; // Ваш ключ Groq API
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Доступные модели Groq (на июнь 2024)
const GROQ_MODELS = {
  LLAMA3_70B: 'llama3-70b-8192',
  LLAMA3_8B: 'llama3-8b-8192',
  MIXTRAL: 'mixtral-8x7b-32768',
  GEMMA: 'gemma-7b-it'
};

export const askGroq = async (messages, model = GROQ_MODELS.LLAMA3_70B) => {
  try {
    const response = await axios.post(
      GROQ_API_URL,
      {
        model, // Используем выбранную модель
        messages,
        temperature: 0.7, // Дополнительные параметры
        max_tokens: 1024,
        top_p: 1,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`,
        },
        timeout: 30000, // Таймаут 30 секунд
      }
    );

    if (!response.data?.choices?.[0]?.message?.content) {
      throw new Error('Неверный формат ответа от API');
    }

    return {
      success: true,
      content: response.data.choices[0].message.content,
      usage: response.data.usage,
    };
    
  } catch (error) {
    console.error('Ошибка запроса к Groq API:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });

    return {
      success: false,
      error: error.response?.data?.error?.message || error.message,
      status: error.response?.status,
    };
  }
};