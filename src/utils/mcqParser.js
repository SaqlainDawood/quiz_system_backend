// backend/src/utils/mcqParser.js
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const Tesseract = require('tesseract.js');

/**
 * Extract text from file
 */
const extractText = async (filePath, mimeType) => {
  const fs = require('fs');
  const buffer = fs.readFileSync(filePath);

  if (mimeType === 'application/pdf') {
    const data = await pdfParse(buffer);
    return data.text;
  }
  
  if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }
  
  if (mimeType.startsWith('image/')) {
    const result = await Tesseract.recognize(buffer, 'eng');
    return result.data.text;
  }
  
  // Plain text
  return buffer.toString('utf8');
};

/**
 * Parse MCQ from text
 */
const parseMCQs = (text) => {
  const questions = [];
  const lines = text.split('\n').filter(line => line.trim());
  
  let currentQuestion = null;
  let options = [];
  let correct = null;
  
  // Pattern: Q1. or 1. or Q.1
  const questionPattern = /^(Q\.?\s*(\d+)\.?|(\d+)\.?)\s*(.+)/i;
  const optionPattern = /^([A-Da-d])[\.\)]\s*(.+)/;
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Check if it's a question
    const qMatch = trimmed.match(questionPattern);
    if (qMatch) {
      // Save previous question
      if (currentQuestion && options.length === 4 && correct !== null) {
        questions.push({
          question: currentQuestion,
          options,
          correct
        });
      }
      
      // Start new question
      currentQuestion = qMatch[4] || qMatch[3];
      options = [];
      correct = null;
      continue;
    }
    
    // Check if it's an option
    const oMatch = trimmed.match(optionPattern);
    if (oMatch && currentQuestion) {
      const label = oMatch[1].toLowerCase();
      const text = oMatch[2];
      options.push(text);
      
      // Check if marked as correct
      if (trimmed.includes('*') || trimmed.includes('✓') || trimmed.toLowerCase().includes('correct')) {
        correct = options.length - 1;
      }
      continue;
    }
    
    // Check for correct answer indication
    if (currentQuestion && /^(correct|answer|ans)/i.test(trimmed)) {
      const ansMatch = trimmed.match(/[A-D]/i);
      if (ansMatch) {
        const map = { a: 0, b: 1, c: 2, d: 3 };
        correct = map[ansMatch[0].toLowerCase()];
      }
    }
  }
  
  // Save last question
  if (currentQuestion && options.length === 4 && correct !== null) {
    questions.push({
      question: currentQuestion,
      options,
      correct
    });
  }
  
  return questions;
};

module.exports = { extractText, parseMCQs };