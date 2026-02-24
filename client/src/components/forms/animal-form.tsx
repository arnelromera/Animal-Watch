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
  age: z.coerce.number().min(0).optional().or(z.literal("").transform(() => undefined)),
});

type FormValues = z.infer<typeof formSchema>;

interface AnimalFormProps {
  initialData?: Animal;
  onSuccess?: () => void;
}

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
      species: initialData?.species || "",
      age: initialData?.age ?? undefined,
      healthStatus: initialData?.healthStatus || "Unknown",
      location: initialData?.location || "",
      imageUrl: initialData?.imageUrl || "",
    },
  });

  async function onSubmit(data: FormValues) {
    try {
      if (isEditing && initialData) {
        await updateMutation.mutateAsync({ id: initialData.id, data });
        toast({
          title: "Animal updated",
          description: `${data.name} has been successfully updated.`,
        });
      } else {
        await createMutation.mutateAsync(data);
        toast({
          title: "Animal created",
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
                <FormLabel>Identifier / Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Leo, Tracker #402" {...field} className="bg-background" />
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
                <FormLabel>Species</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Panthera leo" {...field} className="bg-background" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="age"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estimated Age (Years)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="Optional" {...field} value={field.value ?? ""} className="bg-background" />
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
              <FormLabel>Primary Location / Sector</FormLabel>
              <FormControl>
                <Input placeholder="e.g. North Ridge, Sector 4" {...field} className="bg-background" />
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
              <FormLabel>Image URL</FormLabel>
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
            {isEditing ? "Save Changes" : "Register Animal"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
