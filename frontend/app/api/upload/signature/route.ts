import { mkdir, writeFile } from 'fs/promises';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('signature') as File | null;
    const base64Data = formData.get('base64') as string | null;
    
    let buffer: Buffer;
    let filename: string;
    let mimeType: string;
    
    if (file) {
      // Handle file upload
      const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        return NextResponse.json(
          { error: 'Invalid file type. Please upload an image file.' },
          { status: 400 }
        );
      }

      // Validate file size (max 2MB)
      const maxSize = 2 * 1024 * 1024; // 2MB
      if (file.size > maxSize) {
        return NextResponse.json(
          { error: 'File size too large. Maximum size is 2MB.' },
          { status: 400 }
        );
      }

      const bytes = await file.arrayBuffer();
      buffer = Buffer.from(bytes);
      mimeType = file.type;
      
      const extension = file.name.split('.').pop();
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      filename = `signature_${timestamp}_${randomString}.${extension}`;
      
    } else if (base64Data) {
      // Handle base64 data from canvas drawing
      const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      
      if (!matches || matches.length !== 3) {
        return NextResponse.json(
          { error: 'Invalid base64 data' },
          { status: 400 }
        );
      }
      
      const extractedMimeType = matches[1];
      const base64 = matches[2];
      if (!extractedMimeType || !base64) {
        return NextResponse.json(
          { error: 'Invalid base64 data' },
          { status: 400 }
        );
      }
      mimeType = extractedMimeType;
      buffer = Buffer.from(base64, 'base64');
      
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      filename = `signature_${timestamp}_${randomString}.png`;
      
    } else {
      return NextResponse.json(
        { error: 'No signature data provided' },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'signatures');
    await mkdir(uploadsDir, { recursive: true });
    
    // Save the file
    const filePath = path.join(uploadsDir, filename);
    await writeFile(filePath, buffer);
    
    // Return the public URL
    const publicUrl = `/uploads/signatures/${filename}`;
    
    return NextResponse.json({
      url: publicUrl,
      filename: filename,
      type: mimeType
    });
  } catch (error: any) {
    console.error('Signature upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload signature' },
      { status: 500 }
    );
  }
}