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
  amount: z.string().refine((val) => parseFloat(val) > 0, "Amount must be greater than 0"),
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
      amount: "",
      type: "expense",
      category: "Others",
      animalId: null,
      units: "1",
      pricePerUnit: "",
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

  if (isLoading) return <div className="p-8 flex justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500 h-full overflow-y-auto scrollbar-hide">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 shrink-0">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold font-display text-foreground uppercase tracking-tight">Financial Oversight</h1>
          <p className="text-muted-foreground mt-2 text-sm md:text-base">Track revenue and operational costs across your livestock batches.</p>
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
            <DialogContent className="sm:max-w-[550px] overflow-y-auto max-h-[90vh] rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-display flex items-center gap-2 text-foreground font-black">
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
                            <FormLabel className="text-foreground font-bold">Type <span className="text-destructive">*</span></FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="bg-muted/50 rounded-xl h-11 border-border/50">
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
                              <FormLabel className="text-foreground font-bold">Category <span className="text-destructive">*</span></FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger className="bg-muted/50 rounded-xl h-11 border-border/50">
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
                          <FormLabel className="text-foreground font-bold">{type === "income" ? "Livestock Sold" : "Flock / Batch (Optional)"} {type === "income" && <span className="text-destructive">*</span>}</FormLabel>
                          <Select
                            onValueChange={(val) => field.onChange(val === "none" ? null : parseInt(val))}
                            value={field.value?.toString() || "none"}
                          >
                            <FormControl>
                              <SelectTrigger className="bg-muted/50 rounded-xl h-11 border-border/50">
                                <SelectValue placeholder={type === "income" ? "Select the livestock batch sold" : "Link to a specific flock"} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="rounded-xl border-border/50">
                              <SelectItem value="none">{type === "income" ? "Select a batch..." : "None / General Expense"}</SelectItem>
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
                          <FormLabel className="text-foreground font-bold">Description <span className="text-destructive">*</span></FormLabel>
                          <FormControl><Input placeholder={type === "income" ? "e.g. Sold 5 pigs to Market" : "e.g. Bought 10 bags of feed"} {...field} className="bg-muted/50 h-11 rounded-xl border-border/50" /></FormControl>
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
                          <FormLabel className="text-foreground font-bold">{type === "income" ? "Heads Sold" : "Units / Qty"} <span className="text-destructive">*</span></FormLabel>
                          <FormControl><Input type="number" step="0.1" {...field} className="bg-muted/30 h-11 rounded-xl border-border/50" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="pricePerUnit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground font-bold">Price/Unit (₱) <span className="text-destructive">*</span></FormLabel>
                          <FormControl><Input type="number" step="0.01" {...field} className="bg-muted/30 h-11 rounded-xl border-border/50" /></FormControl>
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
                          <FormLabel className="text-foreground font-bold">Total Amount (₱) <span className="text-destructive">*</span></FormLabel>
                          <FormControl><Input type="number" step="0.01" {...field} className="bg-muted/50 font-bold text-primary h-11 rounded-xl border-border/50" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground font-bold">Record Date</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              value={field.value instanceof Date ? field.value.toISOString().split('T')[0] : field.value}
                              onChange={(e) => field.onChange(new Date(e.target.value))}
                              className="bg-muted/50 h-11 rounded-xl border-border/50"
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
                        <FormLabel className="text-foreground font-bold">Internal Notes</FormLabel>
                        <FormControl><Input placeholder="Additional details..." {...field} value={field.value || ""} className="bg-muted/50 h-11 rounded-xl border-border/50" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="attachments"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 text-foreground font-bold">
                          <Paperclip className="h-4 w-4 text-primary" /> Attachment URLs
                      </FormLabel>
                        <FormControl><Input placeholder="Comma separated URLs" {...field} value={field.value || ""} className="bg-muted/50 h-11 rounded-xl border-border/50" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full h-12 text-lg font-bold text-white rounded-xl shadow-lg bg-primary hover:bg-primary/90 mt-4" disabled={mutation.isPending}>
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
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Net Balance</CardTitle>
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
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-display font-black tracking-tighter text-emerald-600">₱{totalIncome.toLocaleString()}</div>
            <div className="flex items-center gap-2 mt-3 text-emerald-600/70">
              <div className="h-8 w-8 rounded-full bg-emerald flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform border border-emerald-100">
                <TrendingUp className="h-4 w-4" />
              </div>
              <span className="text-xs font-medium">Income Earned</span>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-elevate border-red-500/20 shadow-sm overflow-hidden group rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-4xl font-display font-black tracking-tighter ${totalExpenses > 0 ? "text-red-600" : "text-muted-foreground"}`}>₱{totalExpenses.toLocaleString()}</div>
            <div className="flex items-center gap-2 mt-3 text-red-600/70">
              <div className="h-8 w-8 rounded-full bg-red flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform border border-red-100">
                <TrendingDown className="h-4 w-4" />
              </div>
              <span className="text-xs font-medium">Operations Cost</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-10 flex-1 min-h-0">
        {/* Graph Section */}
        <Card className="lg:col-span-2 overflow-hidden border-border/50 shadow-md glass-card flex flex-col h-[600px] rounded-2xl">
          <CardHeader className="bg-muted/10 border-b border-border/50 flex flex-row items-center justify-between shrink-0">
            <div>
              <CardTitle className="text-xl font-display text-foreground">Performance History</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">Transaction trends and breakdown</p>
            </div>

            <Tabs value={chartType} onValueChange={(v) => setChartType(v as "bar" | "pie")} className="w-[200px]">
              <TabsList className="grid w-full grid-cols-2 rounded-xl h-10 p-1 bg-muted/50">
                <TabsTrigger value="bar" className="flex items-center gap-2 rounded-lg text-xs font-bold uppercase tracking-wider text-muted-foreground data-[state=active]:text-primary">
                  <BarChart3 className="h-3 w-3" /> Bar
                </TabsTrigger>
                <TabsTrigger value="pie" className="flex items-center gap-2 rounded-lg text-xs font-bold uppercase tracking-wider text-muted-foreground data-[state=active]:text-primary">
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
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                      tickFormatter={(val) => `₱${val.toLocaleString()}`}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-background border border-border shadow-xl p-3 rounded-xl min-w-[150px]">
                              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">{data.fullDate}</p>
                              <p className="font-bold text-sm mt-1">{data.description}</p>
                              <p className={`text-lg font-black mt-2 ${data.type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>
                                ₱{data.amount.toLocaleString()}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="amount" radius={[6, 6, 0, 0]} barSize={40}>
                      {chartData?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.type === "income" ? "#10b981" : "#ef4444"} />
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
                      innerRadius={80}
                      outerRadius={160}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      formatter={(value: number) => `₱${value.toLocaleString()}`}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Transaction Ledger Section */}
        <Card className="overflow-hidden border-border/50 shadow-md flex flex-col h-[600px] rounded-2xl bg-card">
          <CardHeader className="bg-muted/10 border-b border-border/50 flex flex-row items-center justify-between shrink-0 px-6 py-4">
            <h2 className="text-lg font-bold font-display flex items-center gap-2 text-foreground">
              <TrendingDown className="h-5 w-5 text-primary/60" />
              Ledger
            </h2>
            <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest bg-muted px-3 py-1 rounded-full border border-border/50">
              {filteredTransactions?.length || 0} items
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-hidden">
            <ScrollArea className="h-full scrollbar-hide">
              <div className="divide-y divide-border/50">
                {filteredTransactions?.map((t) => (
                  <div key={t.id} className="group hover:bg-muted/30 flex items-center justify-between p-4 transition-all border-l-4 border-transparent hover:border-primary/30">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 shadow-inner ${t.type === 'income' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                        {t.type === 'income' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-foreground group-hover:text-primary transition-colors truncate uppercase tracking-tighter">{t.description}</p>
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium">
                          <span className="uppercase font-bold text-muted-foreground/70">{t.category}</span>
                          <span>•</span>
                          <span>{format(new Date(t.date), "MMM d")}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0 ml-2">
                      <div className={`text-base font-display font-black tracking-tighter ${t.type === "income" ? "text-emerald-600" : "text-red-600"}`}>
                        ₱{parseFloat(t.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>
                ))}
                {filteredTransactions.length === 0 && (
                  <div className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center gap-4 h-full">
                    <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center opacity-50 border border-border/50 shadow-inner">
                      <X className="h-8 w-8" />
                    </div>
                    <div>
                      <p className="font-black text-sm uppercase tracking-widest text-foreground">No records found</p>
                      <p className="text-xs mt-1 italic">Try a different date filter</p>
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
