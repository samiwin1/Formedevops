package tn.esprit.forme.modules.user.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.util.List;

/**
 * Payload sent from the Angular UserSuccessPredictorComponent form.
 * Maps directly to the PredictionInput interface in the TypeScript component.
 */
@Data
public class UserSuccessPredictionRequest {

    /** Optional: if provided, userId is logged for audit / future model retraining. */
    private Long userId;

    /** 1 = 18-24 | 2 = 25-34 | 3 = 35-44 | 4 = 45+ */
    @Min(1) @Max(4)
    private int ageGroup = 2;

    /** 1 = High school | 2 = Bachelor | 3 = Master | 4 = PhD */
    @Min(1) @Max(4)
    private int educationLevel = 2;

    /** Weekly hours dedicated to studying (1–40) */
    @Min(1) @Max(40)
    private int weeklyHours = 8;

    /** Total DSO courses completed */
    @Min(0) @Max(100)
    private int coursesCompleted = 0;

    /** Average assessment score as a percentage (0–100) */
    @Min(0) @Max(100)
    private int avgAssessmentScore = 0;

    /** 1 = Low | 2 = Medium | 3 = High */
    @Min(1) @Max(3)
    private int engagementLevel = 2;

    /** 0 = None | 1 = Some | 2 = Extensive */
    @Min(0) @Max(2)
    private int priorExperience = 0;

    /** Selected skill tags (e.g. ["Python", "SQL", "ML"]) */
    private List<String> skills = List.of();
}
