import { useQuery, useMutation } from "@tanstack/react-query";
import { Feed, Animal, InsertFeed } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertFeedSchema } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Loader2, Utensils, Scale, DollarSign } from "lucide-react";
import { useEffect } from "react";
import { z } from "zod";

export default function Feeds() {
  const { toast } = useToast();
  const { data: animals } = useQuery<Animal[]>({ queryKey: ["/api/animals"] });
  const { data: feeds, isLoading } = useQuery<(Feed & { animal?: Animal })[]>({
    queryKey: ["/api/feeds"],
  });

  const form = useForm<any>({
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

  const quantity = form.watch("quantity");
  const pricePerUnit = form.watch("pricePerUnit");

  useEffect(() => {
    const total = parseFloat(quantity || "0") * parseFloat(pricePerUnit || "0");
    form.setValue("totalCost", total.toFixed(2));
  }, [quantity, pricePerUnit, form]);

  const mutation = useMutation({
    mutationFn: async (values: any) => {
      const { animalId, ...rest } = values;
      const res = await apiRequest("POST", `/api/animals/${animalId}/feeds`, rest);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/feeds"] });
      queryClient.invalidateQueries({ queryKey: ["/api/finances"] });
      toast({ title: "Success", description: "Feeding session logged." });
      form.reset();
    },
  });

  if (isLoading) return <div className="p-8 flex justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Nutrition & Feeding</h1>
        <p className="text-muted-foreground mt-2">Manage animal diet and track feeding expenses.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Log Feeding</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
                <FormField
                  control={form.control}
                  name="animalId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Animal</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
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
                  control={form.control}
                  name="foodType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Food Type</FormLabel>
                      <FormControl><Input placeholder="e.g. Grass, Meat, Fruit" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantity</FormLabel>
                        <FormControl><Input type="number" step="0.1" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="unit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unit</FormLabel>
                        <FormControl><Input placeholder="kg" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="pricePerUnit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price per Unit ($)</FormLabel>
                      <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="p-3 bg-muted rounded-lg flex items-center justify-between">
                  <span className="text-sm font-medium">Estimated Total:</span>
                  <span className="font-bold text-primary">${form.watch("totalCost")}</span>
                </div>
                <Button type="submit" className="w-full" disabled={mutation.isPending}>
                  {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Log Feeding
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Feeding History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {feeds?.map((f) => (
                <div key={f.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Utensils className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{f.animal?.name || "Unknown Animal"} fed {f.foodType}</p>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1"><Scale className="h-3 w-3" /> {f.quantity} {f.unit}</span>
                        <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" /> ${parseFloat(f.totalCost).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">{format(new Date(f.fedAt), "MMM d, yyyy")}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(f.fedAt), "h:mm a")}</p>
                  </div>
                </div>
              ))}
              {feeds?.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  No feeding logs yet.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
