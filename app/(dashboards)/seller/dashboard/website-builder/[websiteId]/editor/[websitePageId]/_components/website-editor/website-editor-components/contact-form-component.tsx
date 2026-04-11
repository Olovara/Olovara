'use client'
import SellerWebsiteContactForm from '@/components/forms/SellerWebsiteContactForm'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/use-toast'
import { EditorBtns } from '@/lib/constants'
import { getWebsiteDetails } from '@/lib/queries'
// TODO: Implement contact form functionality for OLOVARA
// import {
//   getWebsite,
//   saveActivityLogsNotification,
//   upsertContact,
// } from '@/lib/queries'

// Contact form schema for website builder
const ContactUserFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  message: z.string().min(1, 'Message is required'),
})
import { EditorElement, useEditor } from '@/providers/editor/editor-provider'
import clsx from 'clsx'
import { Trash } from 'lucide-react'
import { useRouter } from 'next/navigation'

import React from 'react'
import { z } from 'zod'

type Props = {
  element: EditorElement
}

const ContactFormComponent = (props: Props) => {
  const { dispatch, state, sellerId, websiteId, pageDetails } = useEditor()
  const router = useRouter()

  const handleDragStart = (e: React.DragEvent, type: EditorBtns) => {
    if (type === null) return
    e.dataTransfer.setData('componentType', type)
  }

  const handleOnClickBody = (e: React.MouseEvent) => {
    e.stopPropagation()
    dispatch({
      type: 'CHANGE_CLICKED_ELEMENT',
      payload: {
        elementDetails: props.element,
      },
    })
  }

  const styles = props.element.styles

  const goToNextPage = async () => {
    if (!state.editor.liveMode) return
    const websitePages = await getWebsiteDetails(websiteId)
    if (!websitePages || !pageDetails) return
    if (websitePages.pages.length > pageDetails.order + 1) {
      const nextPage = websitePages.pages.find(
        (page) => page.order === pageDetails.order + 1
      )
      if (!nextPage) return
      router.replace(
        `${process.env.NEXT_PUBLIC_SCHEME}${websitePages.subDomainName}.${process.env.NEXT_PUBLIC_DOMAIN}/${nextPage.pathName}`
      )
    }
  }

  const handleDeleteElement = () => {
    dispatch({
      type: 'DELETE_ELEMENT',
      payload: { elementDetails: props.element },
    })
  }

  const onFormSubmit = async (
    values: z.infer<typeof ContactUserFormSchema>
  ) => {
    if (!state.editor.liveMode) return

    try {
      // TODO: Implement contact form submission for OLOVARA
      console.log('Contact form submitted:', values)
      toast({
        title: 'Success',
        description: 'Successfully Saved your info',
      })
      await goToNextPage()
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Failed',
        description: 'Could not save your information',
      })
    }
  }

  return (
    <div
      style={styles}
      draggable
      onDragStart={(e) => handleDragStart(e, 'contactForm')}
      onClick={handleOnClickBody}
      className={clsx(
        'p-[2px] w-full m-[5px] relative text-[16px] transition-all flex items-center justify-center',
        {
          '!border-blue-500':
            state.editor.selectedElement.id === props.element.id,

          '!border-solid': state.editor.selectedElement.id === props.element.id,
          'border-dashed border-[1px] border-slate-300': !state.editor.liveMode,
        }
      )}
    >
      {state.editor.selectedElement.id === props.element.id &&
        !state.editor.liveMode && (
          <Badge className="absolute -top-[23px] -left-[1px] rounded-none rounded-t-lg ">
            {state.editor.selectedElement.name}
          </Badge>
        )}
      <SellerWebsiteContactForm
        subTitle="Contact Us"
        title="Want a free quote? We can help you"
        apiCall={onFormSubmit}
      />
      {state.editor.selectedElement.id === props.element.id &&
        !state.editor.liveMode && (
          <div className="absolute bg-primary px-2.5 py-1 text-xs font-bold  -top-[25px] -right-[1px] rounded-none rounded-t-lg !text-white">
            <Trash
              className="cursor-pointer"
              size={16}
              onClick={handleDeleteElement}
            />
          </div>
        )}
    </div>
  )
}

export default ContactFormComponent
