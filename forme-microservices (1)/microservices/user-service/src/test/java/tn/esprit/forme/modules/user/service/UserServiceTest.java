package tn.esprit.forme.modules.user.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import tn.esprit.forme.common.ApiException;
import tn.esprit.forme.modules.user.dto.UpdateMeRequest;
import tn.esprit.forme.modules.user.dto.UserMeResponse;
import tn.esprit.forme.modules.user.entity.Profession;
import tn.esprit.forme.modules.user.entity.Role;
import tn.esprit.forme.modules.user.entity.User;
import tn.esprit.forme.modules.user.repository.UserRepository;

import java.time.Instant;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserService userService;

    @Test
    void getByEmailReturnsUserWhenFound() {
        User user = sampleUser();
        when(userRepository.findByEmailIgnoreCase("USER@FORME.TN")).thenReturn(Optional.of(user));

        User result = userService.getByEmail("USER@FORME.TN");

        assertThat(result).isSameAs(user);
        verify(userRepository).findByEmailIgnoreCase("USER@FORME.TN");
    }

    @Test
    void getByEmailThrowsApiExceptionWhenMissing() {
        when(userRepository.findByEmailIgnoreCase("missing@forme.tn")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.getByEmail("missing@forme.tn"))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("User not found");
    }

    @Test
    void meMapsUserToUserMeResponse() {
        User user = sampleUser();
        when(userRepository.findByEmailIgnoreCase(user.getEmail())).thenReturn(Optional.of(user));

        UserMeResponse response = userService.me(user.getEmail());

        assertThat(response.getId()).isEqualTo(7L);
        assertThat(response.getFirstName()).isEqualTo("Test");
        assertThat(response.getLastName()).isEqualTo("User");
        assertThat(response.getEmail()).isEqualTo("user@forme.tn");
        assertThat(response.getProfession()).isEqualTo(Profession.DEVELOPER);
        assertThat(response.getPartnerId()).isEqualTo(99L);
        assertThat(response.isActive()).isTrue();
        assertThat(response.getCreatedAt()).isEqualTo(user.getCreatedAt());
        assertThat(response.getRoles()).containsExactlyInAnyOrder("ROLE_USER", "ROLE_ADMIN");
    }

    @Test
    void updateMeUpdatesEditableFieldsAndReturnsUpdatedProfile() {
        User user = sampleUser();
        UpdateMeRequest request = new UpdateMeRequest();
        request.setFirstName("Updated");
        request.setLastName("Name");
        request.setProfession(Profession.EVALUATOR);
        when(userRepository.findByEmailIgnoreCase(user.getEmail())).thenReturn(Optional.of(user));

        UserMeResponse response = userService.updateMe(user.getEmail(), request);

        assertThat(user.getFirstName()).isEqualTo("Updated");
        assertThat(user.getLastName()).isEqualTo("Name");
        assertThat(user.getProfession()).isEqualTo(Profession.EVALUATOR);
        assertThat(response.getFirstName()).isEqualTo("Updated");
        assertThat(response.getLastName()).isEqualTo("Name");
        assertThat(response.getProfession()).isEqualTo(Profession.EVALUATOR);
    }

    private User sampleUser() {
        return User.builder()
                .id(7L)
                .firstName("Test")
                .lastName("User")
                .email("user@forme.tn")
                .password("encoded-password")
                .profession(Profession.DEVELOPER)
                .partnerId(99L)
                .isActive(true)
                .createdAt(Instant.parse("2026-01-01T10:00:00Z"))
                .roles(Set.of(
                        Role.builder().name("ROLE_USER").build(),
                        Role.builder().name("ROLE_ADMIN").build()
                ))
                .build();
    }
}
