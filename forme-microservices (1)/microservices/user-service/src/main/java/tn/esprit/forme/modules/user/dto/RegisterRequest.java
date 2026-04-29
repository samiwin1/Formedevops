package tn.esprit.forme.modules.user.dto;

import tn.esprit.forme.modules.user.entity.Profession;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class RegisterRequest {

    @NotBlank @Size(max = 80)
    private String firstName;

    @NotBlank @Size(max = 80)
    private String lastName;

    @NotBlank @Email @Size(max = 120)
    private String email;

    @NotBlank @Size(min = 8, max = 72)
    private String password;

    @NotNull
    private Profession profession;

    // partner flow
    private Long partnerId;
    private String partnerCode;

    // ✅ reCAPTCHA token from frontend
    @NotBlank(message = "CAPTCHA token is required")
    private String captchaToken;
}