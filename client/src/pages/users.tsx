import { useQuery, useMutation } from "@tanstack/react-query";
import { User, InsertUser } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Loader2, User as UserIcon, Mail, Shield, Edit2, Trash2, UserPlus, Users as UsersIcon, FileText, KeyRound } from "lucide-react";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function Users() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const upsertMutation = useMutation({
    mutationFn: async (values: InsertUser) => {
      if (editingUser) {
        const res = await apiRequest("PATCH", `/api/users/${editingUser.id}`, values);
        return res.json();
      } else {
        const res = await apiRequest("POST", "/api/users", values);
        return res.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Success",
        description: editingUser ? "User updated successfully." : "User added successfully."
      });
      closeDialog();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "Success", description: "User deleted successfully." });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("POST", `/api/users/${id}/reset-password`);
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Password Reset",
        description: `${data.message}. Temporary Password: ${data.temporaryPassword}`,
        duration: 10000,
      });
    }
  });

  const form = useForm<any>({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      username: "",
      fullName: "",
      email: "",
      role: "Staff",
      bio: "",
      avatarUrl: "",
    },
  });

  useEffect(() => {
    if (editingUser) {
      form.reset({
        username: editingUser.username,
        fullName: editingUser.fullName,
        email: editingUser.email || "",
        role: editingUser.role,
        bio: editingUser.bio || "",
        avatarUrl: editingUser.avatarUrl || "",
      });
    } else {
      form.reset({
        username: "",
        fullName: "",
        email: "",
        role: "Staff",
        bio: "",
        avatarUrl: "",
      });
    }
  }, [editingUser, form]);

  const openEditDialog = (user: User) => {
    setEditingUser(user);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingUser(null);
    form.reset();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 h-full flex flex-col overflow-y-auto scrollbar-hide">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 shrink-0">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold font-display text-foreground uppercase tracking-tight">System Users</h1>
          <p className="text-muted-foreground mt-2 text-sm md:text-base">Manage personnel access and roles within the farm monitoring system.</p>
        </div>

        <div className="flex items-center gap-3">
          <Dialog open={isDialogOpen} onOpenChange={(open) => !open && closeDialog()}>
            <DialogTrigger asChild>
              <Button
                size="lg"
                className="hover-elevate active-elevate-2 shadow-lg shadow-primary/20 bg-primary font-bold text-white h-12 px-6 rounded-xl"
                onClick={() => {
                  setEditingUser(null);
                  setIsDialogOpen(true);
                }}
              >
                <UserPlus className="mr-2 h-5 w-5" />
                Add New User
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] rounded-2xl border-border/50 shadow-2xl overflow-y-auto max-h-[90vh]">
              <DialogHeader>
                <DialogTitle className="text-2xl font-display flex items-center gap-2">
                  <UserIcon className="h-6 w-6 text-primary" />
                  {editingUser ? "Update User" : "Register User"}
                </DialogTitle>
                <DialogDescription>
                  {editingUser ? "Update the details for this user account." : "Create a new account for farm staff or administrators."}
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit((v) => upsertMutation.mutate(v))} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" {...field} className="bg-muted/30 h-11 rounded-lg" />
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
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input placeholder="johndoe" {...field} className="bg-muted/30 h-11 rounded-lg" />
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
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="john@example.com" {...field} value={field.value || ""} className="bg-muted/30 h-11 rounded-lg" />
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
                          <FormLabel>Role</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-muted/30 h-11 rounded-lg">
                                <SelectValue placeholder="Select role" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Farm Administrator">Farm Administrator</SelectItem>
                              <SelectItem value="Staff">Staff</SelectItem>
                              <SelectItem value="Veterinarian">Veterinarian</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
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
                              placeholder="Tell us about the user's responsibilities..."
                              {...field}
                              value={field.value || ""}
                              className="bg-muted/30 rounded-lg resize-none min-h-[100px] p-3"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full h-12 text-lg font-bold text-white mt-4 rounded-xl" disabled={upsertMutation.isPending}>
                      {upsertMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {editingUser ? "Save Changes" : "Create Account"}
                    </Button>
                  </form>
                </Form>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="border-border/50 shadow-xl overflow-hidden rounded-2xl glass-card flex-1 min-h-0 flex flex-col">
        <CardContent className="p-0 h-full overflow-auto">
          {users && users.length > 0 ? (
            <Table>
              <TableHeader className="bg-muted/30 sticky top-0 z-10 backdrop-blur-sm border-b border-border/50">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-black uppercase tracking-widest text-[10px] py-4 bg-muted/30 sticky top-0">User</TableHead>
                  <TableHead className="font-black uppercase tracking-widest text-[10px] py-4 bg-muted/30 sticky top-0">Username</TableHead>
                  <TableHead className="font-black uppercase tracking-widest text-[10px] py-4 bg-muted/30 sticky top-0">Email</TableHead>
                  <TableHead className="font-black uppercase tracking-widest text-[10px] py-4 bg-muted/30 sticky top-0">Role</TableHead>
                  <TableHead className="font-black uppercase tracking-widest text-[10px] py-4 text-right bg-muted/30 sticky top-0">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id} className="group hover:bg-muted/20 transition-colors border-b border-border/30">
                    <TableCell className="py-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border-2 border-primary/10 ring-2 ring-primary/5">
                          <AvatarImage src={u.avatarUrl || ""} />
                          <AvatarFallback className="nature-gradient text-white font-black text-xs">
                            {u.fullName.split(" ").map(n => n[0]).join("").toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-bold text-sm text-foreground uppercase tracking-tight">{u.fullName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <span className="font-bold uppercase tracking-tighter text-[11px] text-muted-foreground">@{u.username}</span>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-3.5 w-3.5 text-primary/60" />
                        <span className="font-medium">{u.email || "—"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex items-center gap-2">
                        <Shield className="h-3.5 w-3.5 text-primary" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary/80">{u.role}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          title="Reset Password"
                          className="h-8 w-8 rounded-full hover:bg-amber-100 hover:text-amber-600 transition-all shadow-sm border border-border/50"
                          onClick={() => resetPasswordMutation.mutate(u.id)}
                          disabled={resetPasswordMutation.isPending}
                        >
                          {resetPasswordMutation.isPending && resetPasswordMutation.variables === u.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <KeyRound className="h-4 w-4" />
                          )}
                        </Button>

                        <Button
                          size="icon"
                          variant="ghost"
                          title="Edit User"
                          className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary transition-all shadow-sm border border-border/50"
                          onClick={() => openEditDialog(u)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="icon" variant="ghost" title="Delete User" className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive transition-all shadow-sm border border-border/50">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="rounded-2xl">
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete User?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete {u.fullName}? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive text-white hover:bg-destructive/90 rounded-xl"
                                onClick={() => deleteMutation.mutate(u.id)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-20 h-full">
              <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-4">
                <UsersIcon className="h-10 w-10 text-muted-foreground/50" />
              </div>
              <h3 className="text-xl font-bold font-display text-foreground uppercase tracking-tight">No users found</h3>
              <p className="text-muted-foreground mt-2 max-w-md px-6">
                The system user list is currently empty. Add your first team member to get started.
              </p>
              <Button
                className="mt-6 hover-elevate bg-primary text-white font-bold h-12 px-8 rounded-xl shadow-lg shadow-primary/20"
                onClick={() => setIsDialogOpen(true)}
              >
                <UserPlus className="mr-2 h-5 w-5" />
                Add First User a
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
