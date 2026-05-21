package com.fedu.fedu.service;

import com.fedu.fedu.entity.UserAccount;
import com.fedu.fedu.repository.UserAccountRepository;
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
import java.util.List;
import java.util.Objects;

@Slf4j
@Service
@RequiredArgsConstructor
public class MailService {

    private final JavaMailSender mailSender;
    private final UserAccountRepository userAccountRepository;

    @Value("${spring.mail.from}")
    private String emailFrom;

    public String sendEmail(String recipients, String subject, String content, MultipartFile[] files) throws UnsupportedEncodingException,MessagingException {

        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
        helper.setFrom(emailFrom, "hieudtfptu@gmail.com");

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

    public boolean isExist(String email) {
        List<UserAccount> users = userAccountRepository.findAll();
        for(UserAccount account : users) {
            if(account.getEmail().equals(email)) {
                return false;
            }
        }
        return true;
    }
}