import type { UseFormRegisterReturn } from 'react-hook-form';

/** Motivo obrigatório de todo ajuste excepcional: fica registrado no histórico. */
export function CampoMotivo({ registro, erro }: { registro: UseFormRegisterReturn; erro?: string }) {
  return (
    <div className="xf-field xf-wide">
      <label htmlFor="ajuste-motivo">Motivo (obrigatório — fica no histórico)</label>
      <textarea
        id="ajuste-motivo"
        rows={2}
        aria-invalid={!!erro}
        placeholder="Ex.: troca de sala por conflito de reserva para prova extra em 12/11."
        {...registro}
      />
      {erro && (
        <div className="campo-erro" role="alert">
          {erro}
        </div>
      )}
    </div>
  );
}
