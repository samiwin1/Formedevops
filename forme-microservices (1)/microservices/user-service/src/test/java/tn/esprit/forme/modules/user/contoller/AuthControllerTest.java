package tn.esprit.forme.modules.user.contoller;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;
import tn.esprit.forme.modules.user.dto.AuthResponse;
import tn.esprit.forme.modules.user.dto.LoginRequest;
import tn.esprit.forme.modules.user.dto.RegisterRequest;
import tn.esprit.forme.modules.user.service.AuthService;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    @Mock
    private AuthService authService;

    @InjectMocks
    private AuthController authController;

    @Test
    void registerDelegatesToAuthServiceAndReturnsOk() {
        RegisterRequest request = new RegisterRequest();

        ResponseEntity<Void> response = authController.register(request);

        assertThat(response.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(response.getBody()).isNull();
        verify(authService).register(request);
    }

    @Test
    void loginDelegatesToAuthServiceAndReturnsToken() {
        LoginRequest request = new LoginRequest();
        AuthResponse authResponse = AuthResponse.builder()
                .token("jwt-token")
                .build();
        when(authService.login(request)).thenReturn(authResponse);

        ResponseEntity<AuthResponse> response = authController.login(request);

        assertThat(response.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(response.getBody()).isSameAs(authResponse);
        assertThat(response.getBody().getToken()).isEqualTo("jwt-token");
        verify(authService).login(request);
    }
}
