'use client'
import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Check, Crown } from 'lucide-react'
import Image from 'next/image'
import { toast } from 'sonner'

interface WebsiteTemplate {
  id: string
  name: string
  description: string
  category: string
  previewImage: string
  isPremium: boolean
  price?: number
}

interface TemplateSelectorProps {
  websiteId: string
  onTemplateApplied?: () => void
}

export default function TemplateSelector({ websiteId, onTemplateApplied }: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<WebsiteTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [applyingTemplate, setApplyingTemplate] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const categories = [
    { value: 'all', label: 'All Templates' },
    { value: 'MINIMAL', label: 'Minimal' },
    { value: 'MODERN', label: 'Modern' },
    { value: 'VINTAGE', label: 'Vintage' },
    { value: 'CREATIVE', label: 'Creative' },
    { value: 'BUSINESS', label: 'Business' },
    { value: 'PORTFOLIO', label: 'Portfolio' },
  ]

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory)
      }
      
      const response = await fetch(`/api/website-builder/templates?${params}`)
      if (!response.ok) throw new Error('Failed to fetch templates')
      
      const data = await response.json()
      setTemplates(data.templates)
    } catch (error) {
      console.error('Error fetching templates:', error)
      toast.error('Failed to load templates')
    } finally {
      setLoading(false)
    }
  }, [selectedCategory])

  useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])

  const applyTemplate = async (templateId: string) => {
    try {
      setApplyingTemplate(templateId)
      
      const response = await fetch(`/api/website-builder/templates/${templateId}/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to apply template')
      }

      toast.success('Template applied successfully!')
      onTemplateApplied?.()
    } catch (error) {
      console.error('Error applying template:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to apply template')
    } finally {
      setApplyingTemplate(null)
    }
  }

  const formatPrice = (priceInCents: number) => {
    return `$${(priceInCents / 100).toFixed(2)}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading templates...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <Button
            key={category.value}
            variant={selectedCategory === category.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(category.value)}
          >
            {category.label}
          </Button>
        ))}
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <Card key={template.id} className="relative overflow-hidden">
            {template.isPremium && (
              <div className="absolute top-2 right-2 z-10">
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                  <Crown className="h-3 w-3 mr-1" />
                  Premium
                </Badge>
              </div>
            )}
            
            <div className="aspect-video bg-gray-100 relative">
              <Image
                src={template.previewImage}
                alt={template.name}
                width={400}
                height={225}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = 'https://via.placeholder.com/400x225?text=Template+Preview'
                }}
              />
            </div>
            
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <Badge variant="outline" className="mt-1">
                    {template.category}
                  </Badge>
                </div>
                {template.isPremium && template.price && (
                  <div className="text-right">
                    <div className="text-lg font-bold text-yellow-600">
                      {formatPrice(template.price)}
                    </div>
                  </div>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              <CardDescription className="mb-4">
                {template.description}
              </CardDescription>
              
              <Button
                onClick={() => applyTemplate(template.id)}
                disabled={applyingTemplate === template.id}
                className="w-full"
                variant={template.isPremium ? 'outline' : 'default'}
              >
                {applyingTemplate === template.id ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Applying...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    {template.isPremium ? 'Purchase & Apply' : 'Apply Template'}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {templates.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No templates found for the selected category.</p>
        </div>
      )}
    </div>
  )
}
