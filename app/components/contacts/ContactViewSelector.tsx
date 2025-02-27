// app/components/contacts/ContactViewSelector.tsx
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { Button } from "~/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "~/components/ui/command";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "~/components/ui/alert-dialog";
import { Input } from "~/components/ui/input";
import { useState } from 'react';
import { cn } from "~/lib/utils";
import { ContactView } from '~/components/contacts/types';

interface ContactViewSelectorProps {
  views: ContactView[];
  selectedView: ContactView | null;
  onViewSelect: (view: ContactView) => void;
  onCreateView: (name: string) => void;
  onRefreshViews: () => void;
}

export function ContactViewSelector({
  views,
  selectedView,
  onViewSelect,
  onCreateView,
  onRefreshViews
}: ContactViewSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreateViewOpen, setIsCreateViewOpen] = useState(false);
  const [newViewName, setNewViewName] = useState('');
  
  const handleCreateView = () => {
    if (!newViewName.trim()) return;
    
    onCreateView(newViewName.trim());
    setNewViewName('');
    setIsCreateViewOpen(false);
    onRefreshViews();
  };
  
  return (
    <>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            className="w-[200px] justify-between"
          >
            {selectedView ? selectedView.view_name : "Select view..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0">
          <Command>
            <CommandInput placeholder="Search views..." />
            <CommandList>
              <CommandEmpty>No views found.</CommandEmpty>
              <CommandGroup>
                {views.map((view) => (
                  <CommandItem
                    key={view.id}
                    value={view.id}
                    onSelect={() => {
                      onViewSelect(view);
                      setIsOpen(false);
                    }}
                  >
                    {view.view_name}
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4",
                        selectedView?.id === view.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
                <CommandItem
                  onSelect={() => {
                    setIsOpen(false);
                    setIsCreateViewOpen(true);
                  }}
                  className="border-t"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create View
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      
      {/* Create View Dialog */}
      <AlertDialog open={isCreateViewOpen} onOpenChange={setIsCreateViewOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Create New View</AlertDialogTitle>
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
            <AlertDialogCancel onClick={() => {
              setNewViewName('');
              setIsCreateViewOpen(false);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button 
                onClick={handleCreateView}
                disabled={!newViewName.trim()}
              >
                Create
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}