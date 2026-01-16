# CodeLearn CMS Guide

The Content Management System (CMS) in CodeLearn allows educators and content creators to author lessons, quizzes, and exercises directly within the application. This guide covers everything you need to create and publish educational content.

## Table of Contents

- [Introduction](#introduction)
- [Getting Started](#getting-started)
- [Creating Content](#creating-content)
  - [Lessons](#lessons)
  - [Quizzes](#quizzes)
  - [Exercises](#exercises)
- [Managing Assets](#managing-assets)
- [Publishing](#publishing)
- [Draft Management](#draft-management)

---

## Introduction

### What is the CMS?

The CodeLearn CMS is a built-in authoring tool that enables you to create educational content without leaving the application. It supports:

- **Lessons**: Markdown-based instructional content with code examples
- **Quizzes**: Assessments with multiple choice and fill-in-the-blank questions
- **Exercises**: Coding challenges with templates and test cases

### Who is it for?

- **Educators**: Teachers creating curriculum for their students
- **Content Authors**: Writers developing coding tutorials
- **Hub Administrators**: Operators managing content distribution to offline devices

---

## Getting Started

### Accessing the CMS

Navigate to the CMS from the main application menu. The CMS interface includes:

- **Sidebar**: Navigate between content types (Lessons, Quizzes, Exercises)
- **Content Tree**: Browse and organize your drafts hierarchically
- **Editor Panel**: Create and edit content with live preview
- **Top Bar**: Access publishing, settings, and profile options

### Author Profile Setup

Before creating content, set up your author profile:

1. Click on your avatar in the CMS top bar
2. Select **Edit Profile**
3. Fill in your author details:
   - Display name
   - Bio (optional)
   - Avatar image (optional)
4. Save your profile

Your author information will be attached to all content you create.

---

## Creating Content

### Lessons

Lessons are the primary instructional unit in CodeLearn. Each lesson contains:

#### Using the Markdown Editor

The lesson editor provides a split-pane view with:
- **Left pane**: Markdown source with syntax highlighting
- **Right pane**: Live preview of rendered content

Supported Markdown features:
- Headings, paragraphs, and lists
- Code blocks with syntax highlighting
- Images (via Asset Picker)
- Links and emphasis

#### Adding Learning Objectives

Each lesson should have clear learning objectives using Bloom's Taxonomy levels:

1. Click **Add Learning Objective**
2. Enter the objective text (e.g., "Explain how variables store data")
3. Select the Bloom level:
   - **Remember**: Recall facts and basic concepts
   - **Understand**: Explain ideas or concepts
   - **Apply**: Use information in new situations
   - **Analyze**: Draw connections among ideas
   - **Evaluate**: Justify a decision or course of action
   - **Create**: Produce new or original work
4. Repeat for additional objectives

#### Lesson Metadata

Configure lesson metadata in the sidebar form:
- **Title**: Clear, descriptive lesson title
- **Description**: Brief summary (shown in course listings)
- **Difficulty**: Beginner, Intermediate, or Advanced
- **Duration**: Estimated completion time
- **Prerequisites**: Links to prior lessons (optional)

---

### Quizzes

Quizzes assess learner understanding with various question types.

#### Supported Question Types

**Multiple Choice (MCQ)**
- One correct answer from multiple options
- Add 2-5 answer choices
- Mark the correct answer
- Optional explanation for feedback

**Fill-in-the-Blank**
- Text with blanks for learners to complete
- Define acceptable answers for each blank
- Case-sensitive or case-insensitive matching

#### Creating Questions

1. Click **Add Question** in the quiz editor
2. Select the question type
3. Enter the question text
4. Configure answers:
   - For MCQ: Add options and select the correct one
   - For Fill-blank: Define the blank and accepted answers
5. Add explanation text (shown after answering)
6. Set point value (optional)

#### Quiz Settings

- **Title**: Quiz name
- **Description**: What the quiz covers
- **Passing Score**: Minimum percentage to pass (default: 70%)
- **Shuffle Questions**: Randomize question order
- **Show Feedback**: Immediate or after submission

---

### Exercises

Exercises are hands-on coding challenges where learners write and run code.

#### Code Templates

Provide starter code for learners:

1. Open the exercise editor
2. Select the programming language (Python or JavaScript)
3. Enter the starter code template
4. Mark editable regions if restricting where learners can type

Example template:
```python
def greet(name):
    # Your code here
    pass

# Test your function
print(greet("World"))
```

#### Test Cases

Define test cases to validate learner solutions:

1. Click **Add Test Case**
2. Enter:
   - **Input**: Test input or function arguments
   - **Expected Output**: What the code should produce
   - **Hidden**: Whether learners can see this test
3. Add multiple test cases for thorough validation

#### Exercise Metadata

- **Title**: Challenge name
- **Instructions**: Clear problem description
- **Hints**: Optional hints (revealed on request)
- **Solution**: Reference solution (for authors only)

---

## Managing Assets

### Uploading Images

Add images to your content using the Asset Picker:

1. Click the **Image** button in the editor toolbar
2. Choose from:
   - **Upload**: Select a file from your device
   - **Library**: Browse previously uploaded assets
3. Add alt text for accessibility
4. Insert the image into your content

### Organizing Media

Assets are stored locally and can be:
- Renamed for easy identification
- Tagged for organization
- Deleted when no longer needed

Supported formats:
- Images: PNG, JPG, GIF, SVG, WebP
- Maximum file size: 5MB per image

---

## Publishing

### Validation Requirements

Before publishing, content must pass validation:

| Check | Requirement |
|-------|-------------|
| Title | Must not be empty |
| Content | Must have body content |
| Lessons | At least one learning objective |
| Quizzes | At least one question with correct answer |
| Exercises | Must have test cases |

The publish dialog shows validation status with:
- Green checkmark: Passed
- Red X: Failed (must fix)
- Yellow warning: Optional improvement

### Export as ZIP

Export content for manual distribution:

1. Open the content you want to export
2. Click **Publish** in the top bar
3. Review validation status
4. Click **Export as ZIP**
5. Save the downloaded file

The ZIP contains all content and assets in a portable format.

### Publish to Hub

Send content directly to a connected Hub:

1. Ensure the Hub is connected (check sync status)
2. Open the content to publish
3. Click **Publish** in the top bar
4. Review validation status
5. Click **Publish to Hub**
6. Wait for upload confirmation

Requirements:
- Hub must be reachable on the network
- Valid author profile configured
- All validation checks passed

---

## Draft Management

### Auto-Save

The CMS automatically saves your work:
- Saves every 30 seconds while editing
- Saves when switching between items
- Saves before navigating away

The save indicator in the top bar shows:
- **Saved**: All changes persisted
- **Saving...**: Save in progress
- **Unsaved changes**: Pending save

### Draft Status Workflow

Content progresses through these states:

1. **Draft**: Work in progress, not published
2. **Ready**: Validated and ready to publish
3. **Published**: Available on Hub or exported

To change status:
- Drafts become Ready when validation passes
- Ready items become Published after successful publish
- Published items can be edited (creates new draft version)

### Managing Drafts

From the Content Tree:
- **Create**: Click + to add new content
- **Edit**: Click on any item to open in editor
- **Duplicate**: Right-click > Duplicate
- **Delete**: Right-click > Delete (with confirmation)
- **Reorder**: Drag and drop to reorganize

---

## Tips for Effective Content

1. **Start with objectives**: Define what learners should achieve
2. **Keep lessons focused**: One concept per lesson works best
3. **Use code examples**: Show, don't just tell
4. **Test your quizzes**: Take them yourself before publishing
5. **Provide hints**: Help learners without giving answers
6. **Preview often**: Use the live preview to check formatting

---

## Troubleshooting

### Content won't save
- Check browser storage quota
- Try refreshing the page
- Export content as backup before clearing data

### Images not loading
- Verify file format is supported
- Check file size is under 5MB
- Try re-uploading the image

### Publish button disabled
- Review validation errors in the publish dialog
- Ensure all required fields are completed
- Check Hub connectivity for Hub publishing
