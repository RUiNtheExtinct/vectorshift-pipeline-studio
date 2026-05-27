import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useStore } from '@/store';

export function RenameDialog() {
  const renameTarget = useStore((s) => s.renameTarget);
  const closeRenameDialog = useStore((s) => s.closeRenameDialog);
  const commitRename = useStore((s) => s.commitRename);

  const [value, setValue] = React.useState('');

  React.useEffect(() => {
    if (renameTarget) setValue(renameTarget.currentName ?? '');
  }, [renameTarget]);

  const onOpenChange = (open) => {
    if (!open) closeRenameDialog();
  };

  const onSubmit = (event) => {
    event.preventDefault();
    commitRename(value);
  };

  return (
    <Dialog open={!!renameTarget} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={onSubmit} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>Rename node</DialogTitle>
            <DialogDescription>
              Update the visible title for this node. The underlying node ID
              does not change.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-1.5">
            <Label htmlFor="rename-input">Display name</Label>
            <Input
              id="rename-input"
              autoFocus
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder="e.g. Customer prompt"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeRenameDialog}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={!value.trim()}>
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
