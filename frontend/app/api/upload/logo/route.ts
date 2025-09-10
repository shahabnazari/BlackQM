import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir, access } from 'fs/promises';
import { constants } from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    console.log('Logo upload request received');
    const formData = await request.formData();
    const file = formData.get('logo') as File;
    
    if (!file) {
      console.error('No file in formData');
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }
    
    console.log('File received:', file.name, 'Size:', file.size, 'Type:', file.type);

    // Validate file type
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

    // Create uploads directory if it doesn't exist
    // Use different path for production vs development
    const isProduction = process.env.NODE_ENV === 'production';
    
    // Check if we're running from the root or frontend directory
    const cwd = process.cwd();
    const isRunningFromRoot = !cwd.endsWith('frontend');
    
    const basePath = isProduction 
      ? path.join(process.cwd(), '.next', 'static', 'uploads', 'logos')
      : isRunningFromRoot
        ? path.join(process.cwd(), 'frontend', 'public', 'uploads', 'logos')
        : path.join(process.cwd(), 'public', 'uploads', 'logos');
    
    console.log('Upload directory path:', basePath);
    
    try {
      await access(basePath, constants.F_OK);
      console.log('Directory exists');
    } catch {
      console.log('Creating directory...');
      await mkdir(basePath, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = file.name.split('.').pop();
    const filename = `logo_${timestamp}_${randomString}.${extension}`;
    
    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    const filePath = path.join(basePath, filename);
    console.log('Saving file to:', filePath);
    
    await writeFile(filePath, buffer);
    console.log('File saved successfully');
    
    // Return the public URL
    // In production, files might need to be served from a different location
    const publicUrl = isProduction 
      ? `/_next/static/uploads/logos/${filename}`
      : `/uploads/logos/${filename}`;
    
    console.log('Public URL:', publicUrl);
    
    return NextResponse.json({
      url: publicUrl,
      filename: filename,
      size: file.size,
      type: file.type
    });
  } catch (error) {
    console.error('Logo upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload logo' },
      { status: 500 }
    );
  }
}