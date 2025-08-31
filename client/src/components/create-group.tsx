import { useState } from "react";
import { User } from "firebase/auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createGroupSchema, type CreateGroup } from "@shared/schema";
import { createGroup } from "@/lib/firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface CreateGroupProps {
  user: User;
  onGroupCreated: (groupId: string) => void;
  onBack: () => void;
}

export default function CreateGroup({ user, onGroupCreated, onBack }: CreateGroupProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<CreateGroup>({
    resolver: zodResolver(createGroupSchema),
    defaultValues: {
      name: "",
    },
  });

  const onSubmit = async (data: CreateGroup) => {
    setIsLoading(true);
    try {
      const group = await createGroup(data.name, user);
      toast({
        title: "Success",
        description: `Group created! Code: ${group.code}`,
      });
      onGroupCreated(group.id);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create group",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="max-w-md mx-auto">
        <Button 
          data-testid="button-back"
          onClick={onBack}
          variant="ghost"
          className="mb-4 p-0 h-auto text-muted-foreground"
        >
          <i className="fas fa-arrow-left mr-2"></i>
          Back
        </Button>

        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <i className="fas fa-users text-primary text-4xl"></i>
            </div>
            <CardTitle className="text-2xl">Create Group</CardTitle>
            <CardDescription>
              Start a new group and invite friends to join
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
                      <FormLabel>Group Name</FormLabel>
                      <FormControl>
                        <Input 
                          data-testid="input-group-name"
                          placeholder="Enter group name (e.g., My Football Club)" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button 
                  data-testid="button-create-group"
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center gap-2 py-6 text-base"
                >
                  <i className="fas fa-plus"></i>
                  {isLoading ? "Creating..." : "Create Group"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}