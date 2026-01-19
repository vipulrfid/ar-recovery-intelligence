import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec );

export async function GET() {
  try {
    // Run migrations
    await execAsync('npx prisma migrate deploy');
    
    // Run seed
    await execAsync('npx tsx prisma/seed.ts');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Database setup complete!' 
    });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Setup failed' 
    }, { status: 500 });
  }
}
