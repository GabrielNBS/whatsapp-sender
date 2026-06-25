import { useEffect, useState, useRef } from 'react';
import { useAppStore } from '@/lib/store';
import { User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AvatarDisplayProps {
  phone?: string;
  name: string;
  className?: string; // For customized sizing/styling
  showFallbackIcon?: boolean; // If true, shows a user icon instead of initials on error/empty
}

export function AvatarDisplay({ phone, name, className, showFallbackIcon = false }: AvatarDisplayProps) {
  const { avatars, fetchAvatar } = useAppStore();
  const [imgError, setImgError] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLDivElement | HTMLImageElement>(null);
  
  // Normalized phone
  const normalizedPhone = phone?.replace(/\D/g, '') || '';
  const avatarUrl = normalizedPhone ? avatars[normalizedPhone] : null;

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '50px' } // Pre-load slightly before entering viewport
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (
      isVisible && 
      normalizedPhone && 
      normalizedPhone.length >= 10 && 
      avatars[normalizedPhone] === undefined
    ) {
      fetchAvatar(normalizedPhone);
    }
  }, [isVisible, normalizedPhone, avatars, fetchAvatar]);

  const initials = name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  if (avatarUrl && !imgError) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        ref={elementRef as React.RefObject<HTMLImageElement>}
        src={avatarUrl}
        alt={name}
        className={cn("rounded-full object-cover bg-muted shrink-0", className || "w-8 h-8")}
        onError={() => setImgError(true)}
      />
    );
  }

  // Fallback
  return (
    <div 
      ref={elementRef as React.RefObject<HTMLDivElement>} 
      className={cn("rounded-full bg-muted flex items-center justify-center text-muted-foreground font-medium text-xs shrink-0", className || "w-8 h-8")}
    >
      {showFallbackIcon ? <User className="w-1/2 h-1/2" /> : initials}
    </div>
  );
}
