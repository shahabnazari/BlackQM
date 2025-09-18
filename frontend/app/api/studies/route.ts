import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const studyData = await request.json();
    
    // Here you would normally save to database
    // For now, we'll simulate a successful save
    console.log('Creating study with data:', studyData);
    
    // Simulate database save with generated ID
    const newStudy = {
      id: Math.random().toString(36).substring(2, 15),
      ...studyData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'draft',
    };
    
    // In production, you would save to database here
    // await prisma.study.create({ data: studyData });
    
    return NextResponse.json(newStudy, { status: 201 });
  } catch (error: any) {
    console.error('Error creating study:', error);
    return NextResponse.json(
      { error: 'Failed to create study' },
      { status: 500 }
    );
  }
}

export async function GET(_request: NextRequest) {
  try {
    // Here you would fetch studies from database
    // For now, return empty array
    const studies: any[] = [];
    
    return NextResponse.json(studies);
  } catch (error: any) {
    console.error('Error fetching studies:', error);
    return NextResponse.json(
      { error: 'Failed to fetch studies' },
      { status: 500 }
    );
  }
}