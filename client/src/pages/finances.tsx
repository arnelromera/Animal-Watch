import { useQuery, useMutation } from "@tanstack/react-query";
import { Transaction, InsertTransaction } from "@shared/schema";
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
import { Loader2, Plus, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

export default function Finances() {
  const { toast } = useToast();
  const { data: transactions, isLoading } = useQuery<Transaction[]>({
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
    },
  });

  const form = useForm<InsertTransaction>({
    resolver: zodResolver(insertTransactionSchema),
    defaultValues: {
      description: "",
      amount: "0",
      type: "expense",
      category: "other",
    },
  });

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
        <p className="text-muted-foreground mt-2">Track budget, donations, and operational costs.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Net Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${balance >= 0 ? "text-emerald-600" : "text-red-600"}`}>
              ${balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <Wallet className="h-4 w-4 mt-2 text-muted-foreground" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600">${totalIncome.toLocaleString()}</div>
            <TrendingUp className="h-4 w-4 mt-2 text-emerald-500" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">${totalExpenses.toLocaleString()}</div>
            <TrendingDown className="h-4 w-4 mt-2 text-red-500" />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
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

            <div className="mt-8 space-y-4">
              {transactions?.map((t) => (
                <div key={t.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border">
                  <div>
                    <p className="font-medium">{t.description}</p>
                    <p className="text-sm text-muted-foreground">{format(new Date(t.date), "PPp")} • {t.category}</p>
                  </div>
                  <div className={`font-bold ${t.type === "income" ? "text-emerald-600" : "text-red-600"}`}>
                    {t.type === "income" ? "+" : "-"}${parseFloat(t.amount).toLocaleString()}
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
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl><Input placeholder="e.g. Monthly donation" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount ($)</FormLabel>
                      <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="food">Food & Feeding</SelectItem>
                          <SelectItem value="medical">Medical</SelectItem>
                          <SelectItem value="equipment">Equipment</SelectItem>
                          <SelectItem value="donation">Donation</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
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
