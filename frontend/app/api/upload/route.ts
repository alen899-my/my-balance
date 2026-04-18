import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const blob = await put(file.name, file, {
      access: 'public',
      addRandomSuffix: true, // Prevent "blob already exists" errors
    });

    return NextResponse.json(blob);
  } catch (error: any) {
    console.error('Vercel Blob Upload Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
