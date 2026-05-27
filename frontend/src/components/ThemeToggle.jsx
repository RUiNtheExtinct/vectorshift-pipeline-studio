import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useTheme } from '@/lib/theme';

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const next = isDark ? 'light' : 'dark';
  const Icon = isDark ? Moon : Sun;

  const handleClick = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setTheme(next, {
      x: Math.round(rect.left + rect.width / 2),
      y: Math.round(rect.top + rect.height / 2),
    });
  };

  return (
    <TooltipProvider delayDuration={250}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            onClick={handleClick}
            aria-label={`Switch to ${next} mode`}
          >
            <Icon className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          Switch to {next} mode
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
