import { CardBlock } from "../types/BlockTypes";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ExternalLink, ArrowRight } from "lucide-react";
import Link from "next/link";

interface FeatureCardProps {
  block: CardBlock;
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

export function FeatureCard({ block, className }: FeatureCardProps) {
  const IconComponent = block.icon ? iconMap[block.icon] : null;

  // Color variants - only for icons
  const colorVariants = {
    purple: {
      icon: "text-purple-600",
    },
    blue: {
      icon: "text-blue-600",
    },
    green: {
      icon: "text-green-600",
    },
    yellow: {
      icon: "text-yellow-600",
    },
    red: {
      icon: "text-red-600",
    },
    gray: {
      icon: "text-gray-600",
    },
  };

  const colors = colorVariants[block.color || "purple"];

  return (
    <div
      className={cn(
        "border border-gray-200 hover:border-purple-300 rounded-lg p-4 transition-colors",
        className
      )}
    >
      <div className="flex items-start space-x-3">
        {IconComponent && (
          <div className={cn("mt-0.5 flex-shrink-0", colors.icon)}>
            <IconComponent />
          </div>
        )}

        <div className="flex-1">
          <h3 className="font-medium text-gray-900 mb-2">{block.title}</h3>

          <p className="text-sm text-gray-600 mb-3">{block.content}</p>

          {/* Show solution for warning/alert variants */}
          {block.variant === "alert" && block.solution && (
            <p className="text-sm text-purple-600 mt-2">
              <strong>Solution:</strong> {block.solution}
            </p>
          )}

          {block.link && block.link.url && block.link.text && (
            <Link href={block.link.url}>
              <Button
                variant="ghost"
                size="sm"
                className="p-0 h-auto text-sm text-purple-600 hover:text-purple-800"
              >
                {block.link.text}
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
