'use client';

import { useState, useRef } from 'react';
import { useAuth } from '@/app/hooks/useAuth'; 
import AuthForm from '../../components/AuthForm';  
import { auth } from '../../lib/firebase'
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default function Home() {
  const { user, loading } = useAuth();

  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [error, setError] = useState('');
  const [generating, setGenerating] = useState(false);


  const letterRef = useRef<HTMLDivElement | null>(null);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center text-white text-xl">
        Loading...
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-500 to-red-500">
        <div className="w-full max-w-lg">
          <AuthForm />
        </div>
      </main>
    );
  }

  // Upload resume and extract text
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setResumeFile(file);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/uploadResume', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Failed to extract resume text');

      const data = await res.json();
      setResumeText(data.text || '');
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    }
  };

  // Generate Cover Letter
  const handleGenerate = async () => {
    setGenerating(true);
    setError('');
    setCoverLetter('');

    try {
      const idToken = await auth.currentUser?.getIdToken(true);

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
        body: JSON.stringify({ resumeText, jobDescription }),
      });

      if (!response.ok) throw new Error(`API error: ${response.status}`);

      const data = await response.json();
      if (data.coverLetter) {
        setCoverLetter(data.coverLetter);
      } else {
        setError('No cover letter returned');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setGenerating(false);
    }
  };

  // Download as PDF
  async function handleDownloadPdf() {
  const el = letterRef.current;
  if (!el) return;

  // Remember prior inline styles so we can restore after capture
  const prevWidth = el.style.width;
  const prevMaxWidth = el.style.maxWidth;
  const prevPadding = el.style.padding;

  // Force A4-friendly width for the snapshot
  el.classList.add('pdf-sheet');

  
  const canvas = await html2canvas(el, {
    scale: 2,             
    useCORS: true,
    backgroundColor: '#ffffff',
    windowWidth: 794,     
  });

  // Restore original styles
  el.classList.remove('pdf-sheet');
  el.style.width = prevWidth;
  el.style.maxWidth = prevMaxWidth;
  el.style.padding = prevPadding;

  const imgData = canvas.toDataURL('image/png');

  // Create A4 PDF in points
  const pdf = new jsPDF('p', 'pt', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();   
  const pageHeight = pdf.internal.pageSize.getHeight(); 

  // Start by fitting image to full page width
  let imgWidth = pageWidth;
  let imgHeight = (canvas.height * imgWidth) / canvas.width;

  // If too tall, scale down to fit page height as well (force single page)
  if (imgHeight > pageHeight) {
    const ratio = pageHeight / imgHeight;
    imgWidth = imgWidth * ratio;
    imgHeight = pageHeight;
  }

  // Center the image
  const x = (pageWidth - imgWidth) / 2;
  const y = (pageHeight - imgHeight) / 2;

  pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight, '', 'FAST');
  pdf.save('cover-letter.pdf');
}

  return (
    <main className="min-h-screen p-10 bg-gradient-to-br from-pink-500 to-red-500 text-white">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-4xl font-bold text-center mb-10">
           Coverly: Upload Resume + Job Description
        </h1>

        <div>
          <label className="block font-semibold mb-2">Upload Resume (PDF)</label>
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileUpload}
            className="text-black w-full bg-white rounded-md p-2"
          />
        </div>

        {resumeText && (
          <div>
            <label className="block font-semibold mt-6 mb-2">Extracted Resume Text</label>
            <textarea
              value={resumeText}
              readOnly
              rows={5}
              className="w-full p-4 rounded-md text-black bg-gray-100"
            />
          </div>
        )}

        <div>
          <label className="block font-semibold mt-6 mb-2">Paste Job Description</label>
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            rows={6}
            placeholder="Paste job description here..."
            className="w-full p-4 rounded-md text-black"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleGenerate}
            disabled={generating || !resumeText || !jobDescription}
            className="bg-white text-red-500 px-6 py-3 mt-2 rounded-md font-bold hover:bg-gray-100 transition disabled:opacity-50"
          >
            {generating ? 'Generating...' : 'Generate Cover Letter'}
          </button>

          <button
            onClick={handleDownloadPdf}
            disabled={!coverLetter}
            className="bg-black/80 text-white px-6 py-3 mt-2 rounded-md font-semibold hover:bg-black transition disabled:opacity-50"
          >
            Download PDF
          </button>
        </div>

        {error && <p className="text-yellow-200 font-semibold">{error}</p>}

        {coverLetter && (
          <div
            ref={letterRef}
            className="mt-10 p-8 bg-white text-black rounded-md font-serif text-lg leading-7"
            style={{ fontFamily: 'Merriweather, Georgia, serif' }} // adjust to your chosen font
          >
            {coverLetter.split('\n').map((line, idx) => (
              <p key={idx} className="mb-2">
                {line}
              </p>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}