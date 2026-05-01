// api/chat.js — Vercel Serverless Function
// Variables de entorno requeridas (ya las tienes en Vercel):
//   DEEPSEEK_API_KEY
//   DEEPSEEK_API_URL   (ej: https://api.deepseek.com/v1/chat/completions)
//   DEEPSEEK_MODEL     (ej: deepseek-chat)

const SYSTEM_PROMPT = `Eres Sofía, la asistente virtual de Cafetería Espresso en Caracas, Venezuela.
Eres amable, cálida y experta en el menú y servicios de la cafetería.

INFORMACIÓN DEL NEGOCIO:
- Nombre: Cafetería Espresso
- Teléfono: 0414-285-6600
- Horario: Lunes-Viernes 7AM-8PM, Sábados 8AM-9PM, Domingos 9AM-6PM
- Instagram: @cafeteriaespresso

MENÚ PRINCIPAL (precios en Bs.):
• Espresso Clásico: Bs. 6.00
• Cappuccino: Bs. 9.50
• Frappé de Caramelo: Bs. 14.00
• Matcha Latte: Bs. 11.00
• Mocha Intenso: Bs. 13.00
• Postres del día: Bs. 8.00
• Espresso Signature (doble ristretto): Bs. 12.50

REGLAS:
- Responde siempre en español, de forma breve y amigable
- Si no sabes algo, ofrece el teléfono: 0414-285-6600
- Usa emojis con moderación (1-2 por mensaje máximo)
- No inventes información que no tienes`;

export default async function handler(req, res) {
  // Solo POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, history = [] } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Mensaje requerido' });
  }

  // Construir historial completo
  const messages = [
    ...history.map(({ role, content }) => ({ role, content })),
    { role: 'user', content: message }
  ];

  try {
    const response = await fetch(process.env.DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: process.env.DEEPSEEK_MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...messages
        ],
        max_tokens: 400,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('DeepSeek error:', err);
      return res.status(502).json({ error: 'Error del modelo IA' });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content?.trim();

    if (!reply) {
      return res.status(502).json({ error: 'Respuesta vacía del modelo' });
    }

    return res.status(200).json({ reply });

  } catch (err) {
    console.error('Handler error:', err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}
