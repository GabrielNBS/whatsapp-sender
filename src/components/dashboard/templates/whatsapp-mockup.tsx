import { CheckCheck } from "lucide-react";
import Image from "next/image";

interface WhatsAppMockupProps {
  content: string;
  media?: { data: string; mimetype: string } | null;
  footer?: { link: string; cta: string };
  showFooter?: boolean;
}

export function WhatsAppMockup({ content, media, footer, showFooter }: WhatsAppMockupProps) {
  const time = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const formatText = (text: string) => {
    if (!text) return null;
    
    // Basic formatting for bold (*text*) and italics (_text_)
    // Splitting by lines first
    return text.split('\n').map((line, i) => (
      <div key={i} className="min-h-[1.2em]">
        {/* Simple parser for bold *text* */}
        {line.split(/(\*[^*]+\*)/g).map((part, j) => {
            if (part.startsWith('*') && part.endsWith('*')) {
                return <span key={j} className="font-bold">{part.slice(1, -1)}</span>;
            }
            return <span key={j}>{part}</span>;
        })}
      </div>
    ));
  };

  return (
    <div className="w-full bg-[#E5DDD5] rounded-[24px] overflow-hidden relative shadow-xl border border-gray-200 mx-auto font-sans flex flex-col h-[600px]">
        {/* Status Bar Mockup */}
        <div className="bg-[#005e54] h-7 w-full flex items-center justify-between px-4 shrink-0">
            <div className="text-[10px] text-white/90 font-medium font-mono">12:30</div>
            <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-white/20"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-white/20"></div>
            </div>
        </div>

        {/* Chat Header */}
        <div className="bg-[#008069] h-14 w-full flex items-center px-3 gap-3 shadow-md z-10 relative shrink-0">
            <div className="w-9 h-9 rounded-full bg-gray-300 overflow-hidden shrink-0 border border-white/10">
                 <div className="w-full h-full bg-white/20 flex items-center justify-center text-white text-xs font-bold">U</div>
            </div>
            <div className="text-white">
                <div className="text-sm font-semibold leading-tight">Cliente</div>
                <div className="text-[10px] text-white/80">visto por último hoje às {time}</div>
            </div>
        </div>

        {/* Chat Area - Fixed Background */}
        <div className="flex-1 p-3 overflow-y-auto bg-[#efe7dd] relative">
            <div className="absolute inset-0 opacity-[0.06] bg-[url('https://camo.githubusercontent.com/c502b7e52b21711726a8d67568bd1043f110c73229b110bc7539958999813be6/68747470733a2f2f692e70696e696d672e636f6d2f6f726967696e616c732f39372f63302f30662f39376330306661396339616464613239323337353365643261613936633665332e6a7067')] bg-repeat bg-[length:400px_auto] pointer-events-none"></div>

            {/* Date Bubble */}
            <div className="flex justify-center mb-4 relative z-10">
                <div className="bg-[#E1F3FB] text-gray-800 text-[10px] font-medium px-2.5 py-1 rounded-lg shadow-sm">
                    Hoje
                </div>
            </div>

            {/* Message Bubble */}
            <div className="bg-white rounded-lg p-1 shadow-[0_1px_0.5px_rgba(0,0,0,0.13)] max-w-[90%] ml-auto relative group rounded-tr-none z-10">
                {/* Media */}
                {/* Media */}
                {media && (
                    <div className="p-1 pb-1">
                        <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-gray-100">
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
                
                {/* Text Content */}
                <div className="px-2 pt-1 pb-4 text-[14.2px] text-[#111b21] leading-[19px] wrap-break-word whitespace-pre-wrap font-normal">
                    {formatText(content)}
                    {!content && !media && <span className="text-gray-300 italic text-xs">...</span>}

                    {/* Footer Preview inside bubble */}
                    {showFooter && (footer?.cta || footer?.link) && (
                        <div className="mt-2 pt-2 border-t border-dashed border-gray-200 text-[13px] text-gray-500/90 font-light">
                            {footer.cta && <div className="mb-1">{footer.cta}</div>}
                            {footer.link && <div className="text-[#027eb5]">{footer.link}</div>}
                        </div>
                    )}
                </div>

                {/* Metadata */}
                <div className="absolute bottom-1 right-1.5 flex items-end gap-0.5">
                    <span className="text-[10px] text-gray-500/80 leading-none mb-0.5">{time}</span>
                    <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />
                </div>
            </div>
            
            {/* Ghost footer note if toggled but outside bubble? No, inside bubble is better for WhatsApp */}
        </div>
    </div>
  );
}
