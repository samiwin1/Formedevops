package tn.esprit.forme.modules.user.entity;

public enum Profession {
    STUDENT,
    DEVELOPER,
    OTHER,
    ADMIN,
    EVALUATOR,
    UNKNOWN; // Add this as a fallback

    public static Profession fromString(String value) {
        if (value == null || value.trim().isEmpty()) {
            return UNKNOWN;
        }
        try {
            return Profession.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            return UNKNOWN;
        }
    }
}