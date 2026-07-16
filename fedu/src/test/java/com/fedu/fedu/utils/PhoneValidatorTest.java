package com.fedu.fedu.utils;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.assertFalse;

class PhoneValidatorTest {

    private PhoneValidator validator;

    @BeforeEach
    void setUp() {
        validator = new PhoneValidator();
    }

    @Test
    void testIsValid_withNull_returnsTrue() {
        assertTrue(validator.isValid(null, null));
    }

    @Test
    void testIsValid_withEmptyString_returnsTrue() {
        assertTrue(validator.isValid("", null));
    }

    @Test
    void testIsValid_withBlankString_returnsTrue() {
        assertTrue(validator.isValid("   ", null));
    }

    @Test
    void testIsValid_withEmDash_returnsTrue() {
        assertTrue(validator.isValid("—", null));
    }

    @Test
    void testIsValid_withPaddedEmDash_returnsTrue() {
        assertTrue(validator.isValid("   —   ", null));
    }

    @Test
    void testIsValid_withValid10DigitPhone_returnsTrue() {
        assertTrue(validator.isValid("1234567890", null));
    }

    @Test
    void testIsValid_withValidFormattedPhone_returnsTrue() {
        assertTrue(validator.isValid("123-456-7890", null));
        assertTrue(validator.isValid("123.456.7890", null));
        assertTrue(validator.isValid("123 456 7890", null));
    }

    @Test
    void testIsValid_withValidPhoneAndExtension_returnsTrue() {
        assertTrue(validator.isValid("123-456-7890 x123", null));
        assertTrue(validator.isValid("123-456-7890 ext12345", null));
    }

    @Test
    void testIsValid_withValidParenthesesPhone_returnsTrue() {
        assertTrue(validator.isValid("(123)-456-7890", null));
    }

    @Test
    void testIsValid_withInvalidPhone_returnsFalse() {
        assertFalse(validator.isValid("123-45", null));
        assertFalse(validator.isValid("abc-def-ghij", null));
        assertFalse(validator.isValid("12345678901", null));
    }

    @Test
    void testIsValid_adversarialCases() {
        
        assertTrue(validator.isValid(" 1234567890 ", null));
        assertTrue(validator.isValid(" 123-456-7890", null));
        assertTrue(validator.isValid("123-456-7890 ", null));
        assertTrue(validator.isValid(" 0987654321 ", null));
        assertTrue(validator.isValid("  123-456-7890  ", null));
        assertTrue(validator.isValid(" 123-456-7890 x123 ", null));
        assertTrue(validator.isValid("  (123)-456-7890  ", null));

        
        assertFalse(validator.isValid("123\u00A0456\u00A07890", null)); 
        assertFalse(validator.isValid("123\u2007456\u20077890", null)); 
        assertFalse(validator.isValid("123–456–7890", null));         
        assertFalse(validator.isValid("123—456—7890", null));         

        
        assertFalse(validator.isValid("1234567890; DROP TABLE users;", null));
        assertFalse(validator.isValid("1234567890\nSELECT * FROM users", null));

        
        String veryLongDigits = "1234567890".repeat(1000);
        assertFalse(validator.isValid(veryLongDigits, null));

        
        assertFalse(validator.isValid("–", null));

        
        assertFalse(validator.isValid("\u00A0", null)); 
        assertFalse(validator.isValid("\u3000", null)); 

        
        assertTrue(validator.isValid("123-456.7890", null));
        assertTrue(validator.isValid("123 456-7890", null));

        
        assertFalse(validator.isValid("123\n456\n7890", null));
        assertFalse(validator.isValid("123\t456\t7890", null));

        
        assertFalse(validator.isValid("123-456-7890 Ext123", null));  
        assertFalse(validator.isValid("123-456-7890  x123", null));   
        assertFalse(validator.isValid("123-456-7890 x 123", null));   
    }
}
