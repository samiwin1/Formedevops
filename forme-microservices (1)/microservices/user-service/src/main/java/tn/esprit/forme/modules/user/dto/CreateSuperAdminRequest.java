package tn.esprit.forme.modules.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import tn.esprit.forme.modules.user.entity.Profession;

@Data
public class CreateSuperAdminRequest {
    @NotBlank private String firstName;
    @NotBlank private String lastName;

    @Email @NotBlank
    private String email;

    @NotBlank
    private String password;

    @NotNull
    private Profession profession;
}