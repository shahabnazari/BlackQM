import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File;
    const type = formData.get('type') as string || 'general';
    const maxWidth = parseInt(formData.get('maxWidth') as string || '1200');
    const maxHeight = parseInt(formData.get('maxHeight') as string || '800');
    const quality = parseInt(formData.get('quality') as string || '85');
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload an image file.' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB for processing)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'images', type);
    await mkdir(uploadsDir, { recursive: true });

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const filename = `img_${timestamp}_${randomString}.webp`;
    
    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Process image with sharp
    let processedImage = sharp(buffer);
    
    // Get image metadata
    const metadata = await processedImage.metadata();
    
    // Resize if needed
    if (metadata.width && metadata.height) {
      if (metadata.width > maxWidth || metadata.height > maxHeight) {
        processedImage = processedImage.resize(maxWidth, maxHeight, {
          fit: 'inside',
          withoutEnlargement: true
        });
      }
    }
    
    // Convert to webp for better compression
    processedImage = processedImage.webp({ quality });
    
    // Save processed image
    const processedBuffer = await processedImage.toBuffer();
    const filePath = path.join(uploadsDir, filename);
    await writeFile(filePath, processedBuffer);
    
    // Also save original if requested
    let originalUrl = null;
    if (formData.get('keepOriginal') === 'true') {
      const originalFilename = `orig_${timestamp}_${randomString}.${file.name.split('.').pop()}`;
      const originalPath = path.join(uploadsDir, originalFilename);
      await writeFile(originalPath, buffer);
      originalUrl = `/uploads/images/${type}/${originalFilename}`;
    }
    
    // Return the public URLs
    const publicUrl = `/uploads/images/${type}/${filename}`;
    
    return NextResponse.json({
      url: publicUrl,
      originalUrl,
      filename: filename,
      size: processedBuffer.length,
      originalSize: file.size,
      dimensions: {
        width: metadata.width,
        height: metadata.height
      },
      type: 'image/webp'
    });
  } catch (error: any) {
    console.error('Image upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload and process image' },
      { status: 500 }
    );
  }
}

// Handle base64 image uploads (from image editor)
export async function PUT(request: NextRequest) {
  try {
    const { image, type = 'edited' } = await request.json();
    
    if (!image || !image.startsWith('data:image')) {
      return NextResponse.json(
        { error: 'Invalid image data' },
        { status: 400 }
      );
    }
    
    // Extract base64 data
    const base64Data = image.split(',')[1];
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'images', type);
    await mkdir(uploadsDir, { recursive: true });
    
    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const filename = `edited_${timestamp}_${randomString}.png`;
    
    // Save the image
    const filePath = path.join(uploadsDir, filename);
    await writeFile(filePath, buffer);
    
    // Return the public URL
    const publicUrl = `/uploads/images/${type}/${filename}`;
    
    return NextResponse.json({
      url: publicUrl,
      filename: filename,
      size: buffer.length,
      type: 'image/png'
    });
  } catch (error: any) {
    console.error('Image save error:', error);
    return NextResponse.json(
      { error: 'Failed to save edited image' },
      { status: 500 }
    );
  }
}