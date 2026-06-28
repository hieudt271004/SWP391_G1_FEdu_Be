package com.fedu.fedu.service;

import com.fedu.fedu.dto.res.CloudinarySignatureResponse;

public interface CloudinaryService {

    CloudinarySignatureResponse signUpload(String subFolder);

    void delete(String publicId, String resourceType);
}
