import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

// Type definitions
interface Stimulus {
  id: string;
  surveyId: string;
  type: 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT';
  content: string;
  thumbnail?: string;
  metadata?: {
    duration?: number;
    wordCount?: number;
    dimensions?: { width: number; height: number };
    fileSize?: number;
    mimeType?: string;
  };
  position?: number;
  category?: string;
  tags?: string[];
  uploadStatus: 'pending' | 'processing' | 'complete' | 'failed';
  uploadedBy?: string;
  virusScanStatus: 'pending' | 'clean' | 'infected';
  virusScanDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Mock database for stimuli (replace with Prisma later)
const stimuliDatabase = new Map<string, Stimulus[]>();

// GET /api/studies/[id]/stimuli - Get all stimuli for a study
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const studyId = params.id;
    const stimuli = stimuliDatabase.get(studyId) || [];
    
    return NextResponse.json({
      success: true,
      data: stimuli,
      count: stimuli.length
    });
  } catch (error) {
    console.error('Error fetching stimuli:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stimuli' },
      { status: 500 }
    );
  }
}

// POST /api/studies/[id]/stimuli - Upload a new stimulus
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const studyId = params.id;
    const formData = await request.formData();
    
    // Check if it's a text stimulus or file upload
    const type = formData.get('type') as string;
    
    if (type === 'TEXT') {
      // Handle text stimulus
      const content = formData.get('content') as string;
      const stimulus = await createTextStimulus(studyId, content);
      
      // Add to database
      const studyStimuli = stimuliDatabase.get(studyId) || [];
      studyStimuli.push(stimulus);
      stimuliDatabase.set(studyId, studyStimuli);
      
      return NextResponse.json({
        success: true,
        data: stimulus,
        message: 'Text stimulus created successfully'
      });
    } else {
      // Handle file upload
      const file = formData.get('file') as File;
      
      if (!file) {
        return NextResponse.json(
          { success: false, error: 'No file provided' },
          { status: 400 }
        );
      }
      
      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json(
          { success: false, error: 'File size exceeds 10MB limit' },
          { status: 400 }
        );
      }
      
      // Validate file type
      const validTypes = ['image/', 'video/', 'audio/', 'application/pdf'];
      const isValidType = validTypes.some(t => file.type.startsWith(t));
      
      if (!isValidType) {
        return NextResponse.json(
          { success: false, error: 'Invalid file type' },
          { status: 400 }
        );
      }
      
      // Process and save file
      const stimulus = await processFileUpload(studyId, file);
      
      // Add to database
      const studyStimuli = stimuliDatabase.get(studyId) || [];
      studyStimuli.push(stimulus);
      stimuliDatabase.set(studyId, studyStimuli);
      
      // In production, trigger virus scan
      // await triggerVirusScan(stimulus.id, stimulus.content);
      
      // Emit WebSocket event for real-time progress
      // emitUploadProgress(studyId, stimulus.id, 100);
      
      return NextResponse.json({
        success: true,
        data: stimulus,
        message: 'File uploaded successfully'
      });
    }
  } catch (error) {
    console.error('Error uploading stimulus:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload stimulus' },
      { status: 500 }
    );
  }
}

// PUT /api/studies/[id]/stimuli/[stimulusId] - Update a stimulus
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const studyId = params.id;
    const body = await request.json();
    const { stimulusId, ...updates } = body;
    
    const studyStimuli = stimuliDatabase.get(studyId) || [];
    const stimulusIndex = studyStimuli.findIndex(s => s.id === stimulusId);
    
    if (stimulusIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Stimulus not found' },
        { status: 404 }
      );
    }
    
    // Update stimulus
    studyStimuli[stimulusIndex] = {
      ...studyStimuli[stimulusIndex],
      ...updates,
      updatedAt: new Date()
    };
    
    stimuliDatabase.set(studyId, studyStimuli);
    
    return NextResponse.json({
      success: true,
      data: studyStimuli[stimulusIndex],
      message: 'Stimulus updated successfully'
    });
  } catch (error) {
    console.error('Error updating stimulus:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update stimulus' },
      { status: 500 }
    );
  }
}

// DELETE /api/studies/[id]/stimuli/[stimulusId] - Delete a stimulus
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const studyId = params.id;
    const { searchParams } = new URL(request.url);
    const stimulusId = searchParams.get('stimulusId');
    
    if (!stimulusId) {
      return NextResponse.json(
        { success: false, error: 'Stimulus ID required' },
        { status: 400 }
      );
    }
    
    const studyStimuli = stimuliDatabase.get(studyId) || [];
    const filteredStimuli = studyStimuli.filter(s => s.id !== stimulusId);
    
    if (filteredStimuli.length === studyStimuli.length) {
      return NextResponse.json(
        { success: false, error: 'Stimulus not found' },
        { status: 404 }
      );
    }
    
    stimuliDatabase.set(studyId, filteredStimuli);
    
    return NextResponse.json({
      success: true,
      message: 'Stimulus deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting stimulus:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete stimulus' },
      { status: 500 }
    );
  }
}

// Helper function to create text stimulus
async function createTextStimulus(studyId: string, content: string): Promise<Stimulus> {
  const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;
  
  return {
    id: crypto.randomUUID(),
    surveyId: studyId,
    type: 'TEXT',
    content,
    metadata: {
      wordCount
    },
    uploadStatus: 'complete',
    virusScanStatus: 'clean', // Text doesn't need virus scanning
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

// Helper function to process file upload
async function processFileUpload(studyId: string, file: File): Promise<Stimulus> {
  // Generate unique filename
  const fileExt = path.extname(file.name);
  const fileName = `${crypto.randomUUID()}${fileExt}`;
  
  // Create upload directory if it doesn't exist
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'stimuli', studyId);
  await mkdir(uploadDir, { recursive: true });
  
  // Save file
  const filePath = path.join(uploadDir, fileName);
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  await writeFile(filePath, buffer);
  
  // Generate public URL
  const publicUrl = `/uploads/stimuli/${studyId}/${fileName}`;
  
  // Determine stimulus type from MIME type
  let stimulusType: Stimulus['type'] = 'DOCUMENT';
  if (file.type.startsWith('image/')) stimulusType = 'IMAGE';
  else if (file.type.startsWith('video/')) stimulusType = 'VIDEO';
  else if (file.type.startsWith('audio/')) stimulusType = 'AUDIO';
  
  // Create thumbnail for images and videos (in production)
  let thumbnail: string | undefined;
  if (stimulusType === 'IMAGE') {
    thumbnail = publicUrl; // Use same URL for now
    // In production: thumbnail = await generateThumbnail(filePath);
  }
  
  // Get dimensions for images (in production)
  let dimensions: { width: number; height: number } | undefined;
  if (stimulusType === 'IMAGE') {
    // In production: dimensions = await getImageDimensions(filePath);
    dimensions = { width: 800, height: 600 }; // Mock dimensions
  }
  
  return {
    id: crypto.randomUUID(),
    surveyId: studyId,
    type: stimulusType,
    content: publicUrl,
    thumbnail,
    metadata: {
      fileSize: file.size,
      mimeType: file.type,
      dimensions
    },
    uploadStatus: 'complete',
    virusScanStatus: 'pending', // Will be updated after scan
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

// Chunked upload support for large files
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const studyId = params.id;
    const formData = await request.formData();
    
    const chunkIndex = parseInt(formData.get('chunkIndex') as string);
    const totalChunks = parseInt(formData.get('totalChunks') as string);
    const fileId = formData.get('fileId') as string;
    const chunk = formData.get('chunk') as File;
    
    // Store chunk (in production, use proper chunk storage)
    const chunkKey = `${studyId}_${fileId}_${chunkIndex}`;
    // await storeChunk(chunkKey, chunk);
    
    // Check if all chunks received
    if (chunkIndex === totalChunks - 1) {
      // Reassemble file
      // const completeFile = await reassembleFile(studyId, fileId, totalChunks);
      // const stimulus = await processFileUpload(studyId, completeFile);
      
      return NextResponse.json({
        success: true,
        complete: true,
        message: 'Upload complete'
      });
    }
    
    // Return progress
    const progress = ((chunkIndex + 1) / totalChunks) * 100;
    
    return NextResponse.json({
      success: true,
      complete: false,
      progress,
      message: `Chunk ${chunkIndex + 1}/${totalChunks} received`
    });
  } catch (error) {
    console.error('Error processing chunk:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process chunk' },
      { status: 500 }
    );
  }
}