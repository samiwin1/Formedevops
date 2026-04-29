package tn.esprit.forme.modules.dashboard.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import tn.esprit.forme.modules.dashboard.entity.AnnouncementStatus;

public class AnnouncementDto {

    @Data
    public static class CreateRequest {
        @NotBlank
        @Size(max = 150)
        private String title;

        @NotBlank
        private String content;

        private boolean pinned = false;

        @Size(max = 80)
        private String createdByEmail;
    }

    @Data
    public static class UpdateRequest {
        @Size(max = 150)
        private String title;

        private String content;

        private Boolean pinned;
    }

    @Data
    public static class Response {
        private Long id;
        private String title;
        private String content;
        private AnnouncementStatus status;
        private boolean pinned;
        private String createdByEmail;
        private String createdAt;
        private String publishedAt;
    }
}
