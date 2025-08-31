import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createMatchSchema, type CreateMatch, type PlayerCard, type Match } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { generateBalancedTeams } from "@/lib/team-balancer";

interface CreateMatchProps {
  players: PlayerCard[];
  onCreateMatch: (matchData: CreateMatch) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}

export default function CreateMatch({ players, onCreateMatch, onCancel, isLoading }: CreateMatchProps) {
  const { toast } = useToast();
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [step, setStep] = useState<'setup' | 'players' | 'confirm'>('setup');
  const [generatedTeams, setGeneratedTeams] = useState<{ teamA: { players: PlayerCard[]; averageRating: number }; teamB: { players: PlayerCard[]; averageRating: number } } | null>(null);
  
  const form = useForm<CreateMatch>({
    resolver: zodResolver(createMatchSchema),
    defaultValues: {
      name: "",
      numberOfTeams: 2,
      playersPerTeam: 5,
      selectedPlayerIds: [],
    },
  });

  const watchedValues = form.watch();

  const handlePlayerSelection = (playerId: string, checked: boolean) => {
    if (checked) {
      setSelectedPlayers(prev => [...prev, playerId]);
    } else {
      setSelectedPlayers(prev => prev.filter(id => id !== playerId));
    }
  };

  const totalPlayersNeeded = watchedValues.numberOfTeams * watchedValues.playersPerTeam;
  const canProceedToGenerate = selectedPlayers.length >= totalPlayersNeeded;

  const handleNext = () => {
    if (step === 'setup') {
      setStep('players');
    } else if (step === 'players') {
      if (!canProceedToGenerate) {
        toast({
          title: "Not enough players",
          description: `You need at least ${totalPlayersNeeded} players for ${watchedValues.numberOfTeams} teams of ${watchedValues.playersPerTeam}.`,
          variant: "destructive",
        });
        return;
      }
      
      // Generate teams for preview
      const selectedPlayerCards = players.filter(player => selectedPlayers.includes(player.id));
      const teams = generateBalancedTeams(selectedPlayerCards);
      setGeneratedTeams(teams);
      
      form.setValue('selectedPlayerIds', selectedPlayers);
      setStep('confirm');
    }
  };

  const handleSubmit = async (data: CreateMatch) => {
    console.log("Creating match with data:", { ...data, selectedPlayerIds: selectedPlayers });
    
    if (selectedPlayers.length === 0) {
      toast({
        title: "Error",
        description: "No players selected for the match",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await onCreateMatch({ ...data, selectedPlayerIds: selectedPlayers });
      toast({
        title: "Success",
        description: "Match created successfully!",
      });
      onCancel(); // Go back to dashboard to see the new match
    } catch (error) {
      console.error("Match creation error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create match",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Button 
          data-testid="button-cancel-match"
          onClick={onCancel}
          variant="ghost"
          className="mb-4 p-0 h-auto text-muted-foreground"
        >
          <i className="fas fa-arrow-left mr-2"></i>
          Back to Group
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <i className="fas fa-futbol text-primary"></i>
              Create a Match
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className={`w-3 h-3 rounded-full ${step === 'setup' ? 'bg-primary' : 'bg-muted'}`}></div>
              <span>Setup</span>
              <div className="w-8 h-px bg-border"></div>
              <div className={`w-3 h-3 rounded-full ${step === 'players' ? 'bg-primary' : 'bg-muted'}`}></div>
              <span>Players</span>
              <div className="w-8 h-px bg-border"></div>
              <div className={`w-3 h-3 rounded-full ${step === 'confirm' ? 'bg-primary' : 'bg-muted'}`}></div>
              <span>Confirm</span>
            </div>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
                
                {step === 'setup' && (
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Match Name</FormLabel>
                          <FormControl>
                            <Input 
                              data-testid="input-match-name"
                              placeholder="Friday Night Match" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="numberOfTeams"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Number of Teams</FormLabel>
                          <Select value={field.value.toString()} onValueChange={(value) => field.onChange(parseInt(value))}>
                            <FormControl>
                              <SelectTrigger data-testid="select-number-teams">
                                <SelectValue placeholder="Select teams" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="2">2 Teams</SelectItem>
                              <SelectItem value="3">3 Teams</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="playersPerTeam"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Players per Team</FormLabel>
                          <Select value={field.value.toString()} onValueChange={(value) => field.onChange(parseInt(value))}>
                            <FormControl>
                              <SelectTrigger data-testid="select-players-per-team">
                                <SelectValue placeholder="Select players per team" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="3">3v3</SelectItem>
                              <SelectItem value="4">4v4</SelectItem>
                              <SelectItem value="5">5v5</SelectItem>
                              <SelectItem value="6">6v6</SelectItem>
                              <SelectItem value="7">7v7</SelectItem>
                              <SelectItem value="11">11v11</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <div className="text-sm text-muted-foreground">
                        <p><strong>Match Format:</strong> {watchedValues.numberOfTeams} teams of {watchedValues.playersPerTeam} players each</p>
                        <p><strong>Total Players Needed:</strong> {totalPlayersNeeded}</p>
                        <p><strong>Available Players:</strong> {players.length}</p>
                      </div>
                    </div>
                  </div>
                )}

                {step === 'players' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">Select Players for the Match</h3>
                      <p className="text-sm text-muted-foreground">
                        {selectedPlayers.length} / {totalPlayersNeeded} minimum
                      </p>
                    </div>
                    
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {players.map((player) => (
                        <div key={player.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                          <Checkbox
                            data-testid={`checkbox-player-${player.id}`}
                            checked={selectedPlayers.includes(player.id)}
                            onCheckedChange={(checked) => handlePlayerSelection(player.id, checked as boolean)}
                          />
                          <div className="flex items-center gap-3 flex-1">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              {player.profilePic ? (
                                <span className="text-lg">{player.profilePic}</span>
                              ) : (
                                <i className="fas fa-user text-primary"></i>
                              )}
                            </div>
                            <div>
                              <p className="font-medium">{player.name}</p>
                              <p className="text-sm text-muted-foreground">Overall: {player.overall}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {!canProceedToGenerate && (
                      <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                        <p className="text-sm text-yellow-600 dark:text-yellow-400">
                          <i className="fas fa-exclamation-triangle mr-2"></i>
                          You need to select at least {totalPlayersNeeded} players to create balanced teams.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {step === 'confirm' && generatedTeams && (
                  <div className="space-y-4">
                    <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                      <h3 className="font-medium text-green-600 dark:text-green-400 mb-2">
                        <i className="fas fa-check-circle mr-2"></i>
                        Confirm Match Teams
                      </h3>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p><strong>Match:</strong> {form.getValues('name')}</p>
                        <p><strong>Format:</strong> {watchedValues.numberOfTeams} teams of {watchedValues.playersPerTeam} players</p>
                        <p><strong>Selected Players:</strong> {selectedPlayers.length}</p>
                      </div>
                    </div>
                    
                    {/* Generated Teams Preview */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Team A */}
                      <div className="border rounded-lg p-4 bg-blue-500/5 border-blue-500/20">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-blue-600 dark:text-blue-400 flex items-center gap-2">
                            <i className="fas fa-shield-alt"></i>
                            Team A
                          </h4>
                          <div className="text-sm font-bold text-blue-600 dark:text-blue-400">
                            Team Rating: {generatedTeams.teamA.averageRating}
                          </div>
                        </div>
                        <div className="space-y-2">
                          {generatedTeams.teamA.players.map((player) => (
                            <div key={player.id} className="flex items-center gap-2 p-2 bg-background/50 rounded">
                              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                {player.overall}
                              </div>
                              <div>
                                <div className="font-medium text-sm">{player.name}</div>
                                <div className="text-xs text-muted-foreground">{player.club}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="text-xs text-muted-foreground mt-2">
                          Players ({generatedTeams.teamA.players.length})
                        </div>
                      </div>

                      {/* Team B */}
                      <div className="border rounded-lg p-4 bg-red-500/5 border-red-500/20">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-red-600 dark:text-red-400 flex items-center gap-2">
                            <i className="fas fa-shield-alt"></i>
                            Team B
                          </h4>
                          <div className="text-sm font-bold text-red-600 dark:text-red-400">
                            Team Rating: {generatedTeams.teamB.averageRating}
                          </div>
                        </div>
                        <div className="space-y-2">
                          {generatedTeams.teamB.players.map((player) => (
                            <div key={player.id} className="flex items-center gap-2 p-2 bg-background/50 rounded">
                              <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                {player.overall}
                              </div>
                              <div>
                                <div className="font-medium text-sm">{player.name}</div>
                                <div className="text-xs text-muted-foreground">{player.club}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="text-xs text-muted-foreground mt-2">
                          Players ({generatedTeams.teamB.players.length})
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-sm text-muted-foreground text-center">
                      <p>Teams have been balanced based on player stats. Review and confirm to create the match.</p>
                    </div>
                  </div>
                )}
                
                <div className="flex gap-4">
                  {step !== 'setup' && (
                    <Button 
                      data-testid="button-back-step"
                      type="button"
                      onClick={() => setStep(step === 'confirm' ? 'players' : 'setup')}
                      variant="outline"
                      className="flex-1"
                    >
                      <i className="fas fa-arrow-left mr-2"></i>
                      Back
                    </Button>
                  )}
                  
                  {step !== 'confirm' ? (
                    <Button 
                      data-testid="button-next-step"
                      type="button"
                      onClick={handleNext}
                      className="flex-1"
                      disabled={step === 'players' && !canProceedToGenerate}
                    >
                      Next
                      <i className="fas fa-arrow-right ml-2"></i>
                    </Button>
                  ) : (
                    <Button 
                      data-testid="button-create-match"
                      type="button"
                      disabled={isLoading || selectedPlayers.length === 0}
                      className="flex-1 flex items-center gap-2"
                      onClick={() => {
                        const formData = form.getValues();
                        handleSubmit({ ...formData, selectedPlayerIds: selectedPlayers });
                      }}
                    >
                      <i className="fas fa-futbol"></i>
                      {isLoading ? "Creating..." : "Create Match"}
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}