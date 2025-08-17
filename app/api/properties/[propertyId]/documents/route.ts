import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import { propertyDocuments } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { WalrusStorage } from '@/lib/walrus';

// GET /api/properties/[propertyId]/documents - Get all documents for a property
export async function GET(
  request: NextRequest,
  { params }: { params: { propertyId: string } }
) {
  try {
    const { propertyId } = params;
    const { db } = getConnection();

    const documents = await db
      .select({
        id: propertyDocuments.id,
        fileName: propertyDocuments.fileName,
        fileType: propertyDocuments.fileType,
        mimeType: propertyDocuments.mimeType,
        fileSize: propertyDocuments.fileSize,
        walrusHash: propertyDocuments.walrusHash,
        description: propertyDocuments.description,
        uploadedAt: propertyDocuments.createdAt,
      })
      .from(propertyDocuments)
      .where(eq(propertyDocuments.propertyId, propertyId))
      .orderBy(propertyDocuments.createdAt);

    // Transform documents to include Walrus URLs
    const documentsWithUrls = documents.map(doc => ({
      ...doc,
      walrusUrl: `https://aggregator.walrus-testnet.walrus.space/v1/${doc.walrusHash}`
    }));

    return NextResponse.json({
      success: true,
      documents: documentsWithUrls
    });
  } catch (error) {
    console.error('Error fetching property documents:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}

// POST /api/properties/[propertyId]/documents - Upload documents for a property
export async function POST(
  request: NextRequest,
  { params }: { params: { propertyId: string } }
) {
  try {
    const { propertyId } = params;
    const formData = await request.formData();
    
    const description = formData.get('description') as string;
    const files = formData.getAll('documents') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No files provided' },
        { status: 400 }
      );
    }

    const { db } = getConnection();
    const walrusStorage = new WalrusStorage();
    const uploadedDocuments = [];

    for (const file of files) {
      try {
        // Validate file type
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
        if (!allowedTypes.includes(file.type)) {
          console.warn(`Skipping file ${file.name} - invalid type: ${file.type}`);
          continue;
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          console.warn(`Skipping file ${file.name} - too large: ${file.size} bytes`);
          continue;
        }

        // Store document in Walrus
        const walrusHash = await walrusStorage.storeDocument(file);

        // Save document metadata to database
        const newDocument = await db
          .insert(propertyDocuments)
          .values({
            propertyId,
            fileName: file.name,
            fileType: file.type,
            mimeType: file.type,
            fileSize: file.size,
            walrusHash,
            description,
            isPublic: false,
          })
          .returning();

        uploadedDocuments.push(newDocument[0]);
      } catch (fileError) {
        console.error(`Error processing file ${file.name}:`, fileError);
        // Continue with other files even if one fails
      }
    }

    return NextResponse.json({
      success: true,
      uploadedCount: uploadedDocuments.length,
      documents: uploadedDocuments,
      message: `Successfully uploaded ${uploadedDocuments.length} document(s)`
    });
  } catch (error) {
    console.error('Error uploading property documents:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload documents' },
      { status: 500 }
    );
  }
}
