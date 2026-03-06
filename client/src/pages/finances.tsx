import { useQuery, useMutation } from "@tanstack/react-query";
import { Transaction, InsertTransaction, Animal } from "@shared/schema";
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
import { format } from "date-fns";
import { Loader2, Plus, TrendingDown, TrendingUp, Wallet, Paperclip, FileText } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useEffect } from "react";

const INCOME_CATEGORIES = [
  "sale of pig",
  "sale of goat",
  "sale of chicken",
  "sale of cow",
];

const EXPENSE_CATEGORIES = [
  "Events",
  "feed",
  "gas and electric",
  "general supplies",
  "labor and employment",
  "medication and vaccines",
  "others",
  "purchase of livestock",
];

export default function Finances() {
  const { toast } = useToast();
  const { data: animals } = useQuery<Animal[]>({ queryKey: ["/api/animals"] });
  const { data: transactions, isLoading } = useQuery<(Transaction & { animal?: Animal })[]>({
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
    },
  });

  const form = useForm<any>({
    resolver: zodResolver(insertTransactionSchema),
    defaultValues: {
      description: "",
      amount: "0",
      type: "expense",
      category: "others",
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

  useEffect(() => {
    const total = parseFloat(units || "0") * parseFloat(pricePerUnit || "0");
    if (total > 0) {
      form.setValue("amount", total.toFixed(2));
    }
  }, [units, pricePerUnit, form]);

  if (isLoading) return <div className="p-8 flex justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  const totalIncome = transactions?.filter(t => t.type === "income").reduce((acc, t) => acc + parseFloat(t.amount), 0) || 0;
  const totalExpenses = transactions?.filter(t => t.type === "expense").reduce((acc, t) => acc + parseFloat(t.amount), 0) || 0;
  const balance = totalIncome - totalExpenses;

  const chartData = transactions?.slice(0, 10).reverse().map(t => ({
    name: format(new Date(t.date), "MMM d"),
    amount: parseFloat(t.amount),
    type: t.type,
  }));

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Financial Oversight</h1>
        <p className="text-muted-foreground mt-2">Track revenue and operational costs across your livestock batches.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Net Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${balance >= 0 ? "text-emerald-600" : "text-red-600"}`}>
              ₱{balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <Wallet className="h-4 w-4 mt-2 text-muted-foreground" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600">₱{totalIncome.toLocaleString()}</div>
            <TrendingUp className="h-4 w-4 mt-2 text-emerald-500" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">₱{totalExpenses.toLocaleString()}</div>
            <TrendingDown className="h-4 w-4 mt-2 text-red-500" />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] mb-8">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="amount">
                    {chartData?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.type === "income" ? "#10b981" : "#ef4444"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-4">
              {transactions?.map((t) => (
                <div key={t.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{t.description}</p>
                      {t.animal && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                          {t.animal.name}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(t.date), "PPp")} • {t.category}
                    </p>
                    {t.note && (
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1 italic">
                        <FileText className="h-3 w-3" /> {t.note}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className={`font-bold ${t.type === "income" ? "text-emerald-600" : "text-red-600"}`}>
                      {t.type === "income" ? "+" : "-"}₱{parseFloat(t.amount).toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t.units} x ₱{parseFloat(t.pricePerUnit || "0").toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Log Transaction</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Transaction Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
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
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {type === "income" ? 
                            INCOME_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>) :
                            EXPENSE_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)
                          }
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="animalId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Flock / Batch</FormLabel>
                      <Select 
                        onValueChange={(val) => field.onChange(val === "none" ? null : parseInt(val))} 
                        value={field.value?.toString() || "none"}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select flock (optional)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">None / General</SelectItem>
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
                      <FormControl><Input placeholder="e.g. Sale of 5 pigs" {...field} /></FormControl>
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
                        <FormLabel>Units</FormLabel>
                        <FormControl><Input type="number" step="0.1" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="pricePerUnit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price per Unit (₱)</FormLabel>
                        <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Amount (₱)</FormLabel>
                      <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
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
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="note"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl><Input placeholder="Additional details..." {...field} value={field.value || ""} /></FormControl>
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
                      <FormControl><Input placeholder="Comma separated URLs" {...field} value={field.value || ""} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={mutation.isPending}>
                  {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Plus className="mr-2 h-4 w-4" /> Record Transaction
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
