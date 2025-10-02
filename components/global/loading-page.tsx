import React from 'react'
import Spinner from '../spinner'

const LoadingPage = () => {
  return (
    <div className="h-full w-full flex justify-center items-center">
      <Spinner/>
    </div>
  )
}

export default LoadingPage
