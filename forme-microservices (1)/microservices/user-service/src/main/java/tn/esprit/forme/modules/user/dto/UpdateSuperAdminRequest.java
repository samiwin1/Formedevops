package tn.esprit.forme.modules.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import tn.esprit.forme.modules.user.entity.Profession;

@Data
public class UpdateSuperAdminRequest {
    @NotBlank private String firstName;
    @NotBlank private String lastName;

    @Email @NotBlank
    private String email;

    @NotNull
    private Profession profession;

    @NotNull
    private Boolean isActive;
}