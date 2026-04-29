package tn.esprit.forme.modules.user;

import tn.esprit.forme.modules.user.dto.CreateAdminRequest;
import tn.esprit.forme.common.ApiException;
import tn.esprit.forme.modules.user.entity.Role;
import tn.esprit.forme.modules.user.entity.User;
import tn.esprit.forme.modules.user.repository.RoleRepository;
import tn.esprit.forme.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public User createAdmin(CreateAdminRequest req) {
        if (userRepository.existsByEmailIgnoreCase(req.getEmail())) {
            throw new ApiException(409, "Email already exists");
        }

        Role adminRole = roleRepository.findByName("ROLE_ADMIN")
                .orElseThrow(() -> new ApiException(500, "ROLE_ADMIN not seeded"));

        User admin = User.builder()
                .firstName(req.getFirstName())
                .lastName(req.getLastName())
                .email(req.getEmail().toLowerCase())
                .password(passwordEncoder.encode(req.getPassword()))
                .profession(req.getProfession())
                .isActive(true)
                .partnerId(null)
                .build();

        admin.getRoles().add(adminRole);

        return userRepository.save(admin);
    }

    public List<User> listAdmins() {
        return userRepository.findAll().stream()
                .filter(u -> u.getRoles().stream().anyMatch(r -> r.getName().equals("ROLE_ADMIN")))
                .toList();
    }

    @Transactional
    public void disableUser(Long id) {
        User u = userRepository.findById(id)
                .orElseThrow(() -> new ApiException(404, "User not found"));
        u.setActive(false);
    }
}
