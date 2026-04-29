package tn.esprit.forme.modules.user.contoller;

import tn.esprit.forme.modules.user.dto.CreateAdminRequest;
import tn.esprit.forme.modules.user.AdminService;
import tn.esprit.forme.modules.user.entity.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/admin")
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class AdminController {

    private final AdminService adminService;

    @PostMapping("/create")
    public User createAdmin(@Valid @RequestBody CreateAdminRequest req) {
        return adminService.createAdmin(req);
    }

    @GetMapping("/list")
    public List<User> listAdmins() {
        return adminService.listAdmins();
    }

    @PatchMapping("/{id}/disable")
    public void disable(@PathVariable Long id) {
        adminService.disableUser(id);
    }
}
