const chatForm = document.querySelector('#chat-form') as HTMLFormElement;
const promptInput = document.querySelector('#prompt-input') as HTMLTextAreaElement;
const chatHistoryContainer = document.querySelector('.chat-history') as HTMLElement;

function disableSubmitButton(form: HTMLFormElement, disabled: boolean = true): void {
  const submitButton = form.querySelector('button[type="submit"]') as HTMLButtonElement;
  if (submitButton) {
    submitButton.disabled = disabled;
  }
}

function removeLoadingIndicator(): void {
  const loadingIndicator = chatHistoryContainer?.querySelector('article[data-loading]');
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
  removeLoadingIndicator();
  chatHistoryContainer?.insertAdjacentHTML('beforeend', htmlFragment);
  scrollToBottom();
}


chatForm?.addEventListener('submit', async (event: SubmitEvent): Promise<void> => {
  event.preventDefault();
  
  const formElement = event.target as HTMLFormElement;
  const formData = new FormData(formElement);
  
  formElement.reset();
  disableSubmitButton(formElement);
  
  try {
    const chatResponse = await fetch('/chat-message', {
      method: 'POST',
      headers: {
        'Accept-Encoding': 'gzip'
      },
      body: formData
    });
    
    const responseStream = chatResponse.body!.pipeThrough(new TextDecoderStream()) as unknown as AsyncIterable<string>;
    
    for await (const streamChunk of responseStream) {
      if (!streamChunk.trim()) continue;
      
      let htmlFragment = streamChunk;
      
      if (streamChunk.includes('swap-oob')) {
        htmlFragment = handleOutOfBandSwap(streamChunk, formElement);
      }
      
      addMessageToChat(htmlFragment);
    }
    
  } catch (error) {
    console.error('Error al procesar el mensaje del chat:', error);
  } finally {
    disableSubmitButton(formElement, false);
  }
});

  //const data = Object.fromEntries(formData.entries());
promptInput?.addEventListener('keydown', (event: KeyboardEvent): void => {
  if (event.ctrlKey && event.key === 'Enter') {
    event.preventDefault();
    chatForm.requestSubmit();
  }
});
