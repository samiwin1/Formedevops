package tn.esprit.forme.modules.user.service;

import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.forme.common.ApiException;
import tn.esprit.forme.modules.user.dto.CreateSuperAdminRequest;
import tn.esprit.forme.modules.user.dto.UpdateSuperAdminRequest;
import tn.esprit.forme.modules.user.entity.Role;
import tn.esprit.forme.modules.user.entity.User;
import tn.esprit.forme.modules.user.repository.RoleRepository;
import tn.esprit.forme.modules.user.repository.UserRepository;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SuperAdminService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public User create(CreateSuperAdminRequest req) {
        if (userRepository.existsByEmailIgnoreCase(req.getEmail())) {
            throw new ApiException(409, "Email already exists");
        }

        Role superRole = roleRepository.findByName("ROLE_SUPER_ADMIN")
                .orElseThrow(() -> new ApiException(500, "ROLE_SUPER_ADMIN not seeded"));

        User u = User.builder()
                .firstName(req.getFirstName())
                .lastName(req.getLastName())
                .email(req.getEmail().toLowerCase())
                .password(passwordEncoder.encode(req.getPassword()))
                .profession(req.getProfession())
                .isActive(true)
                .partnerId(null)
                .build();

        u.getRoles().add(superRole);
        return userRepository.save(u);
    }

    public List<User> list() {
        return userRepository.findAll().stream()
                .filter(u -> u.getRoles().stream().anyMatch(r -> r.getName().equals("ROLE_SUPER_ADMIN")))
                .toList();
    }

    @Transactional
    public User update(Long id, UpdateSuperAdminRequest req) {
        User u = userRepository.findById(id)
                .orElseThrow(() -> new ApiException(404, "User not found"));

        // optional: block email conflict
        String newEmail = req.getEmail().toLowerCase();
        if (!u.getEmail().equalsIgnoreCase(newEmail) && userRepository.existsByEmailIgnoreCase(newEmail)) {
            throw new ApiException(409, "Email already exists");
        }

        u.setFirstName(req.getFirstName());
        u.setLastName(req.getLastName());
        u.setEmail(newEmail);
        u.setProfession(req.getProfession());
        u.setActive(req.getIsActive());

        return u;
    }

    @Transactional
    public void delete(Long id) {
        User u = userRepository.findById(id)
                .orElseThrow(() -> new ApiException(404, "User not found"));
        userRepository.delete(u);
    }

    @Transactional
    public void setActive(Long id, boolean active) {
        User u = userRepository.findById(id)
                .orElseThrow(() -> new ApiException(404, "User not found"));
        u.setActive(active);
    }
}