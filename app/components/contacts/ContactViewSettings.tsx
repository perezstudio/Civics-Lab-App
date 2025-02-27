// app/components/contacts/ContactViewSettings.tsx
import { Cog, Edit, Trash2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "~/components/ui/alert-dialog";
import { Input } from "~/components/ui/input";
import { useState } from 'react';
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
  const [isOpen, setIsOpen] = useState(false);
  const [isEditViewOpen, setIsEditViewOpen] = useState(false);
  const [isDeleteViewOpen, setIsDeleteViewOpen] = useState(false);
  const [editViewName, setEditViewName] = useState('');
  
  const handleOpenEditView = () => {
    if (selectedView) {
      setEditViewName(selectedView.view_name);
      setIsEditViewOpen(true);
    }
  };
  
  const handleEditView = async () => {
    if (!editViewName.trim()) return;
    
    await onEditView(editViewName.trim());
    setEditViewName('');
    setIsEditViewOpen(false);
  };
  
  const handleDeleteView = async () => {
    await onDeleteView();
    setIsDeleteViewOpen(false);
  };
  
  if (!selectedView) return null;
  
  return (
    <>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline"><Cog /></Button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
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
            
            <div className="pt-4 border-t flex gap-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={handleOpenEditView}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit View
              </Button>
              <Button
                variant="destructive"
                className="w-full"
                onClick={() => setIsDeleteViewOpen(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete View
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
      
      {/* Edit View Dialog */}
      <AlertDialog open={isEditViewOpen} onOpenChange={setIsEditViewOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Edit View</AlertDialogTitle>
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
            <AlertDialogCancel onClick={() => {
              setEditViewName('');
              setIsEditViewOpen(false);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button 
                onClick={handleEditView}
                disabled={!editViewName.trim()}
              >
                Save Changes
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
            <AlertDialogCancel onClick={() => setIsDeleteViewOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteView}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}