package tn.esprit.forme.modules.user.service;

import tn.esprit.forme.common.ApiException;
import tn.esprit.forme.modules.user.dto.UpdateMeRequest;
import tn.esprit.forme.modules.user.dto.UserMeResponse;
import tn.esprit.forme.modules.user.entity.Role;
import tn.esprit.forme.modules.user.entity.User;
import tn.esprit.forme.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    public User getByEmail(String email) {
        return userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ApiException(404, "User not found"));
    }

    public UserMeResponse me(String email) {
        User user = getByEmail(email);

        return UserMeResponse.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .profession(user.getProfession())
                .partnerId(user.getPartnerId())
                .isActive(user.isActive())
                .createdAt(user.getCreatedAt())
                .roles(user.getRoles().stream().map(Role::getName).collect(Collectors.toSet()))
                .build();
    }

    @Transactional
    public UserMeResponse updateMe(String email, UpdateMeRequest req) {
        User user = getByEmail(email);
        user.setFirstName(req.getFirstName());
        user.setLastName(req.getLastName());
        user.setProfession(req.getProfession());
        return me(email);
    }
}
