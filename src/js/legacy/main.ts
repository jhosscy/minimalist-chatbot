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

function processFragment(fragment: string, formElement: HTMLFormElement) {
  let html = fragment;
  if (html.includes('swap-oob')) {
    html = handleOutOfBandSwap(html, formElement);
  }
  addMessageToChat(html);
}

chatForm?.addEventListener('submit', async (event: SubmitEvent): Promise<void> => {
  event.preventDefault();
  
  const formElement = event.target as HTMLFormElement;
  const formData = new FormData(formElement);
  
  disableSubmitButton(formElement);
  
  try {
    const chatResponse = await fetch('http://localhost:3001/chat-message', {
      method: 'POST',
      body: formData
    });
    
    const reader = chatResponse.body!.pipeThrough(new TextDecoderStream()).getReader();

    let isFirstFragment = true;
    let buffer = '';
    const BOUNDARY = '<!-- FRAGMENT_END -->';

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        if (buffer.trim()) processFragment(fragment, formElement);
        break;
      };

      buffer += value;

      let idx;
      while ((idx = buffer.indexOf(BOUNDARY)) !== -1) {
        const fragment = buffer.slice(0, idx);
        buffer = buffer.slice(idx + BOUNDARY.length);

        processFragment(fragment, formElement);

        if (isFirstFragment) {
          formElement.reset();
          isFirstFragment = false;
        }
      }
    }
  } catch (error) {
    console.error('Error al procesar el mensaje del chat:', error);
  } finally {
    disableSubmitButton(formElement, false);
  }
});

promptInput?.addEventListener('keydown', (event: KeyboardEvent): void => {
  if (event.ctrlKey && event.key === 'Enter') {
    event.preventDefault();
    chatForm.requestSubmit();
  }
});

promptInput?.addEventListener('input', () => {
  if (promptInput.scrollHeight <= parseFloat(getComputedStyle(promptInput).maxHeight)) {
    promptInput.style.height = 'auto';
    promptInput.style.height = `${promptInput.scrollHeight}px`;
  }
})
