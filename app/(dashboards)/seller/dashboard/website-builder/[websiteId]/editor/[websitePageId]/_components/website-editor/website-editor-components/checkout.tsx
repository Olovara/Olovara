'use client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EditorBtns } from '@/lib/constants'
import { EditorElement, useEditor } from '@/providers/editor/editor-provider'
import clsx from 'clsx'
import { ShoppingCart, Trash } from 'lucide-react'
import React from 'react'

type Props = {
  element: EditorElement
}

const Checkout = (props: Props) => {
  const { dispatch, state } = useEditor()
  const styles = props.element.styles

  const handleDragStart = (e: React.DragEvent, type: EditorBtns) => {
    if (type === null) return
    e.dataTransfer.setData('componentType', type)
  }

  const handleOnClickBody = (e: React.MouseEvent) => {
    e.stopPropagation()
    dispatch({
      type: 'CHANGE_CLICKED_ELEMENT',
      payload: { elementDetails: props.element },
    })
  }

  const handleDeleteElement = () => {
    dispatch({
      type: 'DELETE_ELEMENT',
      payload: { elementDetails: props.element },
    })
  }

  return (
    <div
      style={styles}
      draggable
      onDragStart={(e) => handleDragStart(e, 'paymentForm')}
      onClick={handleOnClickBody}
      className={clsx(
        'p-2 w-full m-[5px] relative text-[16px] transition-all rounded-md',
        {
          '!border-blue-500': state.editor.selectedElement.id === props.element.id,
          '!border-solid': state.editor.selectedElement.id === props.element.id,
          'border-dashed border-[1px] border-slate-300': !state.editor.liveMode,
        }
      )}
    >
      {state.editor.selectedElement.id === props.element.id &&
        !state.editor.liveMode && (
          <Badge className="absolute -left-[1px] -top-[23px] rounded-none rounded-t-lg">
            <Trash
              className="w-4 h-4"
              onClick={handleDeleteElement}
            />
          </Badge>
        )}
      
      <Card className="border-none transition-all">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Checkout
          </CardTitle>
          <CardDescription>
            Payment form for your website
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">Checkout Component</p>
            <p className="text-sm">
              This component will integrate with OLOVARA&apos;s e-commerce system
            </p>
            <p className="text-xs mt-2">
              TODO: Connect to product catalog and Stripe payment processing
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Checkout