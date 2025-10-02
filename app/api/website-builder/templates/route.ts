import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { getSellerByUserId } from '@/lib/queries'
import { z } from 'zod'

// Schema for creating templates
const CreateTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required'),
  description: z.string().min(1, 'Description is required'),
  category: z.enum(['MINIMAL', 'MODERN', 'VINTAGE', 'CREATIVE', 'BUSINESS', 'PORTFOLIO']),
  previewImage: z.string().url('Valid preview image URL required'),
  content: z.any(), // EditorElement[] structure
  isPremium: z.boolean().default(false),
  price: z.number().optional(),
})

// GET - Fetch all active templates
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const isPremium = searchParams.get('isPremium')

    const where: any = { isActive: true }
    
    if (category) {
      where.category = category
    }
    
    if (isPremium !== null) {
      where.isPremium = isPremium === 'true'
    }

    const templates = await db.websiteTemplate.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ templates })
  } catch (error) {
    console.error('Error fetching templates:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create new template (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin (you'll need to implement this check)
    // For now, we'll allow any authenticated user to create templates
    // In production, add proper admin role checking

    const body = await request.json()
    const validatedData = CreateTemplateSchema.parse(body)

    const template = await db.websiteTemplate.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        category: validatedData.category,
        previewImage: validatedData.previewImage,
        content: validatedData.content,
        isPremium: validatedData.isPremium,
        price: validatedData.price,
      }
    })

    return NextResponse.json({ template }, { status: 201 })
  } catch (error) {
    console.error('Error creating template:', error)
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
