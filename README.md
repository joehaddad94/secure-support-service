# SecureSupport Backend (Node/Express/TypeScript)

## Setup
1) Install deps  
```bash
npm install
```
2) Env vars (example)  
```bash
export PORT=3001
export AI_PROVIDER=openai          # default provider
export OPENAI_API_KEY=sk-...       # only needed for openai
```

## Run
```bash
npm run dev
```
API base: `http://localhost:3001/api`

## Endpoint
`POST /api/analyze-email`
- Body: `{ "email": "raw email text" }`
- Optional header: `x-ai-provider` to override provider per request  
  - `openai`, `mock-anthropic`, `mock-gemini`

## Sample CURL
```bash
curl -X POST http://localhost:3001/api/analyze-email \
  -H "Content-Type: application/json" \
  -H "x-ai-provider: mock-anthropic" \
  -d '{ "email": "Hi, my card 4111-1111-1111-1111 was charged twice." }'
```
## Response Structure

```json
{
    "analysis": {
        "intent": "string - brief description of what the customer wants",
        "sentiment": "positive | neutral | negative",
        "summary": "string - short summary of the email",
        "suggestedReply": "string - draft reply to the customer",
        "urgency": "low | medium | high"
    },
    "provider": "string - which provider succeeded (e.g., 'openai', 'mock-anthropic', 'mock-gemini')",
    "redactions": [
        {
            "type": "CREDIT_CARD | SSN | EMAIL | PHONE",
            "placeholder": "string - placeholder used (e.g., '[REDACTED_CREDIT_CARD]')",
            "count": "number - how many instances were redacted"
        }
    ],
    "attemptedProviders": [
        "array of strings - order of providers tried (useful for fallback visibility)"
    ]
}
```

## Postman Examples

### Successful Response
![Postman Success Response](docs/images/success.png)

### Provider Switching via Header
![Postman Provider Header](docs/images/header-change.png)

### Fallback Behavior
![Postman Fallback](docs/images/failed-default.png)


