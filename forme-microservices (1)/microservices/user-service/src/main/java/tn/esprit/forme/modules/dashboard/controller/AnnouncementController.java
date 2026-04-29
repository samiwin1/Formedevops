package tn.esprit.forme.modules.dashboard.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import tn.esprit.forme.modules.dashboard.dto.AnnouncementDto;
import tn.esprit.forme.modules.dashboard.entity.AnnouncementStatus;
import tn.esprit.forme.modules.dashboard.service.AnnouncementService;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/admin/dashboard/announcements")
@CrossOrigin(origins = "http://localhost:4200")
public class AnnouncementController {

    private final AnnouncementService service;

    // GET /admin/dashboard/announcements
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    public ResponseEntity<List<AnnouncementDto.Response>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    // GET /admin/dashboard/announcements?status=PUBLISHED
    @GetMapping("/by-status")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    public ResponseEntity<List<AnnouncementDto.Response>> getByStatus(
            @RequestParam AnnouncementStatus status) {
        return ResponseEntity.ok(service.getByStatus(status));
    }

    // GET /admin/dashboard/announcements/{id}
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    public ResponseEntity<AnnouncementDto.Response> getOne(@PathVariable Long id) {
        return ResponseEntity.ok(service.getOne(id));
    }

    // POST /admin/dashboard/announcements
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    public ResponseEntity<AnnouncementDto.Response> create(
            @Valid @RequestBody AnnouncementDto.CreateRequest req) {
        return ResponseEntity.ok(service.create(req));
    }

    // PUT /admin/dashboard/announcements/{id}
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    public ResponseEntity<AnnouncementDto.Response> update(
            @PathVariable Long id,
            @RequestBody AnnouncementDto.UpdateRequest req) {
        return ResponseEntity.ok(service.update(id, req));
    }

    // PATCH /admin/dashboard/announcements/{id}/publish
    @PatchMapping("/{id}/publish")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    public ResponseEntity<AnnouncementDto.Response> publish(@PathVariable Long id) {
        return ResponseEntity.ok(service.publish(id));
    }

    // PATCH /admin/dashboard/announcements/{id}/archive
    @PatchMapping("/{id}/archive")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    public ResponseEntity<AnnouncementDto.Response> archive(@PathVariable Long id) {
        return ResponseEntity.ok(service.archive(id));
    }

    // PATCH /admin/dashboard/announcements/{id}/pin
    @PatchMapping("/{id}/pin")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    public ResponseEntity<AnnouncementDto.Response> togglePin(@PathVariable Long id) {
        return ResponseEntity.ok(service.togglePin(id));
    }

    // DELETE /admin/dashboard/announcements/{id}
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
