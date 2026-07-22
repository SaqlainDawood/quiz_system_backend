/**
 * Generate a random session ID
 */
const generateSessionId = () => {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
};

/**
 * Calculate quiz statistics
 */
const calculateQuizStats = (answers, questions) => {
  let correct = 0;
  const total = questions.length;
  
  answers.forEach((answer, index) => {
    if (answer === questions[index].correct) {
      correct++;
    }
  });

  return {
    correct,
    total,
    wrong: total - correct,
    percentage: Math.round((correct / total) * 100)
  };
};

/**
 * Get grade from percentage
 */
const getGrade = (percentage) => {
  if (percentage >= 90) return { grade: 'A+', label: 'Outstanding' };
  if (percentage >= 80) return { grade: 'A', label: 'Excellent' };
  if (percentage >= 70) return { grade: 'B', label: 'Good' };
  if (percentage >= 60) return { grade: 'C', label: 'Average' };
  return { grade: 'Fail', label: 'Needs Improvement' };
};

/**
 * Pagination helper
 */
const paginate = (page = 1, limit = 20) => {
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
  const skip = (pageNum - 1) * limitNum;
  
  return { skip, limit: limitNum, page: pageNum };
};

module.exports = {
  generateSessionId,
  calculateQuizStats,
  getGrade,
  paginate
};