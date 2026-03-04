import { Link } from "wouter";
import { MapPin, Clock, PawPrint } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { type Animal } from "@shared/schema";

export function getHealthColor(status: string) {
  switch (status.toLowerCase()) {
    case "healthy": return "bg-emerald-500/10 text-emerald-700 border-emerald-200 dark:text-emerald-400 dark:border-emerald-800";
    case "injured": return "bg-red-500/10 text-red-700 border-red-200 dark:text-red-400 dark:border-red-800";
    case "sick": return "bg-orange-500/10 text-orange-700 border-orange-200 dark:text-orange-400 dark:border-orange-800";
    case "monitoring": return "bg-blue-500/10 text-blue-700 border-blue-200 dark:text-blue-400 dark:border-blue-800";
    default: return "bg-slate-500/10 text-slate-700 border-slate-200 dark:text-slate-400 dark:border-slate-800";
  }
}

export function AnimalCard({ animal }: { animal: Animal }) {
  const lastSeen = animal.lastSeenAt ? new Date(animal.lastSeenAt) : null;

  return (
    <Link href={`/animals/${animal.id}`} className="block h-full outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl">
      <Card className="h-full overflow-hidden hover-elevate border-border/60 hover:border-primary/30 transition-all duration-300 bg-card group flex flex-col">
        <div className="relative h-48 w-full overflow-hidden bg-muted">
          {animal.imageUrl ? (
            <img 
              src={animal.imageUrl} 
              alt={animal.name}
              className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full nature-gradient opacity-80 flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
              <PawPrint className="h-16 w-16 text-primary-foreground/30" />
            </div>
          )}
          <div className="absolute top-3 right-3">
            <Badge variant="outline" className={`backdrop-blur-md font-semibold ${getHealthColor(animal.healthStatus)}`}>
              {animal.healthStatus}
            </Badge>
          </div>
        </div>
        
        <CardContent className="p-5 flex-1 flex flex-col">
          <div className="mb-1 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            {animal.species}
          </div>
          <h3 className="font-display text-xl font-bold text-card-foreground mb-1 group-hover:text-primary transition-colors">
            {animal.name}
          </h3>
          <div className="text-sm text-primary font-medium mb-3">
            {animal.count} head
          </div>
          
          <div className="mt-auto space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary/60" />
              <span className="truncate">{animal.location}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary/60" />
              <span>
                {lastSeen ? `Last fed ${formatDistanceToNow(lastSeen, { addSuffix: true })}` : "No feedings logged"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
