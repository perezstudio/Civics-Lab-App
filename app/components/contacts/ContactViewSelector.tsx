// app/components/contacts/ContactViewSelector.tsx
import React, { useState } from 'react';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "~/components/ui/dialog";
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
  // Local state for creating a new view
  const [isCreateViewOpen, setIsCreateViewOpen] = useState(false);
  const [newViewName, setNewViewName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // Handle view selection
  const handleViewSelect = (view: ContactView) => {
    onViewSelect(view);
    setIsDropdownOpen(false);
  };
  
  // Handle creating a new view
  const handleCreateView = async () => {
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
  };
  
  return (
    <>
      {/* Custom Dropdown implementation to avoid Radix UI issues */}
      <div className="relative">
        <Button
          variant="outline"
          className="w-[200px] justify-between"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        >
          {selectedView ? selectedView.view_name : "Select view..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
        
        {isDropdownOpen && (
          <div 
            className="absolute left-0 top-full z-50 mt-1 w-[200px] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2"
          >
            {views.length === 0 ? (
              <div className="py-6 text-center text-sm">
                No views found
              </div>
            ) : (
              views.map((view) => (
                <div
                  key={view.id}
                  className={cn(
                    "relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                    selectedView?.id === view.id ? "bg-accent font-medium" : ""
                  )}
                  onClick={() => handleViewSelect(view)}
                >
                  {view.view_name}
                  {selectedView?.id === view.id && (
                    <Check className="ml-2 h-4 w-4" />
                  )}
                </div>
              ))
            )}
            <div
              className="relative flex cursor-default select-none items-center gap-2 rounded-sm border-t mt-1 pt-1 px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground"
              onClick={() => {
                setIsDropdownOpen(false);
                setIsCreateViewOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Create View
            </div>
          </div>
        )}
      </div>
      
      {/* Create View Dialog - Using Dialog instead of AlertDialog */}
      <Dialog 
        open={isCreateViewOpen} 
        onOpenChange={(open) => {
          setIsCreateViewOpen(open);
          if (!open) setNewViewName('');
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New View</DialogTitle>
            <DialogDescription>
              Enter a name for your new view to organize your contacts.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="View name"
              value={newViewName}
              onChange={(e) => setNewViewName(e.target.value)}
              className="w-full"
            />
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setNewViewName('');
                setIsCreateViewOpen(false);
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateView}
              disabled={!newViewName.trim() || isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}