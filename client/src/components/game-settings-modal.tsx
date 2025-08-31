import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Match } from "@shared/schema";

const gameSettingsSchema = z.object({
  name: z.string().min(1, "Match name is required"),
  numberOfTeams: z.number().min(2, "Must have at least 2 teams"),
  playersPerTeam: z.number().min(1, "Must have at least 1 player per team"),
});

type GameSettingsForm = z.infer<typeof gameSettingsSchema>;

interface GameSettingsModalProps {
  open: boolean;
  onClose: () => void;
  match: Match;
  onSave: (settings: Partial<Match>) => Promise<void>;
  loading?: boolean;
}

export default function GameSettingsModal({ 
  open, 
  onClose, 
  match, 
  onSave, 
  loading = false 
}: GameSettingsModalProps) {
  const [saving, setSaving] = useState(false);

  const form = useForm<GameSettingsForm>({
    resolver: zodResolver(gameSettingsSchema),
    defaultValues: {
      name: match.name,
      numberOfTeams: match.numberOfTeams,
      playersPerTeam: match.playersPerTeam,
    },
  });

  const handleSave = async (data: GameSettingsForm) => {
    setSaving(true);
    try {
      await onSave({
        name: data.name,
        numberOfTeams: data.numberOfTeams,
        playersPerTeam: data.playersPerTeam,
      });
      onClose();
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <i className="fas fa-cog text-primary"></i>
            Game Settings
          </DialogTitle>
          <DialogDescription>
            Customize the match settings. Changes will affect team composition.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Match Name</FormLabel>
                  <FormControl>
                    <Input
                      data-testid="input-match-name"
                      placeholder="Enter match name"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="numberOfTeams"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of Teams</FormLabel>
                    <FormControl>
                      <Select
                        data-testid="select-number-teams"
                        value={field.value.toString()}
                        onValueChange={(value) => field.onChange(parseInt(value))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="2">2 Teams</SelectItem>
                          <SelectItem value="3">3 Teams</SelectItem>
                          <SelectItem value="4">4 Teams</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
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
                    <FormControl>
                      <Select
                        data-testid="select-players-per-team"
                        value={field.value.toString()}
                        onValueChange={(value) => field.onChange(parseInt(value))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="3">3 Players</SelectItem>
                          <SelectItem value="4">4 Players</SelectItem>
                          <SelectItem value="5">5 Players</SelectItem>
                          <SelectItem value="6">6 Players</SelectItem>
                          <SelectItem value="7">7 Players</SelectItem>
                          <SelectItem value="11">11 Players</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <i className="fas fa-info-circle text-primary text-sm"></i>
                <span className="text-sm font-medium">Quick Info</span>
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <div>Total players needed: {form.watch("numberOfTeams") * form.watch("playersPerTeam")}</div>
                <div>Teams will be automatically rebalanced with new settings</div>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button 
                data-testid="button-cancel-settings"
                type="button" 
                variant="outline" 
                onClick={handleClose}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button 
                data-testid="button-save-settings"
                type="submit" 
                disabled={saving || loading}
                className="flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Saving...
                  </>
                ) : (
                  <>
                    <i className="fas fa-save"></i>
                    Save Settings
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}