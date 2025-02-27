// app/components/contacts/ContactSorting.tsx
import { X, Plus } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { ContactSorting, ContactView, formatFieldName } from "~/components/contacts/types";

interface ContactSortingProps {
  selectedView: ContactView | null;
  setSelectedView: (view: ContactView | null) => void;
  updateViewInDatabase: (view: ContactView) => Promise<void>;
  isSortingOpen: boolean;
  setIsSortingOpen: (open: boolean) => void;
}

export function ContactSortingComponent({
  selectedView,
  setSelectedView,
  updateViewInDatabase,
  isSortingOpen,
  setIsSortingOpen
}: ContactSortingProps) {
  // Add sort to view
  const addSort = () => {
    if (!selectedView) return;
    
    // Find first available field that's visible in the view
    const firstField = Object.entries(selectedView)
      .filter(([key, value]) => 
        value === true && 
        ["first_name", "last_name", "email", "phone"].includes(key)
      )[0]?.[0] || "first_name";
    
    const updatedView = {
      ...selectedView,
      sorting: [
        ...(selectedView.sorting || []),
        { field: firstField, direction: 'asc' }
      ]
    };
    
    setSelectedView(updatedView);
    updateViewInDatabase(updatedView);
  };
  
  // Update sort in view
  const updateSort = (index: number, data: Partial<ContactSorting>) => {
    if (!selectedView) return;
    
    const newSorting = [...selectedView.sorting];
    newSorting[index] = { ...newSorting[index], ...data };
    
    const updatedView = {
      ...selectedView,
      sorting: newSorting
    };
    
    setSelectedView(updatedView);
    updateViewInDatabase(updatedView);
  };
  
  // Remove sort from view
  const removeSort = (index: number) => {
    if (!selectedView) return;
    
    const newSorting = [...selectedView.sorting];
    newSorting.splice(index, 1);
    
    const updatedView = {
      ...selectedView,
      sorting: newSorting
    };
    
    setSelectedView(updatedView);
    updateViewInDatabase(updatedView);
  };
  
  // Clear all sorts
  const clearSorting = () => {
    if (!selectedView) return;
    
    const updatedView = {
      ...selectedView,
      sorting: []
    };
    
    setSelectedView(updatedView);
    updateViewInDatabase(updatedView);
  };
  
  return (
    <Popover open={isSortingOpen} onOpenChange={setIsSortingOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          Sort
          {selectedView?.sorting && selectedView.sorting.length > 0 && (
            <Badge variant="secondary" className="ml-1 rounded-full px-2 py-0 text-xs">
              {selectedView.sorting.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-4" align="start" side="top">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Sorting</h4>
            <Button
              variant="outline"
              size="sm"
              onClick={addSort}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Sort
            </Button>
          </div>
          
          {selectedView?.sorting && selectedView.sorting.length > 0 ? (
            <div className="space-y-3">
              {selectedView.sorting.map((sort, index) => (
                <div key={index} className="border rounded-md p-3 bg-background">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      <Select
                        value={sort.field}
                        onValueChange={(value) => updateSort(index, { field: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select field" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(selectedView)
                            .filter(([key, value]) => 
                              typeof value === 'boolean' && 
                              value === true && 
                              key !== 'id' && 
                              key !== 'view_name' && 
                              key !== 'workspace_id'
                            )
                            .map(([key]) => (
                              <SelectItem key={key} value={key}>
                                {formatFieldName(key)}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      
                      <Select
                        value={sort.direction}
                        onValueChange={(value: 'asc' | 'desc') => updateSort(index, { direction: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select direction" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="asc">Ascending</SelectItem>
                          <SelectItem value="desc">Descending</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => removeSort(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              No sorting criteria added. Click "Add Sort" to create one.
            </div>
          )}
          
          {selectedView?.sorting && selectedView.sorting.length > 0 && (
            <div className="flex justify-end">
              <Button 
                variant="destructive" 
                size="sm"
                onClick={clearSorting}
              >
                Clear All Sorting
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}