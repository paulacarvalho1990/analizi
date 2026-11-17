// Cliente de IA dos insights.
//
// Usa o Workers AI da Cloudflare (binding `AI`), passando pelo AI Gateway
// quando AI_GATEWAY_ID estiver configurado. Se o Workers AI não estiver
// disponível ou falhar, cai para a DeepInfra (DEEPINFRA_API_KEY), quando houver.

export interface WorkersAI {
  run(model: string, inputs: Record<string, unknown>, options?: Record<string, unknown>): Promise<unknown>
}

export interface LLMEnv {
  AI?: WorkersAI
  AI_GATEWAY_ID?: string
  DEEPINFRA_API_KEY?: string
}

export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string }

export const WORKERS_AI_MODEL = '@cf/meta/llama-3.3-70b-instruct-fp8-fast'
const DEEPINFRA_MODEL = 'meta-llama/Llama-3.3-70B-Instruct'

export const hasLLM = (env: LLMEnv) => !!(env.AI || env.DEEPINFRA_API_KEY)

function asText(value: unknown): string | null {
  if (typeof value === 'string') return value
  if (value && typeof value === 'object') return JSON.stringify(value)
  return null
}

async function runWorkersAI(env: LLMEnv, messages: ChatMessage[], temperature: number): Promise<string | null> {
  if (!env.AI) return null
  try {
    const options = env.AI_GATEWAY_ID ? { gateway: { id: env.AI_GATEWAY_ID } } : undefined
    const out = (await env.AI.run(
      WORKERS_AI_MODEL,
      { messages, temperature, max_tokens: 1500, response_format: { type: 'json_object' } },
      options
    )) as { response?: unknown }
    return asText(out?.response)
  } catch (err) {
    console.error('Falha no Workers AI:', err)
    return null
  }
}

async function runDeepInfra(env: LLMEnv, messages: ChatMessage[], temperature: number): Promise<string | null> {
  if (!env.DEEPINFRA_API_KEY) return null
  try {
    const res = await fetch('https://api.deepinfra.com/v1/openai/chat/completions', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${env.DEEPINFRA_API_KEY}` },
      body: JSON.stringify({ model: DEEPINFRA_MODEL, messages, temperature, response_format: { type: 'json_object' } })
    })
    if (!res.ok) {
      console.error('DeepInfra error status:', res.status)
      return null
    }
    const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> }
    return data.choices?.[0]?.message?.content || null
  } catch (err) {
    console.error('Falha na chamada DeepInfra:', err)
    return null
  }
}

/** Pede um JSON ao modelo. Retorna o texto bruto ou null se nenhum provedor responder. */
export async function chatJSON(env: LLMEnv, messages: ChatMessage[], temperature = 0.2): Promise<string | null> {
  return (await runWorkersAI(env, messages, temperature)) ?? (await runDeepInfra(env, messages, temperature))
}
