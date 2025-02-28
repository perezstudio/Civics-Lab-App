// app/components/contacts/ContactViewSettings.tsx
import { useState, useCallback } from 'react';
import { Cog, Edit, Trash2 } from 'lucide-react';
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
  const [editViewName, setEditViewName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleOpenEditView = useCallback(() => {
    if (selectedView) {
      setEditViewName(selectedView.view_name);
      setIsEditViewOpen(true);
    }
  }, [selectedView]);
  
  const handleEditView = useCallback(async () => {
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
  }, [editViewName, isSubmitting, onEditView]);
  
  const handleDeleteView = useCallback(async () => {
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      await onDeleteView();
      setIsDeleteViewOpen(false);
      setIsSheetOpen(false);
    } catch (error) {
      console.error("Error deleting view:", error);
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, onDeleteView]);
  
  if (!selectedView) return null;
  
  return (
    <>
      {/* Use a dropdown menu for quick actions */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon">
            <Cog className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setIsSheetOpen(true)}>
            View Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleOpenEditView}>
            <Edit className="mr-2 h-4 w-4" />
            Edit View
          </DropdownMenuItem>
          <DropdownMenuItem 
            className="text-destructive focus:text-destructive"
            onClick={() => setIsDeleteViewOpen(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete View
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
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
      <AlertDialog open={isEditViewOpen} onOpenChange={setIsEditViewOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Edit View</AlertDialogTitle>
            <AlertDialogDescription>
              Update the name of your current view.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Input
              placeholder="View name"
              value={editViewName}
              onChange={(e) => setEditViewName(e.target.value)}
              className="w-full"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => {
                setEditViewName('');
                setIsEditViewOpen(false);
              }}
              disabled={isSubmitting}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button 
                onClick={handleEditView}
                disabled={!editViewName.trim() || isSubmitting}
              >
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
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