import { db } from '@/lib/db'
import { getDomainContent } from '@/lib/queries'
import EditorProvider from '@/providers/editor/editor-provider'
import { notFound } from 'next/navigation'
import React from 'react'
import WebsiteEditor from '@/app/(dashboards)/seller/dashboard/website-builder/[websiteId]/editor/[websitePageId]/_components/website-editor'

const Page = async ({ params }: { params: { domain: string } }) => {
  const domainData = await getDomainContent(params.domain.slice(0, -1))
  if (!domainData) return notFound()

  const pageData = domainData.pages.find((page) => !page.pathName)

  if (!pageData) return notFound()

  await db.websitePage.update({
    where: {
      id: pageData.id,
    },
    data: {
      visits: {
        increment: 1,
      },
    },
  })

  return (
    <EditorProvider
      sellerId={domainData.sellerId}
      pageDetails={pageData}
      websiteId={domainData.id}
    >
      <WebsiteEditor
        websitePageId={pageData.id}
        liveMode={true}
      />
    </EditorProvider>
  )
}

export default Page
