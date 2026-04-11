import { Website, WebsitePage, SubscriptionPlan, SellerSubscription, WebsiteTemplate, Prisma } from '@prisma/client'
import { z } from 'zod'

// Editor Types (adapted from the existing funnel builder)
export type EditorBtns =
  | 'text'
  | 'container'
  | 'section'
  | 'contactForm'
  | 'paymentForm'
  | 'link'
  | '2Col'
  | 'video'
  | '__body'
  | 'image'
  | 'productShowcase'
  | 'productGrid'
  | 'aboutSection'
  | 'heroSection'
  | null
  | '3Col'

export type DeviceTypes = 'Desktop' | 'Mobile' | 'Tablet'

export type EditorElement = {
  id: string
  styles: React.CSSProperties
  name: string
  type: EditorBtns
  content: EditorElement[] | { 
    href?: string
    innerText?: string
    src?: string
    productIds?: string[] // For product showcase components
    category?: string // For product grid components
    maxProducts?: number // For product grid components
  }
}

export type Editor = {
  liveMode: boolean
  elements: EditorElement[]
  selectedElement: EditorElement
  device: DeviceTypes
  previewMode: boolean
  websitePageId: string
}

export type HistoryState = {
  history: Editor[]
  currentIndex: number
}

export type EditorState = {
  editor: Editor
  history: HistoryState
}

// Website Builder Types
export type WebsiteWithPages = Website & {
  pages: WebsitePage[]
}

export type WebsitePageWithWebsite = WebsitePage & {
  website: Website
}

export type SellerWithWebsiteAndSubscription = {
  id: string
  userId: string
  shopName: string
  website: WebsiteWithPages | null
  subscription: SellerSubscriptionWithPlan | null
}

export type SellerSubscriptionWithPlan = SellerSubscription & {
  plan: SubscriptionPlan
}

// Subscription Types
export type SubscriptionPlanWithFeatures = SubscriptionPlan & {
  features: string[]
}

// Template Types
export type WebsiteTemplateWithContent = WebsiteTemplate & {
  content: EditorElement[]
}

// Form Schemas
export const CreateWebsiteSchema = z.object({
  name: z.string().min(1, 'Website name is required'),
  description: z.string().optional(),
  theme: z.string().optional(),
})

export const CreateWebsitePageSchema = z.object({
  name: z.string().min(1, 'Page name is required'),
  pathName: z.string().optional(),
  isHomepage: z.boolean().default(false),
  content: z.string().optional(),
})

export const UpdateWebsitePageSchema = z.object({
  name: z.string().min(1).optional(),
  pathName: z.string().optional(),
  content: z.string().optional(),
  isPublished: z.boolean().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
})

export const PublishWebsiteSchema = z.object({
  published: z.boolean(),
  subDomainName: z.string().optional(),
  customDomain: z.string().optional(),
})

// Editor Actions (adapted from existing funnel builder)
export type EditorAction =
  | {
      type: 'ADD_ELEMENT'
      payload: {
        containerId: string
        elementDetails: EditorElement
      }
    }
  | {
      type: 'UPDATE_ELEMENT'
      payload: {
        elementDetails: EditorElement
      }
    }
  | {
      type: 'DELETE_ELEMENT'
      payload: {
        elementDetails: EditorElement
      }
    }
  | {
      type: 'CHANGE_CLICKED_ELEMENT'
      payload: {
        elementDetails?:
          | EditorElement
          | {
              id: ''
              content: []
              name: ''
              styles: {}
              type: null
            }
      }
    }
  | {
      type: 'CHANGE_DEVICE'
      payload: {
        device: DeviceTypes
      }
    }
  | {
      type: 'TOGGLE_PREVIEW_MODE'
    }
  | {
      type: 'TOGGLE_LIVE_MODE'
      payload?: {
        value: boolean
      }
    }
  | { type: 'REDO' }
  | { type: 'UNDO' }
  | {
      type: 'LOAD_DATA'
      payload: {
        elements: EditorElement[]
        withLive: boolean
      }
    }
  | {
      type: 'SET_WEBSITE_PAGE_ID'
      payload: {
        websitePageId: string
      }
    }

// Default styles for editor elements
export const defaultStyles: React.CSSProperties = {
  backgroundPosition: 'center',
  objectFit: 'cover',
  backgroundRepeat: 'no-repeat',
  textAlign: 'left',
  opacity: '100%',
}

// Website Builder Component Props
export type WebsiteBuilderProps = {
  sellerId: string
  websiteId?: string
  pageId?: string
}

export type WebsiteEditorProps = {
  websitePageId: string
  liveMode?: boolean
}

export type WebsitePreviewProps = {
  website: WebsiteWithPages
  page?: WebsitePage
}

// Subscription Plan Features for OLOVARA
export const SUBSCRIPTION_FEATURES = {
  STARTER: [
    'Marketplace access',
    '10% commission fee',
    'Custom orders',
    'Basic analytics'
  ],
  MAKER: [
    'Everything in Starter plus',
    '8% commission fee instead of 10%',
    'Advanced analytics',
    'SEO assistance',
    'Basic CRM',
    'Digital product stamping + licensing options'
  ],
  STUDIO: [
    'Everything in Maker plus',
    'Website builder',
    'Email marketing',
    'Priority search placement',
    'Team access',
    'Advanced integration',
    'Advanced CRM',
    'Material forecasting',
    'Profit and expenses tracking'
  ]
} as const

// Website Builder Access (only available in Studio plan)
export const WEBSITE_BUILDER_ACCESS = {
  STARTER: false,
  MAKER: false,
  STUDIO: true
} as const

// Website Builder Limits (only for Studio plan)
export const WEBSITE_BUILDER_LIMITS = {
  maxPages: null, // unlimited for Studio
  customDomain: true,
  analytics: true,
  templates: 'all'
} as const

// Media Types (placeholder for future implementation)
// TODO: Implement media types for OLOVARA
// export type GetMediaFiles = Prisma.PromiseReturnType<typeof getMedia>
// export type CreateMediaType = Prisma.MediaCreateWithoutSubaccountInput