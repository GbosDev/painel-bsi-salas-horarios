package br.com.bussola.backend.infrastructure.adapter.out.persistence.mysql.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

@Embeddable
public class WeeklySlotEmbeddable {

    @Column(name = "day_num", nullable = false)
    private int dayNum;

    @Column(name = "day_label", length = 20)
    private String dayLabel;

    @Column(name = "day_short", length = 10)
    private String dayShort;

    @Column(nullable = false)
    private int hour;

    protected WeeklySlotEmbeddable() {}

    public WeeklySlotEmbeddable(int dayNum, String dayLabel, String dayShort, int hour) {
        this.dayNum = dayNum;
        this.dayLabel = dayLabel;
        this.dayShort = dayShort;
        this.hour = hour;
    }

    public int getDayNum() { return dayNum; }
    public String getDayLabel() { return dayLabel; }
    public String getDayShort() { return dayShort; }
    public int getHour() { return hour; }
}
