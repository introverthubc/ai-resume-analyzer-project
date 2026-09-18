AI Resume Analyzer

A full-stack AI-powered resume analysis application built with React, Vite, Node.js, Express, and Google Gemini.

The application lets users upload PDF resumes, extract resume text on the backend, analyze ATS readiness, review strengths and issues, inspect keyword coverage, generate AI-assisted bullet rewrites, and create improved resume versions.

Features

Resume Upload and Parsing

Upload PDF resumes from the frontend.

PDF-only validation.

Maximum upload size: 5 MB.

Backend file handling with Multer.

Resume text extraction with pdf-parse.

Uploaded PDF binary files are not permanently stored.

Extracted text and resume metadata are persisted locally.

Gemini-Powered Resume Analysis

The backend sends extracted resume text to Google Gemini and produces structured analysis data including:

ATS score from 0–100

ATS score breakdown

Strengths

Issues

Present keywords

Missing keywords

Overall summary / verdict

Resume bullet rewrite suggestions

Optional target-role-aware analysis

If Gemini is unavailable, the recreated version can use fallback analysis so the application remains usable during development.

Keyword Analysis

The application identifies:

Keywords already present in the resume

Important keywords that may be missing

This helps users understand basic ATS keyword coverage and how closely the resume aligns with a target role.

AI Bullet Rewrites

Gemini can suggest improved resume bullets.

Each rewrite can contain:

Original text

Improved text

Resume section

Explanation / rationale

Users can:

Select individual rewrites

Apply selected rewrites

Apply all rewrites

Resume Versioning

Every newly uploaded resume starts as V1.

Applying rewrites creates a new version such as V2, V3, and so on.

Previous versions remain available.

Each version can be analyzed separately.

Resume Management

View uploaded resumes

Open a resume detail page

View ATS score

Delete resumes

Resume metadata, extracted text, analyses, and versions survive backend restarts through local JSON persistence

Tech Stack

Frontend

React 19

React DOM

React Router DOM

Vite

Lucide React

CSS

Backend

Node.js

Express

CORS

Multer

dotenv

pdf-parse

AI

Google Gemini API

@google/genai

Development Tools

ESLint

Vite React plugin

Project Structure

AI_RESUME_ANALYZER_RECREATED/
│
├── server/
│   ├── data/
│   │   └── resumes.json
│   └── server.js
│
├── src/
│   ├── api/
│   │   └── resumes.js
│   │
│   ├── components/
│   │   ├── AnalysisPanel.jsx
│   │   ├── Layout.jsx
│   │   ├── ScoreRing.jsx
│   │   └── UploadDropzone.jsx
│   │
│   ├── pages/
│   │   ├── Dashboard.jsx
│   │   ├── Placeholder.jsx
│   │   ├── ResumeDetail.jsx
│   │   └── Resumes.jsx
│   │
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
│
├── .env.example
├── .gitignore
├── eslint.config.js
├── index.html
├── jsconfig.json
├── package.json
├── vite.config.js
└── README.md

How the Application Works

User uploads a PDF resume
        ↓
React sends multipart/form-data to Express
        ↓
Multer receives the PDF in memory
        ↓
pdf-parse extracts resume text
        ↓
Backend creates Resume + V1
        ↓
Resume data is persisted in resumes.json
        ↓
User optionally enters a target role
        ↓
User clicks Analyze
        ↓
Backend sends resume text to Gemini
        ↓
Gemini returns structured analysis
        ↓
Backend validates / normalizes the response
        ↓
Frontend displays:
  • ATS score
  • Score breakdown
  • Strengths
  • Issues
  • Keywords
  • Verdict
  • Rewrites
        ↓
User applies selected rewrite suggestions
        ↓
Backend creates V2 / V3 / ...

Prerequisites

Install:

Node.js

npm

A Google Gemini API key

Check Node.js and npm:

node -v
npm -v

If Windows says:

node is not recognized

Node may not be installed or may not be available in the current PATH.

For a temporary PowerShell PATH fix:

$env:Path += ";C:\Program Files\nodejs"

Then verify again:

node -v
npm -v

If Node.js is not installed, install the current LTS release and reopen VS Code afterward.

Installation

1. Open the Project

Open the project root in VS Code.

The terminal should be inside the directory containing package.json.

Example:

C:\...\AI_RESUME_ANALYZER_RECREATED>

2. Install Dependencies

Run:

npm install

This installs frontend and backend dependencies from package.json.

Gemini API Setup

1. Create a Gemini API Key

Create an API key in Google AI Studio.

2. Create .env

The project includes:

.env.example

Copy it to:

.env

On Windows:

copy .env.example .env

On macOS/Linux:

cp .env.example .env

Then edit .env:

GEMINI_API_KEY=your_real_gemini_api_key
GEMINI_MODEL=gemini-3.6-flash
PORT=5000

The default model used by this recreated version is:

gemini-3.6-flash

Security

Never expose your API key in:

Screenshots

GitHub commits

Frontend React code

Public repositories

Chat messages

The project keeps the API key on the backend only.

.gitignore includes:

.env
node_modules
dist

If a key is accidentally exposed, revoke it and create a new one.

Running the Project

The backend and frontend run in separate terminals.

Terminal 1 — Start Backend

npm run server

Backend URL:

http://localhost:5000

Gemini/backend test:

http://localhost:5000/api/test

A successful Gemini response looks similar to:

{
  "message": "Gemini connection working",
  "aiConfigured": true,
  "model": "gemini-3.6-flash"
}

Keep the backend terminal running.

Terminal 2 — Start Frontend

Open a second terminal:

npm run dev

Vite normally starts at:

http://localhost:5173

Open that URL in the browser.

Main Application Flow

Open Your Resumes.

Select a PDF resume.

Upload the resume.

Open the generated resume detail page.

Optionally enter a target job role.

Click Analyze.

Review the ATS score and score breakdown.

Review the verdict.

Open the Issues tab.

Open the Strengths tab.

Open the Keywords tab.

Open the Rewrites tab.

Select the rewrites you want.

Click Apply selected or Apply all.

A new resume version is created.

Analyze the new version again if required.

API Endpoints

The recreated backend exposes the following routes.

Method

Endpoint

Purpose

GET

/api/test

Test backend and Gemini connectivity

GET

/api/resumes

Fetch all resumes

POST

/api/resume/upload

Upload and parse a PDF resume

GET

/api/resume/:id

Fetch one resume and its versions

POST

/api/resume/analyze

Analyze a resume version

GET

/api/resume/:id/analysis/:versionId

Fetch analysis for a specific version

POST

/api/resume/:id/rewrite

Apply selected AI rewrites and create a new version

DELETE

/api/resume/:id

Delete a resume

Example Upload Request

The frontend sends the PDF using FormData.

Conceptually:

const formData = new FormData();
formData.append("resume", file);
formData.append("title", title);

await fetch("http://localhost:5000/api/resume/upload", {
  method: "POST",
  body: formData,
});

Do not manually set Content-Type when sending FormData; the browser supplies the multipart boundary.

Example Analysis Request

{
  "resumeId": "resume_123",
  "versionId": "v1",
  "targetRole": "Frontend Developer"
}

The backend returns structured analysis data such as:

{
  "message": "Resume analyzed successfully",
  "analysis": {
    "atsScore": 78,
    "strengths": [],
    "issues": [],
    "keywordsPresent": [],
    "keywordsMissing": [],
    "summary": "",
    "bulletRewrites": []
  }
}

The actual values are generated from the uploaded resume.

Analysis Data

A resume analysis may contain fields similar to:

{
  _id,
  resumeId,
  versionId,
  targetRole,
  atsScore,
  scoreBreakdown,
  strengths,
  issues,
  keywordsPresent,
  keywordsMissing,
  bulletRewrites,
  summary
}

ATS Score

A number from:

0 – 100

Higher scores indicate stronger ATS readiness according to the application's analysis criteria.

The score is intended as guidance, not as a guarantee that a particular employer or ATS platform will score the resume identically.

Persistent Storage

Resume information is stored in:

server/data/resumes.json

The recreated version stores:

Resume metadata

Extracted resume text

Resume versions

Analyses

Rewrite results

This makes the project easy to demonstrate without requiring a database server.

For a production implementation, the storage layer can be replaced with:

MongoDB

PostgreSQL

MySQL

Firebase

Supabase

Why JSON Storage Was Used

For this student project, local JSON persistence keeps the architecture easy to understand:

Frontend
   ↓
REST API
   ↓
Express business logic
   ↓
JSON persistence
   ↓
Gemini API

It demonstrates backend persistence without requiring database configuration during a local demo.

Resume Versioning

A new upload begins with:

V1

When a user applies rewrite suggestions, the backend creates another version:

V1 → V2 → V3 → ...

This prevents the original resume content from being overwritten and lets users compare improvements.

Gemini Integration

Gemini is initialized only on the backend.

Environment variable:

GEMINI_API_KEY=...

The backend uses the Gemini SDK to generate structured resume analysis.

A simplified flow is:

const response = await ai.models.generateContent({
  model: GEMINI_MODEL,
  contents: prompt,
});

The application then parses, validates, and normalizes the generated result before sending it to React.

Why the API Key Is Not in React

Anything included directly in frontend JavaScript can be inspected by a browser user.

Therefore this would be unsafe:

// Do not do this
const key = "my-secret-key";

Instead:

React
  ↓
Express backend
  ↓
Gemini API

The backend reads the secret from .env.

PDF Processing

Multer receives the uploaded PDF in memory.

The backend then uses pdf-parse to extract its text.

Conceptually:

PDF
 ↓
Multer
 ↓
Buffer
 ↓
pdf-parse
 ↓
Plain text
 ↓
Gemini analysis

This allows the AI model to analyze the resume content without requiring the frontend to understand PDF internals.

Scripts

Available npm scripts:

npm run dev

Starts the Vite development server.

npm run server

Starts the Express backend.

npm run build

Builds the frontend for production.

npm run preview

Previews the production frontend build locally.

npm run lint

Runs ESLint.

Common Errors and Fixes

npm or node is not recognized

Example:

node : The term 'node' is not recognized

Confirm Node is installed:

& "C:\Program Files\nodejs\node.exe" -v

If that works but node -v does not, the Node installation directory is missing from the terminal PATH.

Temporary fix:

$env:Path += ";C:\Program Files\nodejs"

Then:

node -v
npm -v

ERR_MODULE_NOT_FOUND

Example:

Cannot find package 'dotenv'

Install project dependencies:

npm install

Make sure you run this from the folder containing the project's package.json.

Cannot GET /

Opening:

http://localhost:5000/

may show:

Cannot GET /

That does not necessarily mean the backend is broken. The Express server may simply not define a / page.

Use:

http://localhost:5000/api/test

for the recreated project's backend test.

Gemini says it is not configured

Example:

{
  "aiConfigured": false
}

Check .env:

GEMINI_API_KEY=your_key

Save the file and restart the backend:

Ctrl + C
npm run server

Environment variables are loaded when the backend starts.

Gemini returns 401 UNAUTHENTICATED

Possible causes:

Invalid API key

Revoked key

Incomplete/copied key

Incorrect credential type

Create a fresh Gemini API key in Google AI Studio, replace the .env value, save it, and restart the backend.

Resume disappears after server restart

In older development versions, resumes were stored in a JavaScript Map(), so restarting Node cleared them.

The recreated project fixes this by using:

server/data/resumes.json

Development Notes

The project intentionally separates:

Frontend responsibilities

UI

File selection

User interaction

Routing

Rendering analysis results

Calling backend APIs

Backend responsibilities

File validation

PDF extraction

Gemini API calls

Analysis normalization

Resume persistence

Version management

Rewrite application

This separation keeps the API key secure and makes the project easier to maintain.

Interview Explanation

A concise way to explain the project in an interview:

I built a full-stack resume analysis application where users upload a PDF resume and the backend extracts its text using pdf-parse. The React frontend communicates with an Express REST API, while the backend integrates with Google Gemini to generate ATS-focused analysis such as scores, strengths, issues, keyword coverage, and bullet-point rewrites. I also implemented resume versioning so applying AI suggestions creates a new version instead of overwriting the original. For local persistence I used JSON-based storage, while the architecture allows it to be replaced with a database later.

Motivation

The main motivation was to gain practical experience in full-stack development by combining frontend development, backend APIs, file handling, AI integration, data persistence, and version management in one application.

Instead of learning React, Node.js, Express, REST APIs, PDF parsing, and generative AI separately, the project brings them together in one realistic workflow.

Problem Statement

Resume improvement is often difficult because applicants may not know:

Whether their resume is easy for ATS systems to parse

Which sections are weak

Which important keywords are missing

Whether bullet points clearly communicate impact

How to adapt the resume toward a target role

The project focuses on analyzing these aspects and presenting structured feedback through one interface.

Current Limitations

This is primarily a local/student project.

Current limitations include:

Local JSON persistence instead of a production database

No complete production authentication system

AI-generated analysis can vary between requests

ATS scores are application-generated estimates and not official scores from third-party ATS vendors

Rewrite quality depends on extracted PDF text and AI output

Deployment configuration may require additional environment setup

Future Improvements

Possible extensions:

MongoDB or PostgreSQL

User authentication

Cloud deployment

Resume/job-description similarity scoring

Multiple resume formats

DOCX upload

Download/export improved resume

User accounts

Analysis history

Resume comparison

Better structured resume section extraction

Rate limiting

API request logging

Automated tests

Docker support

Production validation and monitoring

Important Security Reminder

Before uploading this project to GitHub, confirm that .env is ignored:

git status

Your Gemini key should never appear as a tracked file.

If it was ever committed, removing the file from the latest commit is not enough—the key should also be revoked because it may still exist in Git history.

License

This project is intended for educational and portfolio use.

Summary

This project demonstrates:

React frontend development

REST API integration

Express backend development

File uploads

PDF parsing

Environment variables

Gemini API integration

Structured AI responses

ATS-style resume analysis

Keyword analysis

AI rewrites

Version control inside the application

Local data persistence

Error handling

Frontend/backend separation

It is designed as a practical full-stack engineering project that can be demonstrated locally and extended into a production application.
