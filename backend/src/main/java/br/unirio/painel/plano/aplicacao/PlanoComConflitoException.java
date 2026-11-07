package br.unirio.painel.plano.aplicacao;

import br.unirio.painel.oferta.dominio.ConflitoDeHorario;
import java.util.List;

/** O plano tem choques de horário e, por regra do servidor, não é gravado. */
public class PlanoComConflitoException extends RuntimeException {

    private final transient List<ConflitoDeHorario> conflitos;

    public PlanoComConflitoException(List<ConflitoDeHorario> conflitos) {
        super("Não foi possível salvar seu plano porque existem conflitos de horários entre as turmas selecionadas.");
        this.conflitos = List.copyOf(conflitos);
    }

    public List<ConflitoDeHorario> conflitos() { return conflitos; }
}
