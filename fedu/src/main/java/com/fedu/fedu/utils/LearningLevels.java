package com.fedu.fedu.utils;







public final class LearningLevels {

    public static final int WEAK = 1;     
    public static final int MEDIUM = 2;   
    public static final int GOOD = 3;     

    public static final int MIN = WEAK;
    public static final int MAX = GOOD;

    private LearningLevels() {
    }

    
    public static boolean isValid(Integer level) {
        return level != null && level >= MIN && level <= MAX;
    }
}
