import { notFound } from 'next/navigation';

export async function GET(
  request: Request,
  { params }: { params: { slug: string[] } }
) {
  // Handle malformed URLs like /$ or other invalid paths
  const slug = params.slug;
  
  // If the slug contains invalid characters or is just "$", return 404
  if (slug.length === 1 && slug[0] === '$') {
    notFound();
  }
  
  // For any other catch-all routes, return 404
  notFound();
} 