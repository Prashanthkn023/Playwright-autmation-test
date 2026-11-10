import 'dotenv/config';

async function main(): Promise<void> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is missing from .env.');
  }

  const agent =
    process.env.GEMINI_AGENT ||
    'antigravity-preview-09-2026';

  const { GoogleGenAI } = await import('@google/genai');
  const ai = new GoogleGenAI({ apiKey });

  console.log('Testing Antigravity...');
  console.log(`Agent: ${agent}`);

  const result = await ai.interactions.create(
    {
      agent,
      input: 'Reply with exactly: Antigravity is working.',
      environment: 'remote',
    },
    {
      timeout: 300_000,
    },
  );

  console.log('Status:', result.status);
  console.log('Response:', result.output_text);
}

main().catch((error: unknown) => {
  console.error('Antigravity test failed:');

  console.error(
    error instanceof Error ? error.message : String(error),
  );

  process.exitCode = 1;
});