import Image from 'next/image';
import { cn } from '@/lib/utils';

type LogoLoaderProps = {
  className?: string;
  label?: string;
};

export function LogoLoader({
  className,
  label = 'Preparando sua experiência',
}: LogoLoaderProps) {
  return (
    <div
      className={cn('flex flex-col items-center justify-center gap-6 text-center', className)}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div className="logo-loader" aria-hidden="true">
        <Image
          alt=""
          className="logo-loader__base"
          fill
          priority
          sizes="(max-width: 640px) 192px, 240px"
          src="/regula-send.svg"
        />

        <div className="logo-loader__fill">
          <Image
            alt=""
            fill
            priority
            sizes="(max-width: 640px) 192px, 240px"
            src="/regula-send.svg"
          />
        </div>

        <span className="logo-loader__wave" />
      </div>

      <div className="space-y-1.5">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">Isso deve levar apenas alguns instantes.</p>
      </div>
    </div>
  );
}
