package tn.esprit.forme.modules.user.contoller;

import tn.esprit.forme.modules.user.dto.UserSuccessPredictionRequest;
import tn.esprit.forme.modules.user.dto.UserSuccessPredictionResponse;
import tn.esprit.forme.modules.user.service.UserSuccessPredictionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * REST endpoint consumed by the Angular UserSuccessPredictorComponent.
 *
 * POST /admin/dashboard/predict/user-success
 *
 * Requires ADMIN or SUPER_ADMIN role (JWT Bearer token) — consistent with
 * the existing DashboardStatsController security model.
 *
 * The Angular component automatically falls back to local simulation if
 * this endpoint is unreachable, so the UI always works during development.
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/admin/dashboard")

public class UserSuccessPredictionController {

    private final UserSuccessPredictionService predictionService;

    /**
     * Run success prediction for a DSO user profile.
     *
     * Request body: UserSuccessPredictionRequest (all fields validated)
     * Response:     UserSuccessPredictionResponse with LR + LightGBM probs,
     *               cluster assignment, and personalised recommendation.
     */
    @PostMapping("/predict/user-success")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<UserSuccessPredictionResponse> predictUserSuccess(
            @Valid @RequestBody UserSuccessPredictionRequest request) {

        UserSuccessPredictionResponse response = predictionService.predict(request);
        return ResponseEntity.ok(response);
    }
}
