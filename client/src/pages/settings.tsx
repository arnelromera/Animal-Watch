import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Palette, Bell, Shield, Database, Globe, Info, Lock, KeyRound, AlertCircle, Sun, Moon, Monitor, Loader2, Eye, EyeOff, Plus, Trash2, Tag, Settings2, PlusCircle, Volume2, Mail, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useEffect, useState, useMemo } from "react";
import { useUpdateUser } from "@/hooks/use-user";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Category, InsertCategory } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Please confirm your new password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

interface CategorySectionProps {
  title: string;
  type: string;
  description: string;
  categories: Category[];
  isPending: boolean;
  onAdd: (name: string) => void;
  onDelete: (id: number) => void;
}

const CategorySection = ({ title, type, description, categories, isPending, onAdd, onDelete }: CategorySectionProps) => {
  const [newItemName, setNewItemName] = useState("");
  const items = categories.filter(c => c.type === type);

  const handleAdd = () => {
    if (newItemName.trim()) {
      onAdd(newItemName.trim());
      setNewItemName("");
    }
  };

  return (
    <Card className="shadcn-card border bg-card text-card-foreground border-border/50 shadow-md rounded-3xl overflow-hidden glass-card h-full flex flex-col hover:border-primary/20 transition-all duration-300">
      <CardHeader className="bg-muted/5 border-b border-border/50 p-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Tag className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-lg font-display font-bold uppercase tracking-tight text-[#4b9461]">{title}</CardTitle>
            <CardDescription className="text-xs text-muted-foreground line-clamp-1">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6 flex-1 flex flex-col space-y-6">
        <div className="flex gap-2">
          <Input
            placeholder={`Add item...`}
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            className="bg-muted/30 border-border/50 rounded-xl h-11 text-foreground"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAdd();
              }
            }}
          />
          <Button
            onClick={handleAdd}
            disabled={!newItemName.trim() || isPending}
            className="rounded-xl bg-primary text-white font-bold h-11 px-6 shrink-0 hover-elevate active-elevate-2 shadow-sm flex items-center justify-center gap-2"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Add
          </Button>
        </div>

        <div className="flex flex-wrap gap-2 min-h-[40px]">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 border border-border/50 rounded-lg group animate-in fade-in zoom-in-95"
            >
              <span className="text-xs font-bold text-foreground">{item.name}</span>
              <button
                onClick={() => onDelete(item.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive p-0.5"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          {items.length === 0 && (
            <p className="text-xs text-muted-foreground/50 italic py-2">No items added yet.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const NotificationToggle = ({ title, description, defaultChecked = false }: { title: string, description: string, defaultChecked?: boolean }) => (
  <div className="flex items-center justify-between p-4 rounded-2xl border border-border/50 bg-muted/10 hover:bg-muted/20 transition-colors group">
    <div className="space-y-0.5">
      <div className="font-bold text-sm uppercase tracking-tight group-hover:text-primary transition-colors text-foreground">{title}</div>
      <div className="text-[11px] text-muted-foreground leading-relaxed max-w-[280px]">{description}</div>
    </div>
    <Switch defaultChecked={defaultChecked} />
  </div>
);

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const [location] = useLocation();
  const updateMutation = useUpdateUser();

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isTypeDialogOpen, setIsTypeDialogOpen] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");

  // Categories query
  const { data: categories = [], isLoading: isCategoriesLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (values: InsertCategory) => {
      const res = await apiRequest("POST", "/api/categories", values);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({ title: "Success", description: "Item added successfully." });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({ title: "Removed", description: "Item removed successfully." });
    },
  });

  // Unique types from database
  const dynamicTypes = useMemo(() => {
    const types = Array.from(new Set(categories.map(c => c.type)));
    const defaults = ['species', 'expense_category', 'income_category', 'health_status'];
    return Array.from(new Set([...defaults, ...types]));
  }, [categories]);

  const typeLabels: Record<string, string> = {
    'species': 'Livestock Species',
    'expense_category': 'Expense Categories',
    'income_category': 'Income Categories',
    'health_status': 'Health Statuses'
  };

  // Use URL search params to determine the initial tab
  const getInitialTab = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get("tab") || "appearance";
  };

  const [activeTab, setActiveTab] = useState(getInitialTab());

  // Update tab when URL changes
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get("tab");
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [location, activeTab]);

  const form = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  async function onPasswordSubmit(values: z.infer<typeof passwordSchema>) {
    try {
      await updateMutation.mutateAsync({
        password: values.newPassword
      });
      toast({
        title: "Password updated",
        description: "Your account password has been successfully changed.",
      });
      form.reset();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  }

  const handleAddType = () => {
    if (newTypeName.trim()) {
      const slug = newTypeName.trim().toLowerCase().replace(/\s+/g, '_');
      // Create an initial dummy item to register the type
      createCategoryMutation.mutate({ type: slug, name: 'Default Item' });
      setNewTypeName("");
      setIsTypeDialogOpen(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 md:p-8 max-w-6xl w-full mx-auto space-y-2 shrink-0">
        <h1 className="text-3xl md:text-4xl font-bold font-display text-foreground uppercase tracking-tight">Farm Settings</h1>
        <p className="text-muted-foreground text-sm md:text-base">Configure system preferences, appearance, and operation defaults.</p>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden px-6 md:p-8 max-w-6xl w-full mx-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col md:flex-row gap-8 h-full items-start">
          <TabsList className="flex flex-col h-auto bg-transparent gap-2 p-0 min-w-[240px] w-full md:w-[240px] items-stretch shrink-0">
            <TabsTrigger
              value="appearance"
              className="justify-start px-6 py-4 rounded-xl font-bold uppercase text-[11px] tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-muted/50 transition-all border border-transparent data-[state=active]:border-primary"
            >
              <Palette className="h-4 w-4 mr-3" />
              Appearance
            </TabsTrigger>
            <TabsTrigger
              value="operations"
              className="justify-start px-6 py-4 rounded-xl font-bold uppercase text-[11px] tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-muted/50 transition-all border border-transparent data-[state=active]:border-primary"
            >
              <Database className="h-4 w-4 mr-3" />
              Operations
            </TabsTrigger>
            <TabsTrigger
              value="notifications"
              className="justify-start px-6 py-4 rounded-xl font-bold uppercase text-[11px] tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-muted/50 transition-all border border-transparent data-[state=active]:border-primary"
            >
              <Bell className="h-4 w-4 mr-3" />
              Notifications
            </TabsTrigger>
            <TabsTrigger
              value="security"
              className="justify-start px-6 py-4 rounded-xl font-bold uppercase text-[11px] tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-muted/50 transition-all border border-transparent data-[state=active]:border-primary"
            >
              <Shield className="h-4 w-4 mr-3" />
              Security
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 w-full h-full overflow-y-auto pr-4 scrollbar-hide">
            <TabsContent value="appearance" className="m-0 focus-visible:outline-none">
              <Card className="shadcn-card border bg-card text-card-foreground border-border/50 shadow-xl rounded-3xl overflow-hidden glass-card animate-in fade-in zoom-in-95 duration-500">
                <CardHeader className="bg-muted/10 border-b border-border/50 p-8">
                  <CardTitle className="text-2xl font-display font-bold uppercase tracking-tight text-foreground">System Customization</CardTitle>
                  <CardDescription className="text-muted-foreground text-xs uppercase tracking-widest font-black">Interface Styling</CardDescription>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                  <div className="space-y-4">
                    <h3 className="font-bold text-lg flex items-center gap-2 text-foreground">
                      <Palette className="h-5 w-5 text-primary" />
                      Color Theme
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <button
                        onClick={() => setTheme("light")}
                        className={cn(
                          "p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-3",
                          theme === "light" ? "border-primary bg-primary/5 shadow-md" : "border-border hover:border-primary/20 bg-muted/20"
                        )}
                      >
                        <div className="h-12 w-full rounded-lg bg-white border border-border flex items-center justify-center">
                          <Sun className="h-6 w-6 text-orange-500" />
                        </div>
                        <span className="font-bold text-xs uppercase tracking-widest text-foreground">Light Mode</span>
                      </button>

                      <button
                        onClick={() => setTheme("dark")}
                        className={cn(
                          "p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-3",
                          theme === "dark" ? "border-primary bg-primary/5 shadow-md" : "border-border hover:border-primary/20 bg-muted/20"
                        )}
                      >
                        <div className="h-12 w-full rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center">
                          <Moon className="h-6 w-6 text-blue-400" />
                        </div>
                        <span className="font-bold text-xs uppercase tracking-widest text-foreground">Dark Mode</span>
                      </button>

                      <button
                        onClick={() => setTheme("system")}
                        className={cn(
                          "p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-3",
                          theme === "system" ? "border-primary bg-primary/5 shadow-md" : "border-border hover:border-primary/20 bg-muted/20"
                        )}
                      >
                        <div className="h-12 w-full rounded-lg bg-slate-100 dark:bg-slate-800 border border-border flex items-center justify-center">
                          <Monitor className="h-6 w-6 text-primary" />
                        </div>
                        <span className="font-bold text-xs uppercase tracking-widest text-foreground">System Sync</span>
                      </button>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-border/50">
                    <h3 className="font-bold text-lg flex items-center gap-2 mb-2 text-foreground">
                      <Info className="h-5 w-5 text-primary" />
                      Display Language
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4 text-muted-foreground">Select your preferred language for the interface.</p>
                    <Button variant="outline" className="rounded-xl border-primary/20 font-bold opacity-50 cursor-not-allowed text-foreground">
                      English (US) - Default
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="operations" className="m-0 focus-visible:outline-none space-y-6">
              {/* Dynamic Category Manager Section */}
              <Card className="shadcn-card border bg-card text-card-foreground border-border/50 shadow-xl rounded-3xl overflow-hidden glass-card animate-in fade-in zoom-in-95 duration-500">
                <CardHeader className="bg-muted/10 border-b border-border/50 p-8">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                        <Settings2 className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl font-display font-bold uppercase tracking-tight text-[#4b9461]">Operation Defaults</CardTitle>
                        <CardDescription className="text-sm text-muted-foreground">Manage the categorization types and options available throughout the system.</CardDescription>
                      </div>
                    </div>

                    <Dialog open={isTypeDialogOpen} onOpenChange={setIsTypeDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline" className="rounded-xl border-primary/20 font-bold h-10 px-4 flex items-center gap-2 text-foreground hover:bg-primary hover:text-white transition-all">
                          <PlusCircle className="h-4 w-4" /> New Group
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[400px] rounded-2xl">
                        <DialogHeader>
                          <DialogTitle className="text-xl font-display font-bold text-foreground">Add New Group</DialogTitle>
                          <DialogDescription className="text-muted-foreground">Create a new category grouping for your farm operations.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <FormLabel className="text-foreground">Group Name</FormLabel>
                            <Input
                              placeholder="e.g. Vaccination Types"
                              value={newTypeName}
                              onChange={(e) => setNewTypeName(e.target.value)}
                              className="bg-muted/30 rounded-xl h-11 text-foreground"
                            />
                          </div>
                          <Button onClick={handleAddType} className="w-full h-11 rounded-xl bg-primary text-white font-bold" disabled={!newTypeName.trim()}>
                            Create Group
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {dynamicTypes.map(type => (
                      <CategorySection
                        key={type}
                        title={typeLabels[type] || type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                        type={type}
                        description={`Manage ${type.replace('_', ' ')} list.`}
                        categories={categories}
                        isPending={createCategoryMutation.isPending}
                        onAdd={(name) => createCategoryMutation.mutate({ type, name })}
                        onDelete={(id) => deleteCategoryMutation.mutate(id)}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications" className="m-0 focus-visible:outline-none">
              <Card className="shadcn-card border bg-card text-card-foreground border-border/50 shadow-xl rounded-3xl overflow-hidden glass-card animate-in fade-in zoom-in-95 duration-500">
                <CardHeader className="bg-muted/10 border-b border-border/50 p-8">
                  <CardTitle className="text-2xl font-display font-bold uppercase tracking-tight text-foreground">Notification Preferences</CardTitle>
                  <CardDescription className="text-muted-foreground text-xs uppercase tracking-widest font-black">Alert Configuration</CardDescription>
                </CardHeader>
                <CardContent className="p-20 text-center text-muted-foreground italic">
                  Notification settings are coming soon.
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security" className="m-0 focus-visible:outline-none">
              <Card className="shadcn-card border bg-card text-card-foreground border-border/50 shadow-xl rounded-3xl overflow-hidden glass-card animate-in fade-in zoom-in-95 duration-500">
                <CardHeader className="bg-muted/10 border-b border-border/50 p-8">
                  <CardTitle className="text-2xl font-display font-bold uppercase tracking-tight text-foreground">System Security</CardTitle>
                  <CardDescription className="text-muted-foreground text-xs uppercase tracking-widest font-black">Access Control</CardDescription>
                </CardHeader>
                <CardContent className="p-8">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onPasswordSubmit)} className="space-y-6 max-w-md mx-auto sm:mx-0">
                      <FormField
                        control={form.control}
                        name="currentPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2 text-foreground">
                              <Lock className="h-4 w-4 text-primary" /> Current Password
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  type={showCurrentPassword ? "text" : "password"}
                                  placeholder="Current password"
                                  {...field}
                                  className="bg-muted/30 border-border/50 h-12 rounded-xl focus:ring-primary pr-12 text-foreground"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                                >
                                  {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="space-y-4 pt-4 border-t border-border/50">
                        <FormField
                          control={form.control}
                          name="newPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2 text-foreground">
                                <KeyRound className="h-4 w-4 text-primary" /> New Password
                              </FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input
                                  type={showNewPassword ? "text" : "password"}
                                  placeholder="Enter new password"
                                  {...field}
                                  className="bg-muted/30 border-border/50 h-12 rounded-xl focus:ring-primary pr-12 text-foreground"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowNewPassword(!showNewPassword)}
                                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                                >
                                  {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                                </div>
                              </FormControl>
                              <FormDescription className="text-[10px] text-muted-foreground">
                                Minimum 8 characters. Use a mix of letters and numbers.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2 text-foreground font-medium">
                                <Shield className="h-4 w-4 text-primary" /> Confirm New Password
                              </FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input
                                  type={showConfirmPassword ? "text" : "password"}
                                  placeholder="Confirm new password"
                                  {...field}
                                  className="bg-muted/30 border-border/50 h-12 rounded-xl focus:ring-primary pr-12 text-foreground"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                                >
                                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 p-4 rounded-xl flex gap-3">
                        <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
                        <p className="text-xs text-amber-800 dark:text-amber-400 leading-relaxed text-foreground">
                          Changing your password will require you to log back in on all devices. Please ensure you remember your new credentials.
                        </p>
                      </div>

                      <Button
                        type="submit"
                        disabled={updateMutation.isPending}
                        className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 font-bold shadow-lg shadow-primary/20 hover-elevate transition-all text-white"
                      >
                        {updateMutation.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          "Update Password"
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
