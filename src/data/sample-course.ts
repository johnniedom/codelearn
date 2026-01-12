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
    lessonsCount: 10,
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
    lessonCount: 10,
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
];
