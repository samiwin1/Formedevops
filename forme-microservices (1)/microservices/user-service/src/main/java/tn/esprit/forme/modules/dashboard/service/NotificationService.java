package tn.esprit.forme.modules.dashboard.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.forme.modules.dashboard.dto.NotificationDto;
import tn.esprit.forme.modules.dashboard.entity.Notification;
import tn.esprit.forme.modules.dashboard.repository.NotificationRepository;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository repo;

    // ── CREATE ────────────────────────────────────────────────────────────
    public NotificationDto.Response create(NotificationDto.CreateRequest req) {
        Notification saved = repo.save(
            Notification.builder()
                .title(req.getTitle())
                .message(req.getMessage())
                .type(req.getType())
                .targetUserEmail(req.getTargetUserEmail())
                .build()
        );
        return toResponse(saved);
    }

    // ── READ ALL ──────────────────────────────────────────────────────────
    public List<NotificationDto.Response> getAll() {
        return repo.findAllByOrderByCreatedAtDesc()
                   .stream().map(this::toResponse).collect(Collectors.toList());
    }

    // ── READ UNREAD ───────────────────────────────────────────────────────
    public List<NotificationDto.Response> getUnread() {
        return repo.findByIsReadFalseOrderByCreatedAtDesc()
                   .stream().map(this::toResponse).collect(Collectors.toList());
    }

    // ── UNREAD COUNT ──────────────────────────────────────────────────────
    public long countUnread() {
        return repo.countByIsReadFalse();
    }

    // ── MARK ONE AS READ ─────────────────────────────────────────────────
    @Transactional
    public NotificationDto.Response markRead(Long id) {
        Notification n = repo.findById(id)
            .orElseThrow(() -> new RuntimeException("Notification not found: " + id));
        n.setRead(true);
        return toResponse(repo.save(n));
    }

    // ── MARK ALL AS READ ─────────────────────────────────────────────────
    @Transactional
    public void markAllRead() {
        repo.markAllAsRead();
    }

    // ── DELETE ────────────────────────────────────────────────────────────
    @Transactional
    public void delete(Long id) {
        if (!repo.existsById(id)) {
            throw new RuntimeException("Notification not found: " + id);
        }
        repo.deleteById(id);
    }

    // ── MAPPER ────────────────────────────────────────────────────────────
    private NotificationDto.Response toResponse(Notification n) {
        NotificationDto.Response r = new NotificationDto.Response();
        r.setId(n.getId());
        r.setTitle(n.getTitle());
        r.setMessage(n.getMessage());
        r.setType(n.getType());
        r.setRead(n.isRead());
        r.setTargetUserEmail(n.getTargetUserEmail());
        r.setCreatedAt(n.getCreatedAt() != null ? n.getCreatedAt().toString() : null);
        return r;
    }
}
