package com.fedu.fedu.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;

/**
 * Bật xử lý bất đồng bộ ({@code @Async}) — dùng để gửi email nền khi import sinh viên,
 * tránh treo request khi danh sách lớn.
 */
@Configuration
@EnableAsync
public class AsyncConfig {
}
