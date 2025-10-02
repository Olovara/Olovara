import WebsiteEditor from '@/app/(dashboards)/seller/dashboard/website-builder/[websiteId]/editor/[websitePageId]/_components/website-editor'
import { getDomainContent } from '@/lib/queries'
import EditorProvider from '@/providers/editor/editor-provider'
import { notFound } from 'next/navigation'
import React from 'react'

const Page = async ({
  params,
}: {
  params: { domain: string; path: string }
}) => {
  const domainData = await getDomainContent(params.domain.slice(0, -1))
  const pageData = domainData?.pages.find(
    (page) => page.pathName === params.path
  )

  if (!pageData || !domainData) return notFound()

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
