interface ToastProps {
  message: string;
  icon: 'warning' | 'info' | 'success';
  tone: 'warning' | 'info' | 'success';
  role: 'alert' | 'status';
}

const ICONS = {
  warning: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M12 9v4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M12 17h.01" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M10.29 3.86 2.82 17.63A1.8 1.8 0 0 0 4.4 20.3h15.2a1.8 1.8 0 0 0 1.58-2.67L13.71 3.86a1.8 1.8 0 0 0-3.42 0Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" />
    </svg>
  ),
  info: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8" />
      <path d="M11 11h2v6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M12 7h.01" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  ),
  success: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="m5 13 4 4 10-10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" />
    </svg>
  ),
};

export function Toast({ message, icon, tone, role }: ToastProps) {
  const iconMarkup = ICONS[icon];

  return (
    <div class={`toast toast--${tone}`} role={role}>
      <span class="toast__icon" aria-hidden="true">{iconMarkup}</span>
      <p class="toast__message">{message}</p>
    </div>
  );
}
