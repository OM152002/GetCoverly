import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import { adminAuth, adminDb } from '../../../../lib/firebaseAdmin';
import admin from 'firebase-admin';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function formatToday() {
  return new Date().toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format a single US phone number into "(XXX) XXX-XXXX".
 * If it’s not a valid US 10‑digit number (optionally prefixed with +1/1), return input unchanged.
 */
function formatUSPhone(input: string): string {
  if (!input) return input;
  let digits = input.replace(/\D+/g, '');
  if (digits.length === 11 && digits.startsWith('1')) digits = digits.slice(1);
  if (digits.length !== 10) return input; // leave non‑US/invalid as-is
  const a = digits.slice(0, 3);
  const b = digits.slice(3, 6);
  const c = digits.slice(6);
  return `(${a}) ${b}-${c}`;
}

/**
 * Scan arbitrary text and format any US phone numbers into "(XXX) XXX-XXXX".
 * Handles common separators and optional +1/1 country code.
 */
function normalizePhonesInText(text: string): string {
  const re = /(?:\+?1[\s\-.]?)?\(?\s*(\d{3})\s*\)?[\s\-.]?\s*(\d{3})[\s\-.]?\s*(\d{4})\b/g;
  return text.replace(re, (_m, a: string, b: string, c: string) => `(${a}) ${b}-${c}`);
}

export async function POST(req: Request) {
  try {
    const { resumeText, jobDescription } = await req.json();

    if (!resumeText || !jobDescription) {
      return NextResponse.json({ error: 'Missing input' }, { status: 400 });
    }

    // 1) Verify Firebase ID token (if provided)
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    let uid: string | null = null;
    let emailFromAuth: string | null = null;

    if (token) {
      try {
        const decoded = await adminAuth.verifyIdToken(token);
        uid = decoded.uid;
        emailFromAuth = decoded.email ?? null;
      } catch {
        // ignore invalid token -> anonymous flow
      }
    }

    // 2) Fetch user profile from Firestore
    let fullName = '';
    let address = '';
    let cityStateZip = '';
    let phone = '';
    let email = emailFromAuth ?? '';

    if (uid) {
      const snap = await adminDb.collection('users').doc(uid).get();
      if (snap.exists) {
        const data = snap.data() as any;
        fullName = data?.fullName ?? '';
        address = data?.address ?? '';
        cityStateZip = data?.cityStateZip ?? '';
        phone = data?.phone ?? '';
        email = data?.email ?? email;
      }
    }

    // Normalize the phone for the header we inject
    const phoneForHeader = phone ? formatUSPhone(phone) : '';

    // 3) Build header block for the letter
    const headerBlock = [
     fullName,
     address,
     cityStateZip,
     email,
     phoneForHeader,
     formatToday(),
     '',
     '', // space before body
    ]
    .filter((line) => line && line.trim() !== '')
    .join('\n');




    // 4) Prompt with header injected
    const prompt = `
    You are a cover letter generator. Your task is to create write a professional and personalized cover letter, tailored to the job description and resume below and concise cover letters.
To compose a compelling cover letter, you must scrutinise the job description for key qualifications. 
Begin with a succinct introduction about the candidate's identity and career goals. 
Highlight skills aligned with the job, underpinned by tangible examples. 
Incorporate details about the company, emphasising its mission or unique aspects that align with the candidate's values. 
Conclude by reaffirming the candidate's suitability, inviting further discussion. 
Use job-specific terminology for a tailored and impactful letter, maintaining a professional style suitable for a job role mentioned in jobdescription. Please provide your response in strictly under 300 words.
Use the header block provided exactly at the top. Header Block (place as-is, do not add labels):

${headerBlock}

Job Description:
${jobDescription}

Resume:
${resumeText}

Requirements:
- Formal, concise tone
- Clearly map the candidate's skills/experience to the job
- Assume the header block is correct; do not include placeholder fields
- End with a professional closing and the candidate's name
`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 800,
    });

    const rawLetter = completion.choices[0]?.message?.content ?? '';

    // 5) Post‑process the entire output to normalize any phone numbers
    const coverLetter = normalizePhonesInText(rawLetter);

    // Saving letters to Firestore
    let letterId: string | null = null;
    if (uid) {
      const doc = await adminDb
        .collection('users')
        .doc(uid)
        .collection('letters')
        .add({
          coverLetter,
          resumeText,
          jobDescription,
          headerBlock,
          model: 'gpt-4o',
          createdAt: admin.firestore.FieldValue.serverTimestamp(), // ✅ correct way
        });

      letterId = doc.id;
    }
    return NextResponse.json({ coverLetter, usedHeader: headerBlock, letterId });
  } catch (error: any) {
    console.error('❌ Error in /api/generate:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to generate cover letter' },
      { status: 500 }
    );
  }
}
