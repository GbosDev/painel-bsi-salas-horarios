package br.unirio.painel.compartilhado;

import java.util.Optional;

/**
 * API pública do módulo catálogo para os módulos que guardam apenas a referência (id) de um curso:
 * evita que plano, importação e auditoria dependam das entidades JPA do catálogo.
 */
public interface ReferenciasDeCurso {

    Optional<Long> idPorCodigo(String codigo);

    Optional<Referencia> porId(long id);

    record Referencia(long id, String codigo, String nome) { }
}
