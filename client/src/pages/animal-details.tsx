import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useAnimal, useDeleteAnimal } from "@/hooks/use-animals";
import { format, formatDistanceToNow } from "date-fns";
import { 
  ArrowLeft, Edit, Trash2, MapPin, Calendar, 
  Activity, ClipboardList, PawPrint, Clock 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AnimalForm } from "@/components/forms/animal-form";
import { ObservationForm } from "@/components/forms/observation-form";
import { getHealthColor } from "@/components/animal-card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

export default function AnimalDetails() {
  const [, params] = useRoute("/animals/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const animalId = params?.id ? parseInt(params.id, 10) : 0;
  const { data: animal, isLoading, error } = useAnimal(animalId);
  const deleteMutation = useDeleteAnimal();
  
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isObservationDialogOpen, setIsObservationDialogOpen] = useState(false);

  if (isLoading) return <div className="p-8 animate-pulse"><div className="h-10 w-32 bg-muted rounded mb-8"></div><div className="h-96 bg-muted rounded-xl"></div></div>;
  
  if (error || !animal) {
    return (
      <div className="p-8 text-center mt-20">
        <h2 className="text-2xl font-bold mb-4 text-foreground">Animal not found</h2>
        <Button onClick={() => setLocation("/animals")} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Roster
        </Button>
      </div>
    );
  }

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(animalId);
      toast({ title: "Animal removed", description: "The record has been permanently deleted." });
      setLocation("/animals");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const observations = animal.observations || [];
  // Sort observations newest first
  observations.sort((a, b) => {
    return new Date(b.observedAt || 0).getTime() - new Date(a.observedAt || 0).getTime();
  });

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8">
      <Button variant="ghost" className="mb-2 pl-0 hover:bg-transparent hover:text-primary" onClick={() => setLocation("/animals")}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Wildlife Roster
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Profile */}
        <div className="lg:col-span-5 space-y-6">
          <div className="relative rounded-2xl overflow-hidden shadow-lg border border-border/50 bg-muted aspect-square">
            {animal.imageUrl ? (
              <img 
                src={animal.imageUrl} 
                alt={animal.name} 
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="w-full h-full nature-gradient flex items-center justify-center">
                <PawPrint className="h-32 w-32 text-primary-foreground/30" />
              </div>
            )}
            <div className="absolute top-4 right-4">
              <Badge variant="outline" className={`px-3 py-1 text-sm shadow-sm backdrop-blur-md font-semibold ${getHealthColor(animal.healthStatus)}`}>
                {animal.healthStatus}
              </Badge>
            </div>
          </div>

          <Card className="border-border/60 shadow-sm">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="text-sm font-semibold tracking-wider text-muted-foreground uppercase mb-1">
                    {animal.species}
                  </div>
                  <h1 className="text-3xl font-display font-bold text-foreground">{animal.name}</h1>
                </div>
                
                <div className="flex gap-2">
                  <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="icon" variant="outline" className="h-9 w-9 text-muted-foreground hover:text-primary">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px]">
                      <DialogHeader>
                        <DialogTitle>Edit Animal Details</DialogTitle>
                      </DialogHeader>
                      <AnimalForm initialData={animal} onSuccess={() => setIsEditDialogOpen(false)} />
                    </DialogContent>
                  </Dialog>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="icon" variant="outline" className="h-9 w-9 text-muted-foreground hover:text-destructive hover:border-destructive/30 hover:bg-destructive/5">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Record?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete the record for {animal.name} and all associated field observations. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-border/50">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <MapPin className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Primary Location</p>
                    <p className="text-foreground font-medium">{animal.location}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Calendar className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Estimated Age</p>
                    <p className="text-foreground font-medium">{animal.age !== null ? `${animal.age} years` : "Unknown"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Clock className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Last Sighting</p>
                    <p className="text-foreground font-medium">
                      {animal.lastSeenAt ? format(new Date(animal.lastSeenAt), "MMM d, yyyy • h:mm a") : "Never observed"}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Timeline / Observations */}
        <div className="lg:col-span-7">
          <Card className="h-full border-border/60 shadow-sm flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 pb-4 bg-muted/20">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-primary" />
                <CardTitle className="text-xl font-display">Field Observations</CardTitle>
              </div>
              <Dialog open={isObservationDialogOpen} onOpenChange={setIsObservationDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="hover-elevate active-elevate-2 shadow-sm">
                    Log Observation
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Log New Observation</DialogTitle>
                    <DialogDescription>
                      Record notes from your recent encounter with {animal.name}.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="pt-4">
                    <ObservationForm animalId={animal.id} onSuccess={() => setIsObservationDialogOpen(false)} />
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="p-0 flex-1">
              {observations.length > 0 ? (
                <div className="divide-y divide-border/50">
                  {observations.map((obs) => (
                    <div key={obs.id} className="p-6 transition-colors hover:bg-muted/10">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-semibold text-foreground">{obs.observerName}</span>
                        <span className="text-xs text-muted-foreground font-mono bg-muted px-2 py-1 rounded">
                          {obs.observedAt && formatDistanceToNow(new Date(obs.observedAt), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-foreground leading-relaxed whitespace-pre-wrap mt-3">{obs.notes}</p>
                      {obs.observedAt && (
                        <p className="text-xs text-muted-foreground mt-4">
                          Recorded on {format(new Date(obs.observedAt), "MMMM do, yyyy 'at' h:mm a")}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center p-12 h-full min-h-[300px]">
                  <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-4 border border-dashed border-border">
                    <Eye className="h-8 w-8 text-muted-foreground/40" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">No field notes yet</h3>
                  <p className="text-muted-foreground max-w-sm mt-2 mb-6 text-sm">
                    There are no recorded observations for this animal. Log the first encounter to start building the timeline.
                  </p>
                  <Button variant="outline" onClick={() => setIsObservationDialogOpen(true)} className="hover-elevate">
                    Log First Observation
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Ensure the Eye icon is available for the empty state
function Eye(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}
