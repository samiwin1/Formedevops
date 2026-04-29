package tn.esprit.forme.modules.user.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.esprit.forme.modules.user.entity.User;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmailIgnoreCase(String email);
    boolean existsByEmailIgnoreCase(String email);
}