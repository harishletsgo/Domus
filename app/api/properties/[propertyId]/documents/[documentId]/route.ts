import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import { propertyDocuments } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';

// DELETE /api/properties/[propertyId]/documents/[documentId] - Delete a specific document
export async function DELETE(
  request: NextRequest,
  { params }: { params: { propertyId: string; documentId: string } }
) {
  try {
    const { propertyId, documentId } = params;
    const { db } = getConnection();

    // First, check if document exists and belongs to the property
    const existingDocument = await db
      .select()
      .from(propertyDocuments)
      .where(
        and(
          eq(propertyDocuments.id, documentId),
          eq(propertyDocuments.propertyId, propertyId)
        )
      )
      .limit(1);

    if (existingDocument.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      );
    }

    // Delete the document from database
    await db
      .delete(propertyDocuments)
      .where(eq(propertyDocuments.id, documentId));

    // Note: We're not deleting from Walrus as it's immutable storage
    // The document will remain in Walrus but won't be accessible through our app

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting property document:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete document' },
      { status: 500 }
    );
  }
}
