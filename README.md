📄 GetCoverly

GetCoverly is a smart cover letter generator that helps job seekers quickly craft personalized, professional cover letters tailored to their resume and a target job description.

It integrates with OpenAI GPT-4o, Firebase Authentication, Firestore, and Firebase Storage to give users a secure, seamless experience:

Upload your resume (PDF)

Paste the job description

Instantly generate a polished cover letter

Save your letters to your profile and download as PDFs

✨ Features

🔐 User Authentication – Sign up/login using Email & Password or Google

📄 Resume Parsing – Upload a PDF resume, automatically extract text

🎯 Job-Specific Cover Letters – Generate tailored cover letters with GPT-4o

📦 User Profile Integration – Save user details (name, address, email, phone) for reuse in cover letters

📂 Letter Storage – Store generated letters in Firestore

☁️ PDF Export & Storage – Export letters to PDF and save to Firebase Storage

📜 User Dashboard – View, download, or revisit all saved letters in one place

🛠️ Tech Stack

Frontend: Next.js 15
, React, TailwindCSS

Backend: Next.js API routes

AI Model: OpenAI GPT-4o

Database: Firebase Firestore

Auth: Firebase Authentication (Email/Password & Google)

Storage: Firebase Storage (PDFs)

PDF Generation: jsPDF + html2canvas
