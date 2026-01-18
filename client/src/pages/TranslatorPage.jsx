import { useState } from "react";
import api from "../lib/api";

const TranslatorPage = () => {
  const [text, setText] = useState("");
  const [direction, setDirection] = useState("en-am"); // en-am or am-en
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [provider, setProvider] = useState("");
  const [error, setError] = useState("");

  const to = direction === "en-am" ? "am" : "en";
  const from = direction === "en-am" ? "en" : "am";

  const handleTranslate = async () => {
    setLoading(true);
    setError("");
    setResult("");
    setProvider("");
    try {
      const { data } = await api.post("/api/translate", { text, to, from });
      setResult(data?.translatedText || "");
      setProvider(data?.provider || "");
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || "Translation failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[60vh] container mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-4">Translator</h1>
      <p className="text-sm text-slate-600 mb-6">Translate between English and Amharic.</p>

      <div className="mb-4">
        <label className="mr-4">
          <input
            type="radio"
            name="direction"
            value="en-am"
            checked={direction === "en-am"}
            onChange={(e) => setDirection(e.target.value)}
            className="mr-2"
          />
          English → Amharic
        </label>
        <label className="ml-6">
          <input
            type="radio"
            name="direction"
            value="am-en"
            checked={direction === "am-en"}
            onChange={(e) => setDirection(e.target.value)}
            className="mr-2"
          />
          Amharic → English
        </label>
      </div>

      <textarea
        className="w-full border rounded-md p-3 h-40 mb-4"
        placeholder={direction === "en-am" ? "Enter English text" : "አማርኛ ጽሁፍ አስገባ"}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <button
        onClick={handleTranslate}
        disabled={loading || !text.trim()}
        className="px-4 py-2 bg-fidel-500 hover:bg-fidel-600 text-white rounded-md disabled:opacity-50"
      >
        {loading ? "Translating…" : "Translate"}
      </button>

      {error && (
        <div className="mt-4 text-red-600 text-sm">{error}</div>
      )}

      {result && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold">Result</h2>
            {provider && (
              <span className="text-xs text-slate-500">via {provider}</span>
            )}
          </div>
          <div className="border rounded-md p-3 bg-slate-50 whitespace-pre-wrap">{result}</div>
        </div>
      )}
    </div>
  );
};

export default TranslatorPage;
