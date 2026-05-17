package com.fedu.fedu.utils;

import com.fedu.fedu.dto.req.ResetPassRequest;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class PasswordMatchValidator implements ConstraintValidator<com.fedu.fedu.dto.validator.PasswordMatchValidator, Object> {
    @Override
    public void initialize(com.fedu.fedu.dto.validator.PasswordMatchValidator constraintAnnotation) {
    }

    @Override
    public boolean isValid(Object o, ConstraintValidatorContext constraintValidatorContext) {
        ResetPassRequest request = (ResetPassRequest) o;
        return request.getPassword().equals(request.getConfirmPassword());
    }
}
