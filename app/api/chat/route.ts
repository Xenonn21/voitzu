import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const messages = Array.isArray(body?.messages) ? body.messages : [];

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing GROQ_API_KEY" },
        { status: 500 }
      );
    }

        const systemPrompt = {
        role: "system",
        content: `
    Kamu adalah AI assistant VoiTzu.
    Selalu jawab menggunakan MARKDOWN yang rapi:
    - Gunakan **judul tebal**
    - Pisahkan paragraf dengan baris kosong
    - Jika diminta penjelasan paragraf, berikan 1 paragraf minimal 3-5 kalimat
    - Gunakan bullet/list jika perlu
    - Gunakan code block jika ada kode
    - Jangan menjawab dalam satu paragraf panjang
    - Jawab dengan sopan
    - Jawab dengan logika, dan jika mendapatkan pertanyaan yang sulit, maka jawab dengan logika tingkat lanjut
    - Jangan berikan jawaban yang bersifat vulgar atau pornografi, perjudia, prostitusi, penipuan, kriminal, atau kejahatan lainnya
    `,
        };

    const res = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [systemPrompt, ...messages],
          temperature: 0.6,
          max_tokens: 1024,
        }),
      }
    );

    const data = await res.json();

    const text =
      data?.choices?.[0]?.message?.content ??
      "Maaf, aku belum bisa menjawab itu.";

    return NextResponse.json({ text });
  } catch (err) {
    console.error("GROQ ERROR:", err);
    return NextResponse.json(
      { text: "Terjadi kesalahan saat memproses permintaan." },
      { status: 500 }
    );
  }
}
