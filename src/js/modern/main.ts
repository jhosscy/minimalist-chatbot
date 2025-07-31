const chatForm = document.querySelector('#chat-form') as HTMLFormElement;
const promptInput = document.querySelector('#prompt-input') as HTMLTextAreaElement;
const chatHistoryContainer = document.querySelector('.chat-history') as HTMLElement;

function disableSubmitButton(form: HTMLFormElement, disabled: boolean = true): void {
  const submitButton = form.querySelector('button[type="submit"]') as HTMLButtonElement;
  if (submitButton) {
    submitButton.disabled = disabled;
  }
}

function removeLoadingIndicator(element: HTMLElement): void {
  const loadingIndicator = element?.querySelector('article[data-loading]');
  if (loadingIndicator) {
    loadingIndicator.remove();
  }
}

function scrollToBottom(): void {
  const scrollableContainer = chatHistoryContainer?.parentNode as HTMLElement;
  if (scrollableContainer) {
    scrollableContainer.scrollTop = scrollableContainer.scrollHeight;
  }
}

function handleOutOfBandSwap(chunk: string, formElement: HTMLFormElement): string {
  const tempContainer = document.createElement('div');
  tempContainer.innerHTML = chunk;
  
  const outOfBandElements = tempContainer.querySelectorAll('[swap-oob]');
  outOfBandElements.forEach((oobElement) => {
    const oobElementWithId = oobElement as HTMLElement;
    if (oobElementWithId.id) {
      const existingElement = formElement.querySelector(`#${oobElementWithId.id}`);
      if (existingElement) {
        existingElement.replaceWith(oobElementWithId);
      }
    }
  });
  
  return tempContainer.innerHTML;
}

function addMessageToChat(htmlFragment: string): void {
  chatHistoryContainer?.insertAdjacentHTML('beforeend', htmlFragment);
  scrollToBottom();
}

let isSending = false;
chatForm?.addEventListener('submit', async (event: SubmitEvent): Promise<void> => {
  event.preventDefault();
  if (isSending) return;
  isSending = true;
  
  const formElement = event.target as HTMLFormElement;
  const formData = new FormData(formElement);
  
  disableSubmitButton(formElement);
  
  try {
    const chatResponse = await fetch(`${API_BASE}/chat-message`, {
      method: 'POST',
      body: formData
    });
    
    const responseStream = chatResponse.body!.pipeThrough(new TextDecoderStream()) as unknown as AsyncIterable<string>;

    let isFirstChunk = true;
    let bufferFragment = '';
    for await (const streamChunk of responseStream) {
      if (!streamChunk.trim()) continue;
      
      const start = streamChunk.indexOf('<article') >>> 0;
      const end = streamChunk.lastIndexOf('<!--') >>> 0;
      bufferFragment += streamChunk.slice(start, end);
      
      if (streamChunk.includes('swap-oob')) {
        bufferFragment = handleOutOfBandSwap(bufferFragment, formElement);
      }

      if ((bufferFragment.match(/<article\b[^>]*\bclass="[^"]*\bchat-message--assistant\b[^"]*"[^>]*>/g) || []).length === 2) {
        const tempContainer = document.createElement('div');
        tempContainer.innerHTML = bufferFragment;
        removeLoadingIndicator(tempContainer);
        bufferFragment = tempContainer.innerHTML
      }

      if (!isFirstChunk) {
        chatHistoryContainer.lastElementChild?.remove();
        chatHistoryContainer.lastElementChild?.remove();
      }
      
      addMessageToChat(bufferFragment);

      if (isFirstChunk) {
        formElement.reset();
        isFirstChunk = false;
      }
    }
    
  } catch (error) {
    console.error('Error al procesar el mensaje del chat:', error);
  } finally {
    disableSubmitButton(formElement, false);
    isSending = false;
  }
});

promptInput?.addEventListener('keydown', (event: KeyboardEvent): void => {
  if (event.ctrlKey && event.key === 'Enter') {
    event.preventDefault();
    chatForm.requestSubmit();
  }
});
//const data = Object.fromEntries(formData.entries());
