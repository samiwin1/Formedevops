package tn.esprit.forme.modules.user.contoller;

import tn.esprit.forme.modules.user.dto.UpdateMeRequest;
import tn.esprit.forme.modules.user.dto.UserMeResponse;
import tn.esprit.forme.modules.user.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/users")
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public UserMeResponse me(Authentication auth) {
        return userService.me(auth.getName());
    }

    @PutMapping("/me")
    public UserMeResponse updateMe(Authentication auth, @Valid @RequestBody UpdateMeRequest req) {
        return userService.updateMe(auth.getName(), req);
    }
}
