import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertAnimalSchema, type Category } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type Animal } from "@shared/schema";
import { useCreateAnimal, useUpdateAnimal } from "@/hooks/use-animals";
import { useToast } from "@/hooks/use-toast";
import { PawPrint, Loader2, Calendar as CalendarIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const formSchema = insertAnimalSchema.extend({
  name: z.string().min(1, "Flock Name is required").max(100, "Name is too long"),
  species: z.string().min(1, "Livestock Type is required"),
  count: z.coerce.number().min(1, "At least 1 animal is required"),
  pricePerLivestock: z.string()
    .min(1, "Price per Head is required")
    .regex(/^\d+(\.\d{1,2})?$/, "Invalid price format")
    .refine((val) => parseFloat(val) > 0, "Price must be greater than 0"),
  location: z.string().min(1, "Location is required"),
  startDate: z.preprocess((arg) => {
    if (typeof arg === "string" || arg instanceof Date) return new Date(arg);
    return arg;
  }, z.date()),
});

type FormValues = z.infer<typeof formSchema>;

interface AnimalFormProps {
  initialData?: Animal;
  onSuccess?: () => void;
}

export function AnimalForm({ initialData, onSuccess }: AnimalFormProps) {
  const { toast } = useToast();
  const createMutation = useCreateAnimal();
  const updateMutation = useUpdateAnimal();

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const speciesOptions = categories?.filter(c => c.type === 'species') || [];
  const healthStatuses = categories?.filter(c => c.type === 'health_status') || [];

  const isEditing = !!initialData;
  const isPending = createMutation.isPending || updateMutation.isPending;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || "",
      species: initialData?.species || "",
      count: initialData?.count ?? 1,
      pricePerLivestock: initialData?.pricePerLivestock || "",
      startDate: initialData?.startDate ? new Date(initialData.startDate) : new Date(),
      healthStatus: initialData?.healthStatus || "Healthy",
      location: initialData?.location || "",
      notes: initialData?.notes || "",
      imageUrl: initialData?.imageUrl || "",
    },
  });

  async function onSubmit(data: FormValues) {
    try {
      if (isEditing && initialData) {
        await updateMutation.mutateAsync({ id: initialData.id, data });
        toast({
          title: "Livestock updated",
          description: `${data.name} has been successfully updated.`,
        });
      } else {
        await createMutation.mutateAsync(data as any);
        toast({
          title: "Livestock registered",
          description: `${data.name} has been added to the roster.`,
        });
      }
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-foreground">Flock Name <span className="text-destructive">*</span></FormLabel>
                <FormControl>
                  <Input placeholder="e.g. North Pasture Flock" {...field} className="bg-muted/30 border-border/50 rounded-xl h-12 text-foreground font-medium" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="species"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-foreground">Livestock Type <span className="text-destructive">*</span></FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="bg-muted/30 border-border/50 rounded-xl h-12 text-foreground font-medium">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="rounded-xl border-border/50">
                    {speciesOptions.map((s) => (
                      <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                    ))}
                    {speciesOptions.length === 0 && (
                      <SelectItem value="Pig">Pig</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="count"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-foreground">Number of Animals <span className="text-destructive">*</span></FormLabel>
                <FormControl>
                  <Input type="number" {...field} className="bg-muted/30 border-border/50 rounded-xl h-12 text-foreground font-medium" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="pricePerLivestock"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-foreground">Price per Head (₱) <span className="text-destructive">*</span></FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} className="bg-muted/30 border-border/50 rounded-xl h-12 text-foreground font-medium font-bold text-primary" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-foreground mb-2">Start Date <span className="text-destructive">*</span></FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "h-12 px-4 font-bold border-2 transition-all relative group bg-muted/30 border-border/50 rounded-xl",
                          !field.value && "text-muted-foreground",
                          field.value && "border-primary text-primary bg-primary/5"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-5 w-5" />
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
                      toYear={new Date().getFullYear() + 5}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="healthStatus"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-foreground">Health Status</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="bg-muted/30 border-border/50 rounded-xl h-12 text-foreground font-medium">
                      <SelectValue placeholder="Select a status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="rounded-xl border-border/50">
                    {healthStatuses.map((status) => (
                      <SelectItem key={status.id} value={status.name}>
                        {status.name}
                      </SelectItem>
                    ))}
                    {healthStatuses.length === 0 && (
                      <SelectItem value="Healthy">Healthy</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[10px] font-black uppercase tracking-widest text-foreground">Location / Pen <span className="text-destructive">*</span></FormLabel>
              <FormControl>
                <Input placeholder="e.g. Barn A, Pen 4" {...field} className="bg-muted/30 border-border/50 rounded-xl h-12 text-foreground font-medium" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[10px] font-black uppercase tracking-widest text-foreground">Notes</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Additional details about this flock..." 
                  {...field} 
                  value={field.value ?? ""}
                  className="bg-muted/30 border-border/50 rounded-xl min-h-[100px] text-foreground font-medium resize-none"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="imageUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[10px] font-black uppercase tracking-widest text-foreground">Image URL (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="https://..." {...field} value={field.value ?? ""} className="bg-muted/30 border-border/50 rounded-xl h-12 text-foreground font-medium" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end pt-4">
          <Button 
            type="submit" 
            disabled={isPending}
            className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 font-black shadow-lg shadow-primary/20 hover-elevate active-elevate-2 transition-all text-white uppercase tracking-widest text-xs"
          >
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <PawPrint className="mr-2 h-4 w-4" />
            )}
            {isEditing ? "Save Changes" : "Register Master Flock"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
