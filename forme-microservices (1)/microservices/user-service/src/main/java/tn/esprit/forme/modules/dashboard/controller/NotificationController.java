package tn.esprit.forme.modules.dashboard.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import tn.esprit.forme.modules.dashboard.dto.NotificationDto;
import tn.esprit.forme.modules.dashboard.service.NotificationService;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/admin/dashboard/notifications")
@CrossOrigin(origins = "http://localhost:4200")
public class NotificationController {

    private final NotificationService service;

    // GET /admin/dashboard/notifications → all notifications
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    public ResponseEntity<List<NotificationDto.Response>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    // GET /admin/dashboard/notifications/unread → only unread
    @GetMapping("/unread")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    public ResponseEntity<List<NotificationDto.Response>> getUnread() {
        return ResponseEntity.ok(service.getUnread());
    }

    // GET /admin/dashboard/notifications/count → unread count badge
    @GetMapping("/count")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    public ResponseEntity<Map<String, Long>> countUnread() {
        return ResponseEntity.ok(Map.of("unread", service.countUnread()));
    }

    // POST /admin/dashboard/notifications → create
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    public ResponseEntity<NotificationDto.Response> create(
            @Valid @RequestBody NotificationDto.CreateRequest req) {
        return ResponseEntity.ok(service.create(req));
    }

    // PATCH /admin/dashboard/notifications/{id}/read → mark one as read
    @PatchMapping("/{id}/read")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    public ResponseEntity<NotificationDto.Response> markRead(@PathVariable Long id) {
        return ResponseEntity.ok(service.markRead(id));
    }

    // PATCH /admin/dashboard/notifications/read-all → mark all as read
    @PatchMapping("/read-all")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    public ResponseEntity<Void> markAllRead() {
        service.markAllRead();
        return ResponseEntity.noContent().build();
    }

    // DELETE /admin/dashboard/notifications/{id}
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
