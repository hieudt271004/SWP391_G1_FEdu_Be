package com.fedu.fedu.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.UnsupportedEncodingException;
import java.nio.charset.StandardCharsets;
import java.util.Objects;

@Slf4j
@Service
@RequiredArgsConstructor
public class MailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.from}")
    private String emailFrom;

    public String sendEmail(String recipients, String subject, String content, MultipartFile[] files) throws UnsupportedEncodingException,MessagingException {

        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
        helper.setFrom(emailFrom, "FEdu System");

        if (recipients.contains(",")) {
            helper.setTo(InternetAddress.parse(recipients));
        } else {
            helper.setTo(recipients);
        }

        if (files != null) {
            for (MultipartFile file : files) {
                helper.addAttachment(Objects.requireNonNull(file.getOriginalFilename()), file);
            }
        }
        helper.setSubject(subject);
        helper.setText(content, true);
        mailSender.send(message);
        return "Sent";
    }

    @Value("${app.frontend-url}")
    private  String frontendUrl;

    public void sendConfirmLink(String emailTo, String resetToken) throws MessagingException, UnsupportedEncodingException {
        log.info("Sending code to user, email={}", emailTo);
        MimeMessage message = mailSender.createMimeMessage();

        MimeMessageHelper helper = new MimeMessageHelper(message, true, StandardCharsets.UTF_8.name());

        helper.setFrom(emailFrom);
        helper.setTo(emailTo);
        helper.setSubject("Yêu cầu đặt lại mật khẩu - FEdu");

        String resetLink = frontendUrl + "/reset-password?token=" + resetToken;

        String htmlMsg = "<h3>Xin chào!</h3>"
                + "<p>Bạn đã yêu cầu đặt lại mật khẩu. Vui lòng click vào nút bên dưới để tạo mật khẩu mới:</p>"
                + "<a href=\"" + resetLink + "\" style=\"display: inline-block; padding: 10px 20px; background-color: #4338ca; color: white; text-decoration: none; border-radius: 5px;\">Đặt lại mật khẩu</a>"
                + "<p>Đường link này sẽ hết hạn sau 15 phút.</p>";

        helper.setText(htmlMsg, true);

        mailSender.send(message);
        log.info("Email sent successfully to {}", emailTo);
    }

    



    @org.springframework.scheduling.annotation.Async
    public void sendClassEnrollmentEmailAsync(String emailTo, String fullName, String classLabel,
                                              boolean newAccount, String defaultPassword) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, StandardCharsets.UTF_8.name());
            helper.setFrom(emailFrom);
            helper.setTo(emailTo);
            helper.setSubject("Bạn đã được thêm vào lớp - FEdu");

            StringBuilder html = new StringBuilder();
            html.append("<h3>Xin chào ").append(fullName == null ? "" : fullName).append("!</h3>");
            html.append("<p>Bạn đã được thêm vào lớp <b>").append(classLabel).append("</b> trên hệ thống FEdu.</p>");
            if (newAccount) {
                html.append("<p>Tài khoản đăng nhập của bạn:</p>");
                html.append("<ul><li>Email: <b>").append(emailTo).append("</b></li>");
                html.append("<li>Mật khẩu: <b>").append(defaultPassword).append("</b></li></ul>");
                html.append("<p>Vui lòng đăng nhập và <b>đổi mật khẩu</b> ngay trong lần đầu sử dụng.</p>");
            }
            html.append("<a href=\"").append(frontendUrl)
                .append("/login\" style=\"display:inline-block;padding:10px 20px;background-color:#4338ca;color:white;text-decoration:none;border-radius:5px;\">Đăng nhập</a>");

            helper.setText(html.toString(), true);
            mailSender.send(message);
            log.info("Sent class-enrollment email to {}", emailTo);
        } catch (Exception e) {
            log.error("Failed to send class-enrollment email to {}: {}", emailTo, e.getMessage());
        }
    }
}