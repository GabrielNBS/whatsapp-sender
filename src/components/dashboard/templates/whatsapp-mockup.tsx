'use client';

import Image from "next/image";

interface WhatsAppMockupProps {
  content: string;
  media?: { data: string; mimetype: string } | null;
  footer?: { link: string; cta: string };
  showFooter?: boolean;
}

export function WhatsAppMockup({ content, media, footer, showFooter = false }: WhatsAppMockupProps) {
  const time = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const formatText = (text: string) => {
    if (!text) return null;
    return text.split('\n').map((line, i) => (
      <div key={i} className="min-h-[1.15em]">
        {line.split(/(\*[^*]+\*)/g).map((part, j) => {
          if (part.startsWith('*') && part.endsWith('*')) {
            return <span key={j} className="font-semibold">{part.slice(1, -1)}</span>;
          }
          return <span key={j}>{part}</span>;
        })}
      </div>
    ));
  };

  // Build the full display content including footer
  const displayContent = showFooter && footer && (footer.cta || footer.link)
    ? `${content}\n\n${footer.cta}\n${footer.link}`.trim()
    : content;

  return (
    <div className="relative w-full max-w-[300px] mx-auto">
      {/* Phone Frame */}
      <div className="relative bg-black rounded-[2.5rem] p-[8px] shadow-[0_25px_60px_-12px_rgba(0,0,0,0.35)]">
        {/* Inner screen bezel glow */}
        <div className="absolute inset-[6px] rounded-[2.2rem] ring-1 ring-white/[0.08] pointer-events-none z-50" />

        {/* Screen */}
        <div className="relative rounded-[2.2rem] overflow-hidden bg-white flex flex-col" style={{ aspectRatio: '9/19.5' }}>

          {/* === iOS Status Bar === */}
          <div className="h-[44px] bg-[#075E54] flex items-end justify-between px-6 pb-1 shrink-0 relative z-20">
            {/* Time */}
            <span className="text-white text-[14px] font-semibold leading-none w-10">{time}</span>
            
            {/* Notch / Dynamic Island */}
            <div className="absolute left-1/2 -translate-x-1/2 top-[6px] w-[80px] h-[24px] bg-black rounded-full" />

            {/* Status icons */}
            <div className="flex items-center gap-[5px] w-10 justify-end">
              {/* Signal */}
              <svg width="15" height="11" viewBox="0 0 15 11" fill="none">
                <rect x="0" y="7" width="2.5" height="4" rx="0.5" fill="white"/>
                <rect x="4" y="5" width="2.5" height="6" rx="0.5" fill="white"/>
                <rect x="8" y="2.5" width="2.5" height="8.5" rx="0.5" fill="white"/>
                <rect x="12" y="0" width="2.5" height="11" rx="0.5" fill="white"/>
              </svg>
              {/* Wifi */}
              <svg width="13" height="10" viewBox="0 0 13 10" fill="none">
                <path d="M6.5 9.5a1 1 0 100-2 1 1 0 000 2z" fill="white"/>
                <path d="M3.8 6.8a3.8 3.8 0 015.4 0" stroke="white" strokeWidth="1.3" strokeLinecap="round"/>
                <path d="M1.5 4.3a7 7 0 0110 0" stroke="white" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
              {/* Battery */}
              <svg width="22" height="10" viewBox="0 0 22 10" fill="none">
                <rect x="0.5" y="0.5" width="18" height="9" rx="2" stroke="white" strokeOpacity="0.5"/>
                <rect x="1.5" y="1.5" width="14" height="7" rx="1" fill="white"/>
                <path d="M20 3.5v3a1.5 1.5 0 000-3z" fill="white" fillOpacity="0.5"/>
              </svg>
            </div>
          </div>

          {/* === WhatsApp Chat Header === */}
          <div className="h-[52px] bg-[#075E54] flex items-center px-2 gap-2 shrink-0 relative z-10">
            {/* Back arrow */}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="shrink-0 opacity-90">
              <path d="M15 19l-7-7 7-7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            
            {/* Avatar */}
            <div className="w-[34px] h-[34px] rounded-full bg-[#DFE5E7] overflow-hidden shrink-0 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="#AEBAC1" strokeWidth="1.8"/>
                <circle cx="12" cy="7" r="4" stroke="#AEBAC1" strokeWidth="1.8"/>
              </svg>
            </div>

            {/* Contact Info */}
            <div className="flex-1 min-w-0">
              <div className="text-white text-[15px] font-medium leading-tight truncate">Cliente</div>
              <div className="text-white/60 text-[11px] leading-tight">online</div>
            </div>
            
            {/* Action icons */}
            <div className="flex items-center gap-4 pr-1">
              {/* Video */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="opacity-90">
                <path d="M15.6 10.7L20 8v8l-4.4-2.7M3 8.2c0-1.12 0-1.68.218-2.108a2 2 0 01.874-.874C4.52 5 5.08 5 6.2 5h6.6c1.12 0 1.68 0 2.108.218a2 2 0 01.874.874C16 6.52 16 7.08 16 8.2v7.6c0 1.12 0 1.68-.218 2.108a2 2 0 01-.874.874C14.48 19 13.92 19 12.8 19H6.2c-1.12 0-1.68 0-2.108-.218a2 2 0 01-.874-.874C3 17.48 3 16.92 3 15.8V8.2z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {/* Phone */}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="opacity-90">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" stroke="white" strokeWidth="1.5"/>
              </svg>
              {/* More */}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="opacity-90">
                <circle cx="12" cy="5" r="1.5" fill="white"/>
                <circle cx="12" cy="12" r="1.5" fill="white"/>
                <circle cx="12" cy="19" r="1.5" fill="white"/>
              </svg>
            </div>
          </div>

          {/* === Chat Area === */}
          <div className="flex-1 relative overflow-y-auto" style={{ backgroundColor: '#ECE5DD' }}>
            {/* Doodle wallpaper */}
            <div 
              className="absolute inset-0 pointer-events-none opacity-[0.04]"
              style={{ 
                backgroundImage: `url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')`,
                backgroundSize: '350px auto',
                backgroundRepeat: 'repeat',
              }}
            />

            <div className="relative z-10 p-2.5 flex flex-col gap-1.5">
              {/* Date pill */}
              <div className="flex justify-center my-2">
                <div className="bg-white/80 backdrop-blur-sm text-[#54656F] text-[11px] font-medium px-3 py-1 rounded-md shadow-[0_1px_0.5px_rgba(0,0,0,0.13)]">
                  HOJE
                </div>
              </div>

              {/* === Outgoing Message Bubble === */}
              <div className="flex justify-end">
                <div className="relative max-w-[85%]">
                  {/* Bubble tail */}
                  <div className="absolute -right-[6px] top-0 w-[12px] h-[18px] overflow-hidden">
                    <svg width="12" height="18" viewBox="0 0 12 18" className="block">
                      <path d="M0 0H2C2 0 10 3 12 18V0H0Z" fill="#DCF8C6"/>
                    </svg>
                  </div>

                  <div className="bg-[#DCF8C6] rounded-lg rounded-tr-none px-2 py-1 shadow-[0_1px_0.5px_rgba(0,0,0,0.13)]">
                    {/* Media */}
                    {media && (
                      <div className="mb-1 -mx-0.5 -mt-0.5">
                        <div className="relative w-full rounded-md overflow-hidden bg-[#D4ECC3]" style={{ aspectRatio: '4/3' }}>
                          <Image 
                            src={`data:${media.mimetype};base64,${media.data}`} 
                            alt="Media" 
                            fill 
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                      </div>
                    )}
                    
                    {/* Message text */}
                    <div className="text-[13px] text-[#111B21] leading-[19px] whitespace-pre-wrap break-words pr-[52px]" style={{ fontFamily: 'Segoe UI, Helvetica, Arial, sans-serif' }}>
                      {displayContent ? formatText(displayContent) : (
                        <span className="text-[#667781] italic text-[12px]">Sua mensagem aparecerá aqui...</span>
                      )}
                    </div>

                    {/* Timestamp + Read receipt */}
                    <div className="float-right -mt-[14px] -mb-[2px] ml-2 flex items-center gap-0.5 select-none">
                      <span className="text-[10.5px] text-[#667781] leading-none">{time}</span>
                      {/* Blue double check */}
                      <svg width="16" height="10" viewBox="0 0 16 10" fill="none" className="ml-[1px]">
                        <path d="M11.5 1L5.5 7.5L3 5" stroke="#53BDEB" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M14.5 1L8.5 7.5L7.5 6.5" stroke="#53BDEB" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* === Chat Input Bar === */}
          <div className="h-[50px] bg-[#F0F0F0] flex items-center px-2 gap-1.5 shrink-0">
            {/* Emoji */}
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="shrink-0">
              <circle cx="12" cy="12" r="9.5" stroke="#54656F" strokeWidth="1.2"/>
              <path d="M8 14s1.5 2 4 2 4-2 4-2" stroke="#54656F" strokeWidth="1.2" strokeLinecap="round"/>
              <circle cx="9" cy="10" r="1" fill="#54656F"/>
              <circle cx="15" cy="10" r="1" fill="#54656F"/>
            </svg>

            {/* Text input */}
            <div className="flex-1 h-[34px] bg-white rounded-full flex items-center px-3 shadow-[0_0.5px_0.5px_rgba(0,0,0,0.08)]">
              <span className="text-[#667781] text-[14px]">Mensagem</span>
            </div>

            {/* Attachment */}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="shrink-0">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" stroke="#54656F" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>

            {/* Camera */}
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none" className="shrink-0">
              <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" stroke="#54656F" strokeWidth="1.2"/>
              <circle cx="12" cy="13" r="4" stroke="#54656F" strokeWidth="1.2"/>
            </svg>

            {/* Mic */}
            <div className="w-[36px] h-[36px] rounded-full bg-[#00A884] flex items-center justify-center shrink-0 shadow-sm">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <rect x="9" y="1" width="6" height="13" rx="3" stroke="white" strokeWidth="1.8"/>
                <path d="M5 10a7 7 0 0014 0" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
                <path d="M12 17v4M8 21h8" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </div>
          </div>

          {/* Home indicator */}
          <div className="h-[20px] bg-[#F0F0F0] flex items-center justify-center">
            <div className="w-[100px] h-[4px] bg-black/15 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
