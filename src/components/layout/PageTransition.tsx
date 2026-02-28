import { ReactNode } from "react";

export function PageTransition({ children, locationKey }: { children: ReactNode; locationKey: string }) {
  return (
    <div key={locationKey} className="animate-slide-up">
      {children}
    </div>
  );
}
