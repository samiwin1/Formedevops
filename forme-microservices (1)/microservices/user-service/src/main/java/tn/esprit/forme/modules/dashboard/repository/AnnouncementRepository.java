package tn.esprit.forme.modules.dashboard.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.esprit.forme.modules.dashboard.entity.Announcement;
import tn.esprit.forme.modules.dashboard.entity.AnnouncementStatus;

import java.util.List;

public interface AnnouncementRepository extends JpaRepository<Announcement, Long> {

    List<Announcement> findAllByOrderByPinnedDescCreatedAtDesc();

    List<Announcement> findByStatusOrderByPinnedDescPublishedAtDesc(AnnouncementStatus status);

    List<Announcement> findByPinnedTrueAndStatus(AnnouncementStatus status);
}
