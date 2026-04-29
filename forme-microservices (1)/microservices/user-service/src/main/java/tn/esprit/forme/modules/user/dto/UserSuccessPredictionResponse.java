package tn.esprit.forme.modules.user.dto;

import lombok.Builder;
import lombok.Data;

/**
 * Returned to the Angular UserSuccessPredictorComponent.
 * Maps to the PredictionResult interface in the TypeScript component.
 */
@Data
@Builder
public class UserSuccessPredictionResponse {

    /** Logistic Regression success probability (0.0 – 1.0) */
    double probLogistic;

    /** LightGBM success probability (0.0 – 1.0) */
    double probLgbm;

    /**
     * User profile cluster index:
     *   0 = Explorer | 1 = Achiever | 2 = At-Risk | 3 = Expert
     */
    int cluster;

    /** Human-readable cluster name */
    String clusterLabel;

    /** One-line cluster description */
    String clusterDescription;

    /** Personalised recommendation for this user */
    String recommendation;

    /** Whether prediction came from real ML models or the built-in simulation */
    boolean simulationMode;
}
