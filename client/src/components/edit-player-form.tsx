import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createPlayerCardSchema, type CreatePlayerCard, type PlayerCard } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface EditPlayerFormProps {
  player: PlayerCard;
  onUpdatePlayer: (updates: Partial<CreatePlayerCard>) => void;
  onCancel: () => void;
  isLoading: boolean;
}

const profileEmojis = [
  "⚽", "👤", "🏃‍♂️", "🏃‍♀️", "👨‍🦱", "👩‍🦱", "👨", "👩", "🧔", "👱‍♂️", "👱‍♀️", "👨‍🦰", "👩‍🦰"
];

export default function EditPlayerForm({ player, onUpdatePlayer, onCancel, isLoading }: EditPlayerFormProps) {
  const form = useForm<CreatePlayerCard>({
    resolver: zodResolver(createPlayerCardSchema),
    defaultValues: {
      name: player.name,
      club: player.club,
      profilePic: player.profilePic || "⚽",
      pace: player.pace,
      shooting: player.shooting,
      passing: player.passing,
      dribbling: player.dribbling,
      defense: player.defense,
      physical: player.physical,
      overall: player.overall,
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
    onUpdatePlayer({ ...data, overall });
  };

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Button 
          data-testid="button-cancel-edit"
          onClick={onCancel}
          variant="ghost"
          className="mb-4 p-0 h-auto text-muted-foreground"
        >
          <i className="fas fa-arrow-left mr-2"></i>
          Cancel
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <i className="fas fa-edit text-primary"></i>
              Edit Player Card
            </CardTitle>
          </CardHeader>
          <CardContent>
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
                              data-testid="input-edit-player-name"
                              placeholder="Enter player name" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="club"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Club</FormLabel>
                          <FormControl>
                            <Input 
                              data-testid="input-edit-player-club"
                              placeholder="Enter club name" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="profilePic"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Profile Picture</FormLabel>
                          <FormControl>
                            <div className="space-y-3">
                              <div className="flex flex-wrap gap-2">
                                {profileEmojis.map((emoji) => (
                                  <button
                                    key={emoji}
                                    type="button"
                                    data-testid={`emoji-${emoji}`}
                                    onClick={() => field.onChange(emoji)}
                                    className={`w-12 h-12 rounded-lg border-2 text-2xl flex items-center justify-center transition-colors ${
                                      field.value === emoji 
                                        ? 'border-primary bg-primary/10' 
                                        : 'border-border hover:border-primary/50'
                                    }`}
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                              <Input 
                                data-testid="input-custom-profile"
                                placeholder="Or enter custom emoji/text"
                                value={field.value || ""}
                                onChange={(e) => field.onChange(e.target.value)}
                                className="text-center"
                              />
                            </div>
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
                                  data-testid={`slider-edit-${stat}`}
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
                                data-testid={`stat-edit-value-${stat}`}
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
                          data-testid="edit-overall-rating"
                          className="text-lg font-bold text-primary"
                        >
                          {calculateOverall()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <Button 
                    data-testid="button-cancel-edit"
                    type="button"
                    onClick={onCancel}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button 
                    data-testid="button-save-edit"
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 flex items-center gap-2"
                  >
                    <i className="fas fa-save"></i>
                    {isLoading ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}