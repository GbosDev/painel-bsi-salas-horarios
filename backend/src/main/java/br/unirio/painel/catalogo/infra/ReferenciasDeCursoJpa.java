package br.unirio.painel.catalogo.infra;

import br.unirio.painel.compartilhado.ReferenciasDeCurso;
import java.util.Optional;
import org.springframework.stereotype.Component;

@Component
class ReferenciasDeCursoJpa implements ReferenciasDeCurso {

    private final CursoJpaRepository cursos;

    ReferenciasDeCursoJpa(CursoJpaRepository cursos) {
        this.cursos = cursos;
    }

    @Override
    public Optional<Long> idPorCodigo(String codigo) {
        return cursos.findByCodigo(codigo).map(CursoJpa::getId);
    }

    @Override
    public Optional<Referencia> porId(long id) {
        return cursos.findById(id).map(c -> new Referencia(c.getId(), c.getCodigo(), c.getNome()));
    }
}
