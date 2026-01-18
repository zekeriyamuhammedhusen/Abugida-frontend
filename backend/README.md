# Translation API

This backend exposes a simple translation endpoint for English ↔ Amharic.

## Endpoint

- POST `/api/translate`
  - Body: `{ "text": string, "to": "am" | "en", "from": "auto" | "am" | "en" }`
  - Response: `{ translatedText, from, to, provider }`

## Providers

The service supports two providers:

1. Azure Translator (recommended)
2. OpenAI (fallback)

### Configure Azure Translator

Set the following environment variables in `backend/.env`:

- `AZURE_TRANSLATOR_KEY` — your Translator resource key
- `AZURE_TRANSLATOR_REGION` — region of your resource (e.g., `global`, `eastus`)

Azure docs: https://learn.microsoft.com/azure/ai-services/translator/reference/v3-0-translate

### OpenAI Fallback

If Azure credentials are not set but `OPENAI_API_KEY` is available, the service will use OpenAI to translate.

### Errors

If neither provider is configured, the endpoint returns `500` with a clear message indicating missing configuration.
