package com.fedu.fedu.utils;

import com.fedu.fedu.dto.validator.PhoneNumber;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class PhoneValidator implements ConstraintValidator<PhoneNumber, String> {

    @Override
    public void initialize(PhoneNumber phoneNumberNo) {
    }

    @Override
    public boolean isValid(String phoneNo, ConstraintValidatorContext cxt) {
        if (phoneNo == null) {
            return true;
        }
        String trimmed = phoneNo.trim();
        if (trimmed.isEmpty() || "—".equals(trimmed)) {
            return true;
        }
        if (trimmed.matches("\\d{10}")) return true;
        else if(trimmed.matches("\\d{3}[-\\. ]\\d{3}[-\\. ]\\d{4}")) return true;
        else
            if(trimmed.matches("\\d{3}-\\d{3}-\\d{4} (x|(ext))\\d{3,5}")) return true;
            else return trimmed.matches("\\(\\d{3}\\)-\\d{3}-\\d{4}");
    }

}
