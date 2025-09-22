import { NextResponse } from 'next/server';
const pdfParse = require('pdf-parse/lib/pdf-parse'); // ✅ load directly

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      console.error('❌ No file uploaded');
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log('✅ File received');
    console.log('📏 Buffer size:', buffer.length, 'bytes');

    const result = await pdfParse(buffer);

    console.log('📄 PDF Parsed Successfully');
    return NextResponse.json({ text: result.text });

  } catch (error) {
    console.error('❌ Error in /api/uploadResume:', error);
    return NextResponse.json(
      { error: (error as any)?.message || 'Failed to process PDF' },
      { status: 500 }
    );
  }
}
