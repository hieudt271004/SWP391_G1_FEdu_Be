package com.fedu.fedu.service.Impl;

import com.fedu.fedu.dto.res.CloudinarySignatureResponse;
import com.fedu.fedu.exception.InvalidDataException;
import com.fedu.fedu.service.CloudinaryService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

@Slf4j
@Service
public class CloudinaryServiceImpl implements CloudinaryService {

    @Value("${cloudinary.cloud-name:}")
    private String cloudName;

    @Value("${cloudinary.api-key:}")
    private String apiKey;

    @Value("${cloudinary.api-secret:}")
    private String apiSecret;

    @Value("${cloudinary.folder:fedu}")
    private String rootFolder;

    @Override
    public CloudinarySignatureResponse signUpload(String subFolder) {
        if (cloudName == null || cloudName.isBlank() || apiSecret == null || apiSecret.isBlank()) {
            throw new InvalidDataException("Cloudinary chưa được cấu hình (thiếu CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_SECRET).");
        }

        long timestamp = System.currentTimeMillis() / 1000L;
        String base = (rootFolder == null || rootFolder.isBlank()) ? "fedu" : rootFolder;
        String folder = (subFolder != null && !subFolder.isBlank())
                ? base + "/" + subFolder.trim()
                : base;
        
        String toSign = "folder=" + folder + "&timestamp=" + timestamp;
        String signature = sha1Hex(toSign + apiSecret);

        return CloudinarySignatureResponse.builder()
                .cloudName(cloudName)
                .apiKey(apiKey)
                .timestamp(timestamp)
                .signature(signature)
                .folder(folder)
                .build();
    }

    @Override
    public void delete(String publicId, String resourceType) {
        if (publicId == null || publicId.isBlank()) {
            return;
        }
        if (cloudName == null || cloudName.isBlank() || apiSecret == null || apiSecret.isBlank()) {
            log.warn("Bỏ qua xóa Cloudinary: chưa cấu hình cloud-name/api-secret");
            return;
        }
        String rt = (resourceType == null || resourceType.isBlank()) ? "image" : resourceType.trim();
        long timestamp = System.currentTimeMillis() / 1000L;
        String signature = sha1Hex("public_id=" + publicId + "&timestamp=" + timestamp + apiSecret);
        String body = "public_id=" + enc(publicId)
                + "&timestamp=" + timestamp
                + "&api_key=" + enc(apiKey)
                + "&signature=" + signature;
        try {
            HttpResponse<String> resp = HttpClient.newHttpClient().send(
                    HttpRequest.newBuilder()
                            .uri(URI.create("https://api.cloudinary.com/v1_1/" + cloudName + "/" + rt + "/destroy"))
                            .header("Content-Type", "application/x-www-form-urlencoded")
                            .POST(HttpRequest.BodyPublishers.ofString(body))
                            .build(),
                    HttpResponse.BodyHandlers.ofString());
            log.info("Cloudinary destroy {} ({}) -> {}", publicId, rt, resp.body());
        } catch (Exception e) {
            // best-effort: không chặn việc xóa material trong app nếu Cloudinary lỗi
            log.warn("Xóa asset Cloudinary {} thất bại: {}", publicId, e.getMessage());
        }
    }

    private String enc(String s) {
        return URLEncoder.encode(s, StandardCharsets.UTF_8);
    }

    private String sha1Hex(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-1");
            byte[] digest = md.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder(digest.length * 2);
            for (byte b : digest) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-1 không khả dụng", e);
        }
    }
}
