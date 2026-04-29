package tn.esprit.forme.modules.user.service;

import tn.esprit.forme.modules.user.dto.UserSuccessPredictionRequest;
import tn.esprit.forme.modules.user.dto.UserSuccessPredictionResponse;
import tn.esprit.forme.modules.user.entity.User;
import tn.esprit.forme.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * UserSuccessPredictionService
 * ─────────────────────────────
 * Implements the same two-model pipeline as the DSO notebook:
 *   Model A — Logistic Regression   (linear baseline, interpretable)
 *   Model B — LightGBM              (gradient boosting, non-linear)
 *
 * Running in SIMULATION MODE until a real Python ML server is connected.
 * To plug in real models, implement the callPythonMlServer() stub below
 * To plug in real models, implement the callPythonMlServer() stub below
 * and set simulationMode = false in the response.
 *
 * Cluster definitions mirror the notebook's KMeans output:
 *   0 = Explorer  | 1 = Achiever | 2 = At-Risk | 3 = Expert
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class UserSuccessPredictionService {

    private final UserRepository userRepository;

    // ── Cluster metadata ──────────────────────────────────────────────────────

    private static final Map<Integer, String[]> CLUSTERS = Map.of(
        0, new String[]{"Explorer",  "New learner with high curiosity but limited completion history. Needs onboarding nudges."},
        1, new String[]{"Achiever",  "Consistent engagement and strong assessment performance. High success probability."},
        2, new String[]{"At-Risk",   "Declining engagement trend detected. Proactive intervention recommended."},
        3, new String[]{"Expert",    "High experience, rapid completion rate. Ideal mentor candidate."}
    );

    private static final List<String> ALL_SKILLS = List.of(
        "Python", "Machine Learning", "SQL", "Data Visualisation",
        "Statistics", "Deep Learning", "NLP", "Cloud", "Excel", "R"
    );

    // ── Public API ────────────────────────────────────────────────────────────

    public UserSuccessPredictionResponse predict(UserSuccessPredictionRequest req) {

        // Optional: enrich request with real DB data if userId is provided
        if (req.getUserId() != null) {
            Optional<User> user = userRepository.findById(req.getUserId());
            user.ifPresent(u -> log.info(
                "Prediction requested for user {} ({} {})",
                u.getId(), u.getFirstName(), u.getLastName()
            ));
        }

        // Feature vector (all values normalised to [0, 1])
        double[] features = buildFeatureVector(req);

        // ── Option A: Call real Python ML server (plug in when ready) ─────────
        // return callPythonMlServer(req, features);

        // ── Option B: Built-in simulation (active by default) ─────────────────
        return simulateLocally(req, features);
    }

    // ── Feature engineering ───────────────────────────────────────────────────

    /**
     * Normalises all inputs to [0, 1] — mirrors the StandardScaler step
     * used in the notebook's classification pipeline.
     */
    private double[] buildFeatureVector(UserSuccessPredictionRequest req) {
        double h  = req.getWeeklyHours()        / 40.0;
        double s  = req.getAvgAssessmentScore() / 100.0;
        double c  = req.getCoursesCompleted()   / 20.0;
        double e  = (req.getEngagementLevel() - 1) / 2.0;
        double ex = req.getPriorExperience()    / 2.0;
        double ed = (req.getEducationLevel() - 1) / 3.0;
        double sk = (double) req.getSkills().size() / ALL_SKILLS.size();

        // Feature order: [hours, score, courses, engagement, experience, education, skills]
        return new double[]{h, s, c, e, ex, ed, sk};
    }

    // ── Simulation (built-in fallback) ────────────────────────────────────────

    /**
     * Logistic Regression simulation:
     *   Weighted linear combination of normalised features — same weights
     *   as a manually-tuned LR model on DSO-style data.
     *
     * LightGBM simulation:
     *   Applies a small non-linear boost to the base score, simulating the
     *   gain a gradient boosting model typically achieves over a linear baseline.
     */
    private UserSuccessPredictionResponse simulateLocally(
            UserSuccessPredictionRequest req,
            double[] f) {

        // Logistic Regression: weighted sum → sigmoid
        double[] weights = {0.20, 0.25, 0.15, 0.15, 0.10, 0.10, 0.05};
        double linearScore = 0.0;
        for (int i = 0; i < weights.length; i++) linearScore += weights[i] * f[i];

        double probLr   = clamp(sigmoid(linearScore * 4 - 1.5), 0.05, 0.95);

        // LightGBM: adds a non-linear interaction bonus
        double interactionBonus = f[1] * f[2] * 0.08; // score × courses
        double probLgbm = clamp(probLr * 1.05 + interactionBonus + 0.02, 0.05, 0.97);

        int cluster = assignCluster(req);
        String recommendation = buildRecommendation(probLgbm, cluster, req);

        return UserSuccessPredictionResponse.builder()
                .probLogistic(round2(probLr))
                .probLgbm(round2(probLgbm))
                .cluster(cluster)
                .clusterLabel(CLUSTERS.get(cluster)[0])
                .clusterDescription(CLUSTERS.get(cluster)[1])
                .recommendation(recommendation)
                .simulationMode(true)
                .build();
    }

    // ── Cluster assignment ────────────────────────────────────────────────────

    /**
     * Rule-based cluster assignment — mirrors the notebook's KMeans centroids.
     * Replace with a real model.predict() call once you serialise the clustering model.
     */
    private int assignCluster(UserSuccessPredictionRequest req) {
        int courses = req.getCoursesCompleted();
        int score   = req.getAvgAssessmentScore();
        int hours   = req.getWeeklyHours();
        int eng     = req.getEngagementLevel();

        if (courses < 2 && eng < 2)   return 0; // Explorer
        if (score > 72 && eng >= 2)   return 1; // Achiever
        if (hours < 4  || eng == 1)   return 2; // At-Risk
        return 3;                                // Expert
    }

    // ── Recommendation engine ─────────────────────────────────────────────────

    private String buildRecommendation(double probLgbm, int cluster, UserSuccessPredictionRequest req) {
        int pct = (int) Math.round(probLgbm * 100);

        if (cluster == 2)
            return "At-Risk user detected (" + pct + "% success). Schedule a follow-up session or assign a mentor.";
        if (cluster == 3)
            return "Expert profile (" + pct + "% success). Consider inviting this user to lead peer sessions.";
        if (req.getWeeklyHours() < 5)
            return "Low study hours detected. A weekly reminder campaign could significantly improve outcomes.";
        if (req.getAvgAssessmentScore() < 60)
            return "Assessment average below 60%. Review module difficulty and consider remedial content.";
        if (pct >= 75)
            return "Strong success signal (" + pct + "%). User is on track — maintain current engagement strategy.";

        return "Moderate success probability (" + pct + "%). Targeted support could make a significant difference.";
    }

    // ── Math helpers ──────────────────────────────────────────────────────────

    private double sigmoid(double x) { return 1.0 / (1.0 + Math.exp(-x)); }

    private double clamp(double v, double min, double max) {
        return Math.max(min, Math.min(max, v));
    }

    private double round2(double v) { return Math.round(v * 100.0) / 100.0; }

    // ── Stub: real Python ML server call ─────────────────────────────────────

    /**
     * TODO: Once you serialise your trained models in the notebook with:
     *
     *   import joblib, os
     *   os.makedirs("models", exist_ok=True)
     *   joblib.dump(lr_model,   "models/logistic_regression.pkl")
     *   joblib.dump(lgbm_model, "models/lightgbm.pkl")
     *
     * Run a minimal FastAPI wrapper:
     *

     * Then replace the simulateLocally() call in predict() with:
     *
     *   return callPythonMlServer(req, features);
     *
     * and implement the HTTP call here using RestClient (Spring Boot 4).
     */
    @SuppressWarnings("unused")

    private UserSuccessPredictionResponse callPythonMlServer(
            UserSuccessPredictionRequest req,
            double[] features) {

        // Example with Spring Boot 4 RestClient:
        // RestClient client = RestClient.create();
        // return client.post()
        //     .uri("http://localhost:8081/predict")
        //     .body(req)
        //     .retrieve()
        //     .body(UserSuccessPredictionResponse.class);

        throw new UnsupportedOperationException("Python ML server not yet connected.");
    }
}
