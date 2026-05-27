import * as React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Copy, Pencil, PlusSquare, Trash2 } from 'lucide-react';
import { useStore } from '@/store';
import { nodeDefinitions } from '@/nodes/nodeDefinitions';

function getNodeTitle(node) {
  return (
    node?.data?.displayName ||
    nodeDefinitions[node?.type]?.title ||
    nodeDefinitions[node?.type]?.label ||
    node?.id
  );
}

export function NodeContextMenu({ menu, onClose }) {
  const node = useStore((s) =>
    s.nodes.find((current) => current.id === menu?.nodeId),
  );
  const duplicateNode = useStore((s) => s.duplicateNode);
  const deleteNode = useStore((s) => s.deleteNode);
  const openRenameDialog = useStore((s) => s.openRenameDialog);

  if (!menu || !node) return null;

  const title = getNodeTitle(node);

  const copyNodeId = async () => {
    try {
      await navigator.clipboard.writeText(node.id);
    } catch {
      window.prompt('Copy node ID', node.id);
    }
    onClose();
  };

  const handleRename = () => {
    openRenameDialog(node.id, title);
    onClose();
  };

  const handleDuplicate = () => {
    duplicateNode(node.id);
    onClose();
  };

  const handleDelete = () => {
    deleteNode(node.id);
    onClose();
  };

  return (
    <DropdownMenu
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      {/* Invisible 1x1 trigger positioned at the click point */}
      <DropdownMenuTrigger asChild>
        <span
          aria-hidden="true"
          className="absolute size-px opacity-0"
          style={{ left: menu.x, top: menu.y }}
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="right" sideOffset={2} className="w-56">
        <DropdownMenuLabel>{title}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={handleRename}>
          <Pencil />
          Rename
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={handleDuplicate}>
          <PlusSquare />
          Duplicate
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={copyNodeId}>
          <Copy />
          Copy ID
          <DropdownMenuShortcut className="font-mono text-[10px]">
            {node.id}
          </DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={handleDelete} variant="destructive">
          <Trash2 />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
