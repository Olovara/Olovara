import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createWebsite, getWebsiteBySellerId, getSellerByUserId } from '@/lib/queries'
import { CreateWebsiteSchema } from '@/types/websiteBuilder'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const seller = await getSellerByUserId(session.user.id)
    if (!seller) {
      return NextResponse.json({ error: 'Seller not found' }, { status: 404 })
    }

    const website = await getWebsiteBySellerId(seller.id)
    
    return NextResponse.json({ website })
  } catch (error) {
    console.error('Error fetching website:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
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
    const validatedData = CreateWebsiteSchema.parse(body)

    // Check if seller already has a website
    const existingWebsite = await getWebsiteBySellerId(seller.id)
    if (existingWebsite) {
      return NextResponse.json({ error: 'Website already exists' }, { status: 400 })
    }

    const website = await createWebsite(seller.id, validatedData)
    
    return NextResponse.json({ website }, { status: 201 })
  } catch (error) {
    console.error('Error creating website:', error)
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
