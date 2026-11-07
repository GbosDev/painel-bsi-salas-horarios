package br.unirio.painel.catalogo.aplicacao;

import br.unirio.painel.catalogo.dominio.Curso;
import br.unirio.painel.compartilhado.ErroDeNegocio;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ConsultaDeCatalogo {

    private final RepositorioDeCatalogo catalogo;

    public ConsultaDeCatalogo(RepositorioDeCatalogo catalogo) {
        this.catalogo = catalogo;
    }

    @Transactional(readOnly = true)
    public List<Curso> cursos() {
        return catalogo.cursos();
    }

    @Transactional(readOnly = true)
    public Curso curso(String codigo) {
        return catalogo.curso(codigo)
                .orElseThrow(() -> ErroDeNegocio.naoEncontrado("curso_nao_encontrado", "Curso não encontrado: " + codigo));
    }
}
