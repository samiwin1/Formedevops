package tn.esprit.forme.modules.partner.service;

import org.springframework.stereotype.Component;

@Component
public class MockPartnerClient implements PartnerClient {

    @Override
    public boolean validatePartnerCode(Long partnerId, String partnerCode) {
        // Example rule (placeholder): code must equal "PARTNER-" + partnerId
        if (partnerId == null || partnerCode == null) return false;
        return partnerCode.equals("PARTNER-" + partnerId);
    }
}
