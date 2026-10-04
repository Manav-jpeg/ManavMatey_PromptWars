import { GoogleGenAI, Type } from '@google/genai';
import { NextResponse } from 'next/server';

const MODELS = ['gemini-3.5-flash', 'gemini-2.5-flash']; // tried in order
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY missing in .env.local" }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });
    const { decision, details, priorities } = await req.json();

    const systemInstruction = `
      You are an expert critical thinking coach. Evaluate the user's decision context and identify hidden blind spots, unstated assumptions, implicit trade-offs, and friction points. 
      Do NOT make the decision for the user. Formulate sharp Socratic questions to encourage critical thinking.
    `;

    const request = {
      contents: `
        Decision Context: ${decision}
        Specific Details: ${details}
        Key Priorities: ${priorities}
      `,
      config: {
        systemInstruction,
        temperature: 0.2,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING, description: "Brief reflection on the decision context." },
            unstatedAssumptions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Unverified beliefs treated as facts." },
            hiddenTradeOffs: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Sacrifices implicit in this choice." },
            criticalQuestions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Socratic questions to help the user probe deeper." },
          },
          required: ["summary", "unstatedAssumptions", "hiddenTradeOffs", "criticalQuestions"],
        },
      },
    };

    let lastError: any;
    for (const model of MODELS) {
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const response = await ai.models.generateContent({ model, ...request });
          return NextResponse.json(JSON.parse(response.text!));
        } catch (err: any) {
          lastError = err;
          console.error(`[${model}] attempt ${attempt + 1} failed:`, err?.status, err?.message);
          const retryable = err?.status === 503 || err?.status === 429;
          if (!retryable) break;               // 404/400 etc: skip to next model
          await sleep(1000 * 2 ** attempt);    // 1s, 2s, 4s
        }
      }
    }

    return NextResponse.json(
      { error: lastError?.message ?? 'Gemini request failed' },
      { status: lastError?.status ?? 500 }
    );
  } catch (error: any) {
    console.error('Route error:', error);
    return NextResponse.json({ error: error?.message ?? 'Unknown error' }, { status: 500 });
  }
}