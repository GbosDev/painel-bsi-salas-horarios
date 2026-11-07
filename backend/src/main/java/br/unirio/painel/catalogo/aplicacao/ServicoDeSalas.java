package br.unirio.painel.catalogo.aplicacao;

import br.unirio.painel.auditoria.aplicacao.RepositorioDeAuditoria;
import br.unirio.painel.auditoria.dominio.Autor;
import br.unirio.painel.auditoria.dominio.RegistroDeAuditoria;
import br.unirio.painel.auditoria.dominio.TipoDeAlteracao;
import br.unirio.painel.catalogo.dominio.Curso;
import br.unirio.painel.catalogo.dominio.SalaDoCatalogo;
import br.unirio.painel.compartilhado.ErroDeNegocio;
import br.unirio.painel.compartilhado.Textos;
import java.time.Clock;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Gestão do catálogo de salas de um curso (uso excepcional, sempre auditado). */
@Service
public class ServicoDeSalas {

    private final RepositorioDeCatalogo catalogo;
    private final RepositorioDeAuditoria auditoria;
    private final Clock relogio;

    public ServicoDeSalas(RepositorioDeCatalogo catalogo, RepositorioDeAuditoria auditoria, Clock relogio) {
        this.catalogo = catalogo;
        this.auditoria = auditoria;
        this.relogio = relogio;
    }

    @Transactional
    public void adicionar(String cursoCodigo, String nomeBruto, Autor autor) {
        Curso curso = curso(cursoCodigo);
        String nome = Textos.limpar(nomeBruto);
        if (nome.isEmpty() || nome.length() > 60) {
            throw ErroDeNegocio.invalido("sala_nome_invalido", "Informe o nome da sala (até 60 caracteres).");
        }
        if (!catalogo.adicionarSala(cursoCodigo, nome)) {
            throw ErroDeNegocio.conflito("sala_ja_existe", "A sala \"" + nome + "\" já está no catálogo deste curso.", List.of());
        }
        auditoria.registrar(new RegistroDeAuditoria(null, relogio.instant(), autor, curso.codigo(), curso.nome(),
                TipoDeAlteracao.SALA_ADICIONADA, null, "—", "Catálogo de salas", "Sala adicionada",
                Map.of(), Map.of("sala", nome), null));
    }

    @Transactional
    public void remover(String cursoCodigo, long salaId, Autor autor) {
        Curso curso = curso(cursoCodigo);
        SalaDoCatalogo sala = catalogo.salaDoCurso(cursoCodigo, salaId)
                .orElseThrow(() -> ErroDeNegocio.naoEncontrado("sala_nao_encontrada", "Sala não encontrada neste curso."));
        if (sala.turmasEmUso() > 0) {
            throw ErroDeNegocio.conflito("sala_em_uso",
                    "A sala \"" + sala.nome() + "\" está em uso por " + sala.turmasEmUso() + " turma(s) e não pode ser removida.", List.of());
        }
        catalogo.removerSalaDoCurso(cursoCodigo, salaId);
        auditoria.registrar(new RegistroDeAuditoria(null, relogio.instant(), autor, curso.codigo(), curso.nome(),
                TipoDeAlteracao.SALA_REMOVIDA, null, "—", "Catálogo de salas", "Sala removida",
                Map.of("sala", sala.nome()), Map.of(), null));
    }

    private Curso curso(String codigo) {
        return catalogo.curso(codigo)
                .orElseThrow(() -> ErroDeNegocio.naoEncontrado("curso_nao_encontrado", "Curso não encontrado: " + codigo));
    }
}
