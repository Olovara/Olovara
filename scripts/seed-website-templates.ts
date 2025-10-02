import { db } from '../lib/db'
import { EditorElement } from '../types/websiteBuilder'
import { v4 } from 'uuid'

// Template 1: Minimal Portfolio
const minimalPortfolioTemplate: EditorElement[] = [
  {
    id: '__body',
    name: 'Body',
    type: '__body',
    styles: { backgroundColor: 'white' },
    content: [
      {
        id: v4(),
        name: 'Hero Section',
        type: 'container',
        styles: {
          backgroundColor: '#f8fafc',
          padding: '80px 20px',
          textAlign: 'center',
        },
        content: [
          {
            id: v4(),
            name: 'Hero Title',
            type: 'text',
            styles: {
              fontSize: '48px',
              fontWeight: 'bold',
              color: '#1e293b',
              marginBottom: '16px',
            },
            content: { innerText: 'Welcome to My Creative Space' }
          },
          {
            id: v4(),
            name: 'Hero Subtitle',
            type: 'text',
            styles: {
              fontSize: '20px',
              color: '#64748b',
              marginBottom: '32px',
            },
            content: { innerText: 'Handcrafted with love and attention to detail' }
          }
        ]
      },
      {
        id: v4(),
        name: 'About Section',
        type: '2Col',
        styles: {
          padding: '60px 20px',
          backgroundColor: 'white',
        },
        content: [
          {
            id: v4(),
            name: 'About Text Column',
            type: 'container',
            styles: { padding: '20px' },
            content: [
              {
                id: v4(),
                name: 'About Title',
                type: 'text',
                styles: {
                  fontSize: '32px',
                  fontWeight: 'bold',
                  color: '#1e293b',
                  marginBottom: '16px',
                },
                content: { innerText: 'About My Craft' }
              },
              {
                id: v4(),
                name: 'About Description',
                type: 'text',
                styles: {
                  fontSize: '16px',
                  color: '#64748b',
                  lineHeight: '1.6',
                },
                content: { innerText: 'I create unique, handmade items that bring joy and beauty to everyday life. Each piece is carefully crafted with sustainable materials and traditional techniques.' }
              }
            ]
          },
          {
            id: v4(),
            name: 'About Image Column',
            type: 'container',
            styles: { padding: '20px' },
            content: [
              {
                id: v4(),
                name: 'About Image',
                type: 'image',
                styles: {
                  width: '100%',
                  height: '300px',
                  objectFit: 'cover',
                  borderRadius: '8px',
                },
                content: { src: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=500' }
              }
            ]
          }
        ]
      },
      {
        id: v4(),
        name: 'Contact Section',
        type: 'container',
        styles: {
          padding: '60px 20px',
          backgroundColor: '#f1f5f9',
          textAlign: 'center',
        },
        content: [
          {
            id: v4(),
            name: 'Contact Title',
            type: 'text',
            styles: {
              fontSize: '32px',
              fontWeight: 'bold',
              color: '#1e293b',
              marginBottom: '32px',
            },
            content: { innerText: 'Get In Touch' }
          },
          {
            id: v4(),
            name: 'Contact Form',
            type: 'contactForm',
            styles: {},
            content: []
          }
        ]
      }
    ]
  }
]

// Template 2: Modern Business
const modernBusinessTemplate: EditorElement[] = [
  {
    id: '__body',
    name: 'Body',
    type: '__body',
    styles: { backgroundColor: 'white' },
    content: [
      {
        id: v4(),
        name: 'Navigation',
        type: 'container',
        styles: {
          backgroundColor: '#1e293b',
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        },
        content: [
          {
            id: v4(),
            name: 'Logo',
            type: 'text',
            styles: {
              fontSize: '24px',
              fontWeight: 'bold',
              color: 'white',
            },
            content: { innerText: 'My Business' }
          },
          {
            id: v4(),
            name: 'Nav Links',
            type: 'container',
            styles: { display: 'flex', gap: '24px' },
            content: [
              {
                id: v4(),
                name: 'Home Link',
                type: 'link',
                styles: { color: 'white', textDecoration: 'none' },
                content: { innerText: 'Home', href: '#' }
              },
              {
                id: v4(),
                name: 'About Link',
                type: 'link',
                styles: { color: 'white', textDecoration: 'none' },
                content: { innerText: 'About', href: '#' }
              },
              {
                id: v4(),
                name: 'Contact Link',
                type: 'link',
                styles: { color: 'white', textDecoration: 'none' },
                content: { innerText: 'Contact', href: '#' }
              }
            ]
          }
        ]
      },
      {
        id: v4(),
        name: 'Hero Section',
        type: 'container',
        styles: {
          backgroundColor: '#3b82f6',
          padding: '100px 20px',
          textAlign: 'center',
          color: 'white',
        },
        content: [
          {
            id: v4(),
            name: 'Hero Title',
            type: 'text',
            styles: {
              fontSize: '56px',
              fontWeight: 'bold',
              marginBottom: '24px',
            },
            content: { innerText: 'Professional Services' }
          },
          {
            id: v4(),
            name: 'Hero Subtitle',
            type: 'text',
            styles: {
              fontSize: '24px',
              marginBottom: '40px',
              opacity: '0.9',
            },
            content: { innerText: 'Delivering excellence in every project' }
          },
          {
            id: v4(),
            name: 'CTA Button',
            type: 'link',
            styles: {
              backgroundColor: 'white',
              color: '#3b82f6',
              padding: '16px 32px',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 'bold',
              display: 'inline-block',
            },
            content: { innerText: 'Get Started', href: '#' }
          }
        ]
      },
      {
        id: v4(),
        name: 'Services Section',
        type: '3Col',
        styles: {
          padding: '80px 20px',
          backgroundColor: 'white',
        },
        content: [
          {
            id: v4(),
            name: 'Service 1',
            type: 'container',
            styles: { padding: '20px', textAlign: 'center' },
            content: [
              {
                id: v4(),
                name: 'Service 1 Title',
                type: 'text',
                styles: {
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: '#1e293b',
                  marginBottom: '16px',
                },
                content: { innerText: 'Consultation' }
              },
              {
                id: v4(),
                name: 'Service 1 Description',
                type: 'text',
                styles: {
                  fontSize: '16px',
                  color: '#64748b',
                  lineHeight: '1.6',
                },
                content: { innerText: 'Expert advice tailored to your specific needs and goals.' }
              }
            ]
          },
          {
            id: v4(),
            name: 'Service 2',
            type: 'container',
            styles: { padding: '20px', textAlign: 'center' },
            content: [
              {
                id: v4(),
                name: 'Service 2 Title',
                type: 'text',
                styles: {
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: '#1e293b',
                  marginBottom: '16px',
                },
                content: { innerText: 'Implementation' }
              },
              {
                id: v4(),
                name: 'Service 2 Description',
                type: 'text',
                styles: {
                  fontSize: '16px',
                  color: '#64748b',
                  lineHeight: '1.6',
                },
                content: { innerText: 'Professional execution with attention to every detail.' }
              }
            ]
          },
          {
            id: v4(),
            name: 'Service 3',
            type: 'container',
            styles: { padding: '20px', textAlign: 'center' },
            content: [
              {
                id: v4(),
                name: 'Service 3 Title',
                type: 'text',
                styles: {
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: '#1e293b',
                  marginBottom: '16px',
                },
                content: { innerText: 'Support' }
              },
              {
                id: v4(),
                name: 'Service 3 Description',
                type: 'text',
                styles: {
                  fontSize: '16px',
                  color: '#64748b',
                  lineHeight: '1.6',
                },
                content: { innerText: 'Ongoing support to ensure your continued success.' }
              }
            ]
          }
        ]
      }
    ]
  }
]

// Template 3: Creative Showcase
const creativeShowcaseTemplate: EditorElement[] = [
  {
    id: '__body',
    name: 'Body',
    type: '__body',
    styles: { backgroundColor: '#fef7ed' },
    content: [
      {
        id: v4(),
        name: 'Hero Section',
        type: 'container',
        styles: {
          backgroundImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '120px 20px',
          textAlign: 'center',
          color: 'white',
        },
        content: [
          {
            id: v4(),
            name: 'Hero Title',
            type: 'text',
            styles: {
              fontSize: '64px',
              fontWeight: 'bold',
              marginBottom: '24px',
              textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
            },
            content: { innerText: 'Creative Vision' }
          },
          {
            id: v4(),
            name: 'Hero Subtitle',
            type: 'text',
            styles: {
              fontSize: '28px',
              marginBottom: '40px',
              opacity: '0.9',
            },
            content: { innerText: 'Where art meets innovation' }
          }
        ]
      },
      {
        id: v4(),
        name: 'Gallery Section',
        type: '2Col',
        styles: {
          padding: '80px 20px',
          backgroundColor: 'white',
        },
        content: [
          {
            id: v4(),
            name: 'Gallery Image 1',
            type: 'container',
            styles: { padding: '10px' },
            content: [
              {
                id: v4(),
                name: 'Image 1',
                type: 'image',
                styles: {
                  width: '100%',
                  height: '400px',
                  objectFit: 'cover',
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                },
                content: { src: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=500' }
              }
            ]
          },
          {
            id: v4(),
            name: 'Gallery Image 2',
            type: 'container',
            styles: { padding: '10px' },
            content: [
              {
                id: v4(),
                name: 'Image 2',
                type: 'image',
                styles: {
                  width: '100%',
                  height: '400px',
                  objectFit: 'cover',
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                },
                content: { src: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=500' }
              }
            ]
          }
        ]
      }
    ]
  }
]

const templates = [
  {
    name: 'Minimal Portfolio',
    description: 'Clean and simple portfolio template perfect for showcasing your work',
    category: 'MINIMAL',
    previewImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400',
    content: JSON.stringify(minimalPortfolioTemplate),
    isPremium: false,
  },
  {
    name: 'Modern Business',
    description: 'Professional business template with navigation and service sections',
    category: 'MODERN',
    previewImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    content: JSON.stringify(modernBusinessTemplate),
    isPremium: false,
  },
  {
    name: 'Creative Showcase',
    description: 'Bold and artistic template for creative professionals',
    category: 'CREATIVE',
    previewImage: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400',
    content: JSON.stringify(creativeShowcaseTemplate),
    isPremium: true,
    price: 2999, // $29.99 in cents
  }
]

async function seedTemplates() {
  try {
    console.log('🌱 Seeding website templates...')

    // Clear existing templates
    await db.websiteTemplate.deleteMany({})

    // Create new templates
    for (const template of templates) {
      await db.websiteTemplate.create({
        data: template
      })
      console.log(`✅ Created template: ${template.name}`)
    }

    console.log('🎉 Template seeding completed!')
  } catch (error) {
    console.error('❌ Error seeding templates:', error)
  } finally {
    await db.$disconnect()
  }
}

// Run the seeder
if (require.main === module) {
  seedTemplates()
}

export { seedTemplates }
