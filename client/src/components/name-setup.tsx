import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { User } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { updateUserProfile } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

const nameSetupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(30, "Name must be less than 30 characters"),
});

type NameSetupData = z.infer<typeof nameSetupSchema>;

interface NameSetupProps {
  user: User;
  onNameSet: (name: string) => void;
}

export default function NameSetup({ user, onNameSet }: NameSetupProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<NameSetupData>({
    resolver: zodResolver(nameSetupSchema),
    defaultValues: {
      name: user.displayName || "",
    },
  });

  const onSubmit = async (data: NameSetupData) => {
    setIsLoading(true);
    try {
      await updateUserProfile(data.name);
      toast({
        title: "Welcome!",
        description: `Nice to meet you, ${data.name}!`,
      });
      onNameSet(data.name);
    } catch (error: any) {
      console.error("Name setup error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to set name",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <i className="fas fa-futbol text-primary text-4xl"></i>
          </div>
          <CardTitle className="text-2xl">Welcome to FootballStreet!</CardTitle>
          <CardDescription>
            What should we call you?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Name</FormLabel>
                    <FormControl>
                      <Input 
                        data-testid="input-user-name"
                        placeholder="Enter your name" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button 
                data-testid="button-set-name"
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center gap-2 py-6 text-base"
              >
                <i className="fas fa-check"></i>
                {isLoading ? "Setting up..." : "Continue"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}