import { getSocialIcon, SocialIcon } from "@/data/social-icons";

interface SocialIconProps {
  name: string;
  className?: string;
  size?: number;
  color?: string;
}

export function SocialIconComponent({ 
  name, 
  className = "", 
  size = 24,
  color 
}: SocialIconProps) {
  const icon = getSocialIcon(name);
  
  if (!icon) {
    console.warn(`Social icon "${name}" not found`);
    return null;
  }

  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox={icon.viewBox}
      fill={color || "currentColor"}
      aria-label={`${icon.name} icon`}
    >
      <path d={icon.path} />
    </svg>
  );
}

// Convenience components for specific platforms
export function FacebookIcon({ className, size, color }: Omit<SocialIconProps, 'name'>) {
  return <SocialIconComponent name="facebook" className={className} size={size} color={color} />;
}

export function InstagramIcon({ className, size, color }: Omit<SocialIconProps, 'name'>) {
  return <SocialIconComponent name="instagram" className={className} size={size} color={color} />;
}

export function PinterestIcon({ className, size, color }: Omit<SocialIconProps, 'name'>) {
  return <SocialIconComponent name="pinterest" className={className} size={size} color={color} />;
}

export function TikTokIcon({ className, size, color }: Omit<SocialIconProps, 'name'>) {
  return <SocialIconComponent name="tiktok" className={className} size={size} color={color} />;
}

export function RedditIcon({ className, size, color }: Omit<SocialIconProps, 'name'>) {
  return <SocialIconComponent name="reddit" className={className} size={size} color={color} />;
} 