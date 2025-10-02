import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { 
  updateWebsitePage, 
  deleteWebsitePage, 
  getWebsitePageDetails,
  getSellerByUserId
} from '@/lib/queries'
import { UpdateWebsitePageSchema } from '@/types/websiteBuilder'

export async function PUT(
  request: NextRequest,
  { params }: { params: { pageId: string } }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const seller = await getSellerByUserId(session.user.id)
    if (!seller) {
      return NextResponse.json({ error: 'Seller not found' }, { status: 404 })
    }

    const body = await request.json()
    const validatedData = UpdateWebsitePageSchema.parse(body)

    // Verify the page belongs to the seller
    const page = await getWebsitePageDetails(params.pageId)
    if (!page || page.website.sellerId !== seller.id) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 })
    }

    const updatedPage = await updateWebsitePage(params.pageId, validatedData)
    
    return NextResponse.json({ page: updatedPage })
  } catch (error) {
    console.error('Error updating page:', error)
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { pageId: string } }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const seller = await getSellerByUserId(session.user.id)
    if (!seller) {
      return NextResponse.json({ error: 'Seller not found' }, { status: 404 })
    }

    // Verify the page belongs to the seller
    const page = await getWebsitePageDetails(params.pageId)
    if (!page || page.website.sellerId !== seller.id) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 })
    }

    await deleteWebsitePage(params.pageId)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting page:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
