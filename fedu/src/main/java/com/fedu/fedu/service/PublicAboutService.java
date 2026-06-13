package com.fedu.fedu.service;

import com.fedu.fedu.dto.res.AboutStatsResponse;
import com.fedu.fedu.dto.res.AboutFeaturesResponse;
import com.fedu.fedu.dto.req.ContactRequest;
import com.fedu.fedu.entity.Subject;
import java.util.List;

public interface PublicAboutService {
    AboutStatsResponse getSystemStats();
    List<Subject> getFeaturedSubjects();
    AboutFeaturesResponse getFeaturesStats();
    void processContactMessage(ContactRequest contactRequest);
}
