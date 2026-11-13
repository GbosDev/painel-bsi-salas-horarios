package br.unirio.painel.configuracao;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.Instant;
import java.util.List;
import org.springframework.http.HttpStatus;

/**
 * Corpo padrão de todas as respostas de erro: Problem Details (RFC 9457, application/problem+json).
 * Campos padrão: type, title, status, detail, instance. Extensões: codigo (estável, para o front), detalhes, instante
 * e, só no 409 do plano, conflitos (dia, início, fim e turmas de cada choque).
 */
public record RespostaDeErro(String type, String title, int status, String detail, String instance,
                             String codigo, List<String> detalhes, Instant instante,
                             @JsonInclude(JsonInclude.Include.NON_NULL) List<Conflito> conflitos) {

    /** Um choque de horário do plano: dia 1..6, início/fim "HH:mm", ids e rótulos ("SIGLA — Nome") das turmas. */
    public record Conflito(int dia, String inicio, String fim, List<Long> turmaIds, List<String> turmas) { }

    public static RespostaDeErro de(HttpStatus status, String codigo, String detalhe, List<String> detalhes, String caminho) {
        return comConflitos(status, codigo, detalhe, detalhes, caminho, null);
    }

    public static RespostaDeErro comConflitos(HttpStatus status, String codigo, String detalhe, List<String> detalhes, String caminho,
                                             List<Conflito> conflitos) {
        return new RespostaDeErro("about:blank", status.getReasonPhrase(), status.value(), detalhe, caminho,
                codigo, detalhes == null ? List.of() : detalhes, Instant.now(), conflitos);
    }
}
