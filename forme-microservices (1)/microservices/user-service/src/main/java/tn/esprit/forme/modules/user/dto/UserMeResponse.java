package tn.esprit.forme.modules.user.dto;

import tn.esprit.forme.modules.user.entity.Profession;
import lombok.Builder;
import lombok.Getter;

import java.time.Instant;
import java.util.Set;

@Getter
@Builder
public class UserMeResponse {
    private Long id;
    private String firstName;
    private String lastName;
    private String email;
    private Profession profession;
    private Long partnerId;
    private boolean isActive;
    private Instant createdAt;
    private Set<String> roles;
}

