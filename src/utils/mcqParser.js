// backend/src/utils/mcqParser.js
const pdfParse = require('pdf-parse');  // ✅ Version 1.1.1 ke liye
const mammoth = require('mammoth');
const Tesseract = require('tesseract.js');
const fs = require('fs');

/**
 * Extract text from file based on mime type
 */
const extractText = async (filePath, mimeType) => {
  const buffer = fs.readFileSync(filePath);

  // PDF - ✅ FIXED for version 1.1.1
  if (mimeType === 'application/pdf') {
    try {
      const data = await pdfParse(buffer);
      return data.text;
    } catch (err) {
      console.error('PDF Parse Error:', err);
      throw new Error('Failed to parse PDF: ' + err.message);
    }
  }
  
  // Word Document
  if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    } catch (err) {
      console.error('Word Parse Error:', err);
      throw new Error('Failed to parse Word file: ' + err.message);
    }
  }
  
  // Image
  if (mimeType.startsWith('image/')) {
    try {
      const result = await Tesseract.recognize(buffer, 'eng');
      return result.data.text;
    } catch (err) {
      console.error('Image OCR Error:', err);
      throw new Error('Failed to extract text from image: ' + err.message);
    }
  }
  
  // Plain text or CSV
  return buffer.toString('utf8');
};

/**
 * Parse MCQs from extracted text
 */
const parseMCQs = (text) => {
  const questions = [];
  const lines = text.split('\n').filter(line => line.trim());
  
  let currentQuestion = null;
  let options = [];
  let correct = null;
  
  // Patterns
  const questionPatterns = [
    /^(?:Q\.?\s*)?(\d+)\.?\s*(.+)/i,
    /^Question\s*(\d+)\s*[:.]?\s*(.+)/i,
    /^(\d+)\)\s*(.+)/,
  ];
  
  const optionPattern = /^([A-Da-d])[\.\)]\s*(.+)/;
  const correctPatterns = [
    /(?:correct|answer|ans)\s*[:.]?\s*([A-Da-d])/i,
    /^\s*([A-Da-d])\s*$/,
    /\*([A-Da-d])\*/,
  ];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Check if it's a question
    let isQuestion = false;
    let questionText = null;
    
    for (const pattern of questionPatterns) {
      const match = line.match(pattern);
      if (match) {
        questionText = match[2] || match[1];
        isQuestion = true;
        break;
      }
    }

    if (!isQuestion && line.endsWith('?') && i + 1 < lines.length) {
      const nextLine = lines[i + 1].trim();
      if (optionPattern.test(nextLine)) {
        questionText = line;
        isQuestion = true;
      }
    }

    if (isQuestion && questionText) {
      // Save previous question
      if (currentQuestion && options.length >= 2) {
        if (correct === null && options.length > 0) {
          correct = 0;
        }
        questions.push({
          question: currentQuestion,
          options: options.slice(0, 4),
          correct: correct || 0
        });
      }
      
      currentQuestion = questionText.replace(/^Q\.?\s*\d+\.?\s*/, '').trim();
      options = [];
      correct = null;
      continue;
    }

    // Check if it's an option
    const optionMatch = line.match(optionPattern);
    if (optionMatch && currentQuestion) {
      const text = optionMatch[2].trim();
      
      let isCorrect = false;
      for (const pattern of correctPatterns) {
        if (pattern.test(line) || pattern.test(text)) {
          isCorrect = true;
          break;
        }
      }
      
      if (line.includes('*') || line.includes('✓') || line.includes('correct')) {
        isCorrect = true;
      }
      
      options.push(text);
      if (isCorrect) {
        correct = options.length - 1;
      }
      continue;
    }

    // Check for standalone correct answer line
    if (currentQuestion && /^(correct|answer|ans)/i.test(line)) {
      const ansMatch = line.match(/[A-Da-d]/);
      if (ansMatch) {
        const map = { a: 0, b: 1, c: 2, d: 3 };
        correct = map[ansMatch[0].toLowerCase()];
      }
    }
  }
  
  // Save last question
  if (currentQuestion && options.length >= 2) {
    if (correct === null && options.length > 0) {
      correct = 0;
    }
    questions.push({
      question: currentQuestion,
      options: options.slice(0, 4),
      correct: correct || 0
    });
  }
  
  return questions;
};

/**
 * ✅ NEW: Validate parsed questions
 */
const validateQuestions = (questions) => {
  const valid = [];
  const errors = [];
  
  questions.forEach((q, index) => {
    if (!q.question || q.question.length < 3) {
      errors.push(`Question ${index + 1}: Question text too short`);
      return;
    }
    if (q.options.length < 2) {
      errors.push(`Question ${index + 1}: At least 2 options required`);
      return;
    }
    if (q.correct === null || q.correct === undefined) {
      errors.push(`Question ${index + 1}: Correct answer not specified`);
      return;
    }
    if (q.correct >= q.options.length) {
      errors.push(`Question ${index + 1}: Invalid correct answer index`);
      return;
    }
    valid.push(q);
  });
  
  return { valid, errors };
};

// ✅ EXPORT ALL FUNCTIONS
module.exports = { 
  extractText, 
  parseMCQs, 
  validateQuestions  // ✅ ADDED THIS
};