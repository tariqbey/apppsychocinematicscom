import psychoCinematicsLogo from "@/assets/psycho-cinematics-logo.png";

export const AppLoader = () => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background">
      {/* Logo with pulse animation */}
      <div className="relative">
        <img 
          src={psychoCinematicsLogo} 
          alt="Psycho-Cinematics" 
          className="h-24 w-auto animate-pulse"
        />
        
        {/* Spinning ring around logo */}
        <div className="absolute inset-0 -m-4">
          <div className="w-full h-full rounded-full border-2 border-transparent border-t-gold border-r-gold/50 animate-spin" 
               style={{ animationDuration: '1.5s' }} 
          />
        </div>
      </div>
      
      {/* Loading text */}
      <p className="mt-8 text-sm text-muted-foreground animate-pulse">
        Preparing your studio...
      </p>
      
      {/* Progress dots */}
      <div className="flex gap-1.5 mt-4">
        <span className="w-2 h-2 rounded-full bg-gold animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-2 h-2 rounded-full bg-gold animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-2 h-2 rounded-full bg-gold animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  );
};