package tn.esprit.forme.modules.user.dto;

import tn.esprit.forme.modules.user.entity.Profession;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class UpdateMeRequest {

    @NotBlank @Size(max = 80)
    private String firstName;

    @NotBlank @Size(max = 80)
    private String lastName;

    @NotNull
    private Profession profession;
}
