import { SellerWebsiteContactSchema } from '@/schemas/SellerWebsiteContactSchema'
import { zodResolver } from '@hookform/resolvers/zod'
import React from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import Spinner from '../spinner'

type Props = {
  title: string
  subTitle: string
  apiCall: (values: z.infer<typeof SellerWebsiteContactSchema>) => any
}

const SellerWebsiteContactForm = ({ apiCall, subTitle, title }: Props) => {
  const form = useForm<z.infer<typeof SellerWebsiteContactSchema>>({
    mode: 'onChange',
    resolver: zodResolver(SellerWebsiteContactSchema),
    defaultValues: {
      name: '',
      email: '',
      message: '',
    },
  })
  const isLoading = form.formState.isLoading

  //CHALLENGE: We want to create tags for each leads that comes from the form
  
  return (
    <Card className="max-w-[500px] w-[500px]">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{subTitle}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(apiCall)}
            className="flex flex-col gap-4"
          >
            <FormField
              disabled={isLoading}
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Name"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              disabled={isLoading}
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="Email"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              className="mt-4"
              disabled={isLoading}
              type="submit"
            >
              {form.formState.isSubmitting ? <Spinner /> : 'Get a free quote!'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

export default SellerWebsiteContactForm
