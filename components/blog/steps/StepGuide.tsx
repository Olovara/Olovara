import { StepBlock } from "../types/BlockTypes";
import { cn } from "@/lib/utils";

interface StepGuideProps {
  block: StepBlock;
  className?: string;
}

// Icon mapping for dynamic icon rendering
const iconMap: Record<string, any> = {
  Truck: () => <Truck className="h-5 w-5" />,
  Globe: () => <Globe className="h-5 w-5" />,
  DollarSign: () => <DollarSign className="h-5 w-5" />,
  Clock: () => <Clock className="h-5 w-5" />,
  Settings: () => <Settings className="h-5 w-5" />,
  AlertCircle: () => <AlertCircle className="h-5 w-5" />,
  CheckCircle: () => <CheckCircle className="h-5 w-5" />,
  Info: () => <Info className="h-5 w-5" />,
  MapPin: () => <MapPin className="h-5 w-5" />,
  Package: () => <Package className="h-5 w-5" />,
  Star: () => <Star className="h-5 w-5" />,
  Heart: () => <Heart className="h-5 w-5" />,
  Shield: () => <Shield className="h-5 w-5" />,
  Zap: () => <Zap className="h-5 w-5" />,
  Target: () => <Target className="h-5 w-5" />,
  TrendingUp: () => <TrendingUp className="h-5 w-5" />,
  Users: () => <Users className="h-5 w-5" />,
  BookOpen: () => <BookOpen className="h-5 w-5" />,
  Lightbulb: () => <Lightbulb className="h-5 w-5" />,
  Award: () => <Award className="h-5 w-5" />,
  Gift: () => <Gift className="h-5 w-5" />,
  ShoppingCart: () => <ShoppingCart className="h-5 w-5" />,
  CreditCard: () => <CreditCard className="h-5 w-5" />,
  Home: () => <Home className="h-5 w-5" />,
  Search: () => <Search className="h-5 w-5" />,
  Filter: () => <Filter className="h-5 w-5" />,
  Grid: () => <Grid className="h-5 w-5" />,
  List: () => <List className="h-5 w-5" />,
};

// Import all icons
import {
  Truck,
  Globe,
  DollarSign,
  Clock,
  Settings,
  AlertCircle,
  CheckCircle,
  Info,
  MapPin,
  Package,
  Star,
  Heart,
  Shield,
  Zap,
  Target,
  TrendingUp,
  Users,
  BookOpen,
  Lightbulb,
  Award,
  Gift,
  ShoppingCart,
  CreditCard,
  Home,
  Search,
  Filter,
  Grid,
  List,
} from "lucide-react";

export function StepGuide({ block, className }: StepGuideProps) {
  const IconComponent = block.icon ? iconMap[block.icon] : null;

  return (
    <div
      className={cn(
        "border border-gray-200 rounded-lg p-6 hover:border-purple-300 transition-colors",
        className
      )}
    >
      <div className="flex items-start space-x-4">
        {/* Step Number */}
        <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-full flex items-center justify-center font-semibold">
          {block.stepNumber}
        </div>

        <div className="flex-1 space-y-4">
          {/* Header */}
          <div>
            <div className="flex items-center space-x-2 mb-2">
              {IconComponent && (
                <div className="text-purple-600">
                  <IconComponent />
                </div>
              )}
              <h3 className="text-xl font-semibold text-gray-900">
                {block.title}
              </h3>
            </div>

            <p className="text-gray-600 mb-2">{block.description}</p>

            {block.estimatedTime && (
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Clock className="h-4 w-4" />
                <span>Estimated time: {block.estimatedTime}</span>
              </div>
            )}
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* What you'll do */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">
                What you&apos;ll do:
              </h4>
              <ul className="space-y-1">
                {block.details.map((detail, detailIndex) => (
                  <li
                    key={detailIndex}
                    className="flex items-start space-x-2 text-sm text-gray-600"
                  >
                    <CheckCircle className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Pro Tips */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Pro Tips:</h4>
              <ul className="space-y-1">
                {block.tips.map((tip, tipIndex) => (
                  <li
                    key={tipIndex}
                    className="flex items-start space-x-2 text-sm text-gray-600"
                  >
                    <AlertCircle className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
