import { useAnimals } from "@/hooks/use-animals";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimalCard } from "@/components/animal-card";
import { Button } from "@/components/ui/button";
import { Activity, PawPrint, AlertTriangle, ArrowRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function Dashboard() {
  const { data: animals, isLoading } = useAnimals();

  if (isLoading) {
    return (
      <div className="p-8 space-y-6 animate-pulse">
        <div className="h-10 w-48 bg-muted rounded-md mb-8"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-muted rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  const animalList = animals || [];
  const healthyCount = animalList.filter(a => a.healthStatus.toLowerCase() === "healthy").length;
  const criticalCount = animalList.filter(a => 
    ["injured", "sick"].includes(a.healthStatus.toLowerCase())
  ).length;

  // Sort by recently updated
  const recentAnimals = [...animalList]
    .sort((a, b) => {
      const dateA = a.lastSeenAt ? new Date(a.lastSeenAt).getTime() : 0;
      const dateB = b.lastSeenAt ? new Date(b.lastSeenAt).getTime() : 0;
      return dateB - dateA;
    })
    .slice(0, 3);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground">Overview</h1>
        <p className="text-muted-foreground mt-2">Monitor wildlife status and recent field activities.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover-elevate border-primary/10 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Tracked</CardTitle>
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <PawPrint className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-display font-bold text-foreground">{animalList.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Animals in roster</p>
          </CardContent>
        </Card>

        <Card className="hover-elevate border-emerald-500/20 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Healthy Population</CardTitle>
            <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <Activity className="h-4 w-4 text-emerald-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-display font-bold text-emerald-600 dark:text-emerald-400">{healthyCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Optimal condition</p>
          </CardContent>
        </Card>

        <Card className="hover-elevate border-red-500/20 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Critical Attention</CardTitle>
            <div className="h-8 w-8 rounded-full bg-red-500/10 flex items-center justify-center">
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-display font-bold text-red-600 dark:text-red-400">{criticalCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Sick or injured individuals</p>
          </CardContent>
        </Card>
      </div>

      <div className="pt-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold font-display text-foreground">Recently Sighted</h2>
          <Button variant="ghost" asChild className="hover:text-primary transition-colors">
            <Link href="/animals">
              View All <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
        
        {recentAnimals.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentAnimals.map((animal) => (
              <AnimalCard key={animal.id} animal={animal} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-muted/30 rounded-xl border border-dashed border-border">
            <PawPrint className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-foreground">No records found</h3>
            <p className="text-muted-foreground mt-1">Start tracking animals to see them here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
