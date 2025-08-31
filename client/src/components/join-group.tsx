import { useState } from "react";
import { User } from "firebase/auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { joinGroupSchema, type JoinGroup } from "@shared/schema";
import { joinGroup } from "@/lib/firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface JoinGroupProps {
  user: User;
  onGroupJoined: (groupId: string) => void;
  onBack: () => void;
}

export default function JoinGroup({ user, onGroupJoined, onBack }: JoinGroupProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<JoinGroup>({
    resolver: zodResolver(joinGroupSchema),
    defaultValues: {
      code: "",
    },
  });

  const onSubmit = async (data: JoinGroup) => {
    setIsLoading(true);
    try {
      const group = await joinGroup(data.code.toUpperCase(), user);
      if (group) {
        toast({
          title: "Success",
          description: `Joined ${group.name}!`,
        });
        onGroupJoined(group.id);
      } else {
        toast({
          title: "Error",
          description: "Group not found. Please check the code.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to join group",
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
              <i className="fas fa-sign-in-alt text-primary text-4xl"></i>
            </div>
            <CardTitle className="text-2xl">Join Group</CardTitle>
            <CardDescription>
              Enter the 6-character group code to join
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Group Code</FormLabel>
                      <FormControl>
                        <Input 
                          data-testid="input-group-code"
                          placeholder="Enter 6-character code (e.g., ABC123)" 
                          className="text-center text-xl font-mono tracking-widest uppercase"
                          maxLength={6}
                          {...field}
                          onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button 
                  data-testid="button-join-group"
                  type="submit"
                  disabled={isLoading || form.watch("code").length !== 6}
                  className="w-full flex items-center gap-2 py-6 text-base"
                >
                  <i className="fas fa-users"></i>
                  {isLoading ? "Joining..." : "Join Group"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}