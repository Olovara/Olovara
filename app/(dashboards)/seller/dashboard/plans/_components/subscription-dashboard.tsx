'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, Crown, Zap, ExternalLink } from 'lucide-react'
import { SellerSubscriptionWithPlan, SubscriptionPlanWithFeatures } from '@/types/websiteBuilder'
import Link from 'next/link'

interface SubscriptionDashboardProps {
  currentSubscription: SellerSubscriptionWithPlan | null
  availablePlans: SubscriptionPlanWithFeatures[]
  sellerId: string
}

export default function SubscriptionDashboard({ 
  currentSubscription, 
  availablePlans,
  sellerId 
}: SubscriptionDashboardProps) {
  const [isUpgrading, setIsUpgrading] = useState(false)

  const handleUpgrade = async (planId: string) => {
    setIsUpgrading(true)
    try {
      // This would integrate with your Stripe checkout
      // For now, we'll redirect to a checkout page
      window.location.href = `/seller/dashboard/subscription/checkout?plan=${planId}`
    } catch (error) {
      console.error('Error upgrading subscription:', error)
    } finally {
      setIsUpgrading(false)
    }
  }

  const getPlanFeatures = (planName: string) => {
    switch (planName) {
      case 'STARTER':
        return [
          'Up to 10 products',
          'Basic shop features',
          'Standard commission rates',
          'Email support'
        ]
      case 'MAKER':
        return [
          'Up to 100 products',
          'Advanced shop features',
          'Reduced commission rates',
          'Priority support',
          'Analytics dashboard'
        ]
      case 'STUDIO':
        return [
          'Unlimited products',
          'All shop features',
          'Lowest commission rates',
          'Priority support',
          'Advanced analytics',
          'Website builder',
          'Custom domain support',
          'White-label options'
        ]
      default:
        return []
    }
  }

  const formatPrice = (priceInCents: number) => {
    return (priceInCents / 100).toFixed(2)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-500'
      case 'TRIALING':
        return 'bg-blue-500'
      case 'PAST_DUE':
        return 'bg-yellow-500'
      case 'CANCELLED':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  return (
    <div className="space-y-6">
      {/* Current Subscription Status */}
      {currentSubscription ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  Current Plan: {currentSubscription.plan.displayName}
                  <Badge className={getStatusColor(currentSubscription.status)}>
                    {currentSubscription.status}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  ${formatPrice(currentSubscription.plan.price)}/month
                </CardDescription>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">
                  Next billing: {new Date(currentSubscription.currentPeriodEnd).toLocaleDateString()}
                </p>
                {currentSubscription.trialEndsAt && (
                  <p className="text-sm text-blue-600">
                    Trial ends: {new Date(currentSubscription.trialEndsAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Link href="/seller/dashboard/subscription/billing">
                <Button variant="outline">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Manage Billing
                </Button>
              </Link>
              {currentSubscription.plan.name !== 'STUDIO' && (
                <Link href="/seller/dashboard/subscription/upgrade">
                  <Button>
                    Upgrade Plan
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No Active Subscription</CardTitle>
            <CardDescription>
              Choose a plan to unlock Yarnnu features
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Available Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {availablePlans.map((plan) => {
          const isCurrentPlan = currentSubscription?.planId === plan.id
          const isUpgrade = currentSubscription && plan.price > currentSubscription.plan.price
          const isDowngrade = currentSubscription && plan.price < currentSubscription.plan.price
          const hasWebsiteBuilder = plan.websiteBuilder

          return (
            <Card 
              key={plan.id} 
              className={`relative ${
                hasWebsiteBuilder 
                  ? 'border-purple-500 shadow-lg' 
                  : plan.name === 'MAKER' 
                    ? 'border-blue-500 shadow-lg' 
                    : ''
              }`}
            >
              {hasWebsiteBuilder && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-purple-500 text-white">
                    <Crown className="w-3 h-3 mr-1" />
                    Website Builder
                  </Badge>
                </div>
              )}
              {plan.name === 'MAKER' && !hasWebsiteBuilder && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-blue-500 text-white">
                    <Zap className="w-3 h-3 mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center">
                <CardTitle className="text-xl">{plan.displayName}</CardTitle>
                <div className="text-3xl font-bold">
                  ${formatPrice(plan.price)}
                  <span className="text-sm font-normal text-muted-foreground">/month</span>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {getPlanFeatures(plan.name).map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                
                <div className="pt-4">
                  {isCurrentPlan ? (
                    <Button className="w-full" disabled>
                      Current Plan
                    </Button>
                  ) : (
                    <Button 
                      className="w-full" 
                      variant={hasWebsiteBuilder ? "default" : plan.name === 'MAKER' ? "default" : "outline"}
                      onClick={() => handleUpgrade(plan.id)}
                      disabled={isUpgrading}
                    >
                      {isUpgrading ? 'Processing...' : 
                       isUpgrade ? 'Upgrade' : 
                       isDowngrade ? 'Downgrade' : 
                       'Get Started'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Website Builder Access Info */}
      {currentSubscription && !currentSubscription.plan.websiteBuilder && (
        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Crown className="w-6 h-6 text-purple-600" />
              <div>
                <h3 className="font-semibold text-purple-900">Unlock Website Builder</h3>
                <p className="text-sm text-purple-700">
                  Upgrade to Studio to access the website builder and create your custom website.
                </p>
              </div>
              <Link href="/seller/dashboard/subscription/upgrade?plan=studio">
                <Button className="ml-auto">
                  Upgrade to Studio
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
