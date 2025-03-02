// app/components/contacts/ContactFilters.tsx
import { X, Plus, GripVertical } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Badge } from "~/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { ContactFilter, ContactView, formatFieldName, ViewField } from '~/components/contacts/types';
import { useCallback } from "react";

interface ContactFiltersProps {
  selectedView: ContactView | null;
  setSelectedView: (view: ContactView | null) => void;
  updateViewInDatabase: (view: ContactView) => Promise<void>;
  isFilterOpen: boolean;
  setIsFilterOpen: (open: boolean) => void;
}

export function ContactFilters({
  selectedView,
  setSelectedView,
  updateViewInDatabase,
  isFilterOpen,
  setIsFilterOpen
}: ContactFiltersProps) {
  // Add filter to view - using useCallback to prevent recreating on every render
  const addFilter = useCallback(() => {
    if (!selectedView) return;
    
    // Find first available field that's visible in the view
    const firstField = Object.entries(selectedView)
      .filter(([key, value]) => 
        value === true && 
        ["first_name", "last_name", "email", "phone"].includes(key)
      )[0]?.[0] as ViewField || "first_name";
    
    const updatedView = {
      ...selectedView,
      filters: [
        ...(selectedView.filters || []),
        { field: firstField, operator: 'equals', value: '' }
      ]
    };
    
    setSelectedView(updatedView);
    updateViewInDatabase(updatedView);
  }, [selectedView, setSelectedView, updateViewInDatabase]);
  
  // Update filter in view - using useCallback
  const updateFilter = useCallback((index: number, data: Partial<ContactFilter>) => {
    if (!selectedView) return;
    
    const newFilters = [...selectedView.filters];
    newFilters[index] = { ...newFilters[index], ...data };
    
    const updatedView = {
      ...selectedView,
      filters: newFilters
    };
    
    setSelectedView(updatedView);
    updateViewInDatabase(updatedView);
  }, [selectedView, setSelectedView, updateViewInDatabase]);
  
  // Remove filter from view - using useCallback
  const removeFilter = useCallback((index: number) => {
    if (!selectedView) return;
    
    const newFilters = [...selectedView.filters];
    newFilters.splice(index, 1);
    
    const updatedView = {
      ...selectedView,
      filters: newFilters
    };
    
    setSelectedView(updatedView);
    updateViewInDatabase(updatedView);
  }, [selectedView, setSelectedView, updateViewInDatabase]);
  
  // Clear all filters - using useCallback
  const clearFilters = useCallback(() => {
    if (!selectedView) return;
    
    const updatedView = {
      ...selectedView,
      filters: []
    };
    
    setSelectedView(updatedView);
    updateViewInDatabase(updatedView);
  }, [selectedView, setSelectedView, updateViewInDatabase]);
  
  // Move a filter up or down - using useCallback
  const moveFilter = useCallback((index: number, direction: number) => {
    if (!selectedView) return;
    
    const newFilters = [...selectedView.filters];
    const newIndex = index + direction;
    
    // Check if new index is valid
    if (newIndex < 0 || newIndex >= newFilters.length) return;
    
    // Swap the filters
    [newFilters[index], newFilters[newIndex]] = [newFilters[newIndex], newFilters[index]];
    
    const updatedView = {
      ...selectedView,
      filters: newFilters
    };
    
    setSelectedView(updatedView);
    updateViewInDatabase(updatedView);
  }, [selectedView, setSelectedView, updateViewInDatabase]);
  
  // If there's no selected view, don't render anything
  if (!selectedView) return null;
  
  return (
    <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          Filter
          {selectedView?.filters && selectedView.filters.length > 0 && (
            <Badge variant="secondary" className="ml-1 rounded-full px-2 py-0 text-xs">
              {selectedView.filters.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[600px] p-4" align="start" side="top">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Filters</h4>
            <Button
              variant="outline"
              size="sm"
              onClick={addFilter}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Filter
            </Button>
          </div>
          
          {selectedView?.filters && selectedView.filters.length > 0 ? (
            <div className="space-y-3">
              {selectedView.filters.map((filter, index) => (
                <div key={index} className="border rounded-md p-3 bg-background">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-5 w-5 p-0"
                        onClick={() => moveFilter(index, -1)}
                        disabled={index === 0}
                      >
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                    
                    <div className="flex-1 grid grid-cols-3 gap-2">
                      <Select
                        value={filter.field}
                        onValueChange={(value) => updateFilter(index, { field: value })}
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
                        value={filter.operator}
                        onValueChange={(value) => updateFilter(index, { operator: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select operator" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="equals">Equals</SelectItem>
                          <SelectItem value="contains">Contains</SelectItem>
                          <SelectItem value="starts_with">Starts with</SelectItem>
                          <SelectItem value="ends_with">Ends with</SelectItem>
                          <SelectItem value="greater_than">Greater than</SelectItem>
                          <SelectItem value="less_than">Less than</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Input
                        placeholder="Value"
                        value={filter.value}
                        onChange={(e) => updateFilter(index, { value: e.target.value })}
                      />
                    </div>
                    
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => removeFilter(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              No filters added. Click "Add Filter" to create one.
            </div>
          )}
          
          {selectedView?.filters && selectedView.filters.length > 0 && (
            <div className="flex justify-end">
              <Button 
                variant="destructive" 
                size="sm"
                onClick={clearFilters}
              >
                Clear All Filters
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}