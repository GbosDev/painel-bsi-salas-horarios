import {
  useFieldArray,
  type Control,
  type FieldValues,
  type Path,
  type UseFormRegister,
  type UseFormSetValue,
  type UseFormWatch,
  type FieldArray,
} from 'react-hook-form';
import { DIAS, DIA_LONGO, deMinutos, paraMinutos } from '../../../../shared/lib/horarios';

const HORAS = Array.from({ length: 17 }, (_, i) => 6 + i); // 06:00 … 22:00

interface ComHorarios extends FieldValues {
  horarios: { diaSemana: number; inicio: string; fim: string }[];
}

interface Props<T extends ComHorarios> {
  control: Control<T>;
  register: UseFormRegister<T>;
  watch: UseFormWatch<T>;
  setValue: UseFormSetValue<T>;
  duracao: number;
  mensagemDeErro?: string;
}

/** Lista editável de horários semanais (dia + início + fim), com campo para cada um e remoção individual. */
export function SeletorDeHorarios<T extends ComHorarios>({
  control,
  register,
  watch,
  setValue,
  duracao,
  mensagemDeErro,
}: Props<T>) {
  const { fields, append, remove } = useFieldArray({ control, name: 'horarios' as never });
  const nome = (i: number, campo: 'diaSemana' | 'inicio' | 'fim') => `horarios.${i}.${campo}` as Path<T>;

  return (
    <div className="xf-wide">
      <span className="xf-lbl" id="rotulo-horarios">
        Horários semanais
      </span>
      <div className="xf-sessions" role="group" aria-labelledby="rotulo-horarios">
        {fields.length === 0 && (
          <div className="xf-empty">Sem horário fixo. Use “+ adicionar horário” se a turma tiver aulas semanais.</div>
        )}
        {fields.map((campo, i) => {
          const inicioAtual = String(watch(nome(i, 'inicio')) ?? '14:00');
          const fimAtual = String(watch(nome(i, 'fim')) ?? '');
          const ini = Math.floor(paraMinutos(inicioAtual) / 60);
          // inclui o valor atual mesmo quando ele não está na grade de horas cheias (ex.: 15:30 vindo de importação)
          const opcoesInicio = HORAS.map((h) => deMinutos(h * 60));
          if (!opcoesInicio.includes(inicioAtual)) opcoesInicio.push(inicioAtual);
          const opcoesFim = Array.from({ length: 23 - ini }, (_, k) => deMinutos((ini + 1 + k) * 60));
          if (fimAtual && !opcoesFim.includes(fimAtual)) opcoesFim.push(fimAtual);
          return (
            <div className="xf-session" key={campo.id}>
              <select
                aria-label={`Dia do horário ${i + 1}`}
                {...register(nome(i, 'diaSemana'), { valueAsNumber: true })}
              >
                {DIAS.map((d) => (
                  <option key={d} value={d}>
                    {DIA_LONGO[d]}
                  </option>
                ))}
              </select>
              <select
                aria-label={`Início do horário ${i + 1}`}
                {...register(nome(i, 'inicio'), {
                  onChange: (e: { target: { value: string } }) => {
                    const novo = Math.floor(paraMinutos(e.target.value) / 60);
                    setValue(nome(i, 'fim'), deMinutos((novo + duracao) * 60) as never, { shouldValidate: true });
                  },
                })}
              >
                {opcoesInicio.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
              <select aria-label={`Fim do horário ${i + 1}`} {...register(nome(i, 'fim'))}>
                {opcoesFim.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="xf-del"
                aria-label={`Remover horário ${i + 1}`}
                title="Remover horário"
                onClick={() => remove(i)}
              >
                ×
              </button>
            </div>
          );
        })}
      </div>
      {mensagemDeErro && (
        <div className="campo-erro" role="alert">
          {mensagemDeErro}
        </div>
      )}
      <button
        type="button"
        className="edit-add-session"
        onClick={() =>
          append({ diaSemana: 1, inicio: '14:00', fim: deMinutos((14 + duracao) * 60) } as unknown as FieldArray<
            T,
            never
          >)
        }
      >
        + adicionar horário
      </button>
    </div>
  );
}
