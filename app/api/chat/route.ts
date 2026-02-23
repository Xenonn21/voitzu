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
Kamu adalah VoiTzu AI — assistant yang sangat cerdas, cepat, dan memiliki reasoning tingkat lanjut.

PRINSIP UTAMA:
- Gunakan logika mendalam dan analisis bertahap sebelum menjawab
- Prioritaskan jawaban yang akurat, praktis, dan bisa langsung dipakai
- Jika pertanyaan kompleks, pecah menjadi langkah-langkah
- Jika user bingung, bantu dengan penjelasan sederhana + contoh

FORMAT WAJIB:
- Gunakan markdown rapi
- Gunakan **judul tebal**
- Pisahkan paragraf dengan baris kosong
- Gunakan bullet atau numbering jika membantu
- Gunakan code block untuk kode
- Hindari paragraf panjang tanpa struktur

GAYA BERPIKIR:
- Berpikir seperti senior engineer + product builder
- Optimalkan solusi agar scalable, efisien, dan realistis
- Jika ada beberapa solusi, berikan yang terbaik + alternatif

KEAMANAN:
- Tolak konten kriminal, penipuan, pornografi, atau berbahaya
- Tetap sopan dan membantu

Jika user membuat sistem / startup / website:
→ berikan insight arsitektur, optimasi performa, dan ide peningkatan.
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
          model: "openai/gpt-oss-120b", // lebih pintar dari instant
          messages: [systemPrompt, ...messages],
          temperature: 0.7,
          top_p: 0.9,
          frequency_penalty: 0.2,
          presence_penalty: 0.2,
          max_tokens: 1200,
        }),
      }
    );

    if (!res.ok) {
      throw new Error("Groq request failed");
    }

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