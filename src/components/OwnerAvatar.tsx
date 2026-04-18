import React from "react";

interface OwnerAvatarProps {
  size?: string;
  bordered?: boolean;
  url?: string;
}

export const OwnerAvatar = ({ size = "w-8 h-8", bordered = true, url }: OwnerAvatarProps) => (
  <div className={`relative shrink-0 ${size}`}>
    <div className={`w-full h-full rounded-full overflow-hidden shrink-0 shadow-lg ${bordered ? 'border-2 border-amber-500' : 'border border-slate-800'}`}>
      <img 
        src={url || "/logo.jpg"} 
        onError={(e) => {
          (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&h=200&auto=format&fit=crop";
        }}
        alt="Founder" 
        className="w-full h-full object-cover grayscale-[20%] hover:grayscale-0 transition-all duration-500"
        referrerPolicy="no-referrer"
      />
    </div>
    {bordered && (
      <div className="absolute -top-1 -right-1 bg-amber-500 text-slate-950 text-[6px] font-black px-1 rounded-full border border-slate-950 animate-pulse">
        #1
      </div>
    )}
  </div>
);
