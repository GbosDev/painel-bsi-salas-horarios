import type { KeyboardEvent } from 'react';

/** Faz um elemento com role="button" responder a Enter e Espaço como um botão nativo. */
export function aoAtivar(acao: () => void) {
  return (ev: KeyboardEvent) => {
    if (ev.key === 'Enter' || ev.key === ' ') {
      ev.preventDefault();
      acao();
    }
  };
}
