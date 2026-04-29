package tn.esprit.forme.modules.dashboard.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import tn.esprit.forme.modules.dashboard.entity.NotificationType;

public class NotificationDto {

    @Data
    public static class CreateRequest {
        @NotBlank
        @Size(max = 120)
        private String title;

        @NotBlank
        @Size(max = 500)
        private String message;

        @NotNull
        private NotificationType type;

        @Size(max = 120)
        private String targetUserEmail; // optional — null = broadcast
    }

    @Data
    public static class Response {
        private Long id;
        private String title;
        private String message;
        private NotificationType type;
        private boolean isRead;
        private String targetUserEmail;
        private String createdAt;
    }
}
