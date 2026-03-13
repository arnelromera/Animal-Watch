import { useQuery, useMutation } from "@tanstack/react-query";
import { Animal, FeedInventory, InsertFeedInventory, MedicalSupply, InsertMedicalSupply, Category } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertFeedInventorySchema, insertMedicalSupplySchema } from "@shared/schema";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { format, formatDistanceToNow, isBefore, addDays } from "date-fns";
import {
  Loader2, Package, Plus, Trash2,
  AlertTriangle, CheckCircle2,
  Stethoscope, Clock, ShieldAlert, Activity, MapPin,
  History, Pill, Calendar as CalendarIcon
} from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

export default function StockManagement() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("herd");
  const [isStockDialogOpen, setIsStockDialogOpen] = useState(false);
  const [isMedDialogOpen, setIsMedDialogOpen] = useState(false);

  // Queries
  const { data: animals, isLoading: isAnimalsLoading } = useQuery<Animal[]>({ queryKey: ["/api/animals"] });
  const { data: inventory, isLoading: isInvLoading } = useQuery<FeedInventory[]>({ queryKey: ["/api/feed-inventory"] });
  const { data: medicalSupplies, isLoading: isMedLoading } = useQuery<MedicalSupply[]>({ queryKey: ["/api/medical-supplies"] });
  const { data: categories } = useQuery<Category[]>({ queryKey: ["/api/categories"] });

  const feedUnits = useMemo(() => categories?.filter(c => c.type === 'feed_unit') || [], [categories]);
  const medUnits = useMemo(() => categories?.filter(c => c.type === 'med_unit') || [], [categories]);

  // Forms
  const stockForm = useForm<InsertFeedInventory>({
    resolver: zodResolver(insertFeedInventorySchema),
    defaultValues: {
      name: "",
      quantity: "0",
      unit: "kg",
      minThreshold: "10",
    },
  });

  const medForm = useForm<InsertMedicalSupply>({
    resolver: zodResolver(insertMedicalSupplySchema),
    defaultValues: {
      name: "",
      quantity: "0",
      unit: "ml",
      minThreshold: "5",
      expirationDate: null,
      withdrawalDays: 0,
    },
  });

  // Mutations
  const stockMutation = useMutation({
    mutationFn: async (values: InsertFeedInventory) => {
      const res = await apiRequest("POST", "/api/feed-inventory", values);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/feed-inventory"] });
      toast({ title: "Success", description: "New stock registered successfully." });
      stockForm.reset();
      setIsStockDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const medMutation = useMutation({
    mutationFn: async (values: InsertMedicalSupply) => {
      const res = await apiRequest("POST", "/api/medical-supplies", values);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/medical-supplies"] });
      toast({ title: "Success", description: "Medical supply added." });
      medForm.reset();
      setIsMedDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const deleteStockMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/feed-inventory/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/feed-inventory"] });
      toast({ title: "Removed", description: "Stock type removed from system." });
    },
  });

  const deleteMedMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/medical-supplies/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/medical-supplies"] });
      toast({ title: "Removed", description: "Medical supply removed." });
    },
  });

  // Derived Data
  const herdStats = useMemo(() => {
    if (!animals) return [];
    const stats: Record<string, { total: number, locations: Set<string>, species: string }> = {};
    animals.forEach(a => {
      if (!stats[a.species]) {
        stats[a.species] = { total: 0, locations: new Set(), species: a.species };
      }
      stats[a.species].total += a.count;
      stats[a.species].locations.add(a.location);
    });
    return Object.values(stats).sort((a, b) => b.total - a.total).slice(0, 6);
  }, [animals]);

  const feedStats = useMemo(() => {
    if (!inventory) return [];
    return [...inventory].sort((a, b) => parseFloat(a.quantity) - parseFloat(b.quantity)).slice(0, 6);
  }, [inventory]);

  const medicalStats = useMemo(() => {
    if (!medicalSupplies) return [];
    return [...medicalSupplies].sort((a, b) => {
      const aExpiry = a.expirationDate ? new Date(a.expirationDate).getTime() : Infinity;
      const bExpiry = b.expirationDate ? new Date(b.expirationDate).getTime() : Infinity;
      return aExpiry - bExpiry;
    }).slice(0, 6);
  }, [medicalSupplies]);

  if (isInvLoading || isMedLoading || isAnimalsLoading) {
    return <div className="p-8 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-10 animate-in fade-in duration-500 h-full overflow-y-auto scrollbar-hide text-foreground font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 shrink-0">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold font-display uppercase tracking-tight">Farm Assets & Stock</h1>
          <p className="text-muted-foreground mt-2 text-sm md:text-base font-medium">Real-time inventory for herd, feed, and medical supplies.</p>
        </div>

        <div className="flex gap-3">
          <Dialog open={isStockDialogOpen} onOpenChange={setIsStockDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="h-12 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-lg uppercase tracking-widest text-[10px] px-6">
                <Plus className="mr-2 h-5 w-5" />
                Add Feed Stock
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[450px] rounded-2xl border-border/50 shadow-2xl glass-card text-foreground">
              <DialogHeader>
                <DialogTitle className="text-2xl font-display font-black uppercase tracking-tight">
                  <Package className="h-6 w-6 text-primary inline mr-2" />
                  Register Stock
                </DialogTitle>
                <DialogDescription className="text-muted-foreground text-[11px] font-bold uppercase tracking-widest">
                  Add a new consumable to your inventory.
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
                          <FormLabel className="text-[10px] font-black uppercase tracking-widest">Stock Name</FormLabel>
                          <FormControl><Input placeholder="e.g. Starter Mash" {...field} className="bg-muted/30 h-11 border-border/50" /></FormControl>
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
                            <FormLabel className="text-[10px] font-black uppercase tracking-widest">Initial Qty</FormLabel>
                            <FormControl><Input type="number" step="0.1" {...field} className="bg-muted/30 h-11 border-border/50" /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={stockForm.control}
                        name="unit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[10px] font-black uppercase tracking-widest">Unit</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger className="bg-muted/30 h-11 border-border/50 text-foreground font-medium uppercase">
                                  <SelectValue placeholder="Select unit" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="rounded-xl border-border/50">
                                {feedUnits.map(cat => (
                                  <SelectItem key={cat.id} value={cat.name} className="uppercase font-bold text-xs">{cat.name}</SelectItem>
                                ))}
                                {feedUnits.length === 0 && <SelectItem value="kg" className="uppercase font-bold text-xs">kg</SelectItem>}
                              </SelectContent>
                            </Select>
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
                          <FormLabel className="text-[10px] font-black uppercase tracking-widest">Alert Threshold</FormLabel>
                          <FormControl><Input type="number" step="0.1" {...field} className="bg-muted/30 h-11 border-border/50" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full h-12 text-lg font-bold text-white mt-4 rounded-xl bg-primary hover:bg-primary/90 uppercase tracking-widest text-xs" disabled={stockMutation.isPending}>
                      {stockMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Add to Inventory
                    </Button>
                  </form>
                </Form>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isMedDialogOpen} onOpenChange={setIsMedDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg" variant="outline" className="h-12 border-primary text-primary hover:bg-primary/5 font-bold rounded-xl shadow-sm uppercase tracking-widest text-[10px] px-6">
                <Stethoscope className="mr-2 h-5 w-5" />
                Add Medicine
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[450px] rounded-2xl border-border/50 shadow-2xl glass-card text-foreground">
              <DialogHeader>
                <DialogTitle className="text-2xl font-display font-black uppercase tracking-tight">
                  <Pill className="h-6 w-6 text-primary inline mr-2" />
                  Register Medicine
                </DialogTitle>
                <DialogDescription className="text-muted-foreground text-[11px] font-bold uppercase tracking-widest">
                  Track medical supplies and safety periods.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Form {...medForm}>
                  <form onSubmit={medForm.handleSubmit((v) => medMutation.mutate(v))} className="space-y-4">
                    <FormField
                      control={medForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-black uppercase tracking-widest">Medicine Name</FormLabel>
                          <FormControl><Input placeholder="e.g. Penicillin" {...field} className="bg-muted/30 h-11 border-border/50" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={medForm.control}
                        name="quantity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[10px] font-black uppercase tracking-widest">Qty</FormLabel>
                            <FormControl><Input type="number" step="0.1" {...field} className="bg-muted/30 h-11 border-border/50" /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={medForm.control}
                        name="unit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[10px] font-black uppercase tracking-widest">Unit</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger className="bg-muted/30 h-11 border-border/50 text-foreground font-medium uppercase">
                                  <SelectValue placeholder="Select unit" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="rounded-xl border-border/50">
                                {medUnits.map(cat => (
                                  <SelectItem key={cat.id} value={cat.name} className="uppercase font-bold text-xs">{cat.name}</SelectItem>
                                ))}
                                {medUnits.length === 0 && <SelectItem value="ml" className="uppercase font-bold text-xs">ml</SelectItem>}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={medForm.control}
                        name="withdrawalDays"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[10px] font-black uppercase tracking-widest">Withdrawal (Days)</FormLabel>
                            <FormControl><Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} className="bg-muted/30 h-11 border-border/50" /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={medForm.control}
                        name="expirationDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel className="text-[10px] font-black uppercase tracking-widest mb-2">Expiry Date</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button variant="outline" className={cn("h-11 bg-muted/30 border-border/50 rounded-lg text-left font-normal", !field.value && "text-muted-foreground")}>
                                    {field.value ? format(field.value, "PPP") : <span>Pick date</span>}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar mode="single" selected={field.value || undefined} onSelect={field.onChange} initialFocus />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <Button type="submit" className="w-full h-12 text-lg font-bold text-white mt-4 rounded-xl bg-primary hover:bg-primary/90 uppercase tracking-widest text-xs" disabled={medMutation.isPending}>
                      {medMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Add to Cabinet
                    </Button>
                  </form>
                </Form>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={activeTab} className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 mb-8 bg-muted/50 p-1 rounded-2xl h-14">
          <TabsTrigger value="herd" className="rounded-xl font-bold uppercase text-[11px] tracking-widest data-[state=active]:shadow-lg">
            <Activity className="h-4 w-4 mr-2" /> Live Herd
          </TabsTrigger>
          <TabsTrigger value="inventory" className="rounded-xl font-bold uppercase text-[11px] tracking-widest data-[state=active]:shadow-lg">
            <Package className="h-4 w-4 mr-2" /> Feed Stock
          </TabsTrigger>
          <TabsTrigger value="medical" className="rounded-xl font-bold uppercase text-[11px] tracking-widest data-[state=active]:shadow-lg">
            <Stethoscope className="h-4 w-4 mr-2" /> Medicine Cabinet
          </TabsTrigger>
        </TabsList>

        <TabsContent value="herd" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-wrap md:flex-nowrap items-stretch gap-3 pb-4 overflow-x-auto scrollbar-hide">
            {herdStats.map(stat => (
              <div
                key={stat.species}
                className="flex-1 min-w-[180px] max-w-full flex items-center justify-between gap-3 px-5 py-4 bg-card border border-border/50 rounded-2xl shadow-sm hover-elevate transition-all group"
              >
                <div className="flex flex-col justify-center">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary leading-none mb-2 group-hover:translate-x-1 transition-transform">{stat.species}</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-display font-black text-foreground tracking-tighter">{stat.total}</span>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Head</span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                  <Badge variant="outline" className="text-[9px] font-black uppercase tracking-tighter bg-primary/5 text-primary border-primary/20 px-2">
                    {stat.locations.size} {stat.locations.size === 1 ? 'Pen' : 'Pens'}
                  </Badge>
                  <div className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                    <MapPin className="h-3 w-3 text-primary" />
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider truncate max-w-[70px]">
                      {Array.from(stat.locations)[0]}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {herdStats.length === 0 && (
              <div className="flex items-center justify-center w-full py-10 bg-muted/5 border-2 border-dashed border-border/50 rounded-2xl text-muted-foreground italic text-sm">
                No active herd data recorded
              </div>
            )}
          </div>

          <Card className="border-border/50 shadow-xl rounded-3xl overflow-hidden glass-card">
            <CardHeader className="bg-muted/10 border-b border-border/50 p-8">
              <CardTitle className="text-xl font-display font-black uppercase tracking-tight flex items-center gap-3">
                <History className="h-5 w-5 text-primary" />
                Live Inventory Status
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="text-[10px] font-black uppercase tracking-widest px-8">Batch Name</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest">Species</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest">Headcount</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest">Location</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest">Last Activity</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-right px-8">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {animals?.map(a => (
                      <TableRow key={a.id} className="group hover:bg-muted/20 transition-all border-b border-border/30">
                        <TableCell className="px-8 font-bold text-sm uppercase tracking-tight">{a.name}</TableCell>
                        <TableCell className="text-xs font-black text-muted-foreground uppercase">{a.species}</TableCell>
                        <TableCell className="font-display font-black text-lg">{a.count}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3 w-3 text-primary" />
                            <span className="text-xs font-bold text-foreground uppercase">{a.location}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground font-medium">{a.lastSeenAt ? formatDistanceToNow(new Date(a.lastSeenAt), { addSuffix: true }) : "Never"}</TableCell>
                        <TableCell className="text-right px-8">
                          <Badge className={cn(
                            "text-[9px] font-black uppercase tracking-tighter",
                            a.healthStatus.toLowerCase() === 'healthy' ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600"
                          )}>{a.healthStatus}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-wrap md:flex-nowrap items-stretch gap-3 pb-4 overflow-x-auto scrollbar-hide">
            {feedStats.map(item => {
              const qty = parseFloat(item.quantity);
              const threshold = parseFloat(item.minThreshold);
              const isLow = qty <= threshold;
              const isCritical = qty <= threshold / 2;

              return (
                <div
                  key={item.id}
                  className={cn(
                    "flex-1 min-w-[180px] max-w-full flex items-center justify-between gap-3 px-5 py-4 border border-border/50 rounded-2xl shadow-sm hover-elevate transition-all group relative",
                    isCritical ? "bg-red-50/50 dark:bg-red-950/10 border-red-500" : isLow ? "bg-amber-50/50 dark:bg-amber-950/10 border-amber-500" : "bg-card"
                  )}
                >
                  <div className="flex flex-col justify-center">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary leading-none mb-2 group-hover:translate-x-1 transition-transform">{item.name}</span>
                    <div className="flex items-baseline gap-2">
                      <span className={cn("text-3xl font-display font-black tracking-tighter", isCritical ? "text-red-600" : isLow ? "text-amber-600" : "text-foreground")}>
                        {qty.toLocaleString()}
                      </span>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{item.unit}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <button onClick={() => deleteStockMutation.mutate(item.id)} className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-all">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                    {isLow && (
                      <Badge variant={isCritical ? "destructive" : "outline"} className={cn("text-[8px] font-black uppercase border-none", isCritical ? "" : "bg-amber-100 text-amber-600")}>
                        {isCritical ? "URGENT" : "LOW"}
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
            {feedStats.length === 0 && (
              <div className="flex items-center justify-center w-full py-10 bg-muted/5 border-2 border-dashed border-border/50 rounded-2xl text-muted-foreground italic text-sm">
                No feed inventory items registered
              </div>
            )}
          </div>

          <Card className="border-border/50 shadow-xl rounded-3xl overflow-hidden glass-card">
            <CardHeader className="bg-muted/10 border-b border-border/50 p-8 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl font-display font-black uppercase tracking-tight flex items-center gap-3">
                  <Package className="h-5 w-5 text-primary" />
                  Detailed Inventory Audit
                </CardTitle>
                <CardDescription className="text-xs font-medium">Real-time depletion and cost tracking.</CardDescription>
              </div>
              <div className="text-[9px] font-black uppercase tracking-[0.2em] bg-muted/50 px-4 py-1.5 rounded-full border border-border/50 shadow-inner">{inventory?.length || 0} ITEMS</div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="px-8 text-[10px] font-black uppercase tracking-widest">Item Name</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest">In-Stock</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest">Min Threshold</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest">Last Updated</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-right px-8">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inventory?.map(item => (
                      <TableRow key={item.id} className="hover:bg-muted/10 transition-all border-b border-border/30">
                        <TableCell className="px-8 font-bold text-sm uppercase tracking-tight">{item.name}</TableCell>
                        <TableCell className="font-display font-black text-lg text-primary uppercase">{parseFloat(item.quantity).toLocaleString()} {item.unit}</TableCell>
                        <TableCell className="text-xs font-black text-muted-foreground uppercase">{parseFloat(item.minThreshold).toLocaleString()} {item.unit}</TableCell>
                        <TableCell className="text-xs text-muted-foreground font-medium">{item.updatedAt ? formatDistanceToNow(new Date(item.updatedAt), { addSuffix: true }) : "Never"}</TableCell>
                        <TableCell className="text-right px-8">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive rounded-full"
                            onClick={() => deleteStockMutation.mutate(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="medical" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-wrap md:flex-nowrap items-stretch gap-3 pb-4 overflow-x-auto scrollbar-hide">
            {medicalStats.map(item => {
              const expiryDate = item.expirationDate ? new Date(item.expirationDate) : null;
              const isExpired = expiryDate ? isBefore(expiryDate, new Date()) : false;
              const isNearExpiry = expiryDate ? isBefore(expiryDate, addDays(new Date(), 30)) && !isExpired : false;
              const qty = parseFloat(item.quantity);
              const isLow = qty <= parseFloat(item.minThreshold);

              return (
                <div
                  key={item.id}
                  className={cn(
                    "flex-1 min-w-[180px] max-w-full flex items-center justify-between gap-3 px-5 py-4 border border-border/50 rounded-2xl shadow-sm hover-elevate transition-all group",
                    isExpired ? "border-red-500 bg-red-50/10" : "bg-card"
                  )}
                >
                  <div className="flex flex-col justify-center">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary leading-none mb-2 group-hover:translate-x-1 transition-transform">{item.name}</span>
                    <div className="flex items-baseline gap-2">
                      <span className={cn("text-3xl font-display font-black tracking-tighter", isLow ? "text-amber-600" : "text-foreground")}>{qty}</span>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{item.unit}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <button onClick={() => deleteMedMutation.mutate(item.id)} className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-all">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                    {(isExpired || isNearExpiry) && (
                      <Badge variant={isExpired ? "destructive" : "outline"} className={cn("text-[8px] font-black uppercase border-none", isExpired ? "" : "bg-amber-100 text-amber-600")}>
                        {isExpired ? "EXPIRED" : "EXPIRING"}
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
            {medicalStats.length === 0 && (
              <div className="flex items-center justify-center w-full py-10 bg-muted/5 border-2 border-dashed border-border/50 rounded-2xl text-muted-foreground italic text-sm">
                Medical cabinet is empty
              </div>
            )}
          </div>

          <Card className="border-border/50 shadow-xl rounded-3xl overflow-hidden glass-card">
            <CardHeader className="bg-muted/10 border-b border-border/50 p-8 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl font-display font-black uppercase tracking-tight flex items-center gap-3">
                  <ShieldAlert className="h-5 w-5 text-primary" />
                  Medical Safety Audit
                </CardTitle>
                <CardDescription className="text-xs font-medium">Tracking lot dates and withdrawal periods for food safety.</CardDescription>
              </div>
              <div className="text-[9px] font-black uppercase tracking-[0.2em] bg-muted/50 px-4 py-1.5 rounded-full border border-border/50 shadow-inner">{medicalSupplies?.length || 0} ITEMS</div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="px-8 text-[10px] font-black uppercase tracking-widest">Supply Name</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest">In-Stock</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest">Withdrawal</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest">Safety Status</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-right px-8">Expiration</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {medicalSupplies?.map(m => (
                      <TableRow key={m.id} className="hover:bg-muted/10 transition-all border-b border-border/30">
                        <TableCell className="px-8 font-bold text-sm uppercase tracking-tight">{m.name}</TableCell>
                        <TableCell className="font-display font-black text-lg text-primary uppercase">{parseFloat(m.quantity).toLocaleString()} {m.unit}</TableCell>
                        <TableCell className="text-xs font-black text-primary">{m.withdrawalDays} DAYS</TableCell>
                        <TableCell>
                           <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-emerald-500" />
                              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Consumption Clear</span>
                           </div>
                        </TableCell>
                        <TableCell className="text-right px-8 text-xs font-medium text-muted-foreground">
                          {m.expirationDate ? format(new Date(m.expirationDate), "MMM d, yyyy") : "No Date Set"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Table({ children }: { children: React.ReactNode }) {
  return <div className="w-full overflow-x-auto"><table className="w-full text-left border-collapse">{children}</table></div>;
}

function TableHeader({ children }: { children: React.ReactNode }) {
  return <thead className="border-b border-border/50">{children}</thead>;
}

function TableRow({ children, className }: { children: React.ReactNode, className?: string }) {
  return <tr className={cn("border-b border-border/10", className)}>{children}</tr>;
}

function TableHead({ children, className }: { children: React.ReactNode, className?: string }) {
  return <th className={cn("p-4 font-bold text-muted-foreground", className)}>{children}</th>;
}

function TableBody({ children }: { children: React.ReactNode }) {
  return <tbody>{children}</tbody>;
}

function TableCell({ children, className }: { children: React.ReactNode, className?: string }) {
  return <td className={cn("p-4 align-middle", className)}>{children}</td>;
}
