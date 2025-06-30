"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Star, CheckCircle } from "lucide-react";
import { submitOnboardingSurvey } from "@/actions/onboardingSurveyActions";
import { OnboardingSurveyData } from "@/schemas/OnboardingSurveySchema";

interface OnboardingSurveyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const OnboardingSurveyModal: React.FC<OnboardingSurveyModalProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState<Partial<OnboardingSurveyData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if all required fields are filled
    const requiredFields = ['overallExperience', 'clarityOfInstructions', 'difficultyLevel', 'timeToComplete', 'mostChallengingStep', 'wouldRecommend'];
    const missingFields = requiredFields.filter(field => !formData[field as keyof OnboardingSurveyData]);
    
    if (missingFields.length > 0) {
      alert('Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const result = await submitOnboardingSurvey(formData as OnboardingSurveyData);
      
      if (result.success) {
        setIsSubmitted(true);
        // Close modal after 3 seconds
        setTimeout(() => {
          onClose();
          setIsSubmitted(false);
          setFormData({});
        }, 3000);
      } else {
        alert(result.error || 'Failed to submit survey');
      }
    } catch (error) {
      alert('An error occurred while submitting the survey');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof OnboardingSurveyData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (isSubmitted) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              Thank You!
            </DialogTitle>
            <DialogDescription>
              Your feedback has been submitted successfully. We appreciate you taking the time to help us improve our onboarding process!
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Help Us Improve Our Onboarding Process
          </DialogTitle>
          <DialogDescription>
            Congratulations on completing your seller onboarding! We&apos;d love to hear about your experience to help us improve for future sellers.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Overall Experience */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <Label className="text-base font-medium">How would you rate your overall onboarding experience? *</Label>
                <RadioGroup
                  value={formData.overallExperience}
                  onValueChange={(value) => handleInputChange('overallExperience', value)}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="excellent" id="excellent" />
                    <Label htmlFor="excellent">Excellent</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="good" id="good" />
                    <Label htmlFor="good">Good</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="fair" id="fair" />
                    <Label htmlFor="fair">Fair</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="poor" id="poor" />
                    <Label htmlFor="poor">Poor</Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>

          {/* Clarity of Instructions */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <Label className="text-base font-medium">How clear were the instructions throughout the process? *</Label>
                <RadioGroup
                  value={formData.clarityOfInstructions}
                  onValueChange={(value) => handleInputChange('clarityOfInstructions', value)}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="very_clear" id="very_clear" />
                    <Label htmlFor="very_clear">Very Clear</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="clear" id="clear" />
                    <Label htmlFor="clear">Clear</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="somewhat_unclear" id="somewhat_unclear" />
                    <Label htmlFor="somewhat_unclear">Somewhat Unclear</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="very_unclear" id="very_unclear" />
                    <Label htmlFor="very_unclear">Very Unclear</Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>

          {/* Difficulty Level */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <Label className="text-base font-medium">How difficult was the onboarding process? *</Label>
                <RadioGroup
                  value={formData.difficultyLevel}
                  onValueChange={(value) => handleInputChange('difficultyLevel', value)}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="very_easy" id="very_easy" />
                    <Label htmlFor="very_easy">Very Easy</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="easy" id="easy" />
                    <Label htmlFor="easy">Easy</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="moderate" id="moderate" />
                    <Label htmlFor="moderate">Moderate</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="difficult" id="difficult" />
                    <Label htmlFor="difficult">Difficult</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="very_difficult" id="very_difficult" />
                    <Label htmlFor="very_difficult">Very Difficult</Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>

          {/* Time to Complete */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <Label className="text-base font-medium">How long did it take you to complete the onboarding process? *</Label>
                <RadioGroup
                  value={formData.timeToComplete}
                  onValueChange={(value) => handleInputChange('timeToComplete', value)}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="less_than_15_min" id="less_than_15_min" />
                    <Label htmlFor="less_than_15_min">Less than 15 minutes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="15_30_min" id="15_30_min" />
                    <Label htmlFor="15_30_min">15-30 minutes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="30_60_min" id="30_60_min" />
                    <Label htmlFor="30_60_min">30-60 minutes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="1_2_hours" id="1_2_hours" />
                    <Label htmlFor="1_2_hours">1-2 hours</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="more_than_2_hours" id="more_than_2_hours" />
                    <Label htmlFor="more_than_2_hours">More than 2 hours</Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>

          {/* Most Challenging Step */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <Label className="text-base font-medium">Which step was the most challenging? *</Label>
                <RadioGroup
                  value={formData.mostChallengingStep}
                  onValueChange={(value) => handleInputChange('mostChallengingStep', value)}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="application" id="application" />
                    <Label htmlFor="application">Seller Application</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="profile_setup" id="profile_setup" />
                    <Label htmlFor="profile_setup">Profile Setup</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="stripe_connection" id="stripe_connection" />
                    <Label htmlFor="stripe_connection">Stripe Connection</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="shipping_setup" id="shipping_setup" />
                    <Label htmlFor="shipping_setup">Shipping Setup</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="none" id="none" />
                    <Label htmlFor="none">None - All steps were easy</Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>

          {/* Suggestions */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <Label htmlFor="suggestions" className="text-base font-medium">
                  Do you have any suggestions for improving the onboarding process? (Optional)
                </Label>
                <Textarea
                  id="suggestions"
                  placeholder="Share your thoughts on how we can make the onboarding process better..."
                  value={formData.suggestions || ''}
                  onChange={(e) => handleInputChange('suggestions', e.target.value)}
                  maxLength={500}
                  rows={3}
                />
                <p className="text-sm text-muted-foreground">
                  {formData.suggestions?.length || 0}/500 characters
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Would Recommend */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <Label className="text-base font-medium">Would you recommend our platform to other sellers? *</Label>
                <RadioGroup
                  value={formData.wouldRecommend}
                  onValueChange={(value) => handleInputChange('wouldRecommend', value)}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="definitely" id="definitely" />
                    <Label htmlFor="definitely">Definitely</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="probably" id="probably" />
                    <Label htmlFor="probably">Probably</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="maybe" id="maybe" />
                    <Label htmlFor="maybe">Maybe</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="probably_not" id="probably_not" />
                    <Label htmlFor="probably_not">Probably Not</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="definitely_not" id="definitely_not" />
                    <Label htmlFor="definitely_not">Definitely Not</Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Skip
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Feedback"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingSurveyModal; 