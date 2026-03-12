import { useAnimals } from "@/hooks/use-animals";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimalCard } from "@/components/animal-card";
import { Button } from "@/components/ui/button";
import { Activity, PawPrint, AlertTriangle, ArrowRight, CreditCard, Utensils, Plus, ReceiptText, Loader2, Paperclip, Calendar as CalendarIcon, X } from "lucide-react";
import { formatDistanceToNow, format, isSameDay } from "date-fns";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Transaction, Feed, Animal, InsertTransaction, insertTransactionSchema, Category } from "@shared/schema";
import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const { toast } = useToast();
  const [isFinDialogOpen, setIsFinDialogOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [filterDate, setFilterDate] = useState<Date | undefined>(undefined);

  const { data: animals, isLoading: animalsLoading } = useAnimals();
  const { data: transactions } = useQuery<Transaction[]>({ queryKey: ["/api/finances"] });
  const { data: feeds } = useQuery<(Feed & { animal?: Animal })[]>({ queryKey: ["/api/feeds"] });
  const { data: categories } = useQuery<Category[]>({ queryKey: ["/api/categories"] });

  const mutation = useMutation({
    mutationFn: async (values: InsertTransaction) => {
      const res = await apiRequest("POST", "/api/finances", values);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/finances"] });
      toast({ title: "Success", description: "Transaction recorded." });
      form.reset();
      setIsFinDialogOpen(false);
    },
  });

  const form = useForm<any>({
    resolver: zodResolver(insertTransactionSchema),
    defaultValues: {
      description: "",
      amount: "0",
      type: "expense",
      category: "Others",
      animalId: null,
      units: "1",
      pricePerUnit: "0",
      attachments: "",
      note: "",
      date: new Date(),
    },
  });

  const type = form.watch("type");
  const units = form.watch("units");
  const pricePerUnit = form.watch("pricePerUnit");
  const animalId = form.watch("animalId");

  useEffect(() => {
    const total = parseFloat(units || "0") * parseFloat(pricePerUnit || "0");
    if (total > 0) {
      form.setValue("amount", total.toFixed(2));
    }
  }, [units, pricePerUnit, form]);

  // Automatically set category for income based on animal species from categories table
  useEffect(() => {
    if (type === "income" && animalId && animals && categories) {
      const selectedAnimal = animals.find(a => a.id === animalId);
      if (selectedAnimal) {
        const searchName = `Sale of ${selectedAnimal.species.charAt(0).toUpperCase() + selectedAnimal.species.slice(1).toLowerCase()}`;
        const match = categories.find(c => c.type === 'income_category' && c.name === searchName);
        if (match) {
          form.setValue("category", match.name);
        } else {
          form.setValue("category", "Income");
        }
      }
    }
  }, [type, animalId, animals, categories, form]);

  const animalList = animals || [];

  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];
    if (!filterDate) return transactions;
    return transactions.filter(t => isSameDay(new Date(t.date), filterDate));
  }, [transactions, filterDate]);

  const filteredFeeds = useMemo(() => {
    if (!feeds) return [];
    if (!filterDate) return feeds;
    return feeds.filter(f => isSameDay(new Date(f.fedAt), filterDate));
  }, [feeds, filterDate]);

  const healthyCount = animalList.filter(a => a.healthStatus.toLowerCase() === "healthy").length;
  const criticalCount = animalList.filter(a =>
    ["injured", "sick"].includes(a.healthStatus.toLowerCase())
  ).length;

  const totalExpenses = useMemo(() => {
    return filteredTransactions
      .filter(t => t.type === "expense")
      .reduce((acc, t) => acc + parseFloat(t.amount), 0);
  }, [filteredTransactions]);

  const recentAnimals = useMemo(() => {
    return [...animalList]
      .sort((a, b) => {
        const dateA = a.lastSeenAt ? new Date(a.lastSeenAt).getTime() : 0;
        const dateB = b.lastSeenAt ? new Date(b.lastSeenAt).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 3);
  }, [animalList]);

  const displayFeeds = useMemo(() => {
    return filteredFeeds.slice(0, 3);
  }, [filteredFeeds]);

  const handleClearFilter = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFilterDate(undefined);
  };

  const handleDateSelect = (date: Date | undefined) => {
    setFilterDate(date);
    setIsCalendarOpen(false);
  };

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

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 overflow-y-auto max-h-[calc(100vh-100px)] scrollbar-hide">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground font-display text-foreground">Overview</h1>
          <p className="text-muted-foreground mt-2">Monitor livestock status and recent field activities.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn(
                "h-12 px-4 font-bold border-2 transition-all relative group bg-background",
                filterDate ? "border-primary text-primary bg-primary/5" : "border-border"
              )}>
                <CalendarIcon className="mr-2 h-5 w-5" />
                {filterDate ? format(filterDate, "PPP") : "All Time"}
                {filterDate && (
                  <div
                    role="button"
                    onClick={handleClearFilter}
                    className="ml-2 h-6 w-6 rounded-full flex items-center justify-center hover:bg-destructive hover:text-white transition-all scale-90"
                  >
                    <X className="h-3 w-3" />
                  </div>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={filterDate}
                onSelect={handleDateSelect}
                defaultMonth={filterDate}
                initialFocus
                captionLayout="dropdown-buttons"
                fromYear={2020}
                toYear={new Date().getFullYear() + 5}
              />
            </PopoverContent>
          </Popover>

          <Dialog open={isFinDialogOpen} onOpenChange={setIsFinDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="h-12 hover-elevate active-elevate-2 shadow-lg shadow-primary/20 bg-primary font-bold text-white">
                <Plus className="mr-2 h-5 w-5" />
                Register Finance
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px] overflow-y-auto max-h-[90vh]">
              <DialogHeader>
                <DialogTitle className="text-2xl font-display flex items-center gap-2">
                  <ReceiptText className="h-6 w-6 text-primary" />
                  New Financial Record
                </DialogTitle>
                <DialogDescription>
                  Fill in the details below to log income or expenses for your farm.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="bg-muted/50 rounded-xl h-11">
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="income">Income</SelectItem>
                                <SelectItem value="expense">Expense</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger className="bg-muted/50 rounded-xl h-11">
                                  <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {categories?.filter(c => c.type === 'expense_category').map(c => (
                                  <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="animalId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{type === "income" ? "Livestock Sold" : "Flock / Batch (Optional)"} {type === "income" && <span className="text-destructive">*</span>}</FormLabel>
                          <Select
                            onValueChange={(val) => field.onChange(val === "none" ? null : parseInt(val))}
                            value={field.value?.toString() || "none"}
                          >
                            <FormControl>
                              <SelectTrigger className="bg-muted/50 rounded-xl h-11">
                                <SelectValue placeholder="Link to a specific flock" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">None / General Expense</SelectItem>
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
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl><Input placeholder="e.g. Sale of 5 pigs" {...field} className="bg-muted/50 h-11 rounded-xl" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="units"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{type === "income" ? "Heads Sold" : "Units / Qty"}</FormLabel>
                            <FormControl><Input type="number" step="0.1" {...field} className="bg-muted/50 h-11 rounded-xl" /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="pricePerUnit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Price/Unit (₱)</FormLabel>
                            <FormControl><Input type="number" step="0.01" {...field} className="bg-muted/50 h-11 rounded-xl" /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="amount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Total Amount (₱)</FormLabel>
                            <FormControl><Input type="number" step="0.01" {...field} className="bg-muted/50 font-bold text-primary h-11 rounded-xl" /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Record Date</FormLabel>
                            <FormControl>
                              <Input
                                type="date"
                                value={field.value instanceof Date ? field.value.toISOString().split('T')[0] : field.value}
                                onChange={(e) => field.onChange(new Date(e.target.value))}
                                className="bg-muted/50 h-11 rounded-xl"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="note"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Internal Notes</FormLabel>
                          <FormControl><Input placeholder="Additional details..." {...field} value={field.value || ""} className="bg-muted/50 h-11 rounded-xl" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="attachments"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Paperclip className="h-4 w-4" /> Attachment URLs
                          </FormLabel>
                          <FormControl><Input placeholder="Comma separated URLs" {...field} value={field.value || ""} className="bg-muted/50 h-11 rounded-xl" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" className="w-full h-12 text-lg font-bold text-white rounded-xl shadow-lg" disabled={mutation.isPending}>
                      {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Save Record
                    </Button>
                  </form>
                </Form>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="hover-elevate border-primary/10 shadow-sm overflow-hidden group rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground font-display">Total Tracked</CardTitle>
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <PawPrint className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-display font-black tracking-tighter text-foreground">{animalList.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Animals in roster</p>
          </CardContent>
        </Card>

        <Card className="hover-elevate border-emerald-500/20 shadow-sm overflow-hidden group rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground font-display">Healthy</CardTitle>
            <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Activity className="h-4 w-4 text-emerald-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-display font-black tracking-tighter text-emerald-600 dark:text-emerald-400">{healthyCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Optimal condition</p>
          </CardContent>
        </Card>

        <Card className="hover-elevate border-red-500/20 shadow-sm overflow-hidden group rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground font-display">Critical</CardTitle>
            <div className="h-8 w-8 rounded-full bg-red-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-display font-black tracking-tighter text-red-600 dark:text-red-400">{criticalCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Needs attention</p>
          </CardContent>
        </Card>

        <Card className="hover-elevate border-amber-500/20 shadow-sm overflow-hidden group rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground font-display">Expenses</CardTitle>
            <div className="h-8 w-8 rounded-full bg-amber-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="text-xs font-bold text-amber-500">₱</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-display font-black tracking-tighter text-amber-600">₱{totalExpenses.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">{filterDate ? `On ${format(filterDate, "PP")}` : "Total operational cost"}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold font-display flex items-center gap-2 text-foreground">
              <PawPrint className="h-6 w-6 text-primary/60" />
              Recently Sighted
            </h2>
            <Button variant="ghost" size="sm" asChild className="font-bold text-primary hover:bg-primary/5">
              <Link href="/animals">View All <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {recentAnimals.length > 0 ? (
              recentAnimals.map((animal) => (
                <AnimalCard key={animal.id} animal={animal} />
              ))
            ) : (
              <div className="p-12 text-center border-2 border-dashed rounded-2xl text-muted-foreground">
                No animals registered yet.
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold font-display text-foreground flex items-center gap-2">
              <Utensils className="h-6 w-6 text-primary/60" />
              {filterDate ? "Daily Feedings" : "Recent Feedings"}
            </h2>
            <Button variant="ghost" size="sm" asChild className="font-bold text-primary hover:bg-primary/5">
              <Link href="/feeds">View Log <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
          <Card className="border-border/50 shadow-md rounded-2xl overflow-hidden glass-card">
            <CardContent className="p-0">
              {displayFeeds.length > 0 ? (
                <div className="divide-y divide-border/50">
                  {displayFeeds.map((f) => (
                    <div key={f.id} className="p-6 flex items-center justify-between hover:bg-muted/30 transition-all group">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Utensils className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <p className="font-bold text-lg text-foreground group-hover:text-primary transition-colors uppercase tracking-tight">{f.animal?.name || "Unknown"} fed {f.foodType}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                            <span className="uppercase font-bold text-muted-foreground/70">{f.quantity} {f.unit}</span>
                            <span>•</span>
                            <span>{formatDistanceToNow(new Date(f.fedAt), { addSuffix: true })}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-display font-black tracking-tighter text-red-600">
                          ₱{parseFloat(f.totalCost).toLocaleString()}
                        </div>
                        <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-tighter mt-0.5">Feed Cost</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-20 text-center text-muted-foreground flex flex-col items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center opacity-50">
                    <Utensils className="h-8 w-8" />
                  </div>
                  <div>
                    <p className="font-bold text-sm uppercase tracking-widest text-foreground">No feedings found</p>
                    <p className="text-xs mt-1 italic text-muted-foreground">
                      {filterDate ? `No activity on ${format(filterDate, "PPP")}` : "No recent feeding records."}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
