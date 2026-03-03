import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertAnimalSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
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
import { PawPrint, Loader2 } from "lucide-react";

// Extend the schema to handle form string coercions
const formSchema = insertAnimalSchema.extend({
  count: z.coerce.number().min(1),
  pricePerLivestock: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid price format"),
  startDate: z.coerce.date(),
});

type FormValues = z.infer<typeof formSchema>;

interface AnimalFormProps {
  initialData?: Animal;
  onSuccess?: () => void;
}

const SPECIES_OPTIONS = ["Pig", "Goat", "Chicken", "Cow"];
const HEALTH_STATUSES = ["Healthy", "Injured", "Sick", "Monitoring", "Unknown"];

export function AnimalForm({ initialData, onSuccess }: AnimalFormProps) {
  const { toast } = useToast();
  const createMutation = useCreateAnimal();
  const updateMutation = useUpdateAnimal();

  const isEditing = !!initialData;
  const isPending = createMutation.isPending || updateMutation.isPending;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || "",
      species: initialData?.species || "Pig",
      count: initialData?.count ?? 1,
      pricePerLivestock: initialData?.pricePerLivestock || "0",
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
                <FormLabel>Flock Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. North Pasture Flock" {...field} className="bg-background" />
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
                <FormLabel>Livestock Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {SPECIES_OPTIONS.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
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
                <FormLabel>Number of Animals</FormLabel>
                <FormControl>
                  <Input type="number" {...field} className="bg-background" />
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
                <FormLabel>Price per Head ($)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} className="bg-background" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Date</FormLabel>
                <FormControl>
                  <Input 
                    type="date" 
                    value={field.value instanceof Date ? field.value.toISOString().split('T')[0] : field.value}
                    onChange={(e) => field.onChange(new Date(e.target.value))}
                    className="bg-background" 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="healthStatus"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Health Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Select a status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {HEALTH_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
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
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location / Pen</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Barn A, Pen 4" {...field} className="bg-background" />
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
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Additional details about this flock..." 
                  {...field} 
                  value={field.value ?? ""}
                  className="bg-background resize-none" 
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
              <FormLabel>Image URL (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="https://..." {...field} value={field.value ?? ""} className="bg-background" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end pt-4">
          <Button 
            type="submit" 
            disabled={isPending}
            className="w-full sm:w-auto shadow-md shadow-primary/20 hover-elevate active-elevate-2"
          >
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <PawPrint className="mr-2 h-4 w-4" />
            )}
            {isEditing ? "Save Changes" : "Register Flock"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
