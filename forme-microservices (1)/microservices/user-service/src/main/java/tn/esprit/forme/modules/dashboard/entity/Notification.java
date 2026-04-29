package tn.esprit.forme.modules.dashboard.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(name = "notifications")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120)
    private String title;

    @Column(nullable = false, length = 500)
    private String message;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private NotificationType type; // INFO, WARNING, SUCCESS, ERROR

    @Column(nullable = false)
    @Builder.Default
    private boolean isRead = false;

    @Column(length = 120)
    private String targetUserEmail; // null = broadcast to all admins

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;
}
