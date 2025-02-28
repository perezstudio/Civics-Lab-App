// app/components/contacts/ContactsTable.tsx
import { Info } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Contact, ContactView } from "~/components/contacts/types";

interface ContactsTableProps {
  contacts: Contact[];
  selectedView: ContactView | null;
  columnWidths: Record<string, number>;
  handleResizeStart: (e: React.MouseEvent, columnId: string) => void;
  resizing: string | null;
  onViewDetails: (contact: Contact) => void;
  isLoading?: boolean;
}

interface MultipleBadgesProps {
  items: any[] | undefined;
  getLabel: (item: any) => string;
  limit?: number;
}

// Helper component to display multiple items as badges
function MultipleBadges({ items, getLabel, limit = 3 }: MultipleBadgesProps) {
  if (!items || items.length === 0) return null;
  
  const displayItems = items.slice(0, limit);
  const remaining = items.length - limit;
  
  return (
    <div className="flex flex-wrap gap-1">
      {displayItems.map((item, index) => (
        <Badge key={index} variant="outline" className="text-xs">
          {getLabel(item)}
        </Badge>
      ))}
      {remaining > 0 && (
        <Badge variant="secondary" className="text-xs">
          +{remaining} more
        </Badge>
      )}
    </div>
  );
}

export function ContactsTable({
  contacts,
  selectedView,
  columnWidths,
  handleResizeStart,
  resizing,
  onViewDetails,
  isLoading = false
}: ContactsTableProps) {
  // Create a resizable header component
  const ResizableHeader = ({ id, children }: { id: string, children: React.ReactNode }) => (
    <TableHead 
      style={{ 
        width: `${columnWidths[id] || 200}px`, 
        position: 'relative',
        minWidth: `${columnWidths[id] || 200}px`,
        maxWidth: `${columnWidths[id] || 200}px`
      }}
      className={resizing === id ? 'select-none' : ''}
    >
      <div className="flex items-center justify-between">
        <span>{children}</span>
        <div
          className="absolute right-0 top-0 h-full w-4 cursor-col-resize hover:bg-gray-200"
          onMouseDown={(e) => handleResizeStart(e, id)}
        >
          <div className={`h-full w-1 mx-auto ${resizing === id ? 'bg-primary' : 'bg-gray-300'}`}></div>
        </div>
      </div>
    </TableHead>
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
        <span className="ml-2 text-muted-foreground">Loading contacts...</span>
      </div>
    );
  }

  if (!contacts || contacts.length === 0) {
    return (
      <div className="p-8 text-center">
        <h3 className="text-lg font-medium">No contacts found</h3>
        <p className="text-muted-foreground mt-2">
          Try adjusting your search or filters to find what you're looking for.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table className="relative w-full table-fixed">
        <TableHeader>
          <TableRow>
            {selectedView?.first_name && <ResizableHeader id="first_name">First Name</ResizableHeader>}
            {selectedView?.middle_name && <ResizableHeader id="middle_name">Middle Name</ResizableHeader>}
            {selectedView?.last_name && <ResizableHeader id="last_name">Last Name</ResizableHeader>}
            {selectedView?.race && <ResizableHeader id="race">Race</ResizableHeader>}
            {selectedView?.gender && <ResizableHeader id="gender">Gender</ResizableHeader>}
            {selectedView?.pronouns && <ResizableHeader id="pronouns">Pronouns</ResizableHeader>}
            {selectedView?.vanid && <ResizableHeader id="vanid">VAN ID</ResizableHeader>}
            {selectedView?.emails && <ResizableHeader id="emails">Emails</ResizableHeader>}
            {selectedView?.phone_numbers && <ResizableHeader id="phone_numbers">Phone Numbers</ResizableHeader>}
            {selectedView?.addresses && <ResizableHeader id="addresses">Addresses</ResizableHeader>}
            {selectedView?.social_media_accounts && <ResizableHeader id="social_media_accounts">Social Media</ResizableHeader>}
            <ResizableHeader id="actions">Actions</ResizableHeader>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contacts.map(contact => (
            <TableRow key={contact.id}>
              {selectedView?.first_name && (
                <TableCell style={{ 
                  width: `${columnWidths.first_name || 200}px`,
                  minWidth: `${columnWidths.first_name || 200}px`,
                  maxWidth: `${columnWidths.first_name || 200}px`
                }}>
                  {contact.first_name}
                </TableCell>
              )}
              {selectedView?.middle_name && (
                <TableCell style={{ 
                  width: `${columnWidths.middle_name || 150}px`,
                  minWidth: `${columnWidths.middle_name || 150}px`,
                  maxWidth: `${columnWidths.middle_name || 150}px`
                }}>
                  {contact.middle_name}
                </TableCell>
              )}
              {selectedView?.last_name && (
                <TableCell style={{ 
                  width: `${columnWidths.last_name || 200}px`,
                  minWidth: `${columnWidths.last_name || 200}px`,
                  maxWidth: `${columnWidths.last_name || 200}px`
                }}>
                  {contact.last_name}
                </TableCell>
              )}
              {selectedView?.race && (
                <TableCell style={{ 
                  width: `${columnWidths.race || 150}px`,
                  minWidth: `${columnWidths.race || 150}px`,
                  maxWidth: `${columnWidths.race || 150}px`
                }}>
                  {contact.race ? contact.race.race : '-'}
                </TableCell>
              )}
              {selectedView?.gender && (
                <TableCell style={{ 
                  width: `${columnWidths.gender || 150}px`,
                  minWidth: `${columnWidths.gender || 150}px`,
                  maxWidth: `${columnWidths.gender || 150}px`
                }}>
                  {contact.gender ? contact.gender.gender : '-'}
                </TableCell>
              )}
              {selectedView?.pronouns && (
                <TableCell style={{ 
                  width: `${columnWidths.pronouns || 150}px`,
                  minWidth: `${columnWidths.pronouns || 150}px`,
                  maxWidth: `${columnWidths.pronouns || 150}px`
                }}>
                  {contact.pronouns || '-'}
                </TableCell>
              )}
              {selectedView?.vanid && (
                <TableCell style={{ 
                  width: `${columnWidths.vanid || 150}px`,
                  minWidth: `${columnWidths.vanid || 150}px`,
                  maxWidth: `${columnWidths.vanid || 150}px`
                }}>
                  {contact.vanid || '-'}
                </TableCell>
              )}
              {selectedView?.emails && (
                <TableCell style={{ 
                  width: `${columnWidths.emails || 200}px`,
                  minWidth: `${columnWidths.emails || 200}px`,
                  maxWidth: `${columnWidths.emails || 200}px`
                }}>
                  <MultipleBadges 
                    items={contact.emails} 
                    getLabel={item => item.email}
                    limit={2}
                  />
                </TableCell>
              )}
              {selectedView?.phone_numbers && (
                <TableCell style={{ 
                  width: `${columnWidths.phone_numbers || 200}px`,
                  minWidth: `${columnWidths.phone_numbers || 200}px`,
                  maxWidth: `${columnWidths.phone_numbers || 200}px`
                }}>
                  <MultipleBadges 
                    items={contact.phones} 
                    getLabel={item => item.number}
                    limit={2}
                  />
                </TableCell>
              )}
              {selectedView?.addresses && (
                <TableCell style={{ 
                  width: `${columnWidths.addresses || 250}px`,
                  minWidth: `${columnWidths.addresses || 250}px`,
                  maxWidth: `${columnWidths.addresses || 250}px`
                }}>
                  <MultipleBadges 
                    items={contact.addresses} 
                    getLabel={item => `${item.street_address}, ${item.city || ''}`}
                    limit={1}
                  />
                </TableCell>
              )}
              {selectedView?.social_media_accounts && (
                <TableCell style={{ 
                  width: `${columnWidths.social_media_accounts || 200}px`,
                  minWidth: `${columnWidths.social_media_accounts || 200}px`,
                  maxWidth: `${columnWidths.social_media_accounts || 200}px`
                }}>
                  <MultipleBadges 
                    items={contact.social_media} 
                    getLabel={item => `${item.service_type}: ${item.username || 'Unknown'}`}
                    limit={2}
                  />
                </TableCell>
              )}
              <TableCell className="text-right" style={{ 
                width: `${columnWidths.actions || 100}px`,
                minWidth: `${columnWidths.actions || 100}px`,
                maxWidth: `${columnWidths.actions || 100}px`
              }}>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => onViewDetails(contact)}
                  title="View Details"
                >
                  <Info className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}