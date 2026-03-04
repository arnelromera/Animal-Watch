import { useState } from "react";
import { useAnimals } from "@/hooks/use-animals";
import { AnimalCard } from "@/components/animal-card";
import { AnimalForm } from "@/components/forms/animal-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Plus, Search, Map } from "lucide-react";

export default function Animals() {
  const { data: animals, isLoading } = useAnimals();
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const filteredAnimals = animals?.filter((animal) => 
    animal.name.toLowerCase().includes(search.toLowerCase()) || 
    animal.species.toLowerCase().includes(search.toLowerCase()) ||
    animal.location.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold font-display text-foreground">Livestock Roster</h1>
          <p className="text-muted-foreground mt-2">Manage and track your farm flocks and herds.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="hover-elevate active-elevate-2 shadow-md shadow-primary/20">
              <Plus className="mr-2 h-5 w-5" />
              Register Flock
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] border-border/50 shadow-xl">
            <DialogHeader>
              <DialogTitle className="font-display text-2xl">Register New Flock</DialogTitle>
              <DialogDescription>
                Enter the details of the new livestock group to begin tracking.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <AnimalForm onSuccess={() => setIsDialogOpen(false)} />
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card border border-border/60 rounded-xl p-4 mb-8 shadow-sm flex items-center gap-3">
        <Search className="h-5 w-5 text-muted-foreground" />
        <Input 
          placeholder="Search by name, species, or location..." 
          className="border-0 bg-transparent shadow-none focus-visible:ring-0 px-0 text-base"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-80 bg-muted rounded-xl"></div>
          ))}
        </div>
      ) : filteredAnimals.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
          {filteredAnimals.map((animal) => (
            <AnimalCard key={animal.id} animal={animal} />
          ))}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-20">
          <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-4">
            <Map className="h-10 w-10 text-muted-foreground/50" />
          </div>
          <h3 className="text-xl font-bold font-display text-foreground">No matches found</h3>
          <p className="text-muted-foreground mt-2 max-w-md">
            We couldn't find any animals matching your search criteria. Try a different term or register a new animal.
          </p>
          <Button 
            variant="outline" 
            className="mt-6 hover-elevate"
            onClick={() => setSearch("")}
          >
            Clear Search
          </Button>
        </div>
      )}
    </div>
  );
}
