import { useEffect, useState } from 'react';
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
  
  // Normalized phone
  const normalizedPhone = phone?.replace(/\D/g, '') || '';
  const avatarUrl = normalizedPhone ? avatars[normalizedPhone] : null;

  useEffect(() => {
    if (normalizedPhone && avatars[normalizedPhone] === undefined) {
      fetchAvatar(normalizedPhone);
    }
  }, [normalizedPhone, avatars, fetchAvatar]);

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
        src={avatarUrl}
        alt={name}
        className={cn("rounded-full object-cover bg-muted", className || "w-8 h-8")}
        onError={() => setImgError(true)}
      />
    );
  }

  // Fallback
  return (
    <div className={cn("rounded-full bg-muted flex items-center justify-center text-muted-foreground font-medium text-xs", className || "w-8 h-8")}>
      {showFallbackIcon ? <User className="w-1/2 h-1/2" /> : initials}
    </div>
  );
}
