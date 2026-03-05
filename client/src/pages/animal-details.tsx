import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useAnimal, useDeleteAnimal } from "@/hooks/use-animals";
import { format, formatDistanceToNow } from "date-fns";
import { 
  ArrowLeft, Edit, Trash2, MapPin, Calendar, 
  Activity, ClipboardList, PawPrint, Clock, Utensils, Scale, DollarSign 
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  observations.sort((a, b) => new Date(b.observedAt || 0).getTime() - new Date(a.observedAt || 0).getTime());

  const feeds = animal.feeds || [];
  feeds.sort((a, b) => new Date(b.fedAt || 0).getTime() - new Date(a.fedAt || 0).getTime());

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8">
      <Button variant="ghost" className="mb-2 pl-0 hover:bg-transparent hover:text-primary" onClick={() => setLocation("/animals")}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Wildlife Roster
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Profile Card */}
        <div className="lg:col-span-4 space-y-6">
          <div className="relative rounded-2xl overflow-hidden shadow-lg border border-border/50 bg-muted aspect-square">
            {animal.imageUrl ? (
              <img src={animal.imageUrl} alt={animal.name} className="object-cover w-full h-full" />
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
                  <div className="text-sm font-semibold tracking-wider text-muted-foreground uppercase mb-1">{animal.species}</div>
                  <h1 className="text-3xl font-display font-bold text-foreground">{animal.name}</h1>
                </div>
                <div className="flex gap-2">
                  <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="icon" variant="outline" className="h-9 w-9"><Edit className="h-4 w-4" /></Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px]">
                      <DialogHeader><DialogTitle>Edit Animal Details</DialogTitle></DialogHeader>
                      <AnimalForm initialData={animal} onSuccess={() => setIsEditDialogOpen(false)} />
                    </DialogContent>
                  </Dialog>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="icon" variant="outline" className="h-9 w-9 text-destructive"><Trash2 className="h-4 w-4" /></Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Record?</AlertDialogTitle>
                        <AlertDialogDescription>This will permanently delete the record for {animal.name}.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive">Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-border/50">
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Location</p>
                    <p className="text-sm font-medium">{animal.location}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Start Date</p>
                    <p className="text-sm font-medium">{animal.startDate ? format(new Date(animal.startDate), "MMM d, yyyy") : "N/A"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-primary">#</span>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Quantity</p>
                    <p className="text-sm font-medium">{animal.count} head</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-primary">₱</span>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Price per Head</p>
                    <p className="text-sm font-medium">₱{parseFloat(animal.pricePerLivestock || "0").toLocaleString()}</p>
                  </div>
                </div>
              </div>
              {animal.notes && (
                <div className="mt-6 pt-6 border-t border-border/50">
                  <p className="text-xs text-muted-foreground mb-2">Notes</p>
                  <p className="text-sm text-foreground leading-relaxed">{animal.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Details & Logs Tabs */}
        <div className="lg:col-span-8">
          <Tabs defaultValue="observations" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="observations" className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4" /> Field Notes
              </TabsTrigger>
              <TabsTrigger value="feeding" className="flex items-center gap-2">
                <Utensils className="h-4 w-4" /> Diet & Nutrition
              </TabsTrigger>
            </TabsList>

            <TabsContent value="observations">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-4">
                  <CardTitle>Field Observations</CardTitle>
                  <Dialog open={isObservationDialogOpen} onOpenChange={setIsObservationDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm">Log Observation</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>New Observation</DialogTitle></DialogHeader>
                      <ObservationForm animalId={animal.id} onSuccess={() => setIsObservationDialogOpen(false)} />
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent className="p-0">
                  {observations.length > 0 ? (
                    <div className="divide-y divide-border/50">
                      {observations.map((obs) => (
                        <div key={obs.id} className="p-6">
                          <div className="flex justify-between items-start">
                            <span className="font-semibold">{obs.observerName}</span>
                            <span className="text-xs text-muted-foreground">{obs.observedAt && formatDistanceToNow(new Date(obs.observedAt), { addSuffix: true })}</span>
                          </div>
                          <p className="text-foreground mt-2">{obs.notes}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-12 text-center text-muted-foreground">No field notes recorded yet.</div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="feeding">
              <Card>
                <CardHeader>
                  <CardTitle>Feeding History</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {feeds.length > 0 ? (
                    <div className="divide-y divide-border/50">
                      {feeds.map((f) => (
                        <div key={f.id} className="p-6 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <Utensils className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{f.foodType}</p>
                              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1"><Scale className="h-3 w-3" /> {f.quantity} {f.unit}</span>
                                <span className="flex items-center gap-1"><span className="text-xs font-bold text-primary">₱</span> ₱{parseFloat(f.totalCost).toLocaleString()}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">{format(new Date(f.fedAt), "MMM d, yyyy")}</p>
                            <p className="text-xs text-muted-foreground">{format(new Date(f.fedAt), "h:mm a")}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-12 text-center text-muted-foreground">No feeding sessions logged for this animal.</div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
