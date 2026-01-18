import axios from "axios";

const AZURE_ENDPOINT = "https://api.cognitive.microsofttranslator.com";

export async function translateText({ text, to, from = "auto" }) {
  if (!text || !to) {
    throw new Error("Missing required fields: text, to");
  }

  const useAzure = !!process.env.AZURE_TRANSLATOR_KEY && !!process.env.AZURE_TRANSLATOR_REGION;
  const useOpenAI = !!process.env.OPENAI_API_KEY;

  if (!useAzure && !useOpenAI) {
    throw new Error(
      "Translation provider not configured. Set AZURE_TRANSLATOR_KEY and AZURE_TRANSLATOR_REGION, or OPENAI_API_KEY."
    );
  }

  if (useAzure) {
    const params = new URLSearchParams({ "api-version": "3.0", to });
    if (from && from !== "auto") params.set("from", from);

    const url = `${AZURE_ENDPOINT}/translate?${params.toString()}`;

    const { data } = await axios.post(
      url,
      [{ Text: text }],
      {
        headers: {
          "Ocp-Apim-Subscription-Key": process.env.AZURE_TRANSLATOR_KEY,
          "Ocp-Apim-Subscription-Region": process.env.AZURE_TRANSLATOR_REGION,
          "Content-Type": "application/json",
        },
      }
    );

    const item = data?.[0];
    const translation = item?.translations?.[0]?.text || "";
    const detected = item?.detectedLanguage?.language || from || "auto";
    return { provider: "azure", translatedText: translation, from: detected, to };
  }

  // Fallback: OpenAI
  if (useOpenAI) {
    // Lazy import to avoid top-level dependency
    const { OpenAI } = await import("openai");
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const direction = to === "am" ? "English to Amharic" : "Amharic to English";
    const system = `You are a precise translator for ${direction}. Preserve meaning and tone. Return only the translated text.`;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        { role: "system", content: system },
        { role: "user", content: text },
      ],
    });

    const translation = completion.choices?.[0]?.message?.content?.trim() || "";
    return { provider: "openai", translatedText: translation, from, to };
  }
}
