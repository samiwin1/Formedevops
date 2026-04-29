package tn.esprit.forme.security;

import io.jsonwebtoken.ExpiredJwtException;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class JwtServiceTest {

    private static final String SECRET = "ThisIsA32+CharSecretKeyForTestsOnly!!";

    @Test
    void generateTokenCreatesTokenWithSubjectAndClaims() {
        JwtService jwtService = new JwtService(SECRET, 120);
        UserDetails userDetails = userDetails("user@forme.tn");

        String token = jwtService.generateToken(userDetails, Map.of(
                "uid", 5L,
                "roles", java.util.List.of("ROLE_USER")
        ));

        assertThat(token).isNotBlank();
        assertThat(jwtService.extractSubject(token)).isEqualTo("user@forme.tn");
        assertThat(jwtService.isTokenValid(token, userDetails)).isTrue();
    }

    @Test
    void isTokenValidReturnsFalseForDifferentUser() {
        JwtService jwtService = new JwtService(SECRET, 120);
        String token = jwtService.generateToken(userDetails("user@forme.tn"), Map.of());

        boolean valid = jwtService.isTokenValid(token, userDetails("other@forme.tn"));

        assertThat(valid).isFalse();
    }

    @Test
    void expiredTokenIsRejected() {
        JwtService jwtService = new JwtService(SECRET, -1);
        UserDetails userDetails = userDetails("user@forme.tn");
        String token = jwtService.generateToken(userDetails, Map.of());

        assertThatThrownBy(() -> jwtService.isTokenValid(token, userDetails))
                .isInstanceOf(ExpiredJwtException.class);
    }

    private UserDetails userDetails(String email) {
        return org.springframework.security.core.userdetails.User
                .withUsername(email)
                .password("encoded-password")
                .authorities("ROLE_USER")
                .build();
    }
}
