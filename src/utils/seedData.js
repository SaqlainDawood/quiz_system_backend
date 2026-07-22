const mongoose = require('mongoose');
const User = require('../models/User');
const Course = require('../models/Course');
const Subject = require('../models/Subject');
const Question = require('../models/Question');

// Static data from frontend (simplified version)
const staticData = {
  courses: [
    {
      id: "bscs",
      name: "BSCS",
      fullName: "Computer Science",
      description: "Bachelor of Science in Computer Science",
      color: "from-blue-600 to-indigo-700",
      textColor: "text-blue-600",
      bgLight: "bg-blue-50",
      subjects: [
        {
          id: "programming-fundamentals",
          name: "Programming Fundamentals",
          description: "Core concepts of programming and problem solving",
          questions: [
            {
              question: "Which of the following is NOT a programming paradigm?",
              options: ["Object-Oriented", "Functional", "Declarative", "Sequential Relay"],
              correct: 3
            },
            {
              question: "What does a compiler do?",
              options: [
                "Executes code line by line at runtime",
                "Translates high-level code to machine code before execution",
                "Only checks for syntax errors",
                "Converts machine code to source code"
              ],
              correct: 1
            }
          ]
        }
      ]
    }
  ]
};

/**
 * Seed the database with initial data
 */
const seedDatabase = async () => {
  try {
    // Check if data already exists
    const adminExists = await User.findOne({ email: 'admin@gmail.com' });
    const courseExists = await Course.findOne({ name: 'bscs' });

    if (adminExists && courseExists) {
      console.log('📚 Database already seeded. Skipping...');
      return;
    }

    console.log('🌱 Starting database seeding...');

    // Create admin user
    let adminUser = await User.findOne({ email: 'admin@gmail.com' });
    if (!adminUser) {
      adminUser = await User.create({
        email: 'admin@gmail.com',
        password: 'admin123',
        role: 'admin'
      });
      console.log('✅ Admin user created');
    }

    // Seed courses, subjects, questions
    for (const courseData of staticData.courses) {
      // Check if course exists
      let course = await Course.findOne({ name: courseData.name });
      
      if (!course) {
        course = await Course.create({
          name: courseData.name,
          fullName: courseData.fullName,
          description: courseData.description,
          color: courseData.color,
          textColor: courseData.textColor,
          bgLight: courseData.bgLight,
          createdBy: adminUser._id
        });
        console.log(`✅ Course created: ${course.name}`);
      }

      // Seed subjects
      for (const subjectData of courseData.subjects) {
        let subject = await Subject.findOne({ 
          name: subjectData.name,
          courseId: course._id 
        });

        if (!subject) {
          subject = await Subject.create({
            courseId: course._id,
            name: subjectData.name,
            description: subjectData.description,
            order: 0,
            createdBy: adminUser._id
          });
          console.log(`✅ Subject created: ${subject.name}`);
        }

        // Seed questions
        for (const questionData of subjectData.questions) {
          const exists = await Question.findOne({
            subjectId: subject._id,
            question: questionData.question
          });

          if (!exists) {
            await Question.create({
              subjectId: subject._id,
              courseId: course._id,
              question: questionData.question,
              options: questionData.options,
              correct: questionData.correct,
              createdBy: adminUser._id
            });
            console.log(`✅ Question created for: ${subject.name}`);
          }
        }
      }
    }

    console.log('🎉 Database seeding completed successfully!');
  } catch (error) {
     console.error(error);
    console.error('❌ Error seeding database:', error.message);
  }
};

// If running directly (node src/utils/seedData.js)
if (require.main === module) {
  require('../config/database')();
  seedDatabase().then(() => {
    process.exit();
  });
}

module.exports = seedDatabase;