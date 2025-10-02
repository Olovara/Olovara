import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { updateWebsite, getWebsiteDetails, getSellerByUserId } from '@/lib/queries'
import { PublishWebsiteSchema } from '@/types/websiteBuilder'

export async function POST(
  request: NextRequest,
  { params }: { params: { websiteId: string } }
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
    const validatedData = PublishWebsiteSchema.parse(body)

    // Verify the website belongs to the seller
    const website = await getWebsiteDetails(params.websiteId)
    if (!website || website.sellerId !== seller.id) {
      return NextResponse.json({ error: 'Website not found' }, { status: 404 })
    }

    const updatedWebsite = await updateWebsite(params.websiteId, validatedData)
    
    return NextResponse.json({ website: updatedWebsite })
  } catch (error) {
    console.error('Error publishing website:', error)
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
