package com.fedu.fedu.utils;

import com.fedu.fedu.utils.enums.ClassroomStatus;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/**
 * Lưu {@link ClassroomStatus} xuống cột {@code classrooms.status} ở dạng chữ thường
 * ("inactive"/"active"/"completed") — khớp dữ liệu đã tồn tại trong DB, không cần migrate.
 */
@Converter(autoApply = false)
public class ClassroomStatusConverter implements AttributeConverter<ClassroomStatus, String> {

    @Override
    public String convertToDatabaseColumn(ClassroomStatus attribute) {
        return attribute == null ? null : attribute.getValue();
    }

    @Override
    public ClassroomStatus convertToEntityAttribute(String dbData) {
        return ClassroomStatus.fromValue(dbData);
    }
}
