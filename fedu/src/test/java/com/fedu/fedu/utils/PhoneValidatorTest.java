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
        // Padded numbers return true because matches() checks the trimmed phoneNo
        assertTrue(validator.isValid(" 1234567890 ", null));
        assertTrue(validator.isValid(" 123-456-7890", null));
        assertTrue(validator.isValid("123-456-7890 ", null));
        assertTrue(validator.isValid(" 0987654321 ", null));
        assertTrue(validator.isValid("  123-456-7890  ", null));
        assertTrue(validator.isValid(" 123-456-7890 x123 ", null));
        assertTrue(validator.isValid("  (123)-456-7890  ", null));

        // Unicode spaces and dashes that are invalid
        assertFalse(validator.isValid("123\u00A0456\u00A07890", null)); // Non-breaking space
        assertFalse(validator.isValid("123\u2007456\u20077890", null)); // Figure space
        assertFalse(validator.isValid("123–456–7890", null));         // En-dash
        assertFalse(validator.isValid("123—456—7890", null));         // Em-dash

        // SQL injection / Command injection style inputs
        assertFalse(validator.isValid("1234567890; DROP TABLE users;", null));
        assertFalse(validator.isValid("1234567890\nSELECT * FROM users", null));

        // Excessively long input to test performance / overflow limits
        String veryLongDigits = "1234567890".repeat(1000);
        assertFalse(validator.isValid(veryLongDigits, null));

        // En-dash placeholder (should fail, as only Em-dash is allowed)
        assertFalse(validator.isValid("–", null));

        // Edge case: Whitespace-only unicode spaces return false because trim() doesn't strip them
        assertFalse(validator.isValid("\u00A0", null)); // Non-breaking space
        assertFalse(validator.isValid("\u3000", null)); // Ideographic space

        // Edge case: Mixed separators are allowed by the current regex
        assertTrue(validator.isValid("123-456.7890", null));
        assertTrue(validator.isValid("123 456-7890", null));

        // Edge case: Newline and Tab separators are not allowed by the updated regex (since literal space is used)
        assertFalse(validator.isValid("123\n456\n7890", null));
        assertFalse(validator.isValid("123\t456\t7890", null));

        // Edge case: Extension format variants
        assertFalse(validator.isValid("123-456-7890 Ext123", null));  // Capitalized Ext
        assertFalse(validator.isValid("123-456-7890  x123", null));   // Double space
        assertFalse(validator.isValid("123-456-7890 x 123", null));   // Space after x
    }
}
