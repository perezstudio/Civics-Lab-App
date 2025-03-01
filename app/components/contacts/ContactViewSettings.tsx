// app/components/contacts/ContactViewSettings.tsx
import { useState } from 'react';
import { Cog, Edit, Trash2 } from 'lucide-react';
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { Input } from "~/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "~/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from "~/components/ui/sheet";
import { ContactView, formatFieldName, VIEW_FIELDS } from '~/components/contacts/types';

interface ContactViewSettingsProps {
  selectedView: ContactView | null;
  onUpdateViewField: (field: keyof ContactView, value: boolean) => Promise<void>;
  onEditView: (name: string) => Promise<void>;
  onDeleteView: () => Promise<void>;
}

export function ContactViewSettings({
  selectedView,
  onUpdateViewField,
  onEditView,
  onDeleteView
}: ContactViewSettingsProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isEditViewOpen, setIsEditViewOpen] = useState(false);
  const [isDeleteViewOpen, setIsDeleteViewOpen] = useState(false);
  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);
  const [editViewName, setEditViewName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleOpenEditView = () => {
    if (selectedView) {
      setEditViewName(selectedView.view_name);
      setIsEditViewOpen(true);
      setIsSettingsMenuOpen(false);
    }
  };
  
  const handleEditView = async () => {
    if (!editViewName.trim() || isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      await onEditView(editViewName.trim());
      setEditViewName('');
      setIsEditViewOpen(false);
      setIsSheetOpen(false);
    } catch (error) {
      console.error("Error editing view:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDeleteView = async () => {
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      await onDeleteView();
      setIsDeleteViewOpen(false);
      setIsSheetOpen(false);
      setIsSettingsMenuOpen(false);
    } catch (error) {
      console.error("Error deleting view:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openSheet = () => {
    setIsSettingsMenuOpen(false);
    setIsSheetOpen(true);
  };
  
  if (!selectedView) return null;
  
  return (
    <>
      {/* Simple custom dropdown instead of Radix UI DropdownMenu */}
      <div className="relative">
        <Button 
          variant="outline" 
          size="icon"
          onClick={() => setIsSettingsMenuOpen(!isSettingsMenuOpen)}
        >
          <Cog className="h-4 w-4" />
        </Button>
        
        {isSettingsMenuOpen && (
          <div 
            className="absolute right-0 top-full z-50 mt-1 w-56 overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
          >
            <div 
              className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground hover:bg-accent hover:text-accent-foreground"
              onClick={openSheet}
            >
              View Settings
            </div>
            
            <div className="h-px mx-1 my-1 bg-muted" />
            
            <div 
              className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground hover:bg-accent hover:text-accent-foreground"
              onClick={handleOpenEditView}
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit View
            </div>
            
            <div 
              className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground hover:bg-destructive hover:text-destructive-foreground text-destructive"
              onClick={() => {
                setIsSettingsMenuOpen(false);
                setIsDeleteViewOpen(true);
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete View
            </div>
          </div>
        )}
      </div>
      
      {/* Use a Sheet for the view settings UI */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>View Settings</SheetTitle>
            <SheetDescription>
              Configure which fields are visible in this view.
            </SheetDescription>
          </SheetHeader>
          
          <div className="py-4">
            <div className="space-y-4">
              {VIEW_FIELDS.map(field => (
                <div key={field} className="flex items-center gap-2">
                  <Checkbox
                    id={`field-${field}`}
                    checked={selectedView[field]}
                    onCheckedChange={(checked) => onUpdateViewField(field, !!checked)}
                  />
                  <label htmlFor={`field-${field}`} className="text-sm cursor-pointer">
                    {formatFieldName(field)}
                  </label>
                </div>
              ))}
            </div>
          </div>
          
          <SheetFooter>
            <div className="flex w-full gap-2 mt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleOpenEditView}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit View
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => setIsDeleteViewOpen(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete View
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>
      
      {/* Edit View Dialog */}
      <Dialog open={isEditViewOpen} onOpenChange={setIsEditViewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit View</DialogTitle>
            <DialogDescription>
              Update the name of your current view.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="View name"
              value={editViewName}
              onChange={(e) => setEditViewName(e.target.value)}
              className="w-full"
            />
          </div>
          <DialogFooter>
            <Button 
              variant="outline"
              onClick={() => {
                setEditViewName('');
                setIsEditViewOpen(false);
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleEditView}
              disabled={!editViewName.trim() || isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete View Dialog */}
      <AlertDialog open={isDeleteViewOpen} onOpenChange={setIsDeleteViewOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete View</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this view? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => setIsDeleteViewOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteView}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}