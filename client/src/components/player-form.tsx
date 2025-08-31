import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createPlayerCardSchema, type CreatePlayerCard } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

interface PlayerFormProps {
  onCreatePlayer: (player: CreatePlayerCard) => void;
  isLoading: boolean;
}


export default function PlayerForm({ onCreatePlayer, isLoading }: PlayerFormProps) {
  const form = useForm<CreatePlayerCard>({
    resolver: zodResolver(createPlayerCardSchema),
    defaultValues: {
      name: "",
      pace: 50,
      shooting: 50,
      passing: 50,
      dribbling: 50,
      defense: 50,
      physical: 50,
      overall: 50,
    },
  });

  const watchedStats = form.watch(["pace", "shooting", "passing", "dribbling", "defense", "physical"]);
  
  // Calculate overall rating whenever stats change
  const calculateOverall = () => {
    const [pace, shooting, passing, dribbling, defense, physical] = watchedStats;
    const overall = Math.round((pace + shooting + passing + dribbling + defense + physical) / 6);
    form.setValue("overall", overall);
    return overall;
  };

  const onSubmit = (data: CreatePlayerCard) => {
    const overall = calculateOverall();
    onCreatePlayer({ ...data, overall });
    form.reset();
  };

  return (
    <div className="bg-card rounded-lg border border-border p-6 mb-8">
      <h2 className="text-xl font-semibold text-card-foreground mb-4 flex items-center gap-2">
        <i className="fas fa-user-plus text-primary"></i>
        Create New Player
      </h2>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Player Name</FormLabel>
                    <FormControl>
                      <Input 
                        data-testid="input-player-name"
                        placeholder="Enter player name" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
            </div>
            
            <div className="space-y-4">
              <h3 className="font-medium text-card-foreground">Player Stats (1-99)</h3>
              
              {(['pace', 'shooting', 'passing', 'dribbling', 'defense', 'physical'] as const).map((stat) => (
                <FormField
                  key={stat}
                  control={form.control}
                  name={stat}
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center gap-3">
                        <FormLabel className="text-sm font-medium text-muted-foreground w-20 capitalize">
                          {stat}
                        </FormLabel>
                        <FormControl>
                          <Slider
                            data-testid={`slider-${stat}`}
                            min={1}
                            max={99}
                            step={1}
                            value={[field.value]}
                            onValueChange={(value) => {
                              field.onChange(value[0]);
                              calculateOverall();
                            }}
                            className="flex-1"
                          />
                        </FormControl>
                        <span 
                          data-testid={`stat-value-${stat}`}
                          className="text-sm font-bold text-primary w-8 text-right"
                        >
                          {field.value}
                        </span>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
              
              <div className="pt-2 border-t border-border">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Overall Rating:</span>
                  <span 
                    data-testid="overall-rating"
                    className="text-lg font-bold text-primary"
                  >
                    {calculateOverall()}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button 
              data-testid="button-create-player"
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <i className="fas fa-save"></i>
              {isLoading ? "Creating..." : "Create Player Card"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
