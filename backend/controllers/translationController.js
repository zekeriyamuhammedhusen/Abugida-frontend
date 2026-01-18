import asyncHandler from "express-async-handler";
import { translateText } from "../services/translator.js";

export const translate = asyncHandler(async (req, res) => {
  const { text, to, from = "auto" } = req.body || {};
  if (!text || !to) {
    return res.status(400).json({ message: "'text' and 'to' are required" });
  }

  try {
    const result = await translateText({ text, to, from });
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ message: "Translation failed", error: err.message });
  }
});
