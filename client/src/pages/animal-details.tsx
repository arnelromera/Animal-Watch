import { useState, useMemo } from "react";
import { useRoute, useLocation } from "wouter";
import { useAnimal, useDeleteAnimal } from "@/hooks/use-animals";
import { format, formatDistanceToNow } from "date-fns";
import { 
  ArrowLeft, Edit, Trash2, MapPin, Calendar, 
  Activity, ClipboardList, PawPrint, Utensils, Scale, PieChart as PieChartIcon,
  TrendingUp, TrendingDown, Wallet, FileText, ReceiptText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AnimalForm } from "@/components/forms/animal-form";
import { ObservationForm } from "@/components/forms/observation-form";
import { getHealthColor } from "@/components/animal-card";
import {
  Dialog,
  DialogContent,
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
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function AnimalDetails() {
  const [, params] = useRoute("/animals/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const animalId = params?.id ? parseInt(params.id, 10) : 0;
  const { data: animal, isLoading, error } = useAnimal(animalId);
  const deleteMutation = useDeleteAnimal();
  
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isObservationDialogOpen, setIsObservationDialogOpen] = useState(false);

  // Financial Calculations & Ledger
  const financialData = useMemo(() => {
    if (!animal) return { categories: [], totalExpenses: 0, totalIncome: 0, net: 0, ledger: [] };

    const expensesMap: Record<string, number> = {};
    let totalExpenses = 0;
    let totalIncome = 0;
    const ledger: any[] = [];

    // 1. Process Feeds
    animal.feeds?.forEach(f => {
      const amount = parseFloat(f.totalCost);
      expensesMap["Feed"] = (expensesMap["Feed"] || 0) + amount;
      totalExpenses += amount;
      ledger.push({
        id: `feed-${f.id}`,
        type: 'expense',
        category: 'Feed',
        description: `Nutrition: ${f.foodType}`,
        amount: amount,
        date: new Date(f.fedAt),
        details: `${f.quantity} ${f.unit}`
      });
    });

    // 2. Process Linked Transactions
    animal.transactions?.forEach(t => {
      const amount = parseFloat(t.amount);
      if (t.type === "expense") {
        const categoryLabel = t.category.charAt(0).toUpperCase() + t.category.slice(1);
        expensesMap[categoryLabel] = (expensesMap[categoryLabel] || 0) + amount;
        totalExpenses += amount;
        ledger.push({
          id: `tx-${t.id}`,
          type: 'expense',
          category: categoryLabel,
          description: t.description,
          amount: amount,
          date: new Date(t.date),
          details: t.note
        });
      } else {
        totalIncome += amount;
        ledger.push({
          id: `tx-${t.id}`,
          type: 'income',
          category: 'Sale',
          description: t.description,
          amount: amount,
          date: new Date(t.date),
          details: t.note
        });
      }
    });

    const categories = Object.entries(expensesMap).map(([name, value]) => ({
      name,
      value
    }));

    // Sort ledger by date newest first
    ledger.sort((a, b) => b.date.getTime() - a.date.getTime());

    return {
      categories,
      totalExpenses,
      totalIncome,
      net: totalIncome - totalExpenses,
      ledger
    };
  }, [animal]);

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  if (isLoading) return <div className="p-8 animate-pulse"><div className="h-10 w-32 bg-muted rounded mb-8"></div><div className="h-96 bg-muted rounded-xl"></div></div>;
  
  if (error || !animal) {
    return (
      <div className="p-8 text-center mt-20">
        <h2 className="text-2xl font-bold mb-4 text-foreground">Batch not found</h2>
        <p className="text-muted-foreground mb-6">The livestock record you're looking for might have been moved or deleted.</p>
        <Button onClick={() => setLocation("/animals")} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Roster
        </Button>
      </div>
    );
  }

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(animalId);
      toast({ title: "Livestock removed", description: "The record has been permanently deleted." });
      setLocation("/animals");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const observations = animal.observations || [];
  observations.sort((a, b) => new Date(b.observedAt || 0).getTime() - new Date(a.observedAt || 0).getTime());

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <Button variant="ghost" className="mb-2 pl-0 hover:bg-transparent hover:text-primary transition-colors font-bold" onClick={() => setLocation("/animals")}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Livestock Roster
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Profile Card */}
        <div className="lg:col-span-4 space-y-6">
          <div className="relative rounded-2xl overflow-hidden shadow-xl border border-border/50 bg-muted aspect-square group">
            {animal.imageUrl ? (
              <img src={animal.imageUrl} alt={animal.name} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-700" />
            ) : (
              <div className="w-full h-full vibrant-gradient flex items-center justify-center group-hover:scale-105 transition-transform duration-700">
                <PawPrint className="h-32 w-32 text-white/30" />
              </div>
            )}
            <div className="absolute top-4 right-4">
              <Badge variant="outline" className={`px-4 py-1.5 text-sm shadow-lg backdrop-blur-md font-bold uppercase tracking-wider ${getHealthColor(animal.healthStatus)}`}>
                {animal.healthStatus}
              </Badge>
            </div>
          </div>

          <Card className="border-border/60 shadow-xl overflow-hidden glass-card">
            <CardContent className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="text-[10px] font-black tracking-[0.2em] text-primary uppercase mb-1">{animal.species}</div>
                  <h1 className="text-4xl font-display font-black text-foreground tracking-tighter uppercase">{animal.name}</h1>
                </div>
                <div className="flex gap-2">
                  <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="icon" variant="ghost" className="h-10 w-10 rounded-full hover:bg-primary/10 hover:text-primary transition-all shadow-sm border border-border/50"><Edit className="h-4 w-4" /></Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px]">
                      <DialogHeader><DialogTitle className="text-2xl font-display font-bold">Edit Batch Details</DialogTitle></DialogHeader>
                      <AnimalForm initialData={animal} onSuccess={() => setIsEditDialogOpen(false)} />
                    </DialogContent>
                  </Dialog>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="icon" variant="ghost" className="h-10 w-10 rounded-full text-destructive hover:bg-destructive/10 transition-all shadow-sm border border-border/50"><Trash2 className="h-4 w-4" /></Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Record?</AlertDialogTitle>
                        <AlertDialogDescription>This will permanently delete the record for {animal.name}. This action cannot be undone.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Delete permanently</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 pt-6 border-t border-border/50">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5"><MapPin className="h-3 w-3 text-primary" /> Location</p>
                  <p className="text-sm font-black text-foreground">{animal.location}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5"><Calendar className="h-3 w-3 text-primary" /> Joined</p>
                  <p className="text-sm font-black text-foreground">{animal.startDate ? format(new Date(animal.startDate), "MMM d, yyyy") : "N/A"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5"><Activity className="h-3 w-3 text-primary" /> Quantity</p>
                  <p className="text-sm font-black text-foreground">{animal.count} HEAD</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5"><Wallet className="h-3 w-3 text-primary" /> Unit Price</p>
                  <p className="text-sm font-black text-foreground">₱{parseFloat(animal.pricePerLivestock || "0").toLocaleString()}</p>
                </div>
              </div>

              {animal.notes && (
                <div className="mt-8 pt-6 border-t border-border/50">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Health & Field Notes</p>
                  <p className="text-sm text-foreground/80 leading-relaxed font-medium bg-muted/30 p-4 rounded-xl border border-border/30">{animal.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Details & Logs Tabs */}
        <div className="lg:col-span-8">
          <Tabs defaultValue="observations" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8 bg-muted/50 p-1 rounded-2xl h-14">
              <TabsTrigger value="observations" className="rounded-xl font-bold uppercase text-[11px] tracking-widest data-[state=active]:shadow-lg">
                <ClipboardList className="h-4 w-4 mr-2" /> Notes
              </TabsTrigger>
              <TabsTrigger value="feeding" className="rounded-xl font-bold uppercase text-[11px] tracking-widest data-[state=active]:shadow-lg">
                <Utensils className="h-4 w-4 mr-2" /> Nutrition
              </TabsTrigger>
              <TabsTrigger value="financials" className="rounded-xl font-bold uppercase text-[11px] tracking-widest data-[state=active]:shadow-lg">
                <PieChartIcon className="h-4 w-4 mr-2" /> Financials
              </TabsTrigger>
            </TabsList>

            <TabsContent value="observations" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Card className="border-border/50 shadow-xl overflow-hidden rounded-2xl">
                <CardHeader className="flex flex-row items-center justify-between pb-6 border-b border-border/50 px-8">
                  <CardTitle className="text-xl font-display font-bold">Field Observations</CardTitle>
                  <Dialog open={isObservationDialogOpen} onOpenChange={setIsObservationDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="hover-elevate font-bold text-xs uppercase tracking-widest bg-primary shadow-lg shadow-primary/20 text-white">Log Entry</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle className="text-2xl font-display font-bold">New Field Observation</DialogTitle></DialogHeader>
                      <ObservationForm animalId={animal.id} onSuccess={() => setIsObservationDialogOpen(false)} />
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent className="p-0">
                  {observations.length > 0 ? (
                    <div className="divide-y divide-border/50">
                      {observations.map((obs) => (
                        <div key={obs.id} className="p-8 hover:bg-muted/20 transition-colors group">
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">{obs.observerName}</span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground bg-muted px-2 py-1 rounded-md">{obs.observedAt && formatDistanceToNow(new Date(obs.observedAt), { addSuffix: true })}</span>
                          </div>
                          <p className="text-foreground/80 leading-relaxed font-medium">{obs.notes}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-20 text-center text-muted-foreground italic">No field notes recorded yet.</div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="feeding" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Card className="border-border/50 shadow-xl overflow-hidden rounded-2xl">
                <CardHeader className="border-b border-border/50 px-8 py-6">
                  <CardTitle className="text-xl font-display font-bold">Dietary History</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {financialData.ledger.filter(l => l.category === 'Feed').length > 0 ? (
                    <div className="divide-y divide-border/50">
                      {financialData.ledger.filter(l => l.category === 'Feed').map((f) => (
                        <div key={f.id} className="p-8 flex items-center justify-between hover:bg-muted/20 transition-colors group">
                          <div className="flex items-center gap-6">
                            <div className="h-14 w-14 rounded-2xl vibrant-gradient flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                              <Utensils className="h-7 w-7 text-white" />
                            </div>
                            <div>
                              <p className="font-black text-xl uppercase tracking-tighter">{f.description.replace('Nutrition: ', '')}</p>
                              <div className="flex items-center gap-4 text-sm font-bold text-muted-foreground mt-1">
                                <span className="flex items-center gap-1.5"><Scale className="h-4 w-4 text-primary" /> {f.details}</span>
                                <span className="flex items-center gap-1.5 underline decoration-primary/30 decoration-2 underline-offset-4">₱{f.amount.toLocaleString()} TOTAL</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-black uppercase tracking-widest">{format(f.date, "MMM d, yyyy")}</p>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1 tracking-widest">{format(f.date, "h:mm a")}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-20 text-center text-muted-foreground italic">No feeding sessions logged for this animal.</div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="financials" className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
              {/* Batch Financial Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-border/50 shadow-lg group hover-elevate">
                  <CardContent className="p-6">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-2">Total Revenue</p>
                    <div className="text-3xl font-display font-black text-emerald-600 tracking-tighter flex items-center gap-2">
                      <TrendingUp className="h-6 w-6" />
                      ₱{financialData.totalIncome.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-border/50 shadow-lg group hover-elevate">
                  <CardContent className="p-6">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-2">Total Expenses</p>
                    <div className="text-3xl font-display font-black text-red-600 tracking-tighter flex items-center gap-2">
                      <TrendingDown className="h-6 w-6" />
                      ₱{financialData.totalExpenses.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-border/50 shadow-lg group hover-elevate vibrant-gradient border-none">
                  <CardContent className="p-6">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70 mb-2">Net Profit/Loss</p>
                    <div className="text-3xl font-display font-black text-white tracking-tighter flex items-center gap-2">
                      <Wallet className="h-6 w-6" />
                      ₱{financialData.net.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Pie Chart Analysis */}
                <Card className="border-border/50 shadow-xl rounded-2xl overflow-hidden flex flex-col h-[550px]">
                  <CardHeader className="border-b border-border/50 px-8 py-6">
                    <CardTitle className="text-xl font-display font-bold">Expense Distribution</CardTitle>
                  </CardHeader>
                  <CardContent className="p-8 flex-1 flex flex-col justify-center">
                    <div className="h-full w-full">
                      {financialData.categories.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={financialData.categories}
                              cx="50%"
                              cy="50%"
                              innerRadius={80}
                              outerRadius={140}
                              fill="#8884d8"
                              dataKey="value"
                              paddingAngle={5}
                            >
                              {financialData.categories.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{
                                borderRadius: '16px',
                                border: 'none',
                                boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                                padding: '12px 16px'
                              }}
                              formatter={(value: number) => `₱${value.toLocaleString()}`}
                            />
                            <Legend verticalAlign="bottom" height={36}/>
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full w-full flex flex-col items-center justify-center text-muted-foreground gap-4">
                          <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
                            <PieChartIcon className="h-10 w-10 text-muted-foreground/30" />
                          </div>
                          <p className="font-bold uppercase tracking-widest text-[10px]">No expense data to visualize</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Detailed Expense Ledger */}
                <Card className="border-border/50 shadow-xl rounded-2xl overflow-hidden flex flex-col h-[550px]">
                  <CardHeader className="border-b border-border/50 px-8 py-6 flex flex-row items-center justify-between">
                    <CardTitle className="text-xl font-display font-bold">Expense Audit</CardTitle>
                    <div className="text-[10px] font-black uppercase tracking-widest bg-muted px-2 py-1 rounded-md text-muted-foreground">Detailed Ledger</div>
                  </CardHeader>
                  <CardContent className="p-0 flex-1 overflow-hidden">
                    <ScrollArea className="h-full">
                      {financialData.ledger.length > 0 ? (
                        <div className="divide-y divide-border/50">
                          {financialData.ledger.map((item) => (
                            <div key={item.id} className="p-6 hover:bg-muted/20 transition-all flex items-center justify-between group">
                              <div className="flex items-center gap-4 min-w-0">
                                <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${item.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                  {item.category === 'Feed' ? <Utensils className="h-5 w-5" /> : <ReceiptText className="h-5 w-5" />}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-bold text-sm text-foreground truncate uppercase group-hover:text-primary transition-colors">{item.description}</p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/70">{item.category}</span>
                                    <span className="text-muted-foreground/30">•</span>
                                    <span className="text-[9px] font-bold text-muted-foreground uppercase">{format(item.date, "MMM d")}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right shrink-0 ml-4">
                                <div className={`text-base font-display font-black tracking-tighter ${item.type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>
                                  {item.type === 'income' ? '+' : '-'}₱{item.amount.toLocaleString()}
                                </div>
                                {item.details && (
                                  <p className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-tighter mt-0.5">{item.details}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-20 text-center text-muted-foreground flex flex-col items-center gap-4">
                          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center opacity-50">
                            <FileText className="h-8 w-8" />
                          </div>
                          <p className="font-bold text-xs uppercase tracking-widest">No financial records</p>
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
