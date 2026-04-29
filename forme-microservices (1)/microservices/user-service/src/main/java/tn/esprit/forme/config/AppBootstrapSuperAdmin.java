package tn.esprit.forme.config;

import tn.esprit.forme.modules.user.repository.RoleRepository;
import tn.esprit.forme.modules.user.repository.UserRepository;
import tn.esprit.forme.modules.user.entity.Profession;
import tn.esprit.forme.modules.user.entity.Role;
import tn.esprit.forme.modules.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
@RequiredArgsConstructor
public class AppBootstrapSuperAdmin {

    @Bean
    CommandLineRunner seedSuperAdmin(
            UserRepository userRepository,
            RoleRepository roleRepository,
            PasswordEncoder passwordEncoder,
            @Value("${app.bootstrap.superadmin.email}") String email,
            @Value("${app.bootstrap.superadmin.password}") String password,
            @Value("${app.bootstrap.superadmin.firstName}") String firstName,
            @Value("${app.bootstrap.superadmin.lastName}") String lastName
    ) {
        return args -> {
            if (userRepository.existsByEmailIgnoreCase(email)) return;

            Role superRole = roleRepository.findByName("ROLE_SUPER_ADMIN")
                    .orElseThrow(() -> new RuntimeException("ROLE_SUPER_ADMIN not seeded"));

            User superAdmin = User.builder()
                    .firstName(firstName)
                    .lastName(lastName)
                    .email(email.toLowerCase())
                    .password(passwordEncoder.encode(password))
                    .profession(Profession.OTHER)
                    .isActive(true)
                    .build();

            superAdmin.getRoles().add(superRole);
            userRepository.save(superAdmin);
        };
    }
}
