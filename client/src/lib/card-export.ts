import { PlayerCard } from "@shared/schema";

export async function exportCardAsPNG(player: PlayerCard): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');

      // Set canvas size
      canvas.width = 300;
      canvas.height = 400;

      // Determine card style and colors
      let gradient: CanvasGradient;
      if (player.isFusion) {
        gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, '#8B5CF6');
        gradient.addColorStop(0.3, '#7C3AED');
        gradient.addColorStop(1, '#6D28D9');
      } else if (player.overall >= 85) {
        gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, '#FFD700');
        gradient.addColorStop(0.3, '#FFA500');
        gradient.addColorStop(1, '#FF8C00');
      } else if (player.overall >= 70) {
        gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, '#C0C0C0');
        gradient.addColorStop(0.3, '#A8A8A8');
        gradient.addColorStop(1, '#909090');
      } else {
        gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, '#CD7F32');
        gradient.addColorStop(0.3, '#B8661F');
        gradient.addColorStop(1, '#A0540D');
      }

      // Draw card background
      ctx.fillStyle = gradient;
      ctx.roundRect(0, 0, canvas.width, canvas.height, 8);
      ctx.fill();

      // Add shadow/border effect
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw fusion badge if applicable
      if (player.isFusion) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.roundRect(10, 10, 60, 20, 10);
        ctx.fill();
        
        ctx.fillStyle = 'white';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('FUSION', 40, 23);
      }

      // Draw overall rating
      ctx.fillStyle = 'white';
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(player.overall.toString(), canvas.width / 2, 80);

      // Draw position
      ctx.font = 'bold 16px Arial';
      ctx.fillText(player.position, canvas.width / 2, 105);

      // Draw player image placeholder
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.roundRect(canvas.width / 2 - 40, 120, 80, 100, 8);
      ctx.fill();

      // Draw user icon
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.font = '32px FontAwesome';
      ctx.fillText('👤', canvas.width / 2, 180);

      // Draw player name
      ctx.fillStyle = 'white';
      ctx.font = 'bold 16px Arial';
      ctx.fillText(player.name, canvas.width / 2, 250);

      // Draw stats
      const stats = [
        { label: 'PAC', value: player.pace },
        { label: 'SHO', value: player.shooting },
        { label: 'PAS', value: player.passing },
        { label: 'DRI', value: player.dribbling },
        { label: 'DEF', value: player.defense },
        { label: 'PHY', value: player.physical },
      ];

      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.font = '12px Arial';
      ctx.textAlign = 'left';

      let y = 280;
      for (let i = 0; i < stats.length; i += 2) {
        // Left column
        ctx.fillText(stats[i].label, 20, y);
        ctx.textAlign = 'right';
        ctx.fillText(stats[i].value.toString(), 90, y);
        
        // Right column
        if (stats[i + 1]) {
          ctx.textAlign = 'left';
          ctx.fillText(stats[i + 1].label, 160, y);
          ctx.textAlign = 'right';
          ctx.fillText(stats[i + 1].value.toString(), 230, y);
        }
        
        ctx.textAlign = 'left';
        y += 20;
      }

      // Convert canvas to blob and download
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Failed to create blob'));
          return;
        }

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${player.name.replace(/\s+/g, '_')}_card.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        resolve();
      });
    } catch (error) {
      reject(error);
    }
  });
}
