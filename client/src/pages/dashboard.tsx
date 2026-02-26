import { useAnimals } from "@/hooks/use-animals";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimalCard } from "@/components/animal-card";
import { Button } from "@/components/ui/button";
import { Activity, PawPrint, AlertTriangle, ArrowRight, CreditCard, Utensils } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { Transaction, Feed, Animal } from "@shared/schema";

export default function Dashboard() {
  const { data: animals, isLoading: animalsLoading } = useAnimals();
  const { data: transactions } = useQuery<Transaction[]>({ queryKey: ["/api/finances"] });
  const { data: feeds } = useQuery<(Feed & { animal?: Animal })[]>({ queryKey: ["/api/feeds"] });

  if (animalsLoading) {
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

  const totalExpenses = transactions?.filter(t => t.type === "expense").reduce((acc, t) => acc + parseFloat(t.amount), 0) || 0;

  // Sort by recently updated
  const recentAnimals = [...animalList]
    .sort((a, b) => {
      const dateA = a.lastSeenAt ? new Date(a.lastSeenAt).getTime() : 0;
      const dateB = b.lastSeenAt ? new Date(b.lastSeenAt).getTime() : 0;
      return dateB - dateA;
    })
    .slice(0, 3);

  const recentFeeds = feeds?.slice(0, 3) || [];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground">Overview</h1>
        <p className="text-muted-foreground mt-2">Monitor wildlife status and recent field activities.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
            <CardTitle className="text-sm font-medium text-muted-foreground">Healthy</CardTitle>
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
            <CardTitle className="text-sm font-medium text-muted-foreground">Critical</CardTitle>
            <div className="h-8 w-8 rounded-full bg-red-500/10 flex items-center justify-center">
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-display font-bold text-red-600 dark:text-red-400">{criticalCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Needs attention</p>
          </CardContent>
        </Card>

        <Card className="hover-elevate border-amber-500/20 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Expenses</CardTitle>
            <div className="h-8 w-8 rounded-full bg-amber-500/10 flex items-center justify-center">
              <CreditCard className="h-4 w-4 text-amber-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-display font-bold text-amber-600">${totalExpenses.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Total operational cost</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold font-display">Recently Sighted</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/animals">View All</Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {recentAnimals.map((animal) => (
              <AnimalCard key={animal.id} animal={animal} />
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold font-display text-foreground">Recent Feedings</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/feeds">View Log</Link>
            </Button>
          </div>
          <Card className="border-border/50 shadow-sm">
            <CardContent className="p-0">
              {recentFeeds.length > 0 ? (
                <div className="divide-y divide-border/50">
                  {recentFeeds.map((f) => (
                    <div key={f.id} className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                          <Utensils className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{f.animal?.name || "Unknown"} fed {f.foodType}</p>
                          <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(f.fedAt), { addSuffix: true })}</p>
                        </div>
                      </div>
                      <div className="text-sm font-bold text-amber-600">
                        -${parseFloat(f.totalCost).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  No recent feeding records.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
