'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'

const Footer = () => {
  const pathname = usePathname()
  const pathsToMinimize = [
    '/verify-email',
    '/sign-up',
    '/sign-in',
  ]

  return (
    <footer className='bg-white flex-grow-0'>
      <div className='border-t border-gray-200'>
        {pathsToMinimize.includes(pathname) ? null : (
          <div className='pb-8 pt-16'>
            <div className='flex justify-center'>
              <p>Yarnnu</p>
            </div>
          </div>
        )}

        {pathsToMinimize.includes(pathname) ? null : (
          <div>
            <div className='relative flex items-center px-6 py-6 sm:py-8 lg:mt-0'>
              <div className='absolute inset-0 overflow-hidden rounded-lg'>
                <div
                  aria-hidden='true'
                  className='absolute bg-purple-50 inset-0 bg-gradient-to-br bg-opacity-90'
                />
              </div>

              <div className='text-center relative mx-auto max-w-sm'>
                <h3 className='font-semibold text-gray-900'>
                  Become a seller
                </h3>
                <p className='mt-2 text-sm text-muted-foreground'>
                  If you&apos;d like to sell high-quality
                  digital products, you can do so in
                  minutes.{' '}
                  <Link
                    href='/seller-application'
                    className='whitespace-nowrap font-medium text-black hover:text-zinc-900'>
                    Get started &rarr;
                  </Link>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className='py-10 md:flex md:items-center md:justify-center'>
        {/* Centered Copyright */}
        <div className='text-center'>
          <p className='text-sm text-muted-foreground'>
            &copy; {new Date().getFullYear()} All Rights Reserved
          </p>

          {/* Links below the copyright */}
          <div className='mt-4 flex justify-center space-x-8'>
            <Link
              href='/terms-of-service'
              className='text-sm text-muted-foreground hover:text-gray-600'>
              Terms
            </Link>
            <Link
              href='/privacy-policy'
              className='text-sm text-muted-foreground hover:text-gray-600'>
              Privacy Policy
            </Link>
            <Link
              href='/handmade-guidelines'
              className='text-sm text-muted-foreground hover:text-gray-600'>
              Handmade Guidelines
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
