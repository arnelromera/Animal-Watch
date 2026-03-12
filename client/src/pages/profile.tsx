import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema } from "@shared/schema";
import { useUser, useUpdateUser } from "@/hooks/use-user";
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
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, User as UserIcon, Mail, Briefcase, Info, Save, ArrowLeft, FileText, Camera, Upload } from "lucide-react";
import { Link } from "wouter";
import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

export default function Profile() {
  const { data: user, isLoading } = useUser();
  const updateMutation = useUpdateUser();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  const form = useForm({
    resolver: zodResolver(insertUserSchema),
    values: {
      username: user?.username || "",
      fullName: user?.fullName || "",
      email: user?.email || "",
      role: user?.role || "Farm Administrator",
      bio: user?.bio || "",
      avatarUrl: user?.avatarUrl || "",
    },
  });

  const currentAvatar = form.watch("avatarUrl");

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Increased limit to 10MB for reasonable storage performance
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "Image too large",
          description: "Please select an image smaller than 10MB.",
          variant: "destructive",
        });
        return;
      }

      setIsProcessingImage(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        form.setValue("avatarUrl", reader.result as string, { shouldDirty: true });
        setIsProcessingImage(false);
      };
      reader.onerror = () => {
        toast({
          title: "Error",
          description: "Failed to read image file.",
          variant: "destructive",
        });
        setIsProcessingImage(false);
      };
      reader.readAsDataURL(file);
    }
  };

  async function onSubmit(data: any) {
    try {
      await updateMutation.mutateAsync(data);
      toast({
        title: "Profile updated",
        description: "Your profile information and photo have been successfully saved.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <Link href="/">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold font-display text-foreground">Edit Profile</h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">Update your personal information and farm role.</p>
        </div>
      </div>

      <Card className="border-border/50 shadow-xl overflow-hidden glass-card rounded-2xl">
        <CardHeader className="bg-muted/10 border-b border-border/50 pb-8 pt-8 px-8">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative group">
              <div className="h-24 w-24 rounded-2xl nature-gradient flex items-center justify-center text-primary-foreground text-4xl font-black shadow-xl ring-4 ring-background uppercase overflow-hidden bg-muted">
                {isProcessingImage ? (
                  <Loader2 className="h-8 w-8 animate-spin text-white/50" />
                ) : currentAvatar ? (
                  <img src={currentAvatar} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  user?.fullName?.charAt(0) || "U"
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "absolute inset-0 flex items-center justify-center transition-all rounded-2xl cursor-pointer bg-black/40",
                  currentAvatar ? "opacity-0 group-hover:opacity-100" : "opacity-100"
                )}
                disabled={isProcessingImage}
              >
                <Camera className="h-8 w-8 text-white" />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleImageUpload}
              />
            </div>
            <div className="text-center sm:text-left">
              <CardTitle className="text-2xl font-display">{user?.fullName}</CardTitle>
              <CardDescription className="text-primary font-bold uppercase tracking-widest text-[10px] mt-1">{user?.role}</CardDescription>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 h-8 text-[10px] uppercase font-bold tracking-wider rounded-lg border-primary/20 hover:bg-primary/5"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessingImage}
              >
                <Upload className="mr-2 h-3 w-3" />
                {currentAvatar ? "Change Photo" : "Upload Photo"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <UserIcon className="h-4 w-4 text-primary" /> Full Name
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Rodrigo Dela Cruz" {...field} className="bg-muted/30 border-border/50 h-12 rounded-xl focus:ring-primary" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Info className="h-4 w-4 text-primary" /> Username
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="admin" {...field} className="bg-muted/30 border-border/50 h-12 rounded-xl focus:ring-primary" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-primary" /> Email Address
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="rodrigo@farm.com" {...field} className="bg-muted/30 border-border/50 h-12 rounded-xl focus:ring-primary" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-primary" /> Farm Role (Locked)
                      </FormLabel>
                      <FormControl>
                        <Input
                          disabled
                          placeholder="Farm Administrator"
                          {...field}
                          className="bg-muted/50 border-border/50 h-12 rounded-xl opacity-70 cursor-not-allowed italic"
                        />
                      </FormControl>
                      <FormDescription className="text-[10px]">
                        Your role is managed by the system owner.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" /> Biography
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Tell us about your responsibilities..."
                        {...field}
                        value={field.value || ""}
                        className="bg-muted/30 border-border/50 min-h-[120px] rounded-xl focus:ring-primary resize-none p-4"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="pt-4 flex justify-end">
                <Button
                  type="submit"
                  size="lg"
                  disabled={updateMutation.isPending || isProcessingImage}
                  className="h-12 px-8 rounded-xl bg-primary hover:bg-primary/90 font-bold shadow-lg shadow-primary/20 hover-elevate transition-all text-white"
                >
                  {updateMutation.isPending ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-5 w-5" />
                  )}
                  Save Profile Changes
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
