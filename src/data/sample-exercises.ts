/**
 * Sample Exercise Data
 *
 * Demo exercises for testing the Code Workbench.
 */

import type { CodeExercise } from '@/types/content';

// =============================================================================
// Python Hello World Exercise
// =============================================================================

export const PYTHON_HELLO_WORLD: CodeExercise = {
  schemaVersion: '1.0.0',
  id: 'ex-python-hello',
  lessonId: 'les-001',
  moduleId: 'mod-001',
  courseId: 'course-python-basics',

  title: { default: 'Hello, World!' },
  description: { default: 'Write your first Python program that prints "Hello, World!"' },

  language: 'python',
  difficulty: 'beginner',
  estimatedMinutes: 5,

  problem: {
    description: {
      default: `Welcome to your first Python exercise!

Your task is to write a program that prints the text \`Hello, World!\` to the console.

In Python, you can print text using the \`print()\` function.`,
    },
    inputFormat: { default: 'This exercise has no input.' },
    outputFormat: { default: 'Print exactly: `Hello, World!`' },
    examples: [
      {
        input: '',
        output: 'Hello, World!',
        explanation: { default: 'The program simply prints the greeting text.' },
      },
    ],
  },

  editor: {
    starterCode: '# Write your code below\n\n',
    solutionCode: 'print("Hello, World!")',
  },

  testCases: [
    {
      id: 'tc-1',
      name: 'Basic output',
      visible: true,
      input: '',
      expectedOutput: 'Hello, World!',
      points: 100,
      failureFeedback: { default: 'Make sure you print exactly "Hello, World!" with correct capitalization and punctuation.' },
    },
  ],

  limits: {
    timeoutMs: 5000,
    memoryBytes: 10 * 1024 * 1024,
    maxOutputChars: 1000,
    maxSubmissions: 10,
  },

  hints: [
    {
      id: 'hint-1',
      unlockCondition: 'always',
      content: { default: 'Use the print() function to display text. Put the text inside quotes.' },
      pointPenalty: 0,
    },
    {
      id: 'hint-2',
      unlockCondition: 'after-attempts',
      attemptsRequired: 2,
      content: { default: 'The syntax is: print("Your text here")' },
      pointPenalty: 10,
    },
  ],

  scoring: {
    maxPoints: 100,
    method: 'all-or-nothing',
    partialCredit: false,
    passingScore: 100,
  },

  feedback: {
    showTestResults: true,
    showDiff: true,
    showStats: true,
  },

  concepts: ['print', 'strings', 'output'],
  status: 'published',
};

// =============================================================================
// Python Variables Exercise
// =============================================================================

export const PYTHON_VARIABLES: CodeExercise = {
  schemaVersion: '1.0.0',
  id: 'ex-python-vars',
  lessonId: 'les-001',
  moduleId: 'mod-001',
  courseId: 'course-python-basics',

  title: { default: 'Sum Two Numbers' },
  description: { default: 'Read two numbers and print their sum.' },

  language: 'python',
  difficulty: 'beginner',
  estimatedMinutes: 10,

  problem: {
    description: {
      default: `Write a program that:
1. Reads two integers from input
2. Calculates their sum
3. Prints the result

You will need to use \`input()\` to read values and \`int()\` to convert them to numbers.`,
    },
    inputFormat: { default: 'Two lines, each containing an integer.' },
    outputFormat: { default: 'A single integer: the sum of the two input numbers.' },
    constraints: [
      { default: '-1000 <= numbers <= 1000' },
    ],
    examples: [
      {
        input: '5\n3',
        output: '8',
        explanation: { default: '5 + 3 = 8' },
      },
      {
        input: '-2\n7',
        output: '5',
        explanation: { default: '-2 + 7 = 5' },
      },
    ],
  },

  editor: {
    starterCode: `# Read two numbers and print their sum
# Hint: Use input() to read and int() to convert

`,
    solutionCode: `a = int(input())
b = int(input())
print(a + b)`,
  },

  testCases: [
    {
      id: 'tc-1',
      name: 'Positive numbers',
      visible: true,
      input: '5\n3',
      expectedOutput: '8',
      points: 25,
    },
    {
      id: 'tc-2',
      name: 'Negative and positive',
      visible: true,
      input: '-2\n7',
      expectedOutput: '5',
      points: 25,
    },
    {
      id: 'tc-3',
      name: 'Both negative',
      visible: false,
      input: '-10\n-5',
      expectedOutput: '-15',
      points: 25,
    },
    {
      id: 'tc-4',
      name: 'Zero handling',
      visible: false,
      input: '0\n100',
      expectedOutput: '100',
      points: 25,
    },
  ],

  limits: {
    timeoutMs: 5000,
    memoryBytes: 10 * 1024 * 1024,
    maxOutputChars: 1000,
    maxSubmissions: 10,
  },

  hints: [
    {
      id: 'hint-1',
      unlockCondition: 'always',
      content: { default: 'To read input in Python, use the input() function. It returns a string.' },
      pointPenalty: 0,
    },
    {
      id: 'hint-2',
      unlockCondition: 'after-attempts',
      attemptsRequired: 2,
      content: { default: 'Convert the string to a number with int(). Example: num = int(input())' },
      pointPenalty: 5,
    },
    {
      id: 'hint-3',
      unlockCondition: 'after-attempts',
      attemptsRequired: 4,
      content: { default: 'To add two numbers: result = a + b, then print(result)' },
      pointPenalty: 10,
    },
  ],

  scoring: {
    maxPoints: 100,
    method: 'weighted',
    partialCredit: true,
    passingScore: 50,
  },

  feedback: {
    showTestResults: true,
    showDiff: true,
    showStats: true,
  },

  concepts: ['input', 'variables', 'integers', 'arithmetic'],
  status: 'published',
};

// =============================================================================
// JavaScript Hello World Exercise
// =============================================================================

export const JS_HELLO_WORLD: CodeExercise = {
  schemaVersion: '1.0.0',
  id: 'ex-js-hello',
  lessonId: 'les-js-001',
  moduleId: 'mod-js-001',
  courseId: 'course-javascript-intro',

  title: { default: 'JavaScript Hello World' },
  description: { default: 'Write your first JavaScript program.' },

  language: 'javascript',
  difficulty: 'beginner',
  estimatedMinutes: 5,

  problem: {
    description: {
      default: `Write a JavaScript program that prints "Hello, JavaScript!" to the console.

In JavaScript, you use \`console.log()\` to print output.`,
    },
    inputFormat: { default: 'No input.' },
    outputFormat: { default: 'Print exactly: `Hello, JavaScript!`' },
    examples: [
      {
        input: '',
        output: 'Hello, JavaScript!',
      },
    ],
  },

  editor: {
    starterCode: '// Write your code below\n\n',
    solutionCode: 'console.log("Hello, JavaScript!");',
  },

  testCases: [
    {
      id: 'tc-1',
      name: 'Basic output',
      visible: true,
      input: '',
      expectedOutput: 'Hello, JavaScript!',
      points: 100,
    },
  ],

  limits: {
    timeoutMs: 5000,
    memoryBytes: 10 * 1024 * 1024,
    maxOutputChars: 1000,
    maxSubmissions: 10,
  },

  hints: [
    {
      id: 'hint-1',
      unlockCondition: 'always',
      content: { default: 'Use console.log() to print text. Put the text in quotes.' },
      pointPenalty: 0,
    },
  ],

  scoring: {
    maxPoints: 100,
    method: 'all-or-nothing',
    partialCredit: false,
    passingScore: 100,
  },

  feedback: {
    showTestResults: true,
    showDiff: true,
    showStats: true,
  },

  concepts: ['console.log', 'strings', 'output'],
  status: 'published',
};

// =============================================================================
// Exercise Map for lookup
// =============================================================================

export const SAMPLE_EXERCISES: Record<string, CodeExercise> = {
  'ex-python-hello': PYTHON_HELLO_WORLD,
  'ex-python-vars': PYTHON_VARIABLES,
  'ex-js-hello': JS_HELLO_WORLD,
};

/**
 * Get a sample exercise by ID
 */
export function getSampleExercise(exerciseId: string): CodeExercise | undefined {
  return SAMPLE_EXERCISES[exerciseId];
}

/**
 * Get exercises for a module
 */
export function getModuleExercises(moduleId: string): CodeExercise[] {
  return Object.values(SAMPLE_EXERCISES).filter((ex) => ex.moduleId === moduleId);
}
