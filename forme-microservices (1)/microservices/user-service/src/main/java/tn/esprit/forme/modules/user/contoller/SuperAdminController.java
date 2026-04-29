package tn.esprit.forme.modules.user.contoller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import tn.esprit.forme.modules.user.dto.CreateSuperAdminRequest;
import tn.esprit.forme.modules.user.dto.UpdateSuperAdminRequest;
import tn.esprit.forme.modules.user.entity.User;
import tn.esprit.forme.modules.user.service.SuperAdminService;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/super-admin")
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class SuperAdminController {

    private final SuperAdminService superAdminService;

    @PostMapping("/create")
    public User create(@Valid @RequestBody CreateSuperAdminRequest req) {
        return superAdminService.create(req);
    }

    @GetMapping("/list")
    public List<User> list() {
        return superAdminService.list();
    }

    @PutMapping("/{id}")
    public User update(@PathVariable Long id, @Valid @RequestBody UpdateSuperAdminRequest req) {
        return superAdminService.update(id, req);
    }

    @PatchMapping("/{id}/active")
    public void setActive(@PathVariable Long id, @RequestParam boolean value) {
        superAdminService.setActive(id, value);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        superAdminService.delete(id);
    }
}