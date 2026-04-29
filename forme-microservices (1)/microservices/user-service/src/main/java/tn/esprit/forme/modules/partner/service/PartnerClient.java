package tn.esprit.forme.modules.partner.service;

public interface PartnerClient {
    boolean validatePartnerCode(Long partnerId, String partnerCode);
}
