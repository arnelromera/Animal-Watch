import { useQuery, useMutation } from "@tanstack/react-query";
import { Feed, Animal, InsertFeed, FeedInventory, InsertFeedInventory } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertFeedSchema, insertFeedInventorySchema } from "@shared/schema";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Loader2, Utensils, Scale, Package, Plus, Trash2, AlertTriangle, CheckCircle2, ShoppingCart } from "lucide-react";
import { useEffect, useState } from "react";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export default function Feeds() {
  const { toast } = useToast();
  const [isStockDialogOpen, setIsStockDialogOpen] = useState(false);
  const { data: animals } = useQuery<Animal[]>({ queryKey: ["/api/animals"] });

  const { data: inventory, isLoading: isInvLoading } = useQuery<FeedInventory[]>({
    queryKey: ["/api/feed-inventory"],
  });

  const { data: feeds, isLoading: isFeedsLoading } = useQuery<(Feed & { animal?: Animal })[]>({
    queryKey: ["/api/feeds"],
  });

  const feedForm = useForm<any>({
    resolver: zodResolver(insertFeedSchema.extend({ animalId: z.string() })),
    defaultValues: {
      animalId: "",
      foodType: "",
      quantity: "0",
      unit: "kg",
      pricePerUnit: "0",
      totalCost: "0",
    },
  });

  const stockForm = useForm<InsertFeedInventory>({
    resolver: zodResolver(insertFeedInventorySchema),
    defaultValues: {
      name: "",
      quantity: "0",
      unit: "kg",
      minThreshold: "10",
    },
  });

  const quantity = feedForm.watch("quantity");
  const pricePerUnit = feedForm.watch("pricePerUnit");

  useEffect(() => {
    const total = parseFloat(quantity || "0") * parseFloat(pricePerUnit || "0");
    feedForm.setValue("totalCost", total.toFixed(2));
  }, [quantity, pricePerUnit, feedForm]);

  const feedMutation = useMutation({
    mutationFn: async (values: any) => {
      const { animalId, ...rest } = values;
      const res = await apiRequest("POST", `/api/animals/${animalId}/feeds`, rest);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/feeds"] });
      queryClient.invalidateQueries({ queryKey: ["/api/feed-inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/finances"] });
      toast({ title: "Success", description: "Feeding session logged and inventory updated." });
      feedForm.reset();
    },
  });

  const stockMutation = useMutation({
    mutationFn: async (values: InsertFeedInventory) => {
      const res = await apiRequest("POST", "/api/feed-inventory", values);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/feed-inventory"] });
      toast({ title: "Success", description: "New feed type added to inventory." });
      stockForm.reset();
      setIsStockDialogOpen(false);
    },
  });

  const deleteStockMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/feed-inventory/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/feed-inventory"] });
      toast({ title: "Removed", description: "Feed type removed from inventory." });
    },
  });

  if (isInvLoading || isFeedsLoading) {
    return <div className="p-8 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-10 animate-in fade-in duration-500 h-full overflow-y-auto scrollbar-hide">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold font-display text-foreground uppercase tracking-tight">Nutrition & Feeding</h1>
          <p className="text-muted-foreground mt-2">Manage feed inventory and track daily nutrition logs.</p>
        </div>

        <Dialog open={isStockDialogOpen} onOpenChange={setIsStockDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="h-12 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover-elevate">
              <ShoppingCart className="mr-2 h-5 w-5" />
              Add New Stock
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[450px] rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-display flex items-center gap-2">
                <Package className="h-6 w-6 text-primary" />
                Register Feed Type
              </DialogTitle>
              <DialogDescription>
                Add a new type of feed to your inventory tracking system.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Form {...stockForm}>
                <form onSubmit={stockForm.handleSubmit((v) => stockMutation.mutate(v))} className="space-y-4">
                  <FormField
                    control={stockForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Feed Name</FormLabel>
                        <FormControl><Input placeholder="e.g. Starter Mash" {...field} className="bg-muted/30 h-11" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={stockForm.control}
                      name="quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Qty</FormLabel>
                          <FormControl><Input type="number" step="0.1" {...field} className="bg-muted/30 h-11" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={stockForm.control}
                      name="unit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unit</FormLabel>
                          <FormControl><Input placeholder="kg or bags" {...field} className="bg-muted/30 h-11" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={stockForm.control}
                    name="minThreshold"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Low Stock Warning Threshold</FormLabel>
                        <FormControl><Input type="number" step="0.1" {...field} className="bg-muted/30 h-11" /></FormControl>
                        <FormDescription className="text-[10px]">We'll alert you when stock drops below this level.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full h-12 text-lg font-bold text-white mt-4" disabled={stockMutation.isPending}>
                    {stockMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Add to Silo
                  </Button>
                </form>
              </Form>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Inventory Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {inventory?.map((item) => {
          const isLow = parseFloat(item.quantity) <= parseFloat(item.minThreshold);
          return (
            <Card key={item.id} className={cn(
              "border-border/50 shadow-sm relative group transition-all duration-300 hover-elevate",
              isLow ? "bg-red-50 dark:bg-red-950/10 border-red-200" : "bg-card"
            )}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">{item.name}</CardTitle>
                  <button
                    onClick={() => deleteStockMutation.mutate(item.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-all"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <span className={cn(
                    "text-3xl font-display font-black tracking-tighter",
                    isLow ? "text-red-600" : "text-primary"
                  )}>
                    {parseFloat(item.quantity).toLocaleString()}
                  </span>
                  <span className="text-xs font-bold text-muted-foreground uppercase">{item.unit}</span>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  {isLow ? (
                    <div className="flex items-center gap-1.5 text-red-600 text-[10px] font-black uppercase tracking-wider bg-red-100 dark:bg-red-900/20 px-2 py-0.5 rounded-full">
                      <AlertTriangle className="h-3 w-3" />
                      Low Stock
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-emerald-600 text-[10px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="h-3 w-3" />
                      Healthy
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
        {inventory?.length === 0 && (
          <div className="col-span-full py-10 text-center border-2 border-dashed rounded-2xl text-muted-foreground">
            No feed inventory found. Use the "Add New Stock" button to get started.
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-10">
        <Card className="lg:col-span-1 border-border/50 shadow-xl rounded-2xl overflow-hidden glass-card">
          <CardHeader className="bg-muted/10 border-b border-border/50 p-6">
            <CardTitle className="text-xl font-display font-bold uppercase tracking-tight flex items-center gap-2">
              <Utensils className="h-5 w-5 text-primary" />
              Log Feeding
            </CardTitle>
            <CardDescription>Record daily nutrition for specific animal batches.</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <Form {...feedForm}>
              <form onSubmit={feedForm.handleSubmit((v) => feedMutation.mutate(v))} className="space-y-4">
                <FormField
                  control={feedForm.control}
                  name="animalId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Animal Batch</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-muted/30 rounded-xl h-11">
                            <SelectValue placeholder="Select animal" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {animals?.map(a => (
                            <SelectItem key={a.id} value={a.id.toString()}>{a.name} ({a.species})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={feedForm.control}
                  name="foodType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Feed Used</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-muted/30 rounded-xl h-11">
                            <SelectValue placeholder="Select feed type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {inventory?.map(item => (
                            <SelectItem key={item.id} value={item.name}>{item.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription className="text-[10px]">Inventory will be automatically deducted.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={feedForm.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantity</FormLabel>
                        <FormControl><Input type="number" step="0.1" {...field} className="bg-muted/30 rounded-xl h-11" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={feedForm.control}
                    name="unit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unit</FormLabel>
                        <FormControl><Input placeholder="kg" {...field} className="bg-muted/30 rounded-xl h-11" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={feedForm.control}
                  name="pricePerUnit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price per Unit (₱)</FormLabel>
                      <FormControl><Input type="number" step="0.01" {...field} className="bg-muted/30 rounded-xl h-11" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Est. Total Cost:</span>
                  <span className="font-display font-black text-xl text-primary tracking-tight">₱{feedForm.watch("totalCost")}</span>
                </div>
                <Button type="submit" className="w-full h-12 text-lg font-bold text-white rounded-xl shadow-lg shadow-primary/20" disabled={feedMutation.isPending}>
                  {feedMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Log Feeding
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 border-border/50 shadow-xl rounded-2xl overflow-hidden glass-card">
          <CardHeader className="bg-muted/10 border-b border-border/50 p-6">
            <CardTitle className="text-xl font-display font-bold uppercase tracking-tight">Feeding History</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/50">
              {feeds?.map((f) => (
                <div key={f.id} className="flex items-center justify-between p-6 hover:bg-muted/20 transition-all group">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Utensils className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-bold text-lg text-foreground group-hover:text-primary transition-colors uppercase tracking-tight">{f.animal?.name || "Unknown"} fed {f.foodType}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium">
                        <span className="flex items-center gap-1.5"><Scale className="h-3.5 w-3.5" /> {f.quantity} {f.unit}</span>
                        <span className="flex items-center gap-1.5 underline decoration-primary/20 decoration-2 underline-offset-4 uppercase font-black tracking-widest text-[9px]">₱{parseFloat(f.totalCost).toLocaleString()} total</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-foreground uppercase">{format(new Date(f.fedAt), "MMM d")}</p>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">{format(new Date(f.fedAt), "h:mm a")}</p>
                  </div>
                </div>
              ))}
              {feeds?.length === 0 && (
                <div className="text-center py-20 text-muted-foreground flex flex-col items-center gap-4 opacity-50">
                  <Utensils className="h-12 w-12" />
                  <p className="font-bold text-sm uppercase tracking-widest">No feeding records found</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
