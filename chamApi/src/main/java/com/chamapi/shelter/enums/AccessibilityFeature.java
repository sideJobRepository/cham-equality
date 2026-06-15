package com.chamapi.shelter.enums;

import com.chamapi.shelter.entity.Shelter;
import com.chamapi.shelter.entity.ShelterAccessibility;

import java.util.function.Function;
import java.util.function.Predicate;

import static java.lang.Boolean.*;

public enum AccessibilityFeature {
    RAMP(fromAccessibility(ShelterAccessibility::getRamp)),                  // 경사로
    ELEVATOR(fromAccessibility(ShelterAccessibility::getElevator)),          // 엘리베이터
    BRAILLE_BLOCK(fromAccessibility(ShelterAccessibility::getBrailleBlock)); // 점자블록

    private final Predicate<Shelter> predicate;

    AccessibilityFeature(Predicate<Shelter> predicate) {
        this.predicate = predicate;
    }

    public boolean isSatisfiedBy(Shelter shelter) {
        return shelter != null && predicate.test(shelter);
    }

    private static Predicate<Shelter> fromAccessibility(Function<ShelterAccessibility, Boolean> extractor) {
        return s -> {
            ShelterAccessibility a = s.getAccessibility();
            return a != null && TRUE.equals(extractor.apply(a));
        };
    }
}
