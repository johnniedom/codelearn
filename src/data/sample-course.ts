/**
 * Sample Course Data
 *
 * Demo content for testing the content system without needing
 * actual cached course packages.
 */

import type {
  Course,
  Module,
  Lesson,
  Quiz,
  CourseListItem,
  MultipleChoiceQuestion,
  FillBlankQuestion,
} from '@/types/content';

// =============================================================================
// Constants
// =============================================================================

export const SAMPLE_COURSE_SLUG = 'python-basics';

// =============================================================================
// Sample Course List Items (for CoursesPage)
// =============================================================================

export const SAMPLE_COURSES: CourseListItem[] = [
  {
    id: 'course-python-basics',
    slug: 'python-basics',
    title: 'Python Basics',
    description:
      'Learn the fundamentals of Python programming. Perfect for beginners with no prior coding experience.',
    icon: '🐍',
    difficulty: 'beginner',
    lessonsCount: 15,
    completedLessons: 0,
    estimatedHours: 8,
  },
  {
    id: 'course-web-fundamentals',
    slug: 'web-fundamentals',
    title: 'Web Fundamentals',
    description:
      'Build your first website with HTML and CSS. Learn the building blocks of the modern web.',
    icon: '🌐',
    difficulty: 'beginner',
    lessonsCount: 12,
    completedLessons: 0,
    estimatedHours: 10,
  },
  {
    id: 'course-javascript-intro',
    slug: 'javascript-intro',
    title: 'Introduction to JavaScript',
    description:
      'Add interactivity to your websites. Learn JavaScript from scratch.',
    icon: '⚡',
    difficulty: 'intermediate',
    lessonsCount: 15,
    completedLessons: 0,
    estimatedHours: 12,
  },
];

// =============================================================================
// Sample Full Course (for detail pages)
// =============================================================================

export const SAMPLE_COURSE: Course = {
  schemaVersion: '1.0.0',
  id: 'course-python-basics',
  slug: 'python-basics',
  title: { default: 'Python Basics' },
  shortTitle: { default: 'Python' },
  description: {
    default:
      'Learn the fundamentals of Python programming. This course covers variables, data types, control structures, functions, and more. Perfect for beginners with no prior coding experience.',
  },
  thumbnail: {
    assetId: 'thumb-python',
    path: 'assets/images/python-thumb.png',
    mimeType: 'image/png',
    sizeBytes: 50000,
    checksum: 'abc123',
  },
  icon: '🐍',
  authors: [{ name: 'CodeLearn Team', organization: 'CodeLearn' }],
  category: 'Programming',
  tags: ['python', 'programming', 'beginner', 'coding'],
  targetAudience: {
    gradeLevels: ['grade-9', 'grade-10', 'grade-11', 'grade-12'],
    ageRange: { min: 14, max: 18 },
  },
  difficulty: 'beginner',
  learningObjectives: [
    { id: 'obj-1', description: { default: 'Understand variables and data types' } },
    { id: 'obj-2', description: { default: 'Write conditional statements' } },
    { id: 'obj-3', description: { default: 'Create and use functions' } },
  ],
  prerequisites: [],
  skillsGained: ['Python programming', 'Problem solving', 'Algorithmic thinking'],
  structure: {
    moduleCount: 3,
    lessonCount: 15,
    assessmentCount: 3,
    exerciseCount: 15,
  },
  duration: {
    totalHours: 8,
    weeklyHours: 4,
    weeksToComplete: 2,
  },
  modules: [
    { moduleId: 'mod-001', path: 'modules/mod-001/module.json' },
    { moduleId: 'mod-002', path: 'modules/mod-002/module.json' },
    { moduleId: 'mod-003', path: 'modules/mod-003/module.json' },
  ],
  completion: {
    requiredModules: ['mod-001', 'mod-002', 'mod-003'],
    minOverallScore: 70,
    certificateEnabled: true,
  },
  settings: {
    allowNonLinearProgress: false,
    showTimeEstimates: true,
    discussionEnabled: false,
    autoPlayNarration: false,
  },
  locale: 'en',
  supportedLocales: ['en'],
  status: 'published',
  publishedAt: '2026-01-01T00:00:00Z',
};

// =============================================================================
// Sample Module
// =============================================================================

export const SAMPLE_MODULE: Module = {
  schemaVersion: '1.0.0',
  id: 'mod-001',
  courseId: 'course-python-basics',
  orderIndex: 0,
  title: { default: 'Getting Started with Python' },
  shortTitle: { default: 'Getting Started' },
  description: {
    default: 'Learn the basics of Python programming, including variables, data types, and your first program.',
  },
  icon: '🚀',
  learningObjectives: [
    { id: 'mod-obj-1', description: { default: 'Set up Python environment' } },
    { id: 'mod-obj-2', description: { default: 'Understand variables' } },
  ],
  prerequisites: [],
  estimatedMinutes: 90,
  lessons: [
    { lessonId: 'les-001', path: 'lessons/les-001/lesson.json', required: true },
    { lessonId: 'les-002', path: 'lessons/les-002/lesson.json', required: true },
    { lessonId: 'les-003', path: 'lessons/les-003/lesson.json', required: true },
    { lessonId: 'les-004', path: 'lessons/les-004/lesson.json', required: true },
    { lessonId: 'les-005', path: 'lessons/les-005/lesson.json', required: true },
    { lessonId: 'les-006', path: 'lessons/les-006/lesson.json', required: true },
    { lessonId: 'les-007', path: 'lessons/les-007/lesson.json', required: true },
    { lessonId: 'les-008', path: 'lessons/les-008/lesson.json', required: true },
    { lessonId: 'les-009', path: 'lessons/les-009/lesson.json', required: true },
    { lessonId: 'les-010', path: 'lessons/les-010/lesson.json', required: true },
    { lessonId: 'les-011', path: 'lessons/les-011/lesson.json', required: true },
    { lessonId: 'les-012', path: 'lessons/les-012/lesson.json', required: true },
    { lessonId: 'les-013', path: 'lessons/les-013/lesson.json', required: true },
    { lessonId: 'les-014', path: 'lessons/les-014/lesson.json', required: true },
    { lessonId: 'les-015', path: 'lessons/les-015/lesson.json', required: true },
  ],
  assessment: {
    quizId: 'quiz-001',
    path: 'assessments/quiz-001.json',
    availability: 'after-lessons',
    required: true,
    passingScore: 70,
  },
  unlockConditions: {
    type: 'none',
  },
  completion: {
    lessonThreshold: 100,
    requireAssessment: true,
  },
  status: 'published',
};

// =============================================================================
// Sample Lesson
// =============================================================================

export const SAMPLE_LESSON: Lesson = {
  schemaVersion: '1.0.0',
  id: 'les-001',
  moduleId: 'mod-001',
  courseId: 'course-python-basics',
  orderIndex: 0,
  title: { default: 'What are Variables?' },
  shortTitle: { default: 'Variables' },
  description: {
    default: 'Learn what variables are and how to use them in Python.',
  },
  learningObjectives: [
    { id: 'les-obj-1', description: { default: 'Define what a variable is' } },
    { id: 'les-obj-2', description: { default: 'Create and assign variables' } },
  ],
  estimatedMinutes: 15,
  readingMinutes: 10,
  practiceMinutes: 5,
  difficulty: 'beginner',
  content: [
    {
      id: 'block-1',
      type: 'text',
      orderIndex: 0,
      markdown: {
        default: `## What are Variables?

In Python, **variables** are containers for storing data values. Unlike some other programming languages, Python has no command for declaring a variable - a variable is created the moment you first assign a value to it.

Variables do not need to be declared with any particular type, and can even change type after they have been set.`,
      },
    },
    {
      id: 'block-2',
      type: 'code',
      orderIndex: 1,
      language: 'python',
      code: `# Creating variables
name = "Alice"
age = 25
is_student = True

# Variables can change type
x = 5       # x is an integer
x = "hello" # x is now a string`,
      filename: 'variables.py',
      highlightLines: [2, 3, 4],
      caption: { default: 'Example of creating variables in Python' },
      allowCopy: true,
    },
    {
      id: 'block-3',
      type: 'callout',
      orderIndex: 2,
      calloutType: 'tip',
      title: { default: 'Variable Naming' },
      content: {
        default: 'Variable names must start with a letter or underscore (_). They can contain letters, numbers, and underscores, but cannot start with a number.',
      },
      collapsible: false,
    },
    {
      id: 'block-4',
      type: 'text',
      orderIndex: 3,
      markdown: {
        default: `## Variable Names

A variable can have a short name (like \`x\` and \`y\`) or a more descriptive name (\`age\`, \`car_name\`, \`total_volume\`).

### Rules for Python variables:
- Must start with a letter or underscore
- Cannot start with a number
- Can only contain alphanumeric characters and underscores
- Are case-sensitive (\`age\`, \`Age\`, and \`AGE\` are different variables)`,
      },
    },
    {
      id: 'block-5',
      type: 'code',
      orderIndex: 4,
      language: 'python',
      code: `# Valid variable names
my_var = "hello"
_my_var = "hello"
myVar = "hello"
MYVAR = "hello"
myvar2 = "hello"

# Invalid variable names (will cause errors)
# 2myvar = "hello"  # Starts with number
# my-var = "hello"  # Contains hyphen
# my var = "hello"  # Contains space`,
      caption: { default: 'Valid and invalid variable names' },
      allowCopy: true,
    },
    {
      id: 'block-6',
      type: 'divider',
      orderIndex: 5,
      label: { default: 'Practice Time' },
    },
    {
      id: 'block-7',
      type: 'callout',
      orderIndex: 6,
      calloutType: 'example',
      title: { default: 'Try It Yourself' },
      content: {
        default: 'Create a variable called `greeting` and assign it the value "Hello, World!". Then create a variable called `year` with the value 2026.',
      },
      collapsible: false,
    },
  ],
  summary: {
    keyPoints: [
      { default: 'Variables are containers for storing data values' },
      { default: 'Python creates variables when you assign a value' },
      { default: 'Variable names have specific rules to follow' },
    ],
    nextSteps: { default: 'Learn about different data types in Python' },
  },
  navigation: {
    nextLessonId: 'les-002',
    allowSkip: false,
  },
  progress: {
    completionCriteria: 'scroll-end',
    checkpoints: [],
  },
  status: 'published',
};

// =============================================================================
// Sample Lesson 2: Data Types in Python
// =============================================================================

export const SAMPLE_LESSON_2: Lesson = {
  schemaVersion: '1.0.0',
  id: 'les-002',
  moduleId: 'mod-001',
  courseId: 'course-python-basics',
  orderIndex: 1,
  title: { default: 'Data Types in Python' },
  shortTitle: { default: 'Data Types' },
  description: {
    default: 'Explore the fundamental data types in Python: strings, integers, floats, and booleans.',
  },
  learningObjectives: [
    { id: 'les2-obj-1', description: { default: 'Identify the four basic data types in Python' } },
    { id: 'les2-obj-2', description: { default: 'Use the type() function to check data types' } },
    { id: 'les2-obj-3', description: { default: 'Convert between different data types' } },
  ],
  estimatedMinutes: 20,
  readingMinutes: 12,
  practiceMinutes: 8,
  difficulty: 'beginner',
  content: [
    {
      id: 'les2-block-1',
      type: 'text',
      orderIndex: 0,
      markdown: {
        default: `## Understanding Data Types

Every value in Python has a **data type**. Data types tell Python what kind of value you're working with and what operations you can perform on it.

Python has four fundamental (primitive) data types that you'll use constantly:

1. **Strings (str)** - Text data
2. **Integers (int)** - Whole numbers
3. **Floats (float)** - Decimal numbers
4. **Booleans (bool)** - True/False values`,
      },
    },
    {
      id: 'les2-block-2',
      type: 'callout',
      orderIndex: 1,
      calloutType: 'info',
      title: { default: 'Why Data Types Matter' },
      content: {
        default: 'Different data types behave differently. For example, 5 + 5 gives you 10, but "5" + "5" gives you "55". Understanding data types helps you avoid unexpected bugs!',
      },
      collapsible: false,
    },
    {
      id: 'les2-block-3',
      type: 'divider',
      orderIndex: 2,
      label: { default: 'Strings' },
    },
    {
      id: 'les2-block-4',
      type: 'text',
      orderIndex: 3,
      markdown: {
        default: `## Strings (str)

A **string** is a sequence of characters enclosed in quotes. You can use single quotes (\`'\`) or double quotes (\`"\`) - both work the same way.

Strings are used for any text data: names, messages, file paths, etc.`,
      },
    },
    {
      id: 'les2-block-5',
      type: 'code',
      orderIndex: 4,
      language: 'python',
      code: `# Creating strings
name = "Alice"
greeting = 'Hello, World!'
empty_string = ""

# Strings can contain numbers (but they're still text!)
phone = "555-1234"
zip_code = "90210"

# Check the type
print(type(name))  # <class 'str'>

# String operations
full_greeting = greeting + " My name is " + name
print(full_greeting)  # Hello, World! My name is Alice`,
      filename: 'strings.py',
      highlightLines: [2, 3, 12],
      caption: { default: 'Working with string data' },
      allowCopy: true,
    },
    {
      id: 'les2-block-6',
      type: 'callout',
      orderIndex: 5,
      calloutType: 'tip',
      title: { default: 'String Concatenation' },
      content: {
        default: 'Use the + operator to join strings together. This is called "concatenation". You can also use f-strings for cleaner code: f"Hello, {name}!"',
      },
      collapsible: false,
    },
    {
      id: 'les2-block-7',
      type: 'divider',
      orderIndex: 6,
      label: { default: 'Numbers' },
    },
    {
      id: 'les2-block-8',
      type: 'text',
      orderIndex: 7,
      markdown: {
        default: `## Integers (int)

**Integers** are whole numbers without decimal points. They can be positive, negative, or zero.

## Floats (float)

**Floats** (floating-point numbers) are numbers with decimal points. Even if the decimal part is zero (like 5.0), Python still treats it as a float.`,
      },
    },
    {
      id: 'les2-block-9',
      type: 'code',
      orderIndex: 8,
      language: 'python',
      code: `# Integers - whole numbers
age = 25
temperature = -10
count = 0
big_number = 1_000_000  # Underscores for readability

print(type(age))  # <class 'int'>

# Floats - decimal numbers
price = 19.99
pi = 3.14159
percentage = 85.5
also_a_float = 5.0  # Has decimal, so it's a float!

print(type(price))  # <class 'float'>

# Math works naturally
total = price * 2
print(total)  # 39.98`,
      filename: 'numbers.py',
      highlightLines: [2, 3, 4, 11, 12, 13],
      caption: { default: 'Integer and float examples' },
      allowCopy: true,
    },
    {
      id: 'les2-block-10',
      type: 'callout',
      orderIndex: 9,
      calloutType: 'warning',
      title: { default: 'Float Precision' },
      content: {
        default: 'Floats can have tiny precision errors due to how computers store decimals. For example, 0.1 + 0.2 might give 0.30000000000000004. For financial calculations, consider using the decimal module.',
      },
      collapsible: false,
    },
    {
      id: 'les2-block-11',
      type: 'divider',
      orderIndex: 10,
      label: { default: 'Booleans' },
    },
    {
      id: 'les2-block-12',
      type: 'text',
      orderIndex: 11,
      markdown: {
        default: `## Booleans (bool)

**Booleans** represent truth values and can only be one of two values: \`True\` or \`False\` (note the capital letters!).

Booleans are essential for making decisions in your code - they're the foundation of if statements and loops.`,
      },
    },
    {
      id: 'les2-block-13',
      type: 'code',
      orderIndex: 12,
      language: 'python',
      code: `# Boolean values
is_student = True
has_license = False

print(type(is_student))  # <class 'bool'>

# Booleans from comparisons
age = 18
is_adult = age >= 18      # True
is_teenager = age < 20    # True
is_senior = age >= 65     # False

print(is_adult)   # True
print(is_senior)  # False

# Booleans in conditions
if is_adult:
    print("You can vote!")`,
      filename: 'booleans.py',
      highlightLines: [2, 3, 9, 10, 11],
      caption: { default: 'Boolean values and comparisons' },
      allowCopy: true,
    },
    {
      id: 'les2-block-14',
      type: 'divider',
      orderIndex: 13,
      label: { default: 'Type Conversion' },
    },
    {
      id: 'les2-block-15',
      type: 'text',
      orderIndex: 14,
      markdown: {
        default: `## Converting Between Types

Sometimes you need to convert data from one type to another. Python provides built-in functions for this:

- \`str()\` - Convert to string
- \`int()\` - Convert to integer
- \`float()\` - Convert to float
- \`bool()\` - Convert to boolean`,
      },
    },
    {
      id: 'les2-block-16',
      type: 'code',
      orderIndex: 15,
      language: 'python',
      code: `# String to number
user_input = "42"
number = int(user_input)
print(number + 8)  # 50

# Number to string
age = 25
message = "I am " + str(age) + " years old"
print(message)  # I am 25 years old

# Float to int (truncates, doesn't round!)
price = 19.99
whole_price = int(price)
print(whole_price)  # 19

# Int to float
count = 5
precise = float(count)
print(precise)  # 5.0

# Check the type
print(type(number))       # <class 'int'>
print(type(precise))      # <class 'float'>`,
      filename: 'conversion.py',
      highlightLines: [3, 8, 13, 18],
      caption: { default: 'Converting between data types' },
      allowCopy: true,
    },
    {
      id: 'les2-block-17',
      type: 'callout',
      orderIndex: 16,
      calloutType: 'warning',
      title: { default: 'Conversion Errors' },
      content: {
        default: 'Not all conversions work! int("hello") will crash with a ValueError. Always validate user input before converting.',
      },
      collapsible: false,
    },
    {
      id: 'les2-block-18',
      type: 'divider',
      orderIndex: 17,
      label: { default: 'Practice' },
    },
    {
      id: 'les2-block-19',
      type: 'callout',
      orderIndex: 18,
      calloutType: 'example',
      title: { default: 'Try It Yourself' },
      content: {
        default: `Create variables of each type and use type() to verify:
1. A string containing your favorite food
2. An integer for the current year
3. A float for a product price
4. A boolean for whether you like coding

Then try converting the year to a string and concatenating it with a message!`,
      },
      collapsible: false,
    },
  ],
  summary: {
    keyPoints: [
      { default: 'Python has four basic data types: str, int, float, and bool' },
      { default: 'Use type() to check what type a value is' },
      { default: 'Strings are text in quotes, integers are whole numbers' },
      { default: 'Floats are decimal numbers, booleans are True/False' },
      { default: 'Use str(), int(), float(), bool() to convert between types' },
    ],
    nextSteps: { default: 'Learn how to work with numbers and mathematical operations' },
  },
  navigation: {
    previousLessonId: 'les-001',
    nextLessonId: 'les-003',
    allowSkip: false,
  },
  progress: {
    completionCriteria: 'scroll-end',
    checkpoints: [],
  },
  status: 'published',
};

// =============================================================================
// Sample Lesson 3: Working with Numbers
// =============================================================================

export const SAMPLE_LESSON_3: Lesson = {
  schemaVersion: '1.0.0',
  id: 'les-003',
  moduleId: 'mod-001',
  courseId: 'course-python-basics',
  orderIndex: 2,
  title: { default: 'Working with Numbers' },
  shortTitle: { default: 'Numbers' },
  description: {
    default: 'Master arithmetic operators and understand order of operations in Python.',
  },
  learningObjectives: [
    { id: 'les3-obj-1', description: { default: 'Use all arithmetic operators in Python' } },
    { id: 'les3-obj-2', description: { default: 'Understand operator precedence (order of operations)' } },
    { id: 'les3-obj-3', description: { default: 'Apply operators to solve practical problems' } },
  ],
  estimatedMinutes: 25,
  readingMinutes: 15,
  practiceMinutes: 10,
  difficulty: 'beginner',
  content: [
    {
      id: 'les3-block-1',
      type: 'text',
      orderIndex: 0,
      markdown: {
        default: `## Arithmetic Operators

Python supports all the basic math operations you'd expect, plus a few special ones. These operators work with both integers and floats.

| Operator | Name | Example | Result |
|----------|------|---------|--------|
| \`+\` | Addition | \`5 + 3\` | \`8\` |
| \`-\` | Subtraction | \`5 - 3\` | \`2\` |
| \`*\` | Multiplication | \`5 * 3\` | \`15\` |
| \`/\` | Division | \`5 / 3\` | \`1.666...\` |
| \`//\` | Floor Division | \`5 // 3\` | \`1\` |
| \`%\` | Modulus | \`5 % 3\` | \`2\` |
| \`**\` | Exponent | \`5 ** 3\` | \`125\` |`,
      },
    },
    {
      id: 'les3-block-2',
      type: 'code',
      orderIndex: 1,
      language: 'python',
      code: `# Basic arithmetic
a = 10
b = 3

print(a + b)   # Addition: 13
print(a - b)   # Subtraction: 7
print(a * b)   # Multiplication: 30
print(a / b)   # Division: 3.333...

# Special operators
print(a // b)  # Floor division: 3 (rounds down)
print(a % b)   # Modulus: 1 (remainder)
print(a ** b)  # Exponent: 1000 (10^3)`,
      filename: 'arithmetic.py',
      highlightLines: [5, 6, 7, 8, 11, 12, 13],
      caption: { default: 'All arithmetic operators in Python' },
      allowCopy: true,
    },
    {
      id: 'les3-block-3',
      type: 'callout',
      orderIndex: 2,
      calloutType: 'info',
      title: { default: 'Division Always Returns a Float' },
      content: {
        default: 'In Python 3, regular division (/) always returns a float, even if the result is a whole number. 10 / 2 gives 5.0, not 5. Use floor division (//) if you need an integer result.',
      },
      collapsible: false,
    },
    {
      id: 'les3-block-4',
      type: 'divider',
      orderIndex: 3,
      label: { default: 'Floor Division & Modulus' },
    },
    {
      id: 'les3-block-5',
      type: 'text',
      orderIndex: 4,
      markdown: {
        default: `## Floor Division (//)

**Floor division** divides and rounds down to the nearest integer. It always rounds toward negative infinity, not toward zero.

## Modulus (%)

The **modulus** operator returns the remainder after division. It's incredibly useful for:
- Checking if a number is even or odd
- Wrapping values around (like clock arithmetic)
- Extracting digits from numbers`,
      },
    },
    {
      id: 'les3-block-6',
      type: 'code',
      orderIndex: 5,
      language: 'python',
      code: `# Floor division examples
print(17 // 5)   # 3 (not 3.4)
print(17 / 5)    # 3.4 (regular division)
print(-17 // 5)  # -4 (rounds toward negative infinity!)

# Modulus examples
print(17 % 5)    # 2 (remainder of 17/5)
print(10 % 2)    # 0 (10 is even)
print(11 % 2)    # 1 (11 is odd)

# Practical use: Check if a number is even
number = 42
if number % 2 == 0:
    print(f"{number} is even")
else:
    print(f"{number} is odd")

# Practical use: Extract last digit
year = 2026
last_digit = year % 10
print(f"Last digit of {year} is {last_digit}")  # 6`,
      filename: 'floor_modulus.py',
      highlightLines: [7, 8, 9, 13, 20],
      caption: { default: 'Floor division and modulus in action' },
      allowCopy: true,
    },
    {
      id: 'les3-block-7',
      type: 'callout',
      orderIndex: 6,
      calloutType: 'tip',
      title: { default: 'Quick Even/Odd Check' },
      content: {
        default: 'number % 2 == 0 means the number is even. number % 2 == 1 means it is odd. This pattern is used constantly in programming!',
      },
      collapsible: false,
    },
    {
      id: 'les3-block-8',
      type: 'divider',
      orderIndex: 7,
      label: { default: 'Order of Operations' },
    },
    {
      id: 'les3-block-9',
      type: 'text',
      orderIndex: 8,
      markdown: {
        default: `## Order of Operations (Operator Precedence)

Python follows the standard mathematical order of operations, often remembered as **PEMDAS**:

1. **P**arentheses \`()\` - highest priority
2. **E**xponents \`**\`
3. **M**ultiplication \`*\`, **D**ivision \`/\`, Floor Division \`//\`, Modulus \`%\`
4. **A**ddition \`+\`, **S**ubtraction \`-\` - lowest priority

Operations at the same level are evaluated left to right.`,
      },
    },
    {
      id: 'les3-block-10',
      type: 'code',
      orderIndex: 9,
      language: 'python',
      code: `# Without parentheses - follows PEMDAS
result1 = 2 + 3 * 4      # 3*4 first, then +2 = 14
result2 = 10 - 2 ** 3    # 2**3 first = 8, then 10-8 = 2
result3 = 20 / 4 + 1     # 20/4 first = 5.0, then +1 = 6.0

print(result1)  # 14
print(result2)  # 2
print(result3)  # 6.0

# With parentheses - override default order
result4 = (2 + 3) * 4    # 2+3 first = 5, then *4 = 20
result5 = (10 - 2) ** 3  # 10-2 first = 8, then **3 = 512
result6 = 20 / (4 + 1)   # 4+1 first = 5, then 20/5 = 4.0

print(result4)  # 20
print(result5)  # 512
print(result6)  # 4.0`,
      filename: 'order_of_operations.py',
      highlightLines: [2, 3, 4, 11, 12, 13],
      caption: { default: 'Order of operations examples' },
      allowCopy: true,
    },
    {
      id: 'les3-block-11',
      type: 'callout',
      orderIndex: 10,
      calloutType: 'tip',
      title: { default: 'When in Doubt, Use Parentheses!' },
      content: {
        default: 'Even if you know the precedence rules, parentheses make your code easier to read. (2 + 3) * 4 is clearer than relying on everyone knowing PEMDAS.',
      },
      collapsible: false,
    },
    {
      id: 'les3-block-12',
      type: 'divider',
      orderIndex: 11,
      label: { default: 'Compound Assignment' },
    },
    {
      id: 'les3-block-13',
      type: 'text',
      orderIndex: 12,
      markdown: {
        default: `## Compound Assignment Operators

Python provides shorthand operators that combine an operation with assignment. These are useful for updating variables.`,
      },
    },
    {
      id: 'les3-block-14',
      type: 'code',
      orderIndex: 13,
      language: 'python',
      code: `# Instead of writing:
score = 100
score = score + 10  # Add 10 to score

# You can write:
score = 100
score += 10  # Same thing, shorter!
print(score)  # 110

# All compound operators
x = 20
x += 5   # x = x + 5  -> 25
x -= 3   # x = x - 3  -> 22
x *= 2   # x = x * 2  -> 44
x /= 4   # x = x / 4  -> 11.0
x //= 2  # x = x // 2 -> 5.0
x **= 2  # x = x ** 2 -> 25.0
x %= 7   # x = x % 7  -> 4.0

print(x)  # 4.0`,
      filename: 'compound_operators.py',
      highlightLines: [7, 12, 13, 14, 15],
      caption: { default: 'Compound assignment operators' },
      allowCopy: true,
    },
    {
      id: 'les3-block-15',
      type: 'divider',
      orderIndex: 14,
      label: { default: 'Practice Exercises' },
    },
    {
      id: 'les3-block-16',
      type: 'text',
      orderIndex: 15,
      markdown: {
        default: `## Practice Exercises

Try solving these problems using what you've learned:`,
      },
    },
    {
      id: 'les3-block-17',
      type: 'callout',
      orderIndex: 16,
      calloutType: 'example',
      title: { default: 'Exercise 1: Temperature Converter' },
      content: {
        default: `Convert 98.6 degrees Fahrenheit to Celsius.
Formula: celsius = (fahrenheit - 32) * 5 / 9

Write the Python code and print the result.`,
      },
      collapsible: false,
    },
    {
      id: 'les3-block-18',
      type: 'callout',
      orderIndex: 17,
      calloutType: 'example',
      title: { default: 'Exercise 2: Time Calculator' },
      content: {
        default: `You have 7385 seconds. Convert this to hours, minutes, and seconds.
Hints:
- Use // for integer division
- Use % for remainder
- There are 60 seconds in a minute, 60 minutes in an hour`,
      },
      collapsible: false,
    },
    {
      id: 'les3-block-19',
      type: 'callout',
      orderIndex: 18,
      calloutType: 'example',
      title: { default: 'Exercise 3: Discount Calculator' },
      content: {
        default: `An item costs $85.50 and is on sale for 20% off.
Calculate the discount amount and the final price.
Use proper variable names and print both values.`,
      },
      collapsible: false,
    },
    {
      id: 'les3-block-20',
      type: 'divider',
      orderIndex: 19,
      label: { default: 'Solutions' },
    },
    {
      id: 'les3-block-21',
      type: 'code',
      orderIndex: 20,
      language: 'python',
      code: `# Exercise 1: Temperature Converter
fahrenheit = 98.6
celsius = (fahrenheit - 32) * 5 / 9
print(f"{fahrenheit}F = {celsius:.2f}C")  # 98.6F = 37.00C

# Exercise 2: Time Calculator
total_seconds = 7385
hours = total_seconds // 3600
remaining = total_seconds % 3600
minutes = remaining // 60
seconds = remaining % 60
print(f"{total_seconds}s = {hours}h {minutes}m {seconds}s")
# Output: 7385s = 2h 3m 5s

# Exercise 3: Discount Calculator
original_price = 85.50
discount_rate = 0.20  # 20%
discount_amount = original_price * discount_rate
final_price = original_price - discount_amount
print(f"Discount: \${discount_amount:.2f}")   # \$17.10
print(f"Final price: \${final_price:.2f}")    # \$68.40`,
      filename: 'solutions.py',
      highlightLines: [3, 8, 9, 10, 11, 17, 18, 19],
      caption: { default: 'Exercise solutions' },
      allowCopy: true,
    },
  ],
  summary: {
    keyPoints: [
      { default: 'Python has 7 arithmetic operators: +, -, *, /, //, %, **' },
      { default: 'Regular division (/) always returns a float' },
      { default: 'Floor division (//) rounds down, modulus (%) gives remainder' },
      { default: 'PEMDAS determines order of operations; use parentheses for clarity' },
      { default: 'Compound operators (+=, -=, etc.) provide convenient shortcuts' },
    ],
    nextSteps: { default: 'Learn about strings and text manipulation in Python' },
  },
  navigation: {
    previousLessonId: 'les-002',
    nextLessonId: 'les-004',
    allowSkip: false,
  },
  progress: {
    completionCriteria: 'scroll-end',
    checkpoints: [],
  },
  status: 'published',
};

// =============================================================================
// Sample Lesson 4: Data Types: Strings
// =============================================================================

export const SAMPLE_LESSON_4: Lesson = {
  schemaVersion: '1.0.0',
  id: 'les-004',
  moduleId: 'mod-001',
  courseId: 'course-python-basics',
  orderIndex: 3,
  title: { default: 'Data Types: Strings' },
  shortTitle: { default: 'Strings' },
  description: {
    default: 'Dive deep into strings: creation, concatenation, repetition, and formatting with f-strings.',
  },
  learningObjectives: [
    { id: 'les4-obj-1', description: { default: 'Define what a string is' } },
    { id: 'les4-obj-2', description: { default: 'Explain string concatenation' } },
    { id: 'les4-obj-3', description: { default: 'Create and combine strings' } },
  ],
  estimatedMinutes: 25,
  readingMinutes: 15,
  practiceMinutes: 10,
  difficulty: 'beginner',
  content: [
    {
      id: 'les4-block-1',
      type: 'text',
      orderIndex: 0,
      markdown: {
        default: `## What are Strings?

A **string** is a sequence of characters - letters, numbers, symbols, or spaces - enclosed in quotes. Strings are one of the most commonly used data types in programming because they represent text.

In Python, strings are:
- **Immutable**: Once created, individual characters cannot be changed
- **Ordered**: Characters maintain their position (index)
- **Iterable**: You can loop through each character`,
      },
    },
    {
      id: 'les4-block-2',
      type: 'code',
      orderIndex: 1,
      language: 'python',
      code: `# Creating strings with single quotes
message = 'Hello, World!'

# Creating strings with double quotes
greeting = "Welcome to Python!"

# Both work exactly the same
print(message)   # Hello, World!
print(greeting)  # Welcome to Python!

# When to use which?
# Use double quotes when your string contains an apostrophe
sentence = "It's a beautiful day!"

# Use single quotes when your string contains double quotes
html = '<div class="container">Content</div>'`,
      filename: 'creating_strings.py',
      highlightLines: [2, 5, 13, 16],
      caption: { default: 'Creating strings with single and double quotes' },
      allowCopy: true,
    },
    {
      id: 'les4-block-3',
      type: 'divider',
      orderIndex: 2,
      label: { default: 'String Concatenation' },
    },
    {
      id: 'les4-block-4',
      type: 'text',
      orderIndex: 3,
      markdown: {
        default: `## String Concatenation with +

**Concatenation** means joining strings together. In Python, you use the \`+\` operator to combine two or more strings into one.`,
      },
    },
    {
      id: 'les4-block-5',
      type: 'code',
      orderIndex: 4,
      language: 'python',
      code: `# Basic concatenation
first_name = "John"
last_name = "Doe"
full_name = first_name + " " + last_name
print(full_name)  # John Doe

# Building messages
greeting = "Hello, "
name = "Alice"
message = greeting + name + "!"
print(message)  # Hello, Alice!

# Concatenating multiple strings
street = "123 Main St"
city = "Springfield"
state = "IL"
address = street + ", " + city + ", " + state
print(address)  # 123 Main St, Springfield, IL`,
      filename: 'concatenation.py',
      highlightLines: [4, 10, 17],
      caption: { default: 'Joining strings with the + operator' },
      allowCopy: true,
    },
    {
      id: 'les4-block-6',
      type: 'divider',
      orderIndex: 5,
      label: { default: 'String Repetition' },
    },
    {
      id: 'les4-block-7',
      type: 'text',
      orderIndex: 6,
      markdown: {
        default: `## String Repetition with *

The \`*\` operator repeats a string a specified number of times. This is useful for creating patterns, separators, or repeated content.`,
      },
    },
    {
      id: 'les4-block-8',
      type: 'code',
      orderIndex: 7,
      language: 'python',
      code: `# Repeat a string
laugh = "ha"
big_laugh = laugh * 5
print(big_laugh)  # hahahahaha

# Create a separator line
separator = "-" * 40
print(separator)  # ----------------------------------------

# Combine with concatenation
border = "=" * 20
title = "Welcome!"
print(border)
print(title)
print(border)
# ====================
# Welcome!
# ====================

# Practical use: Indentation
indent = "  " * 3  # 6 spaces
print(indent + "This is indented")`,
      filename: 'repetition.py',
      highlightLines: [3, 7, 21],
      caption: { default: 'Repeating strings with the * operator' },
      allowCopy: true,
    },
    {
      id: 'les4-block-9',
      type: 'divider',
      orderIndex: 8,
      label: { default: 'F-Strings' },
    },
    {
      id: 'les4-block-10',
      type: 'text',
      orderIndex: 9,
      markdown: {
        default: `## f-strings for Formatting

**f-strings** (formatted string literals) are a modern and readable way to embed variables and expressions inside strings. They were introduced in Python 3.6 and are now the preferred method for string formatting.

To create an f-string, prefix your string with \`f\` and put variables or expressions inside curly braces \`{}\`.`,
      },
    },
    {
      id: 'les4-block-11',
      type: 'code',
      orderIndex: 10,
      language: 'python',
      code: `# Basic f-string usage
name = "Alice"
age = 25
message = f"My name is {name} and I am {age} years old."
print(message)  # My name is Alice and I am 25 years old.

# Expressions inside f-strings
price = 19.99
quantity = 3
total = f"Total: \${price * quantity}"
print(total)  # Total: $59.97

# Formatting numbers
pi = 3.14159
print(f"Pi to 2 decimal places: {pi:.2f}")  # Pi to 2 decimal places: 3.14

# Padding and alignment
name = "Bob"
print(f"|{name:>10}|")  # |       Bob| (right-aligned, 10 chars)
print(f"|{name:<10}|")  # |Bob       | (left-aligned, 10 chars)
print(f"|{name:^10}|")  # |   Bob    | (centered, 10 chars)`,
      filename: 'fstrings.py',
      highlightLines: [4, 10, 15, 19, 20, 21],
      caption: { default: 'Using f-strings for cleaner code' },
      allowCopy: true,
    },
    {
      id: 'les4-block-12',
      type: 'callout',
      orderIndex: 11,
      calloutType: 'tip',
      title: { default: 'f-strings are the Modern Way' },
      content: {
        default: 'f-strings are faster and more readable than older formatting methods like % formatting or .format(). Always prefer f-strings in Python 3.6+ code: f"Hello, {name}!" instead of "Hello, " + name + "!" or "Hello, {}!".format(name)',
      },
      collapsible: false,
    },
    {
      id: 'les4-block-13',
      type: 'divider',
      orderIndex: 12,
      label: { default: 'Practice' },
    },
    {
      id: 'les4-block-14',
      type: 'callout',
      orderIndex: 13,
      calloutType: 'example',
      title: { default: 'Try It Yourself' },
      content: {
        default: `Practice your string skills:
1. Create two variables: first_name and last_name with your name
2. Concatenate them with a space to make full_name
3. Create a greeting using an f-string: "Hello, my name is {full_name}!"
4. Create a decorative border using string repetition
5. Print your greeting with the border above and below it`,
      },
      collapsible: false,
    },
  ],
  summary: {
    keyPoints: [
      { default: 'Strings are sequences of characters enclosed in quotes' },
      { default: 'Use single or double quotes - both work the same' },
      { default: 'The + operator concatenates (joins) strings together' },
      { default: 'The * operator repeats a string multiple times' },
      { default: 'f-strings provide a clean way to embed variables: f"Hello, {name}!"' },
    ],
    nextSteps: { default: 'Learn about Boolean values and comparison operators' },
  },
  navigation: {
    previousLessonId: 'les-003',
    nextLessonId: 'les-005',
    allowSkip: false,
  },
  progress: {
    completionCriteria: 'scroll-end',
    checkpoints: [],
  },
  status: 'published',
};

// =============================================================================
// Sample Lesson 5: Data Types: Booleans
// =============================================================================

export const SAMPLE_LESSON_5: Lesson = {
  schemaVersion: '1.0.0',
  id: 'les-005',
  moduleId: 'mod-001',
  courseId: 'course-python-basics',
  orderIndex: 4,
  title: { default: 'Data Types: Booleans' },
  shortTitle: { default: 'Booleans' },
  description: {
    default: 'Understand Boolean values (True and False) and how they are used in comparisons and conditions.',
  },
  learningObjectives: [
    { id: 'les5-obj-1', description: { default: 'Recall the two Boolean values' } },
    { id: 'les5-obj-2', description: { default: 'Explain when Booleans are used' } },
    { id: 'les5-obj-3', description: { default: 'Create comparison expressions' } },
  ],
  estimatedMinutes: 15,
  readingMinutes: 10,
  practiceMinutes: 5,
  difficulty: 'beginner',
  content: [
    {
      id: 'les5-block-1',
      type: 'text',
      orderIndex: 0,
      markdown: {
        default: `## True and False Values

A **Boolean** is a data type that can only have one of two values: \`True\` or \`False\`. These values represent the concept of truth in programming and are fundamental to making decisions in your code.

Key things to remember about Booleans:
- They are always capitalized: \`True\` not \`true\`, \`False\` not \`false\`
- They are not strings: \`True\` is different from \`"True"\`
- They are the building blocks of conditional logic`,
      },
    },
    {
      id: 'les5-block-2',
      type: 'code',
      orderIndex: 1,
      language: 'python',
      code: `# Boolean values
is_raining = True
is_sunny = False

print(is_raining)       # True
print(is_sunny)         # False
print(type(is_raining)) # <class 'bool'>

# Booleans are used for conditions
game_over = False
logged_in = True
has_permission = True

# You can toggle booleans with 'not'
is_closed = True
is_open = not is_closed
print(is_open)  # False`,
      filename: 'boolean_values.py',
      highlightLines: [2, 3, 16],
      caption: { default: 'Creating and using Boolean values' },
      allowCopy: true,
    },
    {
      id: 'les5-block-3',
      type: 'divider',
      orderIndex: 2,
      label: { default: 'Comparison Operators' },
    },
    {
      id: 'les5-block-4',
      type: 'text',
      orderIndex: 3,
      markdown: {
        default: `## Comparison Results Return Booleans

When you compare two values using comparison operators, Python returns a Boolean result. These comparisons are the foundation of decision-making in programming.

| Operator | Meaning | Example | Result |
|----------|---------|---------|--------|
| \`==\` | Equal to | \`5 == 5\` | \`True\` |
| \`!=\` | Not equal to | \`5 != 3\` | \`True\` |
| \`<\` | Less than | \`3 < 5\` | \`True\` |
| \`>\` | Greater than | \`5 > 3\` | \`True\` |
| \`<=\` | Less than or equal | \`5 <= 5\` | \`True\` |
| \`>=\` | Greater than or equal | \`5 >= 3\` | \`True\` |`,
      },
    },
    {
      id: 'les5-block-5',
      type: 'code',
      orderIndex: 4,
      language: 'python',
      code: `# Comparison operators return Booleans
age = 18
minimum_age = 18

# Equality check
can_vote = age >= minimum_age
print(can_vote)  # True

# More comparisons
print(10 == 10)   # True  (equal)
print(10 != 5)    # True  (not equal)
print(10 > 5)     # True  (greater than)
print(10 < 5)     # False (less than)
print(10 >= 10)   # True  (greater or equal)
print(10 <= 9)    # False (less or equal)

# Comparing strings (alphabetical order)
print("apple" < "banana")  # True
print("cat" == "cat")      # True
print("A" < "a")           # True (uppercase comes before lowercase)

# Storing comparison results
temperature = 32
is_freezing = temperature <= 32
print(f"Is it freezing? {is_freezing}")  # Is it freezing? True`,
      filename: 'comparisons.py',
      highlightLines: [6, 10, 11, 12, 13, 23, 24],
      caption: { default: 'Comparison operators and Boolean results' },
      allowCopy: true,
    },
    {
      id: 'les5-block-6',
      type: 'callout',
      orderIndex: 5,
      calloutType: 'info',
      title: { default: 'Named After George Boole' },
      content: {
        default: 'Boolean values are named after George Boole (1815-1864), an English mathematician who developed Boolean algebra - a branch of mathematics dealing with true/false logic. His work laid the foundation for modern computer science and digital circuits.',
      },
      collapsible: false,
    },
    {
      id: 'les5-block-7',
      type: 'divider',
      orderIndex: 6,
      label: { default: 'Practice' },
    },
    {
      id: 'les5-block-8',
      type: 'callout',
      orderIndex: 7,
      calloutType: 'example',
      title: { default: 'Try It Yourself' },
      content: {
        default: `Practice with Booleans:
1. Create a variable \`score\` with value 85
2. Create a Boolean \`passed\` that checks if score >= 70
3. Create a Boolean \`perfect\` that checks if score == 100
4. Print both Boolean results
5. Use the \`not\` operator to create \`failed = not passed\``,
      },
      collapsible: false,
    },
  ],
  summary: {
    keyPoints: [
      { default: 'Booleans can only be True or False (capitalized)' },
      { default: 'Comparison operators (==, !=, <, >, <=, >=) return Boolean values' },
      { default: 'Booleans are essential for making decisions in code' },
      { default: 'The not operator inverts a Boolean value' },
    ],
    nextSteps: { default: 'Learn how to get input from users' },
  },
  navigation: {
    previousLessonId: 'les-004',
    nextLessonId: 'les-006',
    allowSkip: false,
  },
  progress: {
    completionCriteria: 'scroll-end',
    checkpoints: [],
  },
  status: 'published',
};

// =============================================================================
// Sample Lesson 6: Getting User Input
// =============================================================================

export const SAMPLE_LESSON_6: Lesson = {
  schemaVersion: '1.0.0',
  id: 'les-006',
  moduleId: 'mod-001',
  courseId: 'course-python-basics',
  orderIndex: 5,
  title: { default: 'Getting User Input' },
  shortTitle: { default: 'User Input' },
  description: {
    default: 'Learn to make your programs interactive by getting input from users with the input() function.',
  },
  learningObjectives: [
    { id: 'les6-obj-1', description: { default: 'Recall the input() function syntax' } },
    { id: 'les6-obj-2', description: { default: 'Explain that input() always returns a string' } },
    { id: 'les6-obj-3', description: { default: 'Convert input to appropriate data types' } },
  ],
  estimatedMinutes: 20,
  readingMinutes: 12,
  practiceMinutes: 8,
  difficulty: 'beginner',
  content: [
    {
      id: 'les6-block-1',
      type: 'text',
      orderIndex: 0,
      markdown: {
        default: `## The input() Function

The \`input()\` function allows your program to pause and wait for the user to type something. This makes your programs interactive - they can respond to user data instead of just running the same code every time.

The basic syntax is:
\`\`\`python
variable = input("Your prompt message: ")
\`\`\`

The prompt message is displayed to the user, and their response is stored in the variable.`,
      },
    },
    {
      id: 'les6-block-2',
      type: 'code',
      orderIndex: 1,
      language: 'python',
      code: `# Getting a name from the user
name = input("What is your name? ")
print(f"Hello, {name}!")

# The program waits for user input
# User types: Alice
# Output: Hello, Alice!

# Getting multiple inputs
first_name = input("Enter your first name: ")
last_name = input("Enter your last name: ")
full_name = f"{first_name} {last_name}"
print(f"Welcome, {full_name}!")

# Example interaction:
# Enter your first name: John
# Enter your last name: Doe
# Welcome, John Doe!`,
      filename: 'getting_input.py',
      highlightLines: [2, 10, 11, 12],
      caption: { default: 'Using input() to get user data' },
      allowCopy: true,
    },
    {
      id: 'les6-block-3',
      type: 'callout',
      orderIndex: 2,
      calloutType: 'warning',
      title: { default: 'Input is Always a String!' },
      content: {
        default: 'The input() function ALWAYS returns a string, even if the user types a number. If you type "42", you get the string "42", not the integer 42. This is a common source of bugs for beginners!',
      },
      collapsible: false,
    },
    {
      id: 'les6-block-4',
      type: 'divider',
      orderIndex: 3,
      label: { default: 'Type Conversion' },
    },
    {
      id: 'les6-block-5',
      type: 'text',
      orderIndex: 4,
      markdown: {
        default: `## Converting Input to Numbers

Since \`input()\` always returns a string, you need to convert the result if you want to do math with it. Use \`int()\` for whole numbers and \`float()\` for decimal numbers.`,
      },
    },
    {
      id: 'les6-block-6',
      type: 'code',
      orderIndex: 5,
      language: 'python',
      code: `# Without conversion - this causes problems!
age_string = input("Enter your age: ")
# If user types 25, age_string is "25" (a string)
# age_string + 10  # ERROR! Can't add string and int

# Converting to integer
age = int(input("Enter your age: "))
next_year_age = age + 1
print(f"Next year you will be {next_year_age}")

# Converting to float
price = float(input("Enter the price: "))
tax = price * 0.08
total = price + tax
print(f"Total with tax: \${total:.2f}")

# Example interaction:
# Enter the price: 19.99
# Total with tax: $21.59

# Getting multiple numbers
num1 = int(input("Enter first number: "))
num2 = int(input("Enter second number: "))
sum_result = num1 + num2
print(f"{num1} + {num2} = {sum_result}")`,
      filename: 'converting_input.py',
      highlightLines: [7, 12, 22, 23, 24],
      caption: { default: 'Converting string input to numbers' },
      allowCopy: true,
    },
    {
      id: 'les6-block-7',
      type: 'callout',
      orderIndex: 6,
      calloutType: 'tip',
      title: { default: 'Handle Invalid Input' },
      content: {
        default: 'If the user types "hello" and you try int("hello"), Python will crash with a ValueError. In real programs, you should validate user input or use try/except to handle errors gracefully.',
      },
      collapsible: false,
    },
    {
      id: 'les6-block-8',
      type: 'divider',
      orderIndex: 7,
      label: { default: 'Practice' },
    },
    {
      id: 'les6-block-9',
      type: 'callout',
      orderIndex: 8,
      calloutType: 'example',
      title: { default: 'Try It Yourself' },
      content: {
        default: `Build an interactive program:
1. Ask the user for their name using input()
2. Ask for their birth year (convert to int)
3. Calculate their age (2026 - birth_year)
4. Print a personalized message with their name and age
5. Bonus: Ask for a product price, calculate 20% discount, and show the final price`,
      },
      collapsible: false,
    },
  ],
  summary: {
    keyPoints: [
      { default: 'input() pauses the program and waits for user input' },
      { default: 'input() ALWAYS returns a string, even for numbers' },
      { default: 'Use int() to convert input to an integer' },
      { default: 'Use float() to convert input to a decimal number' },
      { default: 'Always validate or convert input before doing math' },
    ],
    nextSteps: { default: 'Learn how to make decisions with conditional statements' },
  },
  navigation: {
    previousLessonId: 'les-005',
    nextLessonId: 'les-007',
    allowSkip: false,
  },
  progress: {
    completionCriteria: 'scroll-end',
    checkpoints: [],
  },
  status: 'published',
};

// =============================================================================
// Sample Lesson 7: Conditional Statements
// =============================================================================

export const SAMPLE_LESSON_7: Lesson = {
  schemaVersion: '1.0.0',
  id: 'les-007',
  moduleId: 'mod-001',
  courseId: 'course-python-basics',
  orderIndex: 6,
  title: { default: 'Conditional Statements' },
  shortTitle: { default: 'Conditionals' },
  description: {
    default: 'Control program flow with if, elif, and else statements to make decisions based on conditions.',
  },
  learningObjectives: [
    { id: 'les7-obj-1', description: { default: 'Identify the if, elif, else keywords' } },
    { id: 'les7-obj-2', description: { default: 'Explain how conditions control program flow' } },
    { id: 'les7-obj-3', description: { default: 'Write conditional statements with multiple branches' } },
  ],
  estimatedMinutes: 30,
  readingMinutes: 18,
  practiceMinutes: 12,
  difficulty: 'beginner',
  content: [
    {
      id: 'les7-block-1',
      type: 'text',
      orderIndex: 0,
      markdown: {
        default: `## Making Decisions in Code

Real programs need to make decisions. Should we show an error message? Is the user old enough? Did the player win? **Conditional statements** let your code take different paths based on conditions.

The basic structure is:
- **if**: Check a condition, run code if True
- **elif**: Check another condition if the previous was False
- **else**: Run code if all conditions were False`,
      },
    },
    {
      id: 'les7-block-2',
      type: 'divider',
      orderIndex: 1,
      label: { default: 'The if Statement' },
    },
    {
      id: 'les7-block-3',
      type: 'text',
      orderIndex: 2,
      markdown: {
        default: `## Simple if Statement

An \`if\` statement checks a condition. If the condition is \`True\`, the indented code block runs. If it is \`False\`, Python skips that block entirely.`,
      },
    },
    {
      id: 'les7-block-4',
      type: 'code',
      orderIndex: 3,
      language: 'python',
      code: `# Simple if statement
age = 18

if age >= 18:
    print("You are an adult.")
    print("You can vote!")

print("This always prints.")

# The condition must be a Boolean (or evaluate to one)
temperature = 35

if temperature > 30:
    print("It's hot outside!")
    print("Stay hydrated.")

# Using variables as conditions
has_ticket = True

if has_ticket:
    print("Welcome to the show!")`,
      filename: 'if_statement.py',
      highlightLines: [4, 5, 6, 13, 14, 20, 21],
      caption: { default: 'Basic if statement structure' },
      allowCopy: true,
    },
    {
      id: 'les7-block-5',
      type: 'divider',
      orderIndex: 4,
      label: { default: 'The else Clause' },
    },
    {
      id: 'les7-block-6',
      type: 'text',
      orderIndex: 5,
      markdown: {
        default: `## The else Clause

The \`else\` clause provides an alternative path when the \`if\` condition is \`False\`. You must have an \`if\` before you can use \`else\`.`,
      },
    },
    {
      id: 'les7-block-7',
      type: 'code',
      orderIndex: 6,
      language: 'python',
      code: `# if-else structure
age = 16

if age >= 18:
    print("You can vote.")
else:
    print("You are too young to vote.")
    years_left = 18 - age
    print(f"Wait {years_left} more years.")

# Output:
# You are too young to vote.
# Wait 2 more years.

# Another example
password = "secret123"
user_input = "wrong"

if user_input == password:
    print("Access granted!")
else:
    print("Access denied!")

# Output: Access denied!`,
      filename: 'if_else.py',
      highlightLines: [4, 5, 6, 7, 19, 20, 21, 22],
      caption: { default: 'Using else for alternative code paths' },
      allowCopy: true,
    },
    {
      id: 'les7-block-8',
      type: 'divider',
      orderIndex: 7,
      label: { default: 'Multiple Conditions with elif' },
    },
    {
      id: 'les7-block-9',
      type: 'text',
      orderIndex: 8,
      markdown: {
        default: `## Multiple Conditions with elif

When you have more than two possibilities, use \`elif\` (short for "else if") to check additional conditions. Python checks each condition in order and runs the first block where the condition is \`True\`.`,
      },
    },
    {
      id: 'les7-block-10',
      type: 'code',
      orderIndex: 9,
      language: 'python',
      code: `# Grading system with multiple conditions
score = 85

if score >= 90:
    grade = "A"
    print("Excellent work!")
elif score >= 80:
    grade = "B"
    print("Good job!")
elif score >= 70:
    grade = "C"
    print("You passed.")
elif score >= 60:
    grade = "D"
    print("Needs improvement.")
else:
    grade = "F"
    print("Please see the teacher.")

print(f"Your grade: {grade}")

# Output:
# Good job!
# Your grade: B

# Weather recommendation
temperature = 25

if temperature < 0:
    print("It's freezing! Wear a heavy coat.")
elif temperature < 10:
    print("It's cold. Wear a jacket.")
elif temperature < 20:
    print("It's cool. A light sweater is fine.")
elif temperature < 30:
    print("It's warm. T-shirt weather!")
else:
    print("It's hot! Stay cool and hydrated.")

# Output: It's warm. T-shirt weather!`,
      filename: 'elif_statement.py',
      highlightLines: [4, 7, 10, 13, 16, 29, 31, 33, 35, 37],
      caption: { default: 'Using elif for multiple conditions' },
      allowCopy: true,
    },
    {
      id: 'les7-block-11',
      type: 'callout',
      orderIndex: 10,
      calloutType: 'tip',
      title: { default: 'Indentation Matters!' },
      content: {
        default: 'Python uses indentation (spaces at the beginning of a line) to define code blocks. All code inside an if, elif, or else must be indented by the same amount (usually 4 spaces). Incorrect indentation will cause errors or unexpected behavior!',
      },
      collapsible: false,
    },
    {
      id: 'les7-block-12',
      type: 'code',
      orderIndex: 11,
      language: 'python',
      code: `# Correct indentation
if True:
    print("This is inside the if")
    print("This is also inside")
print("This is outside the if")

# WRONG - inconsistent indentation (will cause error!)
# if True:
#     print("This is indented 4 spaces")
#   print("This is indented 2 spaces")  # IndentationError!

# WRONG - missing indentation (will cause error!)
# if True:
# print("This should be indented")  # IndentationError!`,
      filename: 'indentation.py',
      highlightLines: [2, 3, 4, 5],
      caption: { default: 'Proper indentation in Python' },
      allowCopy: true,
    },
    {
      id: 'les7-block-13',
      type: 'divider',
      orderIndex: 12,
      label: { default: 'Practice' },
    },
    {
      id: 'les7-block-14',
      type: 'callout',
      orderIndex: 13,
      calloutType: 'example',
      title: { default: 'Try It Yourself' },
      content: {
        default: `Build a simple program:
1. Ask the user for their age using input() (convert to int)
2. Use conditional statements to print:
   - "You are a child" if under 13
   - "You are a teenager" if 13-19
   - "You are an adult" if 20-64
   - "You are a senior" if 65 or older
3. Bonus: Add a check at the start for negative ages ("Invalid age!")`,
      },
      collapsible: false,
    },
  ],
  summary: {
    keyPoints: [
      { default: 'if statements run code only when a condition is True' },
      { default: 'else provides an alternative when the if condition is False' },
      { default: 'elif checks additional conditions in sequence' },
      { default: 'Only one branch (if, elif, or else) executes per conditional block' },
      { default: 'Indentation defines which code belongs to each branch' },
    ],
    nextSteps: { default: 'Continue learning about loops to repeat code' },
  },
  navigation: {
    previousLessonId: 'les-006',
    nextLessonId: 'les-008',
    allowSkip: false,
  },
  progress: {
    completionCriteria: 'scroll-end',
    checkpoints: [],
  },
  status: 'published',
};

// =============================================================================
// Sample Lesson 8: Comparison Operators
// =============================================================================

export const SAMPLE_LESSON_8: Lesson = {
  schemaVersion: '1.0.0',
  id: 'les-008',
  moduleId: 'mod-001',
  courseId: 'course-python-basics',
  orderIndex: 7,
  title: { default: 'Comparison Operators' },
  shortTitle: { default: 'Comparisons' },
  description: {
    default: 'Learn the six comparison operators in Python and how to use them to compare values.',
  },
  learningObjectives: [
    { id: 'les8-obj-1', description: { default: 'List all six comparison operators' } },
    { id: 'les8-obj-2', description: { default: 'Explain the difference between = and ==' } },
    { id: 'les8-obj-3', description: { default: 'Use comparison operators in conditions' } },
  ],
  estimatedMinutes: 20,
  readingMinutes: 12,
  practiceMinutes: 8,
  difficulty: 'beginner',
  content: [
    {
      id: 'les8-block-1',
      type: 'text',
      orderIndex: 0,
      markdown: {
        default: `## The Six Comparison Operators

Python provides six comparison operators that let you compare two values. Each operator returns a Boolean value (\`True\` or \`False\`) based on whether the comparison is satisfied.

| Operator | Name | Description | Example |
|----------|------|-------------|---------|
| \`==\` | Equal to | True if values are equal | \`5 == 5\` is \`True\` |
| \`!=\` | Not equal to | True if values are different | \`5 != 3\` is \`True\` |
| \`<\` | Less than | True if left is smaller | \`3 < 5\` is \`True\` |
| \`>\` | Greater than | True if left is larger | \`5 > 3\` is \`True\` |
| \`<=\` | Less than or equal | True if left is smaller or equal | \`5 <= 5\` is \`True\` |
| \`>=\` | Greater than or equal | True if left is larger or equal | \`5 >= 3\` is \`True\` |`,
      },
    },
    {
      id: 'les8-block-2',
      type: 'code',
      orderIndex: 1,
      language: 'python',
      code: `# Equality comparison
x = 10
y = 10
z = 5

print(x == y)  # True (10 equals 10)
print(x == z)  # False (10 does not equal 5)

# Not equal comparison
print(x != z)  # True (10 is not equal to 5)
print(x != y)  # False (10 is equal to 10)

# Less than and greater than
print(z < x)   # True (5 is less than 10)
print(x > z)   # True (10 is greater than 5)
print(x < z)   # False (10 is not less than 5)

# Less/greater than or equal
print(x <= 10)  # True (10 is equal to 10)
print(x >= 10)  # True (10 is equal to 10)
print(z <= 3)   # False (5 is not less than or equal to 3)`,
      filename: 'comparison_operators.py',
      highlightLines: [6, 7, 11, 15, 16, 20, 21],
      caption: { default: 'All six comparison operators in action' },
      allowCopy: true,
    },
    {
      id: 'les8-block-3',
      type: 'callout',
      orderIndex: 2,
      calloutType: 'warning',
      title: { default: '= vs == - A Common Mistake' },
      content: {
        default: `This is one of the most common bugs for beginners!

- **=** is the **assignment operator** - it assigns a value to a variable: \`x = 5\`
- **==** is the **equality operator** - it checks if two values are equal: \`x == 5\`

If you write \`if x = 5:\` instead of \`if x == 5:\`, Python will give you a SyntaxError. Always use double equals (==) when comparing values!`,
      },
      collapsible: false,
    },
    {
      id: 'les8-block-4',
      type: 'divider',
      orderIndex: 3,
      label: { default: 'Comparing Strings' },
    },
    {
      id: 'les8-block-5',
      type: 'text',
      orderIndex: 4,
      markdown: {
        default: `## Comparing Strings Alphabetically

Comparison operators also work with strings! Python compares strings character by character based on their Unicode values. For standard English letters:
- Uppercase letters (A-Z) come before lowercase letters (a-z)
- Letters are compared alphabetically within their case`,
      },
    },
    {
      id: 'les8-block-6',
      type: 'code',
      orderIndex: 5,
      language: 'python',
      code: `# String equality
name1 = "Alice"
name2 = "Alice"
name3 = "Bob"

print(name1 == name2)  # True (same characters)
print(name1 == name3)  # False (different strings)
print(name1 != name3)  # True (strings are different)

# Alphabetical comparison
print("apple" < "banana")   # True (a comes before b)
print("cat" > "car")        # True (t comes after r)
print("dog" < "dogs")       # True (shorter string is "less")

# Case matters!
print("Apple" < "apple")    # True (uppercase A < lowercase a)
print("Zebra" < "apple")    # True (uppercase Z < lowercase a)

# Practical example: Sorting check
word = "hello"
print(word >= "hello")      # True
print(word < "world")       # True (h comes before w)`,
      filename: 'string_comparison.py',
      highlightLines: [6, 7, 12, 13, 14, 17, 18],
      caption: { default: 'Comparing strings alphabetically' },
      allowCopy: true,
    },
    {
      id: 'les8-block-7',
      type: 'divider',
      orderIndex: 6,
      label: { default: 'Practice' },
    },
    {
      id: 'les8-block-8',
      type: 'callout',
      orderIndex: 7,
      calloutType: 'example',
      title: { default: 'Try It Yourself' },
      content: {
        default: `Practice using comparison operators:
1. Create two variables: \`score = 85\` and \`passing_score = 70\`
2. Use >= to check if the student passed and store in \`passed\`
3. Create \`age = 18\` and check if \`age == 18\` (voting age)
4. Compare two strings alphabetically: is "python" < "java"?
5. What is the result of "10" > "9"? (Think about string comparison!)`,
      },
      collapsible: false,
    },
  ],
  summary: {
    keyPoints: [
      { default: 'Python has six comparison operators: ==, !=, <, >, <=, >=' },
      { default: '= assigns values, == compares values - do not confuse them!' },
      { default: 'Comparison operators return True or False' },
      { default: 'Strings are compared alphabetically (case-sensitive)' },
    ],
    nextSteps: { default: 'Learn how to combine multiple conditions with logical operators' },
  },
  navigation: {
    previousLessonId: 'les-007',
    nextLessonId: 'les-009',
    allowSkip: false,
  },
  progress: {
    completionCriteria: 'scroll-end',
    checkpoints: [],
  },
  status: 'published',
};

// =============================================================================
// Sample Lesson 9: Logical Operators
// =============================================================================

export const SAMPLE_LESSON_9: Lesson = {
  schemaVersion: '1.0.0',
  id: 'les-009',
  moduleId: 'mod-001',
  courseId: 'course-python-basics',
  orderIndex: 8,
  title: { default: 'Logical Operators' },
  shortTitle: { default: 'Logic' },
  description: {
    default: 'Combine multiple conditions using and, or, and not operators to create complex logic.',
  },
  learningObjectives: [
    { id: 'les9-obj-1', description: { default: 'Identify and, or, not operators' } },
    { id: 'les9-obj-2', description: { default: 'Explain how to combine multiple conditions' } },
    { id: 'les9-obj-3', description: { default: 'Write complex conditional expressions' } },
  ],
  estimatedMinutes: 20,
  readingMinutes: 12,
  practiceMinutes: 8,
  difficulty: 'beginner',
  content: [
    {
      id: 'les9-block-1',
      type: 'text',
      orderIndex: 0,
      markdown: {
        default: `## Combining Conditions

Sometimes a single comparison is not enough. You might need to check multiple conditions at once:
- Is the user logged in **and** has admin permissions?
- Is the temperature below 0 **or** above 100?
- Is the user **not** banned?

Python provides three logical operators to combine conditions: \`and\`, \`or\`, and \`not\`.`,
      },
    },
    {
      id: 'les9-block-2',
      type: 'divider',
      orderIndex: 1,
      label: { default: 'The and Operator' },
    },
    {
      id: 'les9-block-3',
      type: 'code',
      orderIndex: 2,
      language: 'python',
      code: `# The 'and' operator - BOTH conditions must be True
age = 25
has_license = True

# Both conditions must be True for the result to be True
can_drive = age >= 16 and has_license
print(can_drive)  # True

# If either condition is False, the result is False
age = 14
can_drive = age >= 16 and has_license
print(can_drive)  # False (age < 16)

# Checking a range
score = 85
is_b_grade = score >= 80 and score < 90
print(f"Is B grade: {is_b_grade}")  # True

# Multiple 'and' conditions
temperature = 72
is_comfortable = temperature >= 65 and temperature <= 80 and temperature != 75
print(f"Comfortable: {is_comfortable}")  # True`,
      filename: 'and_operator.py',
      highlightLines: [6, 11, 16, 21],
      caption: { default: 'The and operator requires ALL conditions to be True' },
      allowCopy: true,
    },
    {
      id: 'les9-block-4',
      type: 'divider',
      orderIndex: 3,
      label: { default: 'The or Operator' },
    },
    {
      id: 'les9-block-5',
      type: 'code',
      orderIndex: 4,
      language: 'python',
      code: `# The 'or' operator - AT LEAST ONE condition must be True
is_weekend = True
is_holiday = False

# Only one needs to be True for the result to be True
day_off = is_weekend or is_holiday
print(day_off)  # True

# Both False = result is False
is_weekend = False
is_holiday = False
day_off = is_weekend or is_holiday
print(day_off)  # False

# Checking for invalid input
age = -5
is_invalid = age < 0 or age > 150
print(f"Invalid age: {is_invalid}")  # True

# Either condition being True is enough
user_type = "admin"
has_access = user_type == "admin" or user_type == "moderator"
print(f"Has access: {has_access}")  # True`,
      filename: 'or_operator.py',
      highlightLines: [6, 12, 17, 22],
      caption: { default: 'The or operator requires AT LEAST ONE condition to be True' },
      allowCopy: true,
    },
    {
      id: 'les9-block-6',
      type: 'divider',
      orderIndex: 5,
      label: { default: 'The not Operator' },
    },
    {
      id: 'les9-block-7',
      type: 'code',
      orderIndex: 6,
      language: 'python',
      code: `# The 'not' operator - inverts a Boolean value
is_raining = True
is_sunny = not is_raining
print(is_sunny)  # False

# Using 'not' in conditions
logged_in = False
if not logged_in:
    print("Please log in to continue")

# Inverting comparisons
age = 15
is_adult = age >= 18
is_minor = not is_adult
print(f"Is minor: {is_minor}")  # True

# 'not' with 'in' (checking if something is NOT in a collection)
banned_users = ["spammer", "troll", "bot"]
username = "alice"
if username not in banned_users:
    print(f"Welcome, {username}!")  # This prints

# Double negation (avoid this - it's confusing!)
# not not True == True`,
      filename: 'not_operator.py',
      highlightLines: [3, 8, 9, 15, 20, 21],
      caption: { default: 'The not operator inverts Boolean values' },
      allowCopy: true,
    },
    {
      id: 'les9-block-8',
      type: 'divider',
      orderIndex: 7,
      label: { default: 'Operator Precedence' },
    },
    {
      id: 'les9-block-9',
      type: 'text',
      orderIndex: 8,
      markdown: {
        default: `## Operator Precedence

When you combine multiple logical operators, Python evaluates them in this order:
1. \`not\` (highest priority)
2. \`and\`
3. \`or\` (lowest priority)

This means \`a or b and c\` is evaluated as \`a or (b and c)\`, not \`(a or b) and c\`.`,
      },
    },
    {
      id: 'les9-block-10',
      type: 'callout',
      orderIndex: 9,
      calloutType: 'tip',
      title: { default: 'Use Parentheses for Clarity' },
      content: {
        default: `Even if you know the precedence rules, use parentheses to make your code clearer:

\`\`\`python
# Hard to read - relies on precedence
if is_admin or is_moderator and is_verified:
    ...

# Much clearer - intent is obvious
if is_admin or (is_moderator and is_verified):
    ...
\`\`\`

Your future self (and teammates) will thank you!`,
      },
      collapsible: false,
    },
    {
      id: 'les9-block-11',
      type: 'divider',
      orderIndex: 10,
      label: { default: 'Practice' },
    },
    {
      id: 'les9-block-12',
      type: 'callout',
      orderIndex: 11,
      calloutType: 'example',
      title: { default: 'Try It Yourself' },
      content: {
        default: `Practice combining conditions:
1. Create variables: \`age = 25\`, \`has_id = True\`, \`is_vip = False\`
2. Check if someone can enter a club: \`age >= 21 and has_id\`
3. Check if someone gets free entry: \`is_vip or age >= 65\`
4. Use \`not\` to check if someone is NOT a VIP
5. Combine: can enter AND (is VIP or pays cover charge)`,
      },
      collapsible: false,
    },
  ],
  summary: {
    keyPoints: [
      { default: 'and requires ALL conditions to be True' },
      { default: 'or requires AT LEAST ONE condition to be True' },
      { default: 'not inverts a Boolean value (True becomes False)' },
      { default: 'Precedence order: not > and > or' },
      { default: 'Use parentheses to make complex conditions clear' },
    ],
    nextSteps: { default: 'Learn how to repeat code with while loops' },
  },
  navigation: {
    previousLessonId: 'les-008',
    nextLessonId: 'les-010',
    allowSkip: false,
  },
  progress: {
    completionCriteria: 'scroll-end',
    checkpoints: [],
  },
  status: 'published',
};

// =============================================================================
// Sample Lesson 10: While Loops
// =============================================================================

export const SAMPLE_LESSON_10: Lesson = {
  schemaVersion: '1.0.0',
  id: 'les-010',
  moduleId: 'mod-001',
  courseId: 'course-python-basics',
  orderIndex: 9,
  title: { default: 'While Loops' },
  shortTitle: { default: 'While Loops' },
  description: {
    default: 'Learn to repeat code with while loops, control loop execution, and avoid infinite loops.',
  },
  learningObjectives: [
    { id: 'les10-obj-1', description: { default: 'Identify the while loop syntax' } },
    { id: 'les10-obj-2', description: { default: 'Explain how while loops continue until condition is False' } },
    { id: 'les10-obj-3', description: { default: 'Create loops with proper termination conditions' } },
  ],
  estimatedMinutes: 25,
  readingMinutes: 15,
  practiceMinutes: 10,
  difficulty: 'beginner',
  content: [
    {
      id: 'les10-block-1',
      type: 'text',
      orderIndex: 0,
      markdown: {
        default: `## Repeating Code

Sometimes you need to run the same code multiple times. Instead of copying and pasting, you can use a **loop**. A \`while\` loop repeats a block of code as long as a condition remains \`True\`.

The basic structure is:
\`\`\`python
while condition:
    # code to repeat
    # this runs as long as condition is True
\`\`\`

When Python reaches the \`while\` statement:
1. It checks if the condition is True
2. If True, it runs the indented code block
3. It goes back to step 1 and checks again
4. When the condition becomes False, it exits the loop`,
      },
    },
    {
      id: 'les10-block-2',
      type: 'divider',
      orderIndex: 1,
      label: { default: 'Simple while Loop' },
    },
    {
      id: 'les10-block-3',
      type: 'code',
      orderIndex: 2,
      language: 'python',
      code: `# A simple countdown
count = 5

while count > 0:
    print(count)
    count = count - 1  # Decrease count each time

print("Blast off!")

# Output:
# 5
# 4
# 3
# 2
# 1
# Blast off!`,
      filename: 'simple_while.py',
      highlightLines: [4, 5, 6],
      caption: { default: 'A simple while loop countdown' },
      allowCopy: true,
    },
    {
      id: 'les10-block-4',
      type: 'callout',
      orderIndex: 3,
      calloutType: 'warning',
      title: { default: 'Infinite Loops - Always ensure your loop can end!' },
      content: {
        default: `An **infinite loop** happens when the condition never becomes False. Your program will run forever (or until you force it to stop)!

\`\`\`python
# DANGER - infinite loop!
count = 5
while count > 0:
    print(count)
    # Oops! Forgot to decrease count
    # count will always be 5, which is always > 0
\`\`\`

Always make sure something inside the loop will eventually make the condition False.`,
      },
      collapsible: false,
    },
    {
      id: 'les10-block-5',
      type: 'divider',
      orderIndex: 4,
      label: { default: 'Loop Control Variables' },
    },
    {
      id: 'les10-block-6',
      type: 'code',
      orderIndex: 5,
      language: 'python',
      code: `# Using a control variable
password = ""

while password != "secret":
    password = input("Enter password: ")
    if password != "secret":
        print("Wrong password, try again.")

print("Access granted!")

# The loop continues until the user enters "secret"
# Each iteration:
# 1. Check if password != "secret" (True at first)
# 2. Get new password from user
# 3. Check again and give feedback
# 4. Go back to step 1`,
      filename: 'control_variable.py',
      highlightLines: [4, 5, 6, 7],
      caption: { default: 'Using user input to control a loop' },
      allowCopy: true,
    },
    {
      id: 'les10-block-7',
      type: 'divider',
      orderIndex: 6,
      label: { default: 'Counting with while' },
    },
    {
      id: 'les10-block-8',
      type: 'code',
      orderIndex: 7,
      language: 'python',
      code: `# Counting from 1 to 5
counter = 1

while counter <= 5:
    print(f"Count: {counter}")
    counter += 1  # Same as counter = counter + 1

print("Done counting!")

# Output:
# Count: 1
# Count: 2
# Count: 3
# Count: 4
# Count: 5
# Done counting!

# Calculating a sum
total = 0
number = 1

while number <= 10:
    total += number  # Add current number to total
    number += 1

print(f"Sum of 1-10: {total}")  # Sum of 1-10: 55`,
      filename: 'counting.py',
      highlightLines: [4, 5, 6, 21, 22, 23],
      caption: { default: 'Counting and accumulating with while loops' },
      allowCopy: true,
    },
    {
      id: 'les10-block-9',
      type: 'divider',
      orderIndex: 8,
      label: { default: 'The break Statement' },
    },
    {
      id: 'les10-block-10',
      type: 'code',
      orderIndex: 9,
      language: 'python',
      code: `# The 'break' statement exits a loop immediately
while True:  # This would normally run forever!
    user_input = input("Type 'quit' to exit: ")

    if user_input == "quit":
        print("Goodbye!")
        break  # Exit the loop immediately

    print(f"You typed: {user_input}")

print("Loop has ended")

# Using break to find a number
target = 7
guess = 0

while guess <= 100:
    if guess == target:
        print(f"Found it! The number is {guess}")
        break
    guess += 1

# Without break, this would check all numbers 0-100
# With break, it stops as soon as it finds 7`,
      filename: 'break_statement.py',
      highlightLines: [5, 6, 7, 18, 19, 20],
      caption: { default: 'Using break to exit a loop early' },
      allowCopy: true,
    },
    {
      id: 'les10-block-11',
      type: 'divider',
      orderIndex: 10,
      label: { default: 'Practice' },
    },
    {
      id: 'les10-block-12',
      type: 'callout',
      orderIndex: 11,
      calloutType: 'example',
      title: { default: 'Try It Yourself' },
      content: {
        default: `Practice with while loops:
1. Write a loop that prints numbers 1-10
2. Write a loop that prints even numbers from 2-20
3. Create a guessing game: pick a secret number, loop until the user guesses it
4. Write a loop that adds up numbers until the total exceeds 100
5. Use break to exit a loop when the user types "stop"`,
      },
      collapsible: false,
    },
  ],
  summary: {
    keyPoints: [
      { default: 'while loops repeat code as long as a condition is True' },
      { default: 'Always ensure the loop can terminate to avoid infinite loops' },
      { default: 'Use a control variable that changes each iteration' },
      { default: 'The break statement exits a loop immediately' },
      { default: 'Loops are essential for processing data and user interaction' },
    ],
    nextSteps: { default: 'Continue learning about for loops and iterating over sequences' },
  },
  navigation: {
    previousLessonId: 'les-009',
    nextLessonId: 'les-011',
    allowSkip: false,
  },
  progress: {
    completionCriteria: 'scroll-end',
    checkpoints: [],
  },
  status: 'published',
};

// =============================================================================
// Sample Lesson 11: For Loops
// =============================================================================

export const SAMPLE_LESSON_11: Lesson = {
  schemaVersion: '1.0.0',
  id: 'les-011',
  moduleId: 'mod-001',
  courseId: 'course-python-basics',
  orderIndex: 10,
  title: { default: 'For Loops' },
  shortTitle: { default: 'For Loops' },
  description: {
    default: 'Learn to iterate over sequences with for loops and use the range() function for controlled repetition.',
  },
  learningObjectives: [
    { id: 'les11-obj-1', description: { default: 'Identify the for loop syntax' } },
    { id: 'les11-obj-2', description: { default: 'Explain iteration over sequences' } },
    { id: 'les11-obj-3', description: { default: 'Use range() to control iterations' } },
  ],
  estimatedMinutes: 25,
  readingMinutes: 15,
  practiceMinutes: 10,
  difficulty: 'beginner',
  content: [
    {
      id: 'les11-block-1',
      type: 'text',
      orderIndex: 0,
      markdown: {
        default: `## Iterating Over Sequences

A \`for\` loop is used to iterate over a sequence (like a list, string, or range of numbers). Unlike \`while\` loops that run until a condition is False, \`for\` loops run once for each item in a sequence.

The basic syntax is:
\`\`\`python
for item in sequence:
    # code to run for each item
\`\`\`

Each time through the loop, the variable \`item\` takes on the next value from the sequence.`,
      },
    },
    {
      id: 'les11-block-2',
      type: 'divider',
      orderIndex: 1,
      label: { default: 'for Loop with List' },
    },
    {
      id: 'les11-block-3',
      type: 'code',
      orderIndex: 2,
      language: 'python',
      code: `# Iterating over a list
fruits = ["apple", "banana", "cherry"]

for fruit in fruits:
    print(f"I like {fruit}")

# Output:
# I like apple
# I like banana
# I like cherry

# The variable 'fruit' takes each value in order:
# First iteration: fruit = "apple"
# Second iteration: fruit = "banana"
# Third iteration: fruit = "cherry"`,
      filename: 'for_list.py',
      highlightLines: [4, 5],
      caption: { default: 'Iterating over a list with a for loop' },
      allowCopy: true,
    },
    {
      id: 'les11-block-4',
      type: 'divider',
      orderIndex: 3,
      label: { default: 'The range() Function' },
    },
    {
      id: 'les11-block-5',
      type: 'text',
      orderIndex: 4,
      markdown: {
        default: `## The range() Function

The \`range()\` function generates a sequence of numbers. It's commonly used with \`for\` loops when you need to repeat something a specific number of times.

\`range()\` has three forms:
- \`range(stop)\` - generates numbers from 0 to stop-1
- \`range(start, stop)\` - generates numbers from start to stop-1
- \`range(start, stop, step)\` - generates numbers from start to stop-1, incrementing by step`,
      },
    },
    {
      id: 'les11-block-6',
      type: 'code',
      orderIndex: 5,
      language: 'python',
      code: `# range(5) - generates 0, 1, 2, 3, 4
print("range(5):")
for i in range(5):
    print(i)
# Output: 0, 1, 2, 3, 4

# range(1, 6) - generates 1, 2, 3, 4, 5
print("range(1, 6):")
for i in range(1, 6):
    print(i)
# Output: 1, 2, 3, 4, 5

# range(0, 10, 2) - generates 0, 2, 4, 6, 8
print("range(0, 10, 2):")
for i in range(0, 10, 2):
    print(i)
# Output: 0, 2, 4, 6, 8 (even numbers)`,
      filename: 'range_variations.py',
      highlightLines: [3, 9, 15],
      caption: { default: 'Different ways to use range()' },
      allowCopy: true,
    },
    {
      id: 'les11-block-7',
      type: 'callout',
      orderIndex: 6,
      calloutType: 'tip',
      title: { default: 'Use enumerate() for index + value' },
      content: {
        default: `When you need both the index and the value while looping, use enumerate():

\`\`\`python
fruits = ["apple", "banana", "cherry"]
for index, fruit in enumerate(fruits):
    print(f"{index}: {fruit}")
# Output:
# 0: apple
# 1: banana
# 2: cherry
\`\`\`

This is cleaner than manually tracking an index variable!`,
      },
      collapsible: false,
    },
    {
      id: 'les11-block-8',
      type: 'divider',
      orderIndex: 7,
      label: { default: 'Practice' },
    },
    {
      id: 'les11-block-9',
      type: 'callout',
      orderIndex: 8,
      calloutType: 'example',
      title: { default: 'Try It Yourself' },
      content: {
        default: `Practice with for loops:
1. Print numbers 1-10 using range()
2. Loop through a list of your favorite foods and print each one
3. Use range() to print only odd numbers from 1-20
4. Use enumerate() to print items with their index`,
      },
      collapsible: false,
    },
  ],
  summary: {
    keyPoints: [
      { default: 'for loops iterate over sequences (lists, strings, ranges)' },
      { default: 'The loop variable takes each value in the sequence' },
      { default: 'range() generates sequences of numbers' },
      { default: 'range(stop), range(start, stop), and range(start, stop, step) are the three forms' },
      { default: 'Use enumerate() when you need both index and value' },
    ],
    nextSteps: { default: 'Learn about lists and how to store multiple values' },
  },
  navigation: {
    previousLessonId: 'les-010',
    nextLessonId: 'les-012',
    allowSkip: false,
  },
  progress: {
    completionCriteria: 'scroll-end',
    checkpoints: [],
  },
  status: 'published',
};

// =============================================================================
// Sample Lesson 12: Lists Introduction
// =============================================================================

export const SAMPLE_LESSON_12: Lesson = {
  schemaVersion: '1.0.0',
  id: 'les-012',
  moduleId: 'mod-001',
  courseId: 'course-python-basics',
  orderIndex: 11,
  title: { default: 'Lists Introduction' },
  shortTitle: { default: 'Lists Intro' },
  description: {
    default: 'Learn what lists are, how to create them, and how to access individual elements using indices.',
  },
  learningObjectives: [
    { id: 'les12-obj-1', description: { default: 'Define what a list is' } },
    { id: 'les12-obj-2', description: { default: 'Explain list indexing' } },
    { id: 'les12-obj-3', description: { default: 'Create lists and access elements' } },
  ],
  estimatedMinutes: 30,
  readingMinutes: 18,
  practiceMinutes: 12,
  difficulty: 'beginner',
  content: [
    {
      id: 'les12-block-1',
      type: 'text',
      orderIndex: 0,
      markdown: {
        default: `## What is a List?

A **list** is a collection of items stored in a single variable. Lists can hold multiple values of any type - numbers, strings, booleans, or even other lists!

Lists are:
- **Ordered** - items have a specific position (index)
- **Mutable** - you can change, add, or remove items after creation
- **Flexible** - can hold different types of data
- **Dynamic** - can grow or shrink as needed`,
      },
    },
    {
      id: 'les12-block-2',
      type: 'divider',
      orderIndex: 1,
      label: { default: 'Creating Lists' },
    },
    {
      id: 'les12-block-3',
      type: 'code',
      orderIndex: 2,
      language: 'python',
      code: `# Creating lists with square brackets []
fruits = ["apple", "banana", "cherry"]
numbers = [1, 2, 3, 4, 5]
mixed = ["hello", 42, True, 3.14]
empty = []

print(fruits)   # ['apple', 'banana', 'cherry']
print(numbers)  # [1, 2, 3, 4, 5]
print(mixed)    # ['hello', 42, True, 3.14]
print(empty)    # []`,
      filename: 'creating_lists.py',
      highlightLines: [2, 3, 4, 5],
      caption: { default: 'Creating lists with different types of data' },
      allowCopy: true,
    },
    {
      id: 'les12-block-4',
      type: 'divider',
      orderIndex: 3,
      label: { default: 'Accessing Items by Index' },
    },
    {
      id: 'les12-block-5',
      type: 'code',
      orderIndex: 4,
      language: 'python',
      code: `# Accessing items by index (0-based)
fruits = ["apple", "banana", "cherry", "date"]

# Indices:    0        1         2        3

print(fruits[0])  # apple (first item)
print(fruits[1])  # banana (second item)
print(fruits[2])  # cherry (third item)
print(fruits[3])  # date (fourth item)`,
      filename: 'index_access.py',
      highlightLines: [6, 7, 8, 9],
      caption: { default: 'Accessing list items by their index' },
      allowCopy: true,
    },
    {
      id: 'les12-block-6',
      type: 'divider',
      orderIndex: 5,
      label: { default: 'Positive and Negative Indices' },
    },
    {
      id: 'les12-block-7',
      type: 'code',
      orderIndex: 6,
      language: 'python',
      code: `fruits = ["apple", "banana", "cherry", "date"]

# Positive indices (from the start)
# Index:      0        1         2        3
print(fruits[0])   # apple
print(fruits[3])   # date

# Negative indices (from the end)
# Index:     -4       -3        -2       -1
print(fruits[-1])  # date (last item)
print(fruits[-2])  # cherry (second to last)
print(fruits[-4])  # apple (first item)

# Negative indexing is great for accessing the end of a list
# without knowing its exact length!`,
      filename: 'negative_indices.py',
      highlightLines: [10, 11, 12],
      caption: { default: 'Using negative indices to access from the end' },
      allowCopy: true,
    },
    {
      id: 'les12-block-8',
      type: 'divider',
      orderIndex: 7,
      label: { default: 'List Length with len()' },
    },
    {
      id: 'les12-block-9',
      type: 'code',
      orderIndex: 8,
      language: 'python',
      code: `# len() returns the number of items in a list
fruits = ["apple", "banana", "cherry"]
numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
empty = []

print(len(fruits))   # 3
print(len(numbers))  # 10
print(len(empty))    # 0

# Common pattern: get the last item
last_index = len(fruits) - 1
print(fruits[last_index])  # cherry

# But fruits[-1] is easier!
print(fruits[-1])  # cherry`,
      filename: 'list_length.py',
      highlightLines: [6, 7, 8, 11, 12],
      caption: { default: 'Using len() to get list length' },
      allowCopy: true,
    },
    {
      id: 'les12-block-10',
      type: 'callout',
      orderIndex: 9,
      calloutType: 'warning',
      title: { default: 'Index Out of Range Error' },
      content: {
        default: `Trying to access an index that doesn't exist causes an IndexError:

\`\`\`python
fruits = ["apple", "banana", "cherry"]
print(fruits[10])  # IndexError: list index out of range
\`\`\`

A list with 3 items has valid indices 0, 1, 2 (or -1, -2, -3). Always make sure your index is within bounds!`,
      },
      collapsible: false,
    },
    {
      id: 'les12-block-11',
      type: 'divider',
      orderIndex: 10,
      label: { default: 'Practice' },
    },
    {
      id: 'les12-block-12',
      type: 'callout',
      orderIndex: 11,
      calloutType: 'example',
      title: { default: 'Try It Yourself' },
      content: {
        default: `Practice with lists:
1. Create a list of 5 colors
2. Print the first and last colors using positive indices
3. Print the last color using a negative index
4. Use len() to print how many colors are in your list
5. Try accessing an invalid index and observe the error`,
      },
      collapsible: false,
    },
  ],
  summary: {
    keyPoints: [
      { default: 'Lists store multiple items in a single variable' },
      { default: 'Items are accessed by index, starting at 0' },
      { default: 'Negative indices access items from the end (-1 is the last item)' },
      { default: 'len() returns the number of items in a list' },
      { default: 'Accessing an invalid index causes an IndexError' },
    ],
    nextSteps: { default: 'Learn how to modify lists by adding, removing, and changing items' },
  },
  navigation: {
    previousLessonId: 'les-011',
    nextLessonId: 'les-013',
    allowSkip: false,
  },
  progress: {
    completionCriteria: 'scroll-end',
    checkpoints: [],
  },
  status: 'published',
};

// =============================================================================
// Sample Lesson 13: List Operations
// =============================================================================

export const SAMPLE_LESSON_13: Lesson = {
  schemaVersion: '1.0.0',
  id: 'les-013',
  moduleId: 'mod-001',
  courseId: 'course-python-basics',
  orderIndex: 12,
  title: { default: 'List Operations' },
  shortTitle: { default: 'List Ops' },
  description: {
    default: 'Learn to modify lists by adding, removing, and changing items. Master common list methods.',
  },
  learningObjectives: [
    { id: 'les13-obj-1', description: { default: 'List common list methods' } },
    { id: 'les13-obj-2', description: { default: 'Explain mutable vs immutable' } },
    { id: 'les13-obj-3', description: { default: 'Add, remove, and modify list items' } },
  ],
  estimatedMinutes: 25,
  readingMinutes: 15,
  practiceMinutes: 10,
  difficulty: 'beginner',
  content: [
    {
      id: 'les13-block-1',
      type: 'text',
      orderIndex: 0,
      markdown: {
        default: `## Lists are Mutable

**Mutable** means changeable. Unlike strings (which are immutable), you can modify a list after it's created:
- Change existing items
- Add new items
- Remove items
- Reorder items

This makes lists very flexible for storing and managing data that changes over time.`,
      },
    },
    {
      id: 'les13-block-2',
      type: 'divider',
      orderIndex: 1,
      label: { default: 'Changing Items' },
    },
    {
      id: 'les13-block-3',
      type: 'code',
      orderIndex: 2,
      language: 'python',
      code: `# Changing items by index
fruits = ["apple", "banana", "cherry"]
print(fruits)  # ['apple', 'banana', 'cherry']

# Change the second item
fruits[1] = "blueberry"
print(fruits)  # ['apple', 'blueberry', 'cherry']

# Change the last item
fruits[-1] = "coconut"
print(fruits)  # ['apple', 'blueberry', 'coconut']`,
      filename: 'changing_items.py',
      highlightLines: [6, 10],
      caption: { default: 'Modifying list items by index' },
      allowCopy: true,
    },
    {
      id: 'les13-block-4',
      type: 'divider',
      orderIndex: 3,
      label: { default: 'Adding Items: append(), insert()' },
    },
    {
      id: 'les13-block-5',
      type: 'code',
      orderIndex: 4,
      language: 'python',
      code: `fruits = ["apple", "banana"]

# append() adds to the end
fruits.append("cherry")
print(fruits)  # ['apple', 'banana', 'cherry']

# insert() adds at a specific position
fruits.insert(0, "apricot")  # Insert at index 0 (beginning)
print(fruits)  # ['apricot', 'apple', 'banana', 'cherry']

fruits.insert(2, "blueberry")  # Insert at index 2
print(fruits)  # ['apricot', 'apple', 'blueberry', 'banana', 'cherry']

# Note: insert() shifts other items to make room`,
      filename: 'adding_items.py',
      highlightLines: [4, 8, 11],
      caption: { default: 'Adding items with append() and insert()' },
      allowCopy: true,
    },
    {
      id: 'les13-block-6',
      type: 'divider',
      orderIndex: 5,
      label: { default: 'Removing Items: remove(), pop()' },
    },
    {
      id: 'les13-block-7',
      type: 'code',
      orderIndex: 6,
      language: 'python',
      code: `fruits = ["apple", "banana", "cherry", "banana", "date"]

# remove() removes the first matching value
fruits.remove("banana")
print(fruits)  # ['apple', 'cherry', 'banana', 'date']
# Note: only removes the FIRST "banana"

# pop() removes by index and returns the removed item
removed = fruits.pop(1)  # Remove item at index 1
print(removed)  # cherry
print(fruits)   # ['apple', 'banana', 'date']

# pop() with no argument removes the last item
last = fruits.pop()
print(last)    # date
print(fruits)  # ['apple', 'banana']`,
      filename: 'removing_items.py',
      highlightLines: [4, 9, 14],
      caption: { default: 'Removing items with remove() and pop()' },
      allowCopy: true,
    },
    {
      id: 'les13-block-8',
      type: 'divider',
      orderIndex: 7,
      label: { default: 'Slicing Lists' },
    },
    {
      id: 'les13-block-9',
      type: 'code',
      orderIndex: 8,
      language: 'python',
      code: `numbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

# Slicing: list[start:stop] - gets items from start to stop-1
print(numbers[2:5])   # [2, 3, 4]
print(numbers[0:3])   # [0, 1, 2]

# Omit start = from beginning
print(numbers[:4])    # [0, 1, 2, 3]

# Omit stop = to the end
print(numbers[7:])    # [7, 8, 9]

# Negative indices work too
print(numbers[-3:])   # [7, 8, 9] (last 3 items)
print(numbers[:-2])   # [0, 1, 2, 3, 4, 5, 6, 7] (all except last 2)

# Step: list[start:stop:step]
print(numbers[::2])   # [0, 2, 4, 6, 8] (every 2nd item)
print(numbers[1::2])  # [1, 3, 5, 7, 9] (odd indices)`,
      filename: 'slicing.py',
      highlightLines: [4, 8, 11, 18, 19],
      caption: { default: 'Slicing to get portions of a list' },
      allowCopy: true,
    },
    {
      id: 'les13-block-10',
      type: 'divider',
      orderIndex: 9,
      label: { default: 'Practice' },
    },
    {
      id: 'les13-block-11',
      type: 'callout',
      orderIndex: 10,
      calloutType: 'example',
      title: { default: 'Try It Yourself' },
      content: {
        default: `Practice list operations:
1. Create a list of 3 animals
2. Change the second animal to something else
3. Append two more animals to the end
4. Insert an animal at the beginning
5. Remove one animal by name
6. Pop the last animal and print it
7. Slice to get the first 3 animals`,
      },
      collapsible: false,
    },
  ],
  summary: {
    keyPoints: [
      { default: 'Lists are mutable - you can change them after creation' },
      { default: 'Change items by assigning to an index: list[i] = value' },
      { default: 'append() adds to the end, insert() adds at a specific position' },
      { default: 'remove() removes by value, pop() removes by index' },
      { default: 'Slicing [start:stop:step] extracts portions of a list' },
    ],
    nextSteps: { default: 'Learn how to organize code into reusable functions' },
  },
  navigation: {
    previousLessonId: 'les-012',
    nextLessonId: 'les-014',
    allowSkip: false,
  },
  progress: {
    completionCriteria: 'scroll-end',
    checkpoints: [],
  },
  status: 'published',
};

// =============================================================================
// Sample Lesson 14: Functions Basics
// =============================================================================

export const SAMPLE_LESSON_14: Lesson = {
  schemaVersion: '1.0.0',
  id: 'les-014',
  moduleId: 'mod-001',
  courseId: 'course-python-basics',
  orderIndex: 13,
  title: { default: 'Functions Basics' },
  shortTitle: { default: 'Functions' },
  description: {
    default: 'Learn what functions are, why they are useful, and how to define and call simple functions.',
  },
  learningObjectives: [
    { id: 'les14-obj-1', description: { default: 'Identify function definition syntax' } },
    { id: 'les14-obj-2', description: { default: 'Explain why functions are useful' } },
    { id: 'les14-obj-3', description: { default: 'Define and call simple functions' } },
  ],
  estimatedMinutes: 30,
  readingMinutes: 18,
  practiceMinutes: 12,
  difficulty: 'beginner',
  content: [
    {
      id: 'les14-block-1',
      type: 'text',
      orderIndex: 0,
      markdown: {
        default: `## What is a Function?

A **function** is a reusable block of code that performs a specific task. You've already used built-in functions like \`print()\`, \`len()\`, and \`input()\`. Now you'll learn to create your own!

Functions help you:
- **Organize** code into logical, named sections
- **Reuse** code without copying and pasting
- **Simplify** complex programs by breaking them into smaller pieces
- **Debug** more easily by isolating problems`,
      },
    },
    {
      id: 'les14-block-2',
      type: 'divider',
      orderIndex: 1,
      label: { default: 'Defining a Function with def' },
    },
    {
      id: 'les14-block-3',
      type: 'code',
      orderIndex: 2,
      language: 'python',
      code: `# Defining a function with the 'def' keyword
def greet():
    print("Hello!")
    print("Welcome to Python!")

# The function is defined but NOT executed yet
# Nothing prints until we call it`,
      filename: 'defining_function.py',
      highlightLines: [2, 3, 4],
      caption: { default: 'Defining a function with def' },
      allowCopy: true,
    },
    {
      id: 'les14-block-4',
      type: 'divider',
      orderIndex: 3,
      label: { default: 'Calling Functions' },
    },
    {
      id: 'les14-block-5',
      type: 'code',
      orderIndex: 4,
      language: 'python',
      code: `def greet():
    print("Hello!")
    print("Welcome to Python!")

# Call the function by using its name with parentheses
greet()

# Output:
# Hello!
# Welcome to Python!

# You can call a function multiple times!
greet()
greet()

# Output:
# Hello!
# Welcome to Python!
# Hello!
# Welcome to Python!`,
      filename: 'calling_function.py',
      highlightLines: [6, 13, 14],
      caption: { default: 'Calling a function executes its code' },
      allowCopy: true,
    },
    {
      id: 'les14-block-6',
      type: 'divider',
      orderIndex: 5,
      label: { default: 'Why Use Functions? DRY Principle' },
    },
    {
      id: 'les14-block-7',
      type: 'text',
      orderIndex: 6,
      markdown: {
        default: `## Why Use Functions? The DRY Principle

**DRY** stands for **"Don't Repeat Yourself"**. It's a fundamental programming principle.

Instead of copying and pasting the same code multiple times, put it in a function and call that function whenever needed. This makes your code:

- **Shorter** - less redundant code
- **Easier to maintain** - fix a bug once, it's fixed everywhere
- **More readable** - descriptive function names explain what code does`,
      },
    },
    {
      id: 'les14-block-8',
      type: 'code',
      orderIndex: 7,
      language: 'python',
      code: `# WITHOUT functions (repetitive and hard to maintain)
print("=" * 40)
print("Welcome to My Program")
print("=" * 40)

# ... lots of code ...

print("=" * 40)
print("Thanks for using My Program")
print("=" * 40)

# ... more code ...

print("=" * 40)
print("Goodbye!")
print("=" * 40)


# WITH a function (clean and reusable)
def print_banner(message):
    print("=" * 40)
    print(message)
    print("=" * 40)

print_banner("Welcome to My Program")
# ... lots of code ...
print_banner("Thanks for using My Program")
# ... more code ...
print_banner("Goodbye!")`,
      filename: 'dry_principle.py',
      highlightLines: [21, 22, 23, 24, 26, 28, 30],
      caption: { default: 'Functions eliminate repetitive code' },
      allowCopy: true,
    },
    {
      id: 'les14-block-9',
      type: 'callout',
      orderIndex: 8,
      calloutType: 'tip',
      title: { default: 'Name functions with verbs: get_name(), calculate_total()' },
      content: {
        default: `Good function names describe what the function *does*. Use verbs to make this clear:

- \`greet_user()\` - greets the user
- \`calculate_total()\` - calculates a total
- \`get_username()\` - gets a username
- \`print_report()\` - prints a report
- \`is_valid()\` - checks if something is valid (returns True/False)

Avoid vague names like \`do_stuff()\` or \`process()\`.`,
      },
      collapsible: false,
    },
    {
      id: 'les14-block-10',
      type: 'divider',
      orderIndex: 9,
      label: { default: 'Practice' },
    },
    {
      id: 'les14-block-11',
      type: 'callout',
      orderIndex: 10,
      calloutType: 'example',
      title: { default: 'Try It Yourself' },
      content: {
        default: `Practice creating functions:
1. Create a function called \`say_hello\` that prints "Hello, World!"
2. Call it 3 times
3. Create a function called \`print_separator\` that prints a line of dashes
4. Use your separator function to organize output`,
      },
      collapsible: false,
    },
  ],
  summary: {
    keyPoints: [
      { default: 'Functions are reusable blocks of code defined with def' },
      { default: 'Define once, call many times' },
      { default: 'Functions help organize code and follow the DRY principle' },
      { default: 'Call functions by using their name followed by parentheses' },
      { default: 'Name functions with verbs that describe what they do' },
    ],
    nextSteps: { default: 'Learn how to pass data into functions with parameters' },
  },
  navigation: {
    previousLessonId: 'les-013',
    nextLessonId: 'les-015',
    allowSkip: false,
  },
  progress: {
    completionCriteria: 'scroll-end',
    checkpoints: [],
  },
  status: 'published',
};

// =============================================================================
// Sample Lesson 15: Function Parameters
// =============================================================================

export const SAMPLE_LESSON_15: Lesson = {
  schemaVersion: '1.0.0',
  id: 'les-015',
  moduleId: 'mod-001',
  courseId: 'course-python-basics',
  orderIndex: 14,
  title: { default: 'Function Parameters' },
  shortTitle: { default: 'Parameters' },
  description: {
    default: 'Learn to pass data into functions with parameters, return values, and use default parameter values.',
  },
  learningObjectives: [
    { id: 'les15-obj-1', description: { default: 'Define parameter and argument' } },
    { id: 'les15-obj-2', description: { default: 'Explain return values' } },
    { id: 'les15-obj-3', description: { default: 'Create functions with parameters and returns' } },
  ],
  estimatedMinutes: 30,
  readingMinutes: 18,
  practiceMinutes: 12,
  difficulty: 'beginner',
  content: [
    {
      id: 'les15-block-1',
      type: 'text',
      orderIndex: 0,
      markdown: {
        default: `## Parameters and Arguments

**Parameters** are variables listed in the function definition - they're like placeholders for data.

**Arguments** are the actual values you pass to the function when you call it.

\`\`\`python
def greet(name):    # 'name' is a parameter
    print(f"Hello, {name}!")

greet("Alice")      # "Alice" is an argument
\`\`\``,
      },
    },
    {
      id: 'les15-block-2',
      type: 'divider',
      orderIndex: 1,
      label: { default: 'Function with Parameters' },
    },
    {
      id: 'les15-block-3',
      type: 'code',
      orderIndex: 2,
      language: 'python',
      code: `# Function with one parameter
def greet(name):
    print(f"Hello, {name}!")

# Call with different arguments
greet("Alice")   # Hello, Alice!
greet("Bob")     # Hello, Bob!
greet("Charlie") # Hello, Charlie!

# The 'name' parameter takes whatever value we pass in`,
      filename: 'function_parameter.py',
      highlightLines: [2, 6, 7, 8],
      caption: { default: 'A function with a parameter' },
      allowCopy: true,
    },
    {
      id: 'les15-block-4',
      type: 'divider',
      orderIndex: 3,
      label: { default: 'Return Values' },
    },
    {
      id: 'les15-block-5',
      type: 'code',
      orderIndex: 4,
      language: 'python',
      code: `# Functions can return values using 'return'
def square(number):
    result = number * number
    return result

# The returned value can be stored or used directly
answer = square(5)
print(answer)  # 25

print(square(3))  # 9

# Using returned value in an expression
total = square(4) + square(3)
print(total)  # 16 + 9 = 25`,
      filename: 'return_values.py',
      highlightLines: [4, 7, 10, 13],
      caption: { default: 'Using return to send back a value' },
      allowCopy: true,
    },
    {
      id: 'les15-block-6',
      type: 'divider',
      orderIndex: 5,
      label: { default: 'Multiple Parameters' },
    },
    {
      id: 'les15-block-7',
      type: 'code',
      orderIndex: 6,
      language: 'python',
      code: `# Functions can have multiple parameters
def add(a, b):
    return a + b

def introduce(name, age):
    return f"{name} is {age} years old"

# Call with multiple arguments (order matters!)
print(add(5, 3))              # 8
print(introduce("Alice", 25)) # Alice is 25 years old

# You can also use keyword arguments (order doesn't matter)
print(introduce(age=30, name="Bob"))  # Bob is 30 years old`,
      filename: 'multiple_parameters.py',
      highlightLines: [2, 5, 9, 10, 13],
      caption: { default: 'Functions with multiple parameters' },
      allowCopy: true,
    },
    {
      id: 'les15-block-8',
      type: 'divider',
      orderIndex: 7,
      label: { default: 'Default Parameter Values' },
    },
    {
      id: 'les15-block-9',
      type: 'code',
      orderIndex: 8,
      language: 'python',
      code: `# Parameters can have default values
def greet(name, greeting="Hello"):
    return f"{greeting}, {name}!"

# Use default greeting
print(greet("Alice"))           # Hello, Alice!

# Override with custom greeting
print(greet("Bob", "Hi"))       # Hi, Bob!
print(greet("Charlie", "Hey"))  # Hey, Charlie!

# Another example
def power(base, exponent=2):
    return base ** exponent

print(power(5))      # 25 (5^2, uses default)
print(power(2, 10))  # 1024 (2^10)`,
      filename: 'default_values.py',
      highlightLines: [2, 6, 9, 10, 13, 16, 17],
      caption: { default: 'Parameters with default values' },
      allowCopy: true,
    },
    {
      id: 'les15-block-10',
      type: 'callout',
      orderIndex: 9,
      calloutType: 'example',
      title: { default: 'Build a Calculator' },
      content: {
        default: `Let's put it all together with a simple calculator:

\`\`\`python
def add(a, b):
    return a + b

def subtract(a, b):
    return a - b

def multiply(a, b):
    return a * b

def divide(a, b):
    if b == 0:
        return "Cannot divide by zero!"
    return a / b

# Using the calculator
print(add(10, 5))       # 15
print(subtract(10, 5))  # 5
print(multiply(10, 5))  # 50
print(divide(10, 5))    # 2.0
print(divide(10, 0))    # Cannot divide by zero!
\`\`\``,
      },
      collapsible: false,
    },
    {
      id: 'les15-block-11',
      type: 'divider',
      orderIndex: 10,
      label: { default: 'Practice' },
    },
    {
      id: 'les15-block-12',
      type: 'callout',
      orderIndex: 11,
      calloutType: 'example',
      title: { default: 'Try It Yourself' },
      content: {
        default: `Practice with parameters and return values:
1. Create a function \`double(n)\` that returns n * 2
2. Create a function \`greet(name, greeting="Hi")\` with a default greeting
3. Create a function \`calculate_area(length, width)\` that returns the area
4. Create a function \`is_even(n)\` that returns True if n is even, False otherwise`,
      },
      collapsible: false,
    },
  ],
  summary: {
    keyPoints: [
      { default: 'Parameters are variables in the function definition' },
      { default: 'Arguments are values passed when calling the function' },
      { default: 'return sends a value back to the caller' },
      { default: 'Functions can have multiple parameters' },
      { default: 'Default values make parameters optional' },
    ],
    nextSteps: { default: 'Continue exploring Python with more advanced topics' },
  },
  navigation: {
    previousLessonId: 'les-014',
    nextLessonId: undefined,
    allowSkip: false,
  },
  progress: {
    completionCriteria: 'scroll-end',
    checkpoints: [],
  },
  status: 'published',
};

// =============================================================================
// Sample Quiz
// =============================================================================

const mcq1: MultipleChoiceQuestion = {
  id: 'q1',
  type: 'multiple-choice',
  question: { default: 'Which of these is a valid variable name in Python?' },
  points: 10,
  difficulty: 'beginner',
  options: [
    { id: 'opt1', text: { default: '2my_var' }, correct: false, feedback: { default: 'Variable names cannot start with a number.' } },
    { id: 'opt2', text: { default: 'my-var' }, correct: false, feedback: { default: 'Variable names cannot contain hyphens.' } },
    { id: 'opt3', text: { default: '_my_var' }, correct: true, feedback: { default: 'Correct! Variables can start with an underscore.' } },
    { id: 'opt4', text: { default: 'my var' }, correct: false, feedback: { default: 'Variable names cannot contain spaces.' } },
  ],
  explanation: { default: 'Variable names in Python can start with a letter or underscore, but not with a number. They can only contain letters, numbers, and underscores.' },
};

const mcq2: MultipleChoiceQuestion = {
  id: 'q2',
  type: 'multiple-choice',
  question: { default: 'What will be the type of x after running: x = "100"' },
  points: 10,
  difficulty: 'beginner',
  options: [
    { id: 'opt1', text: { default: 'int (integer)' }, correct: false },
    { id: 'opt2', text: { default: 'str (string)' }, correct: true },
    { id: 'opt3', text: { default: 'float' }, correct: false },
    { id: 'opt4', text: { default: 'bool (boolean)' }, correct: false },
  ],
  explanation: { default: 'Because the value is wrapped in quotes, Python treats it as a string, not a number.' },
};

const fillBlank1: FillBlankQuestion = {
  id: 'q3',
  type: 'fill-blank',
  question: { default: 'Complete the code to create a variable' },
  questionWithBlanks: { default: '{{blank1}} = "Hello"' },
  points: 10,
  difficulty: 'beginner',
  blanks: [
    {
      id: 'blank1',
      acceptedAnswers: ['greeting', 'message', 'text', 'name', 'my_var', 'x'],
      caseSensitive: false,
      allowPartial: false,
      placeholder: 'variable_name',
    },
  ],
  explanation: { default: 'Any valid variable name would work here. Common choices include greeting, message, or a simple x.' },
};

export const SAMPLE_QUIZ: Quiz = {
  schemaVersion: '1.0.0',
  id: 'quiz-001',
  moduleId: 'mod-001',
  courseId: 'course-python-basics',
  title: { default: 'Variables Quiz' },
  description: { default: 'Test your understanding of Python variables.' },
  instructions: { default: 'Answer all questions to the best of your ability. You can change your answers before submitting.' },
  config: {
    timeLimitMinutes: 0,
    questionCount: 3,
    shuffleQuestions: false,
    shuffleOptions: true,
    displayMode: 'one-at-a-time',
    allowNavigation: true,
    allowChangeAnswers: true,
    maxAttempts: 0,
    attemptCooldownMinutes: 0,
    passingScore: 70,
    showCorrectAnswers: 'after-submit',
    showCategoryScores: false,
  },
  questions: [mcq1, mcq2, fillBlank1],
  feedback: {
    passMessage: { default: 'Great job! You have a solid understanding of Python variables.' },
    failMessage: { default: 'Keep practicing! Review the lesson on variables and try again.' },
  },
  completion: {
    showResults: true,
    allowReview: true,
    showExplanations: true,
    nextAction: 'next-lesson',
  },
  status: 'published',
};

// =============================================================================
// Sample Quiz 2: Data Types Quiz
// =============================================================================

const dtMcq1: MultipleChoiceQuestion = {
  id: 'dt-q1',
  type: 'multiple-choice',
  question: { default: 'What is the data type of the value "42"?' },
  points: 10,
  difficulty: 'beginner',
  options: [
    { id: 'opt1', text: { default: 'int (integer)' }, correct: false, feedback: { default: 'Close! But the quotes make it a string, not an integer.' } },
    { id: 'opt2', text: { default: 'str (string)' }, correct: true, feedback: { default: 'Correct! Any value in quotes is a string, even if it looks like a number.' } },
    { id: 'opt3', text: { default: 'float' }, correct: false, feedback: { default: 'No, floats are decimal numbers without quotes.' } },
    { id: 'opt4', text: { default: 'bool (boolean)' }, correct: false, feedback: { default: 'No, booleans can only be True or False.' } },
  ],
  explanation: { default: 'Whenever a value is enclosed in quotes (single or double), Python treats it as a string, regardless of what the characters inside look like.' },
};

const dtMcq2: MultipleChoiceQuestion = {
  id: 'dt-q2',
  type: 'multiple-choice',
  question: { default: 'Which function converts a string to an integer?' },
  points: 10,
  difficulty: 'beginner',
  options: [
    { id: 'opt1', text: { default: 'str()' }, correct: false, feedback: { default: 'str() converts TO a string, not FROM a string.' } },
    { id: 'opt2', text: { default: 'int()' }, correct: true, feedback: { default: 'Correct! int() converts values to integers.' } },
    { id: 'opt3', text: { default: 'float()' }, correct: false, feedback: { default: 'float() converts to decimal numbers, not integers.' } },
    { id: 'opt4', text: { default: 'number()' }, correct: false, feedback: { default: 'There is no number() function in Python.' } },
  ],
  explanation: { default: 'The int() function converts compatible values (like "42" or 3.14) to integers. Note that int("hello") would cause an error!' },
};

const dtMcq3: MultipleChoiceQuestion = {
  id: 'dt-q3',
  type: 'multiple-choice',
  question: { default: 'What will print(type(3.0)) output?' },
  points: 10,
  difficulty: 'beginner',
  options: [
    { id: 'opt1', text: { default: "<class 'int'>" }, correct: false, feedback: { default: 'Even though 3.0 equals 3, the .0 makes it a float.' } },
    { id: 'opt2', text: { default: "<class 'float'>" }, correct: true, feedback: { default: 'Correct! Any number with a decimal point is a float.' } },
    { id: 'opt3', text: { default: "<class 'str'>" }, correct: false, feedback: { default: 'There are no quotes, so it is not a string.' } },
    { id: 'opt4', text: { default: "<class 'number'>" }, correct: false, feedback: { default: 'Python does not have a "number" type.' } },
  ],
  explanation: { default: 'In Python, any number written with a decimal point is automatically a float, even if the decimal part is 0.' },
};

const dtFillBlank1: FillBlankQuestion = {
  id: 'dt-q4',
  type: 'fill-blank',
  question: { default: 'Complete the code to check the type of a variable' },
  questionWithBlanks: { default: 'print({{blank1}}(my_variable))' },
  points: 10,
  difficulty: 'beginner',
  blanks: [
    {
      id: 'blank1',
      acceptedAnswers: ['type'],
      caseSensitive: true,
      allowPartial: false,
      placeholder: 'function',
    },
  ],
  explanation: { default: 'The type() function returns the data type of any value or variable.' },
};

const dtMcq4: MultipleChoiceQuestion = {
  id: 'dt-q5',
  type: 'multiple-choice',
  question: { default: 'What is the result of bool(0)?' },
  points: 10,
  difficulty: 'beginner',
  options: [
    { id: 'opt1', text: { default: 'True' }, correct: false, feedback: { default: 'Zero is considered "falsy" in Python.' } },
    { id: 'opt2', text: { default: 'False' }, correct: true, feedback: { default: 'Correct! 0, empty strings "", and None are all "falsy" values.' } },
    { id: 'opt3', text: { default: '0' }, correct: false, feedback: { default: 'bool() always returns True or False, never a number.' } },
    { id: 'opt4', text: { default: 'Error' }, correct: false, feedback: { default: 'This is valid Python code and will not cause an error.' } },
  ],
  explanation: { default: 'In Python, 0, 0.0, empty strings "", empty lists [], and None all convert to False. Everything else converts to True.' },
};

export const SAMPLE_QUIZ_2: Quiz = {
  schemaVersion: '1.0.0',
  id: 'quiz-002',
  moduleId: 'mod-001',
  courseId: 'course-python-basics',
  title: { default: 'Data Types Quiz' },
  description: { default: 'Test your knowledge of Python data types and type conversion.' },
  instructions: { default: 'Answer all questions about strings, integers, floats, and booleans. Take your time!' },
  config: {
    timeLimitMinutes: 0,
    questionCount: 5,
    shuffleQuestions: true,
    shuffleOptions: true,
    displayMode: 'one-at-a-time',
    allowNavigation: true,
    allowChangeAnswers: true,
    maxAttempts: 0,
    attemptCooldownMinutes: 0,
    passingScore: 60,
    showCorrectAnswers: 'after-submit',
    showCategoryScores: false,
  },
  questions: [dtMcq1, dtMcq2, dtMcq3, dtFillBlank1, dtMcq4],
  feedback: {
    passMessage: { default: 'Excellent! You understand Python data types well.' },
    failMessage: { default: 'Review the Data Types lesson and try again. Pay attention to how quotes affect types!' },
  },
  completion: {
    showResults: true,
    allowReview: true,
    showExplanations: true,
    nextAction: 'next-lesson',
  },
  status: 'published',
};

// =============================================================================
// Sample Quiz 3: Fundamentals Review (after Lesson 6)
// =============================================================================

const frMcq1: MultipleChoiceQuestion = {
  id: 'fr-q1',
  type: 'multiple-choice',
  question: { default: 'Which is a valid variable name?' },
  points: 1,
  difficulty: 'beginner',
  options: [
    { id: 'opt1', text: { default: '2name' }, correct: false, feedback: { default: 'Variable names cannot start with a number.' } },
    { id: 'opt2', text: { default: 'my-name' }, correct: false, feedback: { default: 'Variable names cannot contain hyphens. Use underscores instead.' } },
    { id: 'opt3', text: { default: 'my_name' }, correct: true, feedback: { default: 'Correct! Underscores are valid in variable names.' } },
    { id: 'opt4', text: { default: 'class' }, correct: false, feedback: { default: '"class" is a reserved keyword in Python and cannot be used as a variable name.' } },
  ],
  explanation: { default: 'Valid Python variable names must start with a letter or underscore, contain only letters, numbers, and underscores, and not be a reserved keyword.' },
};

const frMcq2: MultipleChoiceQuestion = {
  id: 'fr-q2',
  type: 'multiple-choice',
  question: { default: 'What data type is 3.14?' },
  points: 1,
  difficulty: 'beginner',
  options: [
    { id: 'opt1', text: { default: 'integer' }, correct: false, feedback: { default: 'Integers are whole numbers without decimal points.' } },
    { id: 'opt2', text: { default: 'float' }, correct: true, feedback: { default: 'Correct! Numbers with decimal points are floats in Python.' } },
    { id: 'opt3', text: { default: 'string' }, correct: false, feedback: { default: 'Strings are text enclosed in quotes.' } },
    { id: 'opt4', text: { default: 'boolean' }, correct: false, feedback: { default: 'Booleans can only be True or False.' } },
  ],
  explanation: { default: 'In Python, any number with a decimal point is a float (floating-point number). 3.14, 2.0, and -0.5 are all floats.' },
};

const frFillBlank1: FillBlankQuestion = {
  id: 'fr-q3',
  type: 'fill-blank',
  question: { default: 'To convert text to a number, use the appropriate function' },
  questionWithBlanks: { default: "age = {{blank1}}(input('Age: '))" },
  points: 2,
  difficulty: 'intermediate',
  blanks: [
    {
      id: 'blank1',
      acceptedAnswers: ['int'],
      caseSensitive: true,
      allowPartial: false,
      placeholder: 'function',
    },
  ],
  explanation: { default: 'The int() function converts a string to an integer. Since input() always returns a string, we need int() to convert it to a number for calculations.' },
};

const frMcq3: MultipleChoiceQuestion = {
  id: 'fr-q4',
  type: 'multiple-choice',
  question: { default: "What does print('Hi' * 3) output?" },
  points: 2,
  difficulty: 'intermediate',
  options: [
    { id: 'opt1', text: { default: 'Hi3' }, correct: false, feedback: { default: 'The * operator with strings repeats the string, not appends the number.' } },
    { id: 'opt2', text: { default: 'HiHiHi' }, correct: true, feedback: { default: 'Correct! Multiplying a string by a number repeats the string that many times.' } },
    { id: 'opt3', text: { default: 'Hi Hi Hi' }, correct: false, feedback: { default: 'String repetition does not add spaces between copies.' } },
    { id: 'opt4', text: { default: 'Error' }, correct: false, feedback: { default: 'This is valid Python - you can multiply strings by integers.' } },
  ],
  explanation: { default: "In Python, the * operator can be used with strings to repeat them. 'Hi' * 3 creates 'HiHiHi' by repeating 'Hi' three times." },
};

const frMcq4: MultipleChoiceQuestion = {
  id: 'fr-q5',
  type: 'multiple-choice',
  question: { default: 'What is the result of: 10 % 3 + 5 // 2?' },
  points: 3,
  difficulty: 'advanced',
  options: [
    { id: 'opt1', text: { default: '3' }, correct: true, feedback: { default: 'Correct! 10 % 3 = 1 (remainder), 5 // 2 = 2 (floor division), 1 + 2 = 3.' } },
    { id: 'opt2', text: { default: '4' }, correct: false, feedback: { default: 'Check your arithmetic: 10 % 3 = 1, 5 // 2 = 2, so 1 + 2 = 3.' } },
    { id: 'opt3', text: { default: '2' }, correct: false, feedback: { default: 'Remember: % gives remainder, // gives floor division (rounds down).' } },
    { id: 'opt4', text: { default: '5' }, correct: false, feedback: { default: 'Work through each operation: 10 % 3 = 1, 5 // 2 = 2, then add them.' } },
  ],
  explanation: { default: '10 % 3 calculates the remainder of 10 divided by 3, which is 1. 5 // 2 is floor division (integer division), which gives 2. Adding them: 1 + 2 = 3.' },
};

export const SAMPLE_QUIZ_3: Quiz = {
  schemaVersion: '1.0.0',
  id: 'quiz-003',
  moduleId: 'mod-001',
  courseId: 'course-python-basics',
  title: { default: 'Fundamentals Review' },
  description: { default: 'Review your understanding of variables, data types, and basic operations from lessons 1-6.' },
  instructions: { default: 'Answer all questions to test your knowledge of Python fundamentals. Good luck!' },
  config: {
    timeLimitMinutes: 10,
    questionCount: 5,
    shuffleQuestions: true,
    shuffleOptions: true,
    displayMode: 'one-at-a-time',
    allowNavigation: true,
    allowChangeAnswers: true,
    maxAttempts: 0,
    attemptCooldownMinutes: 0,
    passingScore: 60,
    showCorrectAnswers: 'after-submit',
    showCategoryScores: false,
  },
  questions: [frMcq1, frMcq2, frFillBlank1, frMcq3, frMcq4],
  feedback: {
    passMessage: { default: 'Great work! You have a solid grasp of Python fundamentals.' },
    failMessage: { default: 'Review the lessons on variables, data types, and input, then try again.' },
  },
  completion: {
    showResults: true,
    allowReview: true,
    showExplanations: true,
    nextAction: 'next-lesson',
  },
  status: 'published',
};

// =============================================================================
// Sample Quiz 4: Control Flow Challenge (after Lesson 9)
// =============================================================================

const cfMcq1: MultipleChoiceQuestion = {
  id: 'cf-q1',
  type: 'multiple-choice',
  question: { default: 'Which keyword starts a conditional?' },
  points: 1,
  difficulty: 'beginner',
  options: [
    { id: 'opt1', text: { default: 'for' }, correct: false, feedback: { default: '"for" is used for loops, not conditionals.' } },
    { id: 'opt2', text: { default: 'while' }, correct: false, feedback: { default: '"while" is used for loops, not conditionals.' } },
    { id: 'opt3', text: { default: 'if' }, correct: true, feedback: { default: 'Correct! "if" is used to start conditional statements in Python.' } },
    { id: 'opt4', text: { default: 'def' }, correct: false, feedback: { default: '"def" is used to define functions, not conditionals.' } },
  ],
  explanation: { default: 'In Python, conditional statements start with "if", followed by a condition and a colon. You can add "elif" and "else" for additional branches.' },
};

const cfMcq2: MultipleChoiceQuestion = {
  id: 'cf-q2',
  type: 'multiple-choice',
  question: { default: 'What does == check?' },
  points: 1,
  difficulty: 'beginner',
  options: [
    { id: 'opt1', text: { default: 'Assignment' }, correct: false, feedback: { default: 'Assignment uses a single = sign, not double.' } },
    { id: 'opt2', text: { default: 'Equality' }, correct: true, feedback: { default: 'Correct! == compares two values and returns True if they are equal.' } },
    { id: 'opt3', text: { default: 'Greater than' }, correct: false, feedback: { default: 'Greater than is represented by >.' } },
    { id: 'opt4', text: { default: 'Not equal' }, correct: false, feedback: { default: 'Not equal is represented by !=.' } },
  ],
  explanation: { default: 'The == operator checks equality between two values. It returns True if both sides have the same value, False otherwise. Do not confuse it with = which is for assignment.' },
};

const cfFillBlank1: FillBlankQuestion = {
  id: 'cf-q3',
  type: 'fill-blank',
  question: { default: 'To check if x is between 1 and 10' },
  questionWithBlanks: { default: 'if x > 1 {{blank1}} x < 10:' },
  points: 2,
  difficulty: 'intermediate',
  blanks: [
    {
      id: 'blank1',
      acceptedAnswers: ['and'],
      caseSensitive: true,
      allowPartial: false,
      placeholder: 'operator',
    },
  ],
  explanation: { default: 'The "and" operator is used to combine multiple conditions where both must be true. Here we check if x is greater than 1 AND less than 10.' },
};

const cfMcq3: MultipleChoiceQuestion = {
  id: 'cf-q4',
  type: 'multiple-choice',
  question: { default: 'What does this code print?\n\nx = 5\nif x > 3:\n    print("A")\nelif x > 4:\n    print("B")\nelse:\n    print("C")' },
  points: 2,
  difficulty: 'intermediate',
  options: [
    { id: 'opt1', text: { default: 'A' }, correct: true, feedback: { default: 'Correct! x is 5, which is greater than 3, so "A" prints. The elif is never checked because the first condition was True.' } },
    { id: 'opt2', text: { default: 'B' }, correct: false, feedback: { default: 'Once a condition is True, Python executes that block and skips the rest. Since x > 3 is True, elif is never checked.' } },
    { id: 'opt3', text: { default: 'C' }, correct: false, feedback: { default: 'The else only runs if all previous conditions are False. Here x > 3 is True.' } },
    { id: 'opt4', text: { default: 'AB' }, correct: false, feedback: { default: 'Only one branch of an if/elif/else chain executes. Once if is True, elif and else are skipped.' } },
  ],
  explanation: { default: 'In an if/elif/else chain, Python checks conditions from top to bottom and executes only the FIRST block whose condition is True. Since 5 > 3 is True, it prints "A" and skips the rest.' },
};

const cfMcq4: MultipleChoiceQuestion = {
  id: 'cf-q5',
  type: 'multiple-choice',
  question: { default: 'Which correctly checks if n is positive AND even?' },
  points: 3,
  difficulty: 'advanced',
  options: [
    { id: 'opt1', text: { default: 'n > 0 and n % 2 == 0' }, correct: true, feedback: { default: 'Correct! n > 0 checks positive, n % 2 == 0 checks even (no remainder when divided by 2).' } },
    { id: 'opt2', text: { default: 'n > 0 or n % 2 == 0' }, correct: false, feedback: { default: '"or" would be True if EITHER condition is True. We need both to be True, so use "and".' } },
    { id: 'opt3', text: { default: 'n >= 0 and n % 2 == 0' }, correct: false, feedback: { default: 'n >= 0 includes zero, which is not positive. Use n > 0 for strictly positive.' } },
    { id: 'opt4', text: { default: 'n > 0 and n / 2 == 0' }, correct: false, feedback: { default: 'n / 2 == 0 checks if half of n is zero (only true for n=0). Use n % 2 == 0 to check for even.' } },
  ],
  explanation: { default: 'To check if a number is positive, use n > 0 (not >= which includes zero). To check if even, use n % 2 == 0 (remainder when divided by 2 is zero). Both conditions need "and" to require both be True.' },
};

export const SAMPLE_QUIZ_4: Quiz = {
  schemaVersion: '1.0.0',
  id: 'quiz-004',
  moduleId: 'mod-002',
  courseId: 'course-python-basics',
  title: { default: 'Control Flow Challenge' },
  description: { default: 'Test your understanding of conditionals, comparison operators, and logical operators.' },
  instructions: { default: 'Answer all questions about if statements and boolean logic. Think carefully about each condition!' },
  config: {
    timeLimitMinutes: 10,
    questionCount: 5,
    shuffleQuestions: true,
    shuffleOptions: true,
    displayMode: 'one-at-a-time',
    allowNavigation: true,
    allowChangeAnswers: true,
    maxAttempts: 0,
    attemptCooldownMinutes: 0,
    passingScore: 60,
    showCorrectAnswers: 'after-submit',
    showCategoryScores: false,
  },
  questions: [cfMcq1, cfMcq2, cfFillBlank1, cfMcq3, cfMcq4],
  feedback: {
    passMessage: { default: 'Excellent! You understand control flow and conditionals well.' },
    failMessage: { default: 'Review the lessons on if statements and boolean operators, then try again.' },
  },
  completion: {
    showResults: true,
    allowReview: true,
    showExplanations: true,
    nextAction: 'next-lesson',
  },
  status: 'published',
};

// =============================================================================
// Sample Quiz 5: Loops Basics (after Lesson 10)
// =============================================================================

const lbMcq1: MultipleChoiceQuestion = {
  id: 'lb-q1',
  type: 'multiple-choice',
  question: { default: 'What keyword creates a while loop?' },
  points: 1,
  difficulty: 'beginner',
  options: [
    { id: 'opt1', text: { default: 'for' }, correct: false, feedback: { default: '"for" creates a for loop, which iterates over sequences.' } },
    { id: 'opt2', text: { default: 'loop' }, correct: false, feedback: { default: '"loop" is not a Python keyword.' } },
    { id: 'opt3', text: { default: 'while' }, correct: true, feedback: { default: 'Correct! "while" creates a loop that repeats as long as a condition is True.' } },
    { id: 'opt4', text: { default: 'repeat' }, correct: false, feedback: { default: '"repeat" is not a Python keyword.' } },
  ],
  explanation: { default: 'The "while" keyword creates a loop that checks a condition before each iteration. The loop continues as long as the condition is True.' },
};

const lbMcq2: MultipleChoiceQuestion = {
  id: 'lb-q2',
  type: 'multiple-choice',
  question: { default: 'How many times does this print?\n\ni = 0\nwhile i < 3:\n    print(i)\n    i += 1' },
  points: 2,
  difficulty: 'intermediate',
  options: [
    { id: 'opt1', text: { default: '2' }, correct: false, feedback: { default: 'Count through: i=0, i=1, i=2 all satisfy i < 3, so it prints 3 times.' } },
    { id: 'opt2', text: { default: '3' }, correct: true, feedback: { default: 'Correct! The loop runs for i = 0, 1, 2 (three times), then stops when i reaches 3.' } },
    { id: 'opt3', text: { default: '4' }, correct: false, feedback: { default: 'When i becomes 3, the condition i < 3 is False, so the loop stops.' } },
    { id: 'opt4', text: { default: 'infinite' }, correct: false, feedback: { default: 'i increases each iteration with i += 1, so it will reach 3 and stop.' } },
  ],
  explanation: { default: 'The loop runs while i < 3. Starting at 0, it prints when i is 0, 1, and 2 (three times). When i becomes 3, the condition is False and the loop stops.' },
};

const lbFillBlank1: FillBlankQuestion = {
  id: 'lb-q3',
  type: 'fill-blank',
  question: { default: 'To exit a loop early, use the appropriate statement' },
  questionWithBlanks: { default: 'To exit a loop early, use the {{blank1}} statement' },
  points: 3,
  difficulty: 'advanced',
  blanks: [
    {
      id: 'blank1',
      acceptedAnswers: ['break'],
      caseSensitive: true,
      allowPartial: false,
      placeholder: 'keyword',
    },
  ],
  explanation: { default: 'The "break" statement immediately exits the current loop, regardless of the loop condition. It is often used with an if statement to exit when a specific condition is met.' },
};

export const SAMPLE_QUIZ_5: Quiz = {
  schemaVersion: '1.0.0',
  id: 'quiz-005',
  moduleId: 'mod-003',
  courseId: 'course-python-basics',
  title: { default: 'Loops Basics' },
  description: { default: 'Test your understanding of while loops and loop control.' },
  instructions: { default: 'Answer all questions about loops. Trace through the code carefully!' },
  config: {
    timeLimitMinutes: 10,
    questionCount: 3,
    shuffleQuestions: false,
    shuffleOptions: true,
    displayMode: 'one-at-a-time',
    allowNavigation: true,
    allowChangeAnswers: true,
    maxAttempts: 0,
    attemptCooldownMinutes: 0,
    passingScore: 60,
    showCorrectAnswers: 'after-submit',
    showCategoryScores: false,
  },
  questions: [lbMcq1, lbMcq2, lbFillBlank1],
  feedback: {
    passMessage: { default: 'Well done! You understand how loops work in Python.' },
    failMessage: { default: 'Review the lessons on while loops and try tracing through the code step by step.' },
  },
  completion: {
    showResults: true,
    allowReview: true,
    showExplanations: true,
    nextAction: 'next-lesson',
  },
  status: 'published',
};

// =============================================================================
// Sample Lesson List Items
// =============================================================================

export const SAMPLE_LESSON_LIST = [
  {
    id: 'les-001',
    title: 'What are Variables?',
    duration: 15,
    status: 'available' as const,
    moduleId: 'mod-001',
    courseId: 'course-python-basics',
  },
  {
    id: 'les-002',
    title: 'Data Types in Python',
    duration: 20,
    status: 'available' as const,
    moduleId: 'mod-001',
    courseId: 'course-python-basics',
  },
  {
    id: 'les-003',
    title: 'Working with Numbers',
    duration: 25,
    status: 'available' as const,
    moduleId: 'mod-001',
    courseId: 'course-python-basics',
  },
  {
    id: 'les-004',
    title: 'Data Types: Strings',
    duration: 25,
    status: 'available' as const,
    moduleId: 'mod-001',
    courseId: 'course-python-basics',
  },
  {
    id: 'les-005',
    title: 'Data Types: Booleans',
    duration: 15,
    status: 'available' as const,
    moduleId: 'mod-001',
    courseId: 'course-python-basics',
  },
  {
    id: 'les-006',
    title: 'Getting User Input',
    duration: 20,
    status: 'available' as const,
    moduleId: 'mod-001',
    courseId: 'course-python-basics',
  },
  {
    id: 'les-007',
    title: 'Conditional Statements',
    duration: 30,
    status: 'available' as const,
    moduleId: 'mod-001',
    courseId: 'course-python-basics',
  },
  {
    id: 'les-008',
    title: 'Comparison Operators',
    duration: 20,
    status: 'available' as const,
    moduleId: 'mod-001',
    courseId: 'course-python-basics',
  },
  {
    id: 'les-009',
    title: 'Logical Operators',
    duration: 20,
    status: 'available' as const,
    moduleId: 'mod-001',
    courseId: 'course-python-basics',
  },
  {
    id: 'les-010',
    title: 'While Loops',
    duration: 25,
    status: 'available' as const,
    moduleId: 'mod-001',
    courseId: 'course-python-basics',
  },
  {
    id: 'les-011',
    title: 'For Loops',
    duration: 25,
    status: 'available' as const,
    moduleId: 'mod-001',
    courseId: 'course-python-basics',
  },
  {
    id: 'les-012',
    title: 'Lists Introduction',
    duration: 30,
    status: 'available' as const,
    moduleId: 'mod-001',
    courseId: 'course-python-basics',
  },
  {
    id: 'les-013',
    title: 'List Operations',
    duration: 25,
    status: 'available' as const,
    moduleId: 'mod-001',
    courseId: 'course-python-basics',
  },
  {
    id: 'les-014',
    title: 'Functions Basics',
    duration: 30,
    status: 'available' as const,
    moduleId: 'mod-001',
    courseId: 'course-python-basics',
  },
  {
    id: 'les-015',
    title: 'Function Parameters',
    duration: 30,
    status: 'available' as const,
    moduleId: 'mod-001',
    courseId: 'course-python-basics',
  },
];
