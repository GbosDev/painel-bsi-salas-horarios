package br.unirio.painel.auditoria.aplicacao;

import br.unirio.painel.auditoria.dominio.RegistroDeAuditoria;
import br.unirio.painel.auditoria.dominio.TipoDeAlteracao;
import java.time.Instant;
import java.util.List;

/** Porta de saída: persistência do histórico de alterações. */
public interface RepositorioDeAuditoria {

    void registrar(RegistroDeAuditoria registro);

    List<RegistroDeAuditoria> consultar(FiltroDeAuditoria filtro);

    record FiltroDeAuditoria(String cursoCodigo, TipoDeAlteracao tipo, Instant desde, String texto, int limite) { }
}
