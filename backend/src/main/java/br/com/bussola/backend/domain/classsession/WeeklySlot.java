package br.com.bussola.backend.domain.classsession;

/**
 * One weekly occurrence of a class: day of week (1-6, Monday-Saturday, matching
 * the legacy day_num convention) + the starting hour.
 */
public record WeeklySlot(int dayNum, String dayLabel, String dayShort, int hour) {

    public WeeklySlot {
        if (dayNum < 1 || dayNum > 7) {
            throw new IllegalArgumentException("Dia da semana inválido: " + dayNum);
        }
        if (hour < 0 || hour > 23) {
            throw new IllegalArgumentException("Hora inválida: " + hour);
        }
    }

    public boolean overlaps(WeeklySlot other) {
        return this.dayNum == other.dayNum && this.hour == other.hour;
    }
}
