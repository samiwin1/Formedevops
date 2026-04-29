package tn.esprit.forme.modules.dashboard.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.forme.modules.dashboard.dto.AnnouncementDto;
import tn.esprit.forme.modules.dashboard.entity.Announcement;
import tn.esprit.forme.modules.dashboard.entity.AnnouncementStatus;
import tn.esprit.forme.modules.dashboard.repository.AnnouncementRepository;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnnouncementService {

    private final AnnouncementRepository repo;

    // ── CREATE (saves as DRAFT) ───────────────────────────────────────────
    public AnnouncementDto.Response create(AnnouncementDto.CreateRequest req) {
        Announcement saved = repo.save(
            Announcement.builder()
                .title(req.getTitle())
                .content(req.getContent())
                .pinned(req.isPinned())
                .createdByEmail(req.getCreatedByEmail())
                .status(AnnouncementStatus.DRAFT)
                .build()
        );
        return toResponse(saved);
    }

    // ── READ ALL ──────────────────────────────────────────────────────────
    public List<AnnouncementDto.Response> getAll() {
        return repo.findAllByOrderByPinnedDescCreatedAtDesc()
                   .stream().map(this::toResponse).collect(Collectors.toList());
    }

    // ── READ BY STATUS ────────────────────────────────────────────────────
    public List<AnnouncementDto.Response> getByStatus(AnnouncementStatus status) {
        return repo.findByStatusOrderByPinnedDescPublishedAtDesc(status)
                   .stream().map(this::toResponse).collect(Collectors.toList());
    }

    // ── READ ONE ──────────────────────────────────────────────────────────
    public AnnouncementDto.Response getOne(Long id) {
        return toResponse(findOrThrow(id));
    }

    // ── UPDATE ────────────────────────────────────────────────────────────
    @Transactional
    public AnnouncementDto.Response update(Long id, AnnouncementDto.UpdateRequest req) {
        Announcement a = findOrThrow(id);
        if (req.getTitle()   != null) a.setTitle(req.getTitle());
        if (req.getContent() != null) a.setContent(req.getContent());
        if (req.getPinned()  != null) a.setPinned(req.getPinned());
        return toResponse(repo.save(a));
    }

    // ── PUBLISH ───────────────────────────────────────────────────────────
    @Transactional
    public AnnouncementDto.Response publish(Long id) {
        Announcement a = findOrThrow(id);
        a.setStatus(AnnouncementStatus.PUBLISHED);
        a.setPublishedAt(Instant.now());
        return toResponse(repo.save(a));
    }

    // ── ARCHIVE ───────────────────────────────────────────────────────────
    @Transactional
    public AnnouncementDto.Response archive(Long id) {
        Announcement a = findOrThrow(id);
        a.setStatus(AnnouncementStatus.ARCHIVED);
        a.setPinned(false); // can't be pinned if archived
        return toResponse(repo.save(a));
    }

    // ── TOGGLE PIN ────────────────────────────────────────────────────────
    @Transactional
    public AnnouncementDto.Response togglePin(Long id) {
        Announcement a = findOrThrow(id);
        a.setPinned(!a.isPinned());
        return toResponse(repo.save(a));
    }

    // ── DELETE ────────────────────────────────────────────────────────────
    @Transactional
    public void delete(Long id) {
        if (!repo.existsById(id)) throw new RuntimeException("Announcement not found: " + id);
        repo.deleteById(id);
    }

    // ── HELPERS ───────────────────────────────────────────────────────────
    private Announcement findOrThrow(Long id) {
        return repo.findById(id)
            .orElseThrow(() -> new RuntimeException("Announcement not found: " + id));
    }

    private AnnouncementDto.Response toResponse(Announcement a) {
        AnnouncementDto.Response r = new AnnouncementDto.Response();
        r.setId(a.getId());
        r.setTitle(a.getTitle());
        r.setContent(a.getContent());
        r.setStatus(a.getStatus());
        r.setPinned(a.isPinned());
        r.setCreatedByEmail(a.getCreatedByEmail());
        r.setCreatedAt(a.getCreatedAt() != null ? a.getCreatedAt().toString() : null);
        r.setPublishedAt(a.getPublishedAt() != null ? a.getPublishedAt().toString() : null);
        return r;
    }
}
