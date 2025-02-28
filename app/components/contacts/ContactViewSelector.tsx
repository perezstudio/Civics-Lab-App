// app/components/contacts/ContactViewSelector.tsx
import { useState, useCallback } from 'react';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription,
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "~/components/ui/alert-dialog";
import { Input } from "~/components/ui/input";
import { cn } from "~/lib/utils";
import { ContactView } from '~/components/contacts/types';

interface ContactViewSelectorProps {
  views: ContactView[];
  selectedView: ContactView | null;
  onViewSelect: (view: ContactView) => void;
  onCreateView: (name: string) => Promise<void>;
  onRefreshViews: () => Promise<void>;
}

export function ContactViewSelector({
  views,
  selectedView,
  onViewSelect,
  onCreateView,
  onRefreshViews
}: ContactViewSelectorProps) {
  const [isCreateViewOpen, setIsCreateViewOpen] = useState(false);
  const [newViewName, setNewViewName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Memoized handler to prevent recreating on each render
  const handleCreateView = useCallback(async () => {
    if (!newViewName.trim() || isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      await onCreateView(newViewName.trim());
      await onRefreshViews();
      setNewViewName('');
      setIsCreateViewOpen(false);
    } catch (error) {
      console.error('Error creating view:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [newViewName, isSubmitting, onCreateView, onRefreshViews]);
  
  const openCreateDialog = useCallback(() => {
    setIsCreateViewOpen(true);
  }, []);
  
  return (
    <>
      {/* Use DropdownMenu instead of Popover */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="w-[200px] justify-between"
          >
            {selectedView ? selectedView.view_name : "Select view..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[200px]">
          {views.length === 0 ? (
            <DropdownMenuItem disabled>
              No views found
            </DropdownMenuItem>
          ) : (
            views.map((view) => (
              <DropdownMenuItem
                key={view.id}
                className={cn(
                  "flex items-center justify-between",
                  selectedView?.id === view.id ? "bg-accent font-medium" : ""
                )}
                onClick={() => onViewSelect(view)}
              >
                {view.view_name}
                {selectedView?.id === view.id && (
                  <Check className="ml-2 h-4 w-4" />
                )}
              </DropdownMenuItem>
            ))
          )}
          <DropdownMenuItem
            className="border-t mt-1 pt-1"
            onClick={openCreateDialog}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create View
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      {/* Create View Dialog */}
      <AlertDialog open={isCreateViewOpen} onOpenChange={setIsCreateViewOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Create New View</AlertDialogTitle>
            <AlertDialogDescription>
              Enter a name for your new view to organize your contacts.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Input
              placeholder="View name"
              value={newViewName}
              onChange={(e) => setNewViewName(e.target.value)}
              className="w-full"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => {
                setNewViewName('');
                setIsCreateViewOpen(false);
              }}
              disabled={isSubmitting}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button 
                onClick={handleCreateView}
                disabled={!newViewName.trim() || isSubmitting}
              >
                {isSubmitting ? 'Creating...' : 'Create'}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}