import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertObservationSchema } from "@shared/schema";
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
import { useCreateObservation } from "@/hooks/use-animals";
import { useToast } from "@/hooks/use-toast";
import { Eye, Loader2 } from "lucide-react";

// animalId is handled via props and URL, omitted from form
const formSchema = insertObservationSchema.omit({ animalId: true });
type FormValues = z.infer<typeof formSchema>;

interface ObservationFormProps {
  animalId: number;
  onSuccess?: () => void;
}

export function ObservationForm({ animalId, onSuccess }: ObservationFormProps) {
  const { toast } = useToast();
  const createMutation = useCreateObservation();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      observerName: "",
      notes: "",
    },
  });

  async function onSubmit(data: FormValues) {
    try {
      await createMutation.mutateAsync({ animalId, data });
      toast({
        title: "Observation Logged",
        description: "The field notes have been securely recorded.",
      });
      form.reset();
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "Error logging observation",
        description: error.message,
        variant: "destructive",
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="observerName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ranger / Observer Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Dr. Jane Goodall" {...field} className="bg-background" />
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
              <FormLabel>Field Notes</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Describe behavior, location specifics, or physical condition observed..." 
                  className="min-h-32 resize-none bg-background" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end pt-2">
          <Button 
            type="submit" 
            disabled={createMutation.isPending}
            className="w-full sm:w-auto shadow-md shadow-primary/20 hover-elevate active-elevate-2"
          >
            {createMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Eye className="mr-2 h-4 w-4" />
            )}
            Log Observation
          </Button>
        </div>
      </form>
    </Form>
  );
}
