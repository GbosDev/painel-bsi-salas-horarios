package br.unirio.painel.catalogo.aplicacao;

import br.unirio.painel.catalogo.dominio.Curso;
import br.unirio.painel.catalogo.dominio.SalaDoCatalogo;
import java.util.List;
import java.util.Optional;

/** Porta de saída: cursos, centros e catálogo de salas. */
public interface RepositorioDeCatalogo {

    List<Curso> cursos();

    Optional<Curso> curso(String codigo);

    List<SalaDoCatalogo> salasDoCurso(String cursoCodigo);

    boolean salaExisteNoCurso(String cursoCodigo, String nomeDaSala);

    /** Cria a sala no centro (se não existir) e a inclui no catálogo do curso. Devolve false se já estava no catálogo. */
    boolean adicionarSala(String cursoCodigo, String nomeDaSala);

    Optional<SalaDoCatalogo> salaDoCurso(String cursoCodigo, long salaId);

    void removerSalaDoCurso(String cursoCodigo, long salaId);
}
