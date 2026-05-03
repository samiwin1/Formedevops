package tn.esprit.forme.config;

import tn.esprit.forme.modules.user.entity.Role;
import tn.esprit.forme.modules.user.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;

@Configuration
@RequiredArgsConstructor
public class AppInitConfig {

    @Bean
    @Order(1)
    CommandLineRunner seedRoles(RoleRepository roleRepository) {
        return args -> {
            createIfMissing(roleRepository, "ROLE_USER");
            createIfMissing(roleRepository, "ROLE_ADMIN");
            createIfMissing(roleRepository, "ROLE_SUPER_ADMIN");
        };
    }

    private void createIfMissing(RoleRepository repo, String roleName) {
        repo.findByName(roleName)
                .orElseGet(() -> repo.save(Role.builder().name(roleName).build()));
    }
}
