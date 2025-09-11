interface ChatFormProps {
  action: string;
  model: string;
  isPromptEmpty: boolean;
  isTemporaryChat: boolean;
}

type OptionItem = { value: string; label: string };
type ModelGroup = { label: string; options: OptionItem[] };

const MODEL_GROUPS: readonly ModelGroup[] = [
  {
    label: 'Mistral',
    options: [
      { value: 'mistral:mistral-medium-latest', label: 'mistral medium latest' },
      { value: 'mistral:mistral-small-latest',  label: 'mistral small latest' },
      { value: 'mistral:codestral-latest',      label: 'codestral latest' },
    ],
  },
  {
    label: 'Groq',
    options: [
      { value: 'groq:meta-llama/llama-4-maverick-17b-128e-instruct', label: 'llama-4-maverick-17b-128e-instruct' },
      { value: 'groq:openai/gpt-oss-120b',                           label: 'gpt-oss-120b' },
      { value: 'groq:moonshotai/kimi-k2-instruct-0905',              label: 'kimi-k2-instruct-0905' },
    ],
  },
] as const;

export function ChatForm({ action, model, isPromptEmpty, isTemporaryChat }: ChatFormProps) {
  // si el model recibido no existe en las opciones, cae al primero de la lista
  const hasModel =
    MODEL_GROUPS.some(g => g.options.some(o => o.value === model));
  const defaultModel = hasModel
    ? model
    : MODEL_GROUPS[0]?.options[0]?.value ?? '';

  return (
    <section class={`chat-form ${isPromptEmpty ? 'chat-form__invalid' : ''}`}>
      <form action={action} method="post" autoComplete="off" noValidate>
        <label htmlFor="prompt-input" class="sr-only">Enter your prompt</label>
        <textarea
          id="prompt-input"
          class={`chat-form__input ${isPromptEmpty ? 'chat-form__input--invalid' : ''}`}
          name="prompt"
          placeholder={isPromptEmpty ? 'The message cannot be empty…' : 'Ask something…'}
          aria-label="Chat input"
          rows={1}
          required
        ></textarea>

        {/*<input type="hidden" name="session" value={sessionId} id="session-uuid"/>*/}
        <input id="temporary-toggle" class="switch__input" type="checkbox" name="temporary-chat" hidden checked={isTemporaryChat} />

        <div class="chat-form__controls">
          <div class="chat-form__select-wrapper">
            <label htmlFor="model-select" class="sr-only">Model</label>

            {/* Usamos defaultValue para preseleccionar, permitiendo que el usuario cambie el valor */}
            <select
              id="model-select"
              name="model"
              class="chat-form__select"
              aria-label="Model selector"
              defaultValue={defaultModel}
            >
              {MODEL_GROUPS.map(group => (
                <optgroup key={group.label} label={group.label}>
                  {group.options.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <button type="submit" class="chat-form__submit button button--primary">
            <svg width="38" height="38" viewBox="-6 -8 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22 2L11 13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
      </form>
    </section>
  );
}
