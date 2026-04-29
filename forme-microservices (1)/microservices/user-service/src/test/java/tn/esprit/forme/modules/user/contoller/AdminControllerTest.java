package tn.esprit.forme.modules.user.contoller;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import tn.esprit.forme.modules.user.AdminService;
import tn.esprit.forme.modules.user.dto.CreateAdminRequest;
import tn.esprit.forme.modules.user.entity.Role;
import tn.esprit.forme.modules.user.entity.User;

import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminControllerTest {

    @Mock
    private AdminService adminService;

    @InjectMocks
    private AdminController adminController;

    @Test
    void createAdminDelegatesToAdminService() {
        CreateAdminRequest request = new CreateAdminRequest();
        User created = User.builder()
                .id(10L)
                .email("admin@forme.tn")
                .roles(Set.of(Role.builder().name("ROLE_ADMIN").build()))
                .build();
        when(adminService.createAdmin(request)).thenReturn(created);

        User response = adminController.createAdmin(request);

        assertThat(response).isSameAs(created);
        assertThat(response.getEmail()).isEqualTo("admin@forme.tn");
        verify(adminService).createAdmin(request);
    }

    @Test
    void listAdminsDelegatesToAdminService() {
        User admin = User.builder().id(1L).email("admin@forme.tn").build();
        when(adminService.listAdmins()).thenReturn(List.of(admin));

        List<User> response = adminController.listAdmins();

        assertThat(response).containsExactly(admin);
        verify(adminService).listAdmins();
    }

    @Test
    void disableDelegatesToAdminService() {
        adminController.disable(42L);

        verify(adminService).disableUser(42L);
    }
}
