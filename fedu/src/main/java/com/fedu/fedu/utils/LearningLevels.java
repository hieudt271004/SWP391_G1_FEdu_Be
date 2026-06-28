package com.fedu.fedu.utils;

/**
 * Quy ước mức năng lực lộ trình học, biểu diễn bằng số nguyên.
 * 1 = yếu, 2 = trung bình, 3 = khá.
 * Dùng cho LearningPath.level, LearningNode.level, ClassroomSubjectStudent.currentLevel,
 * QuizScoreBand.targetLevel, StudentLevelHistory.oldLevel/newLevel.
 */
public final class LearningLevels {

    public static final int WEAK = 1;     // yếu
    public static final int MEDIUM = 2;   // trung bình
    public static final int GOOD = 3;     // khá

    public static final int MIN = WEAK;
    public static final int MAX = GOOD;

    private LearningLevels() {
    }

    /** Mức hợp lệ là 1, 2 hoặc 3. */
    public static boolean isValid(Integer level) {
        return level != null && level >= MIN && level <= MAX;
    }
}
