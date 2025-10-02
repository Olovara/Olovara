# Website Builder Blocks

This document describes the new website builder blocks that have been added to make it easier for users to build professional-looking websites without being technical.

## Available Blocks

### 1. Navbar Block
A navigation bar with shop branding and essential e-commerce buttons.

**Features:**
- Editable shop name
- Wishlist button (toggleable)
- Cart button (toggleable) 
- Account button (toggleable)
- Responsive design
- Clean, modern styling

**Usage:**
- Drag the navbar block from the "Blocks" section
- Click on the shop name to edit it
- The buttons are automatically styled and functional

### 2. Hero Section Block
A prominent banner section perfect for showcasing your main message.

**Features:**
- Editable heading text
- Editable subheading text
- Editable call-to-action button text
- Background color or image support
- Responsive typography
- Centered layout

**Usage:**
- Drag the hero block from the "Blocks" section
- Click on any text to edit it
- The background can be customized through the element properties

### 3. Products Block
A product showcase section with a 4-column grid layout.

**Features:**
- Editable section title
- 4-column responsive grid
- Sample product cards with:
  - Product images
  - Product names
  - Star ratings
  - Prices
  - Add to cart buttons
- Hover effects and animations

**Usage:**
- Drag the products block from the "Blocks" section
- Click on the section title to edit it
- The product data is currently using sample data - this would be connected to your actual product database

### 4. Footer Block
A comprehensive footer with multiple columns and links.

**Features:**
- Configurable number of columns (default: 3)
- Editable column headers
- Editable link text for each column
- Dark theme styling
- Copyright notice
- Responsive layout

**Usage:**
- Drag the footer block from the "Blocks" section
- Click on column headers to edit them
- Click on link text to edit the links
- Links are currently placeholder URLs - these would be connected to your actual pages

## Technical Implementation

### Block Structure
Each block consists of two main components:

1. **Placeholder Component** - The draggable element in the components sidebar
2. **Render Component** - The actual block that appears on the page

### Data Structure
Blocks store their content in the `element.content` object with the following structure:

```typescript
// Navbar
{
  shopName: string,
  showWishlist: boolean,
  showCart: boolean,
  showAccount: boolean
}

// Hero
{
  heading: string,
  subheading: string,
  ctaText: string,
  ctaLink: string,
  backgroundType: 'color' | 'image',
  backgroundColor: string,
  backgroundImage: string
}

// Products
{
  title: string
}

// Footer
{
  columns: Array<{
    header: string,
    links: Array<{
      text: string,
      url: string
    }>
  }>
}
```

### Adding New Blocks

To add a new block:

1. Add the block type to `EditorBtns` in `lib/constants.ts`
2. Create a placeholder component in `components-tab/`
3. Create a render component in `website-editor-components/`
4. Add the block to the elements array in `components-tab/index.tsx`
5. Add the case to the switch statement in `recursive.tsx`

## Customization

All blocks are designed to be easily customizable:

- **Text Content**: Click on any text to edit it inline
- **Styling**: Use the element properties panel to modify colors, spacing, etc.
- **Layout**: Blocks are responsive and adapt to different screen sizes
- **Functionality**: Buttons and links can be connected to your actual functionality

## Best Practices

1. **Start with Blocks**: Use the pre-built blocks as a foundation for your website
2. **Customize Content**: Edit the text content to match your brand
3. **Add Your Own Elements**: Combine blocks with individual elements (text, images, etc.)
4. **Test Responsiveness**: Check how your blocks look on different devices
5. **Connect Real Data**: Replace sample data with your actual product information

## Future Enhancements

Potential improvements for these blocks:

- **Navbar**: Add logo upload, menu items, search functionality
- **Hero**: Add video backgrounds, multiple CTA buttons, animation options
- **Products**: Connect to real product data, add filtering, pagination
- **Footer**: Add social media links, newsletter signup, contact information

These blocks provide a solid foundation for building professional e-commerce websites while maintaining the flexibility to customize and extend as needed.
