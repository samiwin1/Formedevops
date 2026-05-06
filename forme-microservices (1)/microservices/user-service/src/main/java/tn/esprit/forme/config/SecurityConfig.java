package tn.esprit.forme.config;

import tn.esprit.forme.security.JwtAuthFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.http.HttpMethod;

@Configuration
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        http
                .cors(Customizer.withDefaults())
                .csrf(csrf -> csrf.disable())
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .formLogin(form -> form.disable())
                .httpBasic(basic -> basic.disable())
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/actuator", "/actuator/**").permitAll()
                        .requestMatchers("/auth/**", "/api/auth/**").permitAll()
                        // Dashboard routes for both ADMIN and SUPER_ADMIN
                        .requestMatchers("/admin/dashboard/**").hasAnyRole("SUPER_ADMIN", "ADMIN")
                        // Certification routes for both ADMIN and SUPER_ADMIN
                        .requestMatchers("/api/certifications/**").hasAnyRole("SUPER_ADMIN", "ADMIN")
                        .requestMatchers("/api/admin/**").hasAnyRole("SUPER_ADMIN", "ADMIN")
                        .requestMatchers("/api/oral-sessions/**").hasAnyRole("SUPER_ADMIN", "ADMIN")
                        .requestMatchers("/api/reschedule/**").hasAnyRole("SUPER_ADMIN", "ADMIN")
                        .requestMatchers("/api/issued-certifications/**").hasAnyRole("SUPER_ADMIN", "ADMIN")
                        .requestMatchers("/api/admin/issued-certifications/**").hasAnyRole("SUPER_ADMIN", "ADMIN")
                        .requestMatchers("/api/admin/oral-sessions/**").hasAnyRole("SUPER_ADMIN", "ADMIN")
                        .requestMatchers("/api/admin/reschedule/**").hasAnyRole("SUPER_ADMIN", "ADMIN")
                        // All other /admin/** routes restricted to SUPER_ADMIN only
                        .requestMatchers("/admin/**").hasRole("SUPER_ADMIN")
                        .requestMatchers("/super-admin/**", "/api/superadmin/**").hasRole("SUPER_ADMIN")
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
