import { AlertBlock } from "../types/BlockTypes";
import { cn } from "@/lib/utils";

interface InfoAlertProps {
  block: AlertBlock;
  className?: string;
}

// Icon mapping for dynamic icon rendering
const iconMap: Record<string, any> = {
  Truck: () => <Truck className="h-4 w-4" />,
  Globe: () => <Globe className="h-4 w-4" />,
  DollarSign: () => <DollarSign className="h-4 w-4" />,
  Clock: () => <Clock className="h-4 w-4" />,
  Settings: () => <Settings className="h-4 w-4" />,
  AlertCircle: () => <AlertCircle className="h-4 w-4" />,
  CheckCircle: () => <CheckCircle className="h-4 w-4" />,
  Info: () => <Info className="h-4 w-4" />,
  MapPin: () => <MapPin className="h-4 w-4" />,
  Package: () => <Package className="h-4 w-4" />,
  Star: () => <Star className="h-4 w-4" />,
  Heart: () => <Heart className="h-4 w-4" />,
  Shield: () => <Shield className="h-4 w-4" />,
  Zap: () => <Zap className="h-4 w-4" />,
  Target: () => <Target className="h-4 w-4" />,
  TrendingUp: () => <TrendingUp className="h-4 w-4" />,
  Users: () => <Users className="h-4 w-4" />,
  BookOpen: () => <BookOpen className="h-4 w-4" />,
  Lightbulb: () => <Lightbulb className="h-4 w-4" />,
  Award: () => <Award className="h-4 w-4" />,
  Gift: () => <Gift className="h-4 w-4" />,
  ShoppingCart: () => <ShoppingCart className="h-4 w-4" />,
  CreditCard: () => <CreditCard className="h-4 w-4" />,
  Home: () => <Home className="h-4 w-4" />,
  Search: () => <Search className="h-4 w-4" />,
  Filter: () => <Filter className="h-4 w-4" />,
  Grid: () => <Grid className="h-4 w-4" />,
  List: () => <List className="h-4 w-4" />,
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
  AlertTriangle,
  XCircle,
} from "lucide-react";

export function InfoAlert({ block, className }: InfoAlertProps) {
  const IconComponent = block.icon ? iconMap[block.icon] : null;

    // Variant styles
  const variantStyles = {
    info: {
      border: "border-blue-200 bg-blue-50",
      icon: "text-blue-600",
      text: "text-blue-800",
      defaultIcon: Info,
    },
    note: {
      border: "border-purple-200 bg-purple-50",
      icon: "text-purple-600",
      text: "text-purple-800",
      defaultIcon: Info,
    },
    warning: {
      border: "border-yellow-200 bg-yellow-50",
      icon: "text-yellow-600",
      text: "text-yellow-800",
      defaultIcon: AlertTriangle,
    },
    success: {
      border: "border-green-200 bg-green-50",
      icon: "text-green-600",
      text: "text-green-800",
      defaultIcon: CheckCircle,
    },
    error: {
      border: "border-red-200 bg-red-50",
      icon: "text-red-600",
      text: "text-red-800",
      defaultIcon: XCircle,
    },
  };

  const styles = variantStyles[block.variant];
  const DefaultIcon = styles.defaultIcon;

  return (
    <div className={cn("border rounded-lg p-4", styles.border, className)}>
      <div className="flex items-start space-x-3">
        <div className={cn("mt-0.5 flex-shrink-0", styles.icon)}>
          {IconComponent ? <IconComponent /> : <DefaultIcon />}
        </div>

        <div className="flex-1">
          {block.title && (
            <h4 className={cn("font-medium mb-1", styles.text)}>
              {block.title}
            </h4>
          )}

          <p className={cn("text-sm", styles.text)}>{block.content}</p>
        </div>
      </div>
    </div>
  );
}
