package br.com.bussola.backend.domain.course;

/**
 * Value object identifying a course by its slug (e.g. "bsi", "eng", "ibio-bcb"),
 * mirroring the ids used across the legacy BUSSOLA_COURSES/BUSSOLA_DATASETS maps.
 */
public record CourseId(String value) {
    public CourseId {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("CourseId não pode ser vazio");
        }
        value = value.trim().toLowerCase();
    }

    public static CourseId of(String value) {
        return new CourseId(value);
    }

    @Override
    public String toString() {
        return value;
    }
}
