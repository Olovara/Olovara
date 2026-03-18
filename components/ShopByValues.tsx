"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { shopValuesExtended } from "@/data/shop-values";

export function ShopByValues() {
  // Track which value is currently featured in the card
  const [currentIndex, setCurrentIndex] = useState(0);
  // Track animation key to force re-animation
  const [animationKey, setAnimationKey] = useState(0);
  // Track previous index for smooth transition
  const [prevIndex, setPrevIndex] = useState(0);
  // Track if we're transitioning (fading out)
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Cycle through values every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      // Store previous index and start transition
      setPrevIndex(currentIndex);
      setIsTransitioning(true);

      // After old card finishes sliding up and fading out, show new card
      setTimeout(() => {
        const nextIndex = (currentIndex + 1) % shopValuesExtended.length;
        setCurrentIndex(nextIndex);
        setAnimationKey((prev) => prev + 1);
        setIsTransitioning(false);
      }, 1500); // Wait for old card animation to complete (1.5s)
    }, 5000); // 5 seconds

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, [currentIndex]);

  // Get the currently featured value
  const featuredValue = shopValuesExtended[currentIndex];
  const FeaturedIcon = featuredValue.icon;

  return (
    // Full-bleed background even inside a max-width parent
    <section className="relative left-1/2 right-1/2 w-screen -ml-[50vw] -mr-[50vw] bg-brand-primary-50">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2 text-brand-dark-neutral-900">
            Shop by Your Values
          </h2>
          <p className="text-brand-dark-neutral-600">
            Support businesses that align with what matters to you
          </p>
        </div>

        {/* Chips display - all values shown as badges */}
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          {shopValuesExtended.map((value) => (
            <Link
              key={value.id}
              href={`/shops?values=${value.id}`}
              className="transition-transform hover:scale-105"
            >
              <Badge
                variant="outline"
                className="px-4 py-2 text-sm cursor-pointer border-brand-dark-neutral-200 bg-brand-light-neutral-50 text-brand-dark-neutral-900 hover:bg-brand-primary-700 hover:text-white hover:border-brand-primary-700 transition-colors"
              >
                {value.name}
              </Badge>
            </Link>
          ))}
        </div>

        {/* Featured card - cycles through values */}
        <div className="flex justify-center relative min-h-[300px]">
          {/* Previous card - sliding up and fading out */}
          {isTransitioning && (
            <div className="absolute w-full max-w-md">
              <Link href={`/shops?values=${shopValuesExtended[prevIndex].id}`} className="group pointer-events-none">
                <div className="bg-brand-light-neutral-50 rounded-lg shadow-sm border border-brand-dark-neutral-200 p-6 flex flex-col items-center text-center animate-slide-up-and-fade-out">
                  <div className="w-16 h-16 rounded-full bg-brand-primary-50 flex items-center justify-center mb-4">
                    {(() => {
                      const PrevIcon = shopValuesExtended[prevIndex].icon;
                      return <PrevIcon className="w-8 h-8 text-brand-primary-700" />;
                    })()}
                  </div>
                  <h3 className="font-semibold text-xl mb-2">{shopValuesExtended[prevIndex].name}</h3>
                  <p className="text-brand-dark-neutral-600 text-sm mb-4">
                    {shopValuesExtended[prevIndex].description}
                  </p>
                  <Button
                    variant="ghost"
                    className="mt-auto hover:bg-brand-primary-50 hover:text-brand-primary-700"
                  >
                    Shop {shopValuesExtended[prevIndex].name}
                  </Button>
                </div>
              </Link>
            </div>
          )}

          {/* Current card - sliding up from bottom and fading in */}
          {!isTransitioning && (
            <div
              key={animationKey}
              className="w-full max-w-md"
            >
              <Link href={`/shops?values=${featuredValue.id}`} className="group">
                <div className="bg-brand-light-neutral-50 rounded-lg shadow-sm border border-brand-dark-neutral-200 p-6 hover:shadow-md transition-all duration-300 flex flex-col items-center text-center animate-slide-up-from-bottom">
                  <div className="w-16 h-16 rounded-full bg-brand-primary-50 flex items-center justify-center mb-4 group-hover:bg-brand-primary-100 transition-colors">
                    <FeaturedIcon className="w-8 h-8 text-brand-primary-700" />
                  </div>
                  <h3 className="font-semibold text-xl mb-2">{featuredValue.name}</h3>
                  <p className="text-brand-dark-neutral-600 text-sm mb-4">
                    {featuredValue.description}
                  </p>
                  <Button
                    variant="ghost"
                    className="mt-auto hover:bg-brand-primary-50 hover:text-brand-primary-700"
                  >
                    Shop {featuredValue.name}
                  </Button>
                </div>
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
} 