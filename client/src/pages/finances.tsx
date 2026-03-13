import { useQuery, useMutation } from "@tanstack/react-query";
import { Transaction, InsertTransaction, Animal, Category } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTransactionSchema } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { format, isSameDay } from "date-fns";
import { Loader2, Plus, TrendingDown, TrendingUp, Wallet, Paperclip, FileText, ReceiptText, BarChart3, PieChart as PieChartIcon, Calendar as CalendarIcon, X } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from "recharts";
import { useEffect, useState, useMemo } from "react";
import { Link } from "wouter";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

// Enhanced validation schema for the form
const financeFormSchema = insertTransactionSchema.extend({
  description: z.string().min(1, "Description is required"),
  amount: z.string().refine((val) => parseFloat(val) >= 0, "Amount must be valid"),
  category: z.string().min(1, "Category is required"),
  units: z.string().min(1, "Units is required"),
  pricePerUnit: z.string().min(1, "Price per unit is required"),
  animalId: z.number().nullable(),
}).superRefine((data, ctx) => {
  if (data.type === "income" && !data.animalId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Please select which flock was sold",
      path: ["animalId"],
    });
  }
});

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

export default function Finances() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [chartType, setChartType] = useState<"bar" | "pie">("bar");
  const [filterDate, setFilterDate] = useState<Date | undefined>(undefined);

  const { data: animals } = useQuery<Animal[]>({ queryKey: ["/api/animals"] });
  const { data: categories } = useQuery<Category[]>({ queryKey: ["/api/categories"] });

  const { data: allTransactions, isLoading } = useQuery<(Transaction & { animal?: Animal })[]>({
    queryKey: ["/api/finances"],
  });

  const mutation = useMutation({
    mutationFn: async (values: InsertTransaction) => {
      const res = await apiRequest("POST", "/api/finances", values);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/finances"] });
      toast({ title: "Success", description: "Transaction recorded." });
      form.reset();
      setIsDialogOpen(false);
    },
  });

  const form = useForm<any>({
    resolver: zodResolver(financeFormSchema),
    defaultValues: {
      description: "",
      amount: "0.00",
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
    form.setValue("amount", total.toFixed(2));
  }, [units, pricePerUnit, form]);

  // Automatically set category for income based on animal species from categories table
  useEffect(() => {
    if (type === "income" && animalId && animals && categories) {
      const selectedAnimal = animals.find(a => a.id === animalId);
      if (selectedAnimal) {
        // Look for matching income category in dynamic categories
        const searchName = `Sale of ${selectedAnimal.species.charAt(0).toUpperCase() + selectedAnimal.species.slice(1).toLowerCase()}`;
        const match = categories.find(c => c.type === 'income_category' && c.name === searchName);
        if (match) {
          form.setValue("category", match.name);
        } else {
          form.setValue("category", "Income"); // Fallback
        }
      }
    }
  }, [type, animalId, animals, categories, form]);

  const filteredTransactions = useMemo(() => {
    if (!allTransactions) return [];
    if (!filterDate) return allTransactions;

    return allTransactions.filter(t => isSameDay(new Date(t.date), filterDate));
  }, [allTransactions, filterDate]);

  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredTransactions.forEach(t => {
      const cat = t.category;
      counts[cat] = (counts[cat] || 0) + parseFloat(t.amount);
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filteredTransactions]);

  const totalIncome = useMemo(() =>
    filteredTransactions.filter(t => t.type === "income").reduce((acc, t) => acc + parseFloat(t.amount), 0)
  , [filteredTransactions]);

  const totalExpenses = useMemo(() =>
    filteredTransactions.filter(t => t.type === "expense").reduce((acc, t) => acc + parseFloat(t.amount), 0)
  , [filteredTransactions]);

  const balance = totalIncome - totalExpenses;

  const chartData = useMemo(() =>
    [...filteredTransactions].slice(0, 15).reverse().map(t => ({
      name: format(new Date(t.date), "MMM d"),
      amount: parseFloat(t.amount),
      type: t.type,
      fullDate: format(new Date(t.date), "PP"),
      description: t.description
    }))
  , [filteredTransactions]);

  const handleClearFilter = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFilterDate(undefined);
  };

  const handleDateSelect = (date: Date | undefined) => {
    setFilterDate(date);
  };

  if (isLoading) return <div className="p-8 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500 h-full overflow-y-auto scrollbar-hide text-foreground">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 shrink-0">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold font-display uppercase tracking-tight">Financial Oversight</h1>
          <p className="text-muted-foreground mt-2 text-sm md:text-base font-medium">Track revenue and operational costs across your livestock batches.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Date Filter */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn(
                "h-12 px-4 font-bold border-2 transition-all relative group bg-background",
                filterDate ? "border-primary text-primary bg-primary/5" : "border-border"
              )}>
                <CalendarIcon className="mr-2 h-5 w-5" />
                {filterDate ? format(filterDate, "PPP") : "Filter by Date"}
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

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="h-12 hover-elevate active-elevate-2 shadow-lg shadow-primary/20 bg-primary font-bold text-white px-6 rounded-xl">
                <Plus className="mr-2 h-5 w-5" />
                Register Finance
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px] overflow-hidden scrollbar-hide rounded-2xl border-border/50 shadow-2xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-display flex items-center gap-2 text-foreground font-black uppercase tracking-tight">
                  <ReceiptText className="h-6 w-6 text-primary" />
                  New Financial Record
                </DialogTitle>
                <DialogDescription className="text-muted-foreground text-[11px] font-bold uppercase tracking-widest">
                  Log farm revenue or expenditures.
                </DialogDescription>
              </DialogHeader>
              <div className="py-2 scrollbar-hide">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[10px] font-black uppercase tracking-widest text-foreground">Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="bg-muted/50 rounded-xl h-11 border-border/50 text-foreground font-medium">
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="rounded-xl border-border/50">
                                <SelectItem value="income">Income</SelectItem>
                                <SelectItem value="expense">Expense</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {type !== "income" && (
                        <FormField
                          control={form.control}
                          name="category"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-[10px] font-black uppercase tracking-widest text-foreground">Category</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger className="bg-muted/50 rounded-xl h-11 border-border/50 text-foreground font-medium">
                                    <SelectValue placeholder="Select category" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="rounded-xl border-border/50">
                                  {categories?.filter(c => c.type === 'expense_category').map(c => (
                                    <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                                  ))}
                                  {categories?.filter(c => c.type === 'expense_category').length === 0 && (
                                    <SelectItem value="Others">Others</SelectItem>
                                  )}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>

                    <FormField
                      control={form.control}
                      name="animalId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-black uppercase tracking-widest text-foreground">{type === "income" ? "Heads Sold" : "Units / Qty"} {type === "income" && <span className="text-destructive">*</span>}</FormLabel>
                          <Select
                            onValueChange={(val) => field.onChange(val === "none" ? null : parseInt(val))}
                            value={field.value?.toString() || "none"}
                          >
                            <FormControl>
                              <SelectTrigger className="bg-muted/50 rounded-xl h-11 border-border/50 text-foreground font-medium">
                                <SelectValue placeholder={type === "income" ? "Select livestock" : "Link to batch"} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="rounded-xl border-border/50">
                              <SelectItem value="none">{type === "income" ? "Select batch..." : "None / General Expense"}</SelectItem>
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
                          <FormLabel className="text-[10px] font-black uppercase tracking-widest text-foreground">Description</FormLabel>
                          <FormControl><Input placeholder={type === "income" ? "Market sale" : "Supplies purchase"} {...field} className="bg-muted/50 h-11 rounded-xl border-border/50 text-foreground font-medium" /></FormControl>
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
                          <FormLabel className="text-[10px] font-black uppercase tracking-widest text-foreground">{type === "income" ? "Heads Sold" : "Qty"} <span className="text-destructive">*</span></FormLabel>
                          <FormControl><Input type="number" step="0.1" {...field} className="bg-muted/50 h-11 rounded-xl border-border/50 text-foreground font-medium" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="pricePerUnit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-black uppercase tracking-widest text-foreground">Price/Unit (₱) <span className="text-destructive">*</span></FormLabel>
                          <FormControl><Input type="number" step="0.01" {...field} className="bg-muted/50 h-11 rounded-xl border-border/50 text-foreground font-medium" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 items-end">
                    <FormField
                      control={form.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-black uppercase tracking-widest text-foreground">Calculated Total (₱)</FormLabel>
                          <FormControl>
                            <div className="bg-primary/5 border border-primary/20 rounded-xl h-11 flex items-center px-4 shadow-inner">
                              <span className="font-display font-black text-primary text-lg">₱{field.value}</span>
                              <Input type="hidden" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel className="text-[10px] font-black uppercase tracking-widest text-foreground mb-2">Record Date <span className="text-destructive">*</span></FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "h-11 px-4 font-bold border-2 transition-all bg-muted/30 border-border/50 rounded-xl",
                                    !field.value && "text-muted-foreground",
                                    field.value && "border-primary text-primary bg-primary/5"
                                  )}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                                initialFocus
                                captionLayout="dropdown-buttons"
                                fromYear={2020}
                                toYear={new Date().getFullYear()}
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button type="submit" className="w-full h-12 text-lg font-black text-white rounded-xl shadow-lg bg-primary hover:bg-primary/90 transition-all uppercase tracking-widest text-xs mt-2" disabled={mutation.isPending}>
                    {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Financial Record
                  </Button>
                </form>
              </Form>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0">
        <Card className="hover-elevate bg-primary/5 border-primary/20 shadow-sm overflow-hidden group rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground font-display">Net Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-4xl font-display font-black tracking-tighter ${balance >= 0 ? "text-emerald-600" : "text-red-600"}`}>
              ₱{balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <div className="flex items-center gap-2 mt-3 text-muted-foreground">
              <div className="h-8 w-8 rounded-full bg-background flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform border border-border/50">
                <Wallet className="h-4 w-4" />
              </div>
              <span className="text-xs font-medium">{filterDate ? `On ${format(filterDate, "PP")}` : "Available Funds"}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-elevate border-emerald-500/20 shadow-sm overflow-hidden group rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground font-display">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-display font-black tracking-tighter text-emerald-600">₱{totalIncome.toLocaleString()}</div>
            <div className="flex items-center gap-2 mt-3 text-emerald-600/70">
              <div className="h-8 w-8 rounded-full bg-emerald flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform border border-emerald-100">
                <TrendingUp className="h-4 w-4" />
              </div>
              <span className="text-xs font-medium font-bold uppercase tracking-widest text-[9px]">Income Earned</span>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-elevate border-red-500/20 shadow-sm overflow-hidden group rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground font-display">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-4xl font-display font-black tracking-tighter ${totalExpenses > 0 ? "text-red-600" : "text-muted-foreground"}`}>₱{totalExpenses.toLocaleString()}</div>
            <div className="flex items-center gap-2 mt-3 text-red-600/70">
              <div className="h-8 w-8 rounded-full bg-red flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform border border-red-100">
                <TrendingDown className="h-4 w-4" />
              </div>
              <span className="text-xs font-medium font-bold uppercase tracking-widest text-[9px]">Operations Cost</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-10 flex-1 min-h-0">
        {/* Graph Section */}
        <Card className="lg:col-span-2 overflow-hidden border-border/50 shadow-md glass-card flex flex-col h-[600px] rounded-3xl animate-in zoom-in-95 duration-500">
          <CardHeader className="bg-muted/10 border-b border-border/50 p-8 flex flex-row items-center justify-between shrink-0">
            <div>
              <CardTitle className="text-2xl font-display font-black uppercase tracking-tight text-foreground">Performance History</CardTitle>
              <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mt-1">Transaction trends and breakdown</p>
            </div>

            <Tabs value={chartType} onValueChange={(v) => setChartType(v as "bar" | "pie")} className="w-[200px]">
              <TabsList className="grid w-full grid-cols-2 rounded-xl h-10 p-1 bg-muted/50 border border-border/50 shadow-inner">
                <TabsTrigger value="bar" className="flex items-center gap-2 rounded-lg text-xs font-black uppercase tracking-widest text-muted-foreground data-[state=active]:text-primary data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">
                  <BarChart3 className="h-3 w-3" /> Bar
                </TabsTrigger>
                <TabsTrigger value="pie" className="flex items-center gap-2 rounded-lg text-xs font-black uppercase tracking-widest text-muted-foreground data-[state=active]:text-primary data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">
                  <PieChartIcon className="h-3 w-3" /> Pie
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>

          <CardContent className="pt-8 flex-1">
            <div className="h-full w-full">
              {chartType === "bar" ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground))" opacity={0.1} />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10, fontWeight: 'bold' }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10, fontWeight: 'bold' }}
                      tickFormatter={(val) => `₱${val.toLocaleString()}`}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-background border border-border shadow-2xl p-4 rounded-2xl min-w-[180px] animate-in zoom-in-95 duration-200">
                              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-black border-b border-border pb-2 mb-2">{data.fullDate}</p>
                              <p className="font-black text-xs text-foreground uppercase tracking-tight line-clamp-2">{data.description}</p>
                              <p className={`text-xl font-display font-black mt-3 ${data.type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>
                                {data.type === 'income' ? '+' : '-'}₱{data.amount.toLocaleString()}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="amount" radius={[8, 8, 0, 0]} barSize={32}>
                      {chartData?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.type === "income" ? "#10b981" : "#ef4444"} className="hover:opacity-80 transition-opacity cursor-pointer" />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={100}
                      outerRadius={160}
                      paddingAngle={8}
                      dataKey="value"
                      stroke="none"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="hover:opacity-80 transition-opacity cursor-pointer shadow-lg" />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: '20px',
                        border: 'none',
                        boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)',
                        padding: '16px',
                        backgroundColor: 'hsl(var(--background))',
                        fontWeight: 'bold'
                      }}
                      itemStyle={{ color: 'hsl(var(--foreground))' }}
                      formatter={(value: number) => `₱${value.toLocaleString()}`}
                    />
                    <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.1em' }}/>
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Transaction Ledger Section */}
        <Card className="overflow-hidden border-border/50 shadow-md flex flex-col h-[600px] rounded-3xl bg-card animate-in slide-in-from-right duration-500">
          <CardHeader className="bg-muted/10 border-b border-border/50 p-8 flex flex-row items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <ReceiptText className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-xl font-display font-black uppercase tracking-tight text-foreground">Ledger</h2>
            </div>
            <div className="text-[9px] text-muted-foreground font-black uppercase tracking-[0.2em] bg-muted/50 px-4 py-1.5 rounded-full border border-border/50 shadow-inner">
              {filteredTransactions?.length || 0} RECORDS
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-hidden">
            <ScrollArea className="h-full scrollbar-hide">
              <div className="divide-y divide-border/30">
                {filteredTransactions?.map((t) => (
                  <div key={t.id} className="group hover:bg-muted/20 flex items-center justify-between p-6 transition-all border-l-4 border-transparent hover:border-primary/40 relative overflow-hidden">
                    <div className="flex items-center gap-4 min-w-0 relative z-10">
                      <div className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-110 ${t.type === 'income' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                        {t.type === 'income' ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                      </div>
                      <div className="min-w-0 space-y-1">
                        <p className="font-black text-sm text-foreground group-hover:text-primary transition-colors truncate uppercase tracking-tight">{t.description}</p>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                          <span className="bg-muted px-2 py-0.5 rounded-md border border-border/50">{t.category}</span>
                          <span className="text-muted-foreground/30">•</span>
                          <span>{format(new Date(t.date), "MMM d")}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0 ml-4 relative z-10">
                      <div className={`text-lg font-display font-black tracking-tighter ${t.type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>
                        {t.type === 'income' ? '+' : '-'}₱{parseFloat(t.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>
                ))}
                {filteredTransactions.length === 0 && (
                  <div className="p-20 text-center text-muted-foreground flex flex-col items-center justify-center gap-6 h-full animate-pulse">
                    <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center border border-border/50 shadow-inner">
                      <X className="h-10 w-10 opacity-30" />
                    </div>
                    <div className="space-y-2">
                      <p className="font-black text-sm uppercase tracking-[0.2em] text-foreground">Audit Clear</p>
                      <p className="text-xs font-bold italic opacity-60">No financial footprints found</p>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
