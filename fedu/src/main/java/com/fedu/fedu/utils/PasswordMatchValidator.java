package com.fedu.fedu.utils;

import com.fedu.fedu.dto.req.RegisterRequest;
import com.fedu.fedu.dto.req.ResetPassRequest;
import com.fedu.fedu.dto.req.ResetPasswordDTO;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class PasswordMatchValidator implements ConstraintValidator<com.fedu.fedu.dto.validator.PasswordMatchValidator, Object> {
    @Override
    public void initialize(com.fedu.fedu.dto.validator.PasswordMatchValidator constraintAnnotation) {
    }

    @Override
    public boolean isValid(Object value, ConstraintValidatorContext context) {
        if(value == null) return true;

        String password;
        String confirmPassword;

        if(value instanceof RegisterRequest req){
            password = req.getPassword();
            confirmPassword = req.getConfirmPassword();
        } else if (value instanceof  ResetPassRequest req) {
            password = req.getPassword();
            confirmPassword = req.getConfirmPassword();
        } else if (value instanceof ResetPasswordDTO req) {
            password = req.getPassword();
            confirmPassword = req.getConfirmPassword();
        }else {
            return true;
        }

        if(password == null || confirmPassword == null) return false;
        return password.equals(confirmPassword);
    }
}
