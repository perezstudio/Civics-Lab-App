// app/components/contacts/ContactDetails.tsx
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription,
  SheetFooter
} from "~/components/ui/sheet";
import { Contact } from "~/components/contacts/types";
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
import { useState } from "react";
import { Edit, Trash2 } from "lucide-react";

interface ContactDetailsProps {
  contact: Contact | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (contact: Contact) => void;
  onDelete?: (contactId: string) => void;
  isLoading?: boolean;
}

export function ContactDetails({
  contact,
  isOpen,
  onOpenChange,
  onEdit,
  onDelete,
  isLoading = false
}: ContactDetailsProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  if (!contact) return null;
  
  const handleEdit = () => {
    if (onEdit && contact) {
      onEdit(contact);
    }
  };
  
  const handleDelete = () => {
    if (onDelete && contact) {
      onDelete(contact.id);
      setIsDeleteDialogOpen(false);
    }
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onOpenChange}>
        <SheetContent className="w-[70%] sm:max-w-[70%]" side="right">
          <SheetHeader>
            <SheetTitle>Contact Details</SheetTitle>
            <SheetDescription>
              View detailed information about this contact
            </SheetDescription>
          </SheetHeader>
          
          <div className="mt-6 space-y-6">
            {isLoading ? (
              <div className="flex items-center justify-center h-40">
                <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                {/* Basic Information */}
                <div>
                  <h3 className="text-lg font-medium">Basic Information</h3>
                  <div className="mt-3 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Name</p>
                      <p className="text-base">
                        {contact.first_name} 
                        {contact.middle_name ? ` ${contact.middle_name} ` : ' '}
                        {contact.last_name}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Race</p>
                      <p className="text-base">
                        {contact.race ? contact.race.race : 'Not specified'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Gender</p>
                      <p className="text-base">
                        {contact.gender ? contact.gender.gender : 'Not specified'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Pronouns</p>
                      <p className="text-base">
                        {contact.pronouns || 'Not specified'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">VAN ID</p>
                      <p className="text-base">
                        {contact.vanid || 'Not specified'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <p className="text-base capitalize">
                        {contact.status || 'Unknown'}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Contact Information */}
                <div>
                  <h3 className="text-lg font-medium">Contact Information</h3>
                  
                  {/* Emails */}
                  <div className="mt-3">
                    <p className="text-sm text-muted-foreground">Email Addresses</p>
                    {contact.emails && contact.emails.length > 0 ? (
                      <div className="mt-1 space-y-2">
                        {contact.emails.map((email, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <Badge variant={email.status === 'active' ? 'default' : 'outline'}>
                              {email.status}
                            </Badge>
                            <p>{email.email}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm italic">No email addresses</p>
                    )}
                  </div>
                  
                  {/* Phone Numbers */}
                  <div className="mt-3">
                    <p className="text-sm text-muted-foreground">Phone Numbers</p>
                    {contact.phones && contact.phones.length > 0 ? (
                      <div className="mt-1 space-y-2">
                        {contact.phones.map((phone, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <Badge variant={phone.status === 'active' ? 'default' : 'outline'}>
                              {phone.status}
                            </Badge>
                            <p>{phone.number}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm italic">No phone numbers</p>
                    )}
                  </div>
                  
                  {/* Addresses */}
                  <div className="mt-3">
                    <p className="text-sm text-muted-foreground">Addresses</p>
                    {contact.addresses && contact.addresses.length > 0 ? (
                      <div className="mt-1 space-y-3">
                        {contact.addresses.map((address, index) => (
                          <div key={index} className="border p-3 rounded-md">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant={address.status === 'active' ? 'default' : 'outline'}>
                                {address.status}
                              </Badge>
                              <p className="font-medium">{address.type || 'Address'}</p>
                            </div>
                            <p>{address.street_address}</p>
                            {address.secondary_street_address && <p>{address.secondary_street_address}</p>}
                            <p>
                              {address.city}
                              {address.state?.name ? `, ${address.state.name}` : ''}
                              {address.zip?.name ? ` ${address.zip.name}` : ''}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm italic">No addresses</p>
                    )}
                  </div>
                  
                  {/* Social Media */}
                  <div className="mt-3">
                    <p className="text-sm text-muted-foreground">Social Media</p>
                    {contact.social_media && contact.social_media.length > 0 ? (
                      <div className="mt-1 space-y-2">
                        {contact.social_media.map((account, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <Badge variant="outline">
                              {account.service_type.charAt(0).toUpperCase() + account.service_type.slice(1)}
                            </Badge>
                            <p>{account.username}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm italic">No social media accounts</p>
                    )}
                  </div>
                  
                  {/* Tags */}
                  {contact.tags && contact.tags.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm text-muted-foreground">Tags</p>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {contact.tags.map(tag => (
                          <Badge key={tag.id} variant="secondary">
                            {tag.tag?.tag || 'Unknown tag'}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
          
          <SheetFooter className="absolute bottom-0 left-0 right-0 p-6 border-t bg-background">
            <div className="flex justify-end gap-2 w-full">
              <Button 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Close
              </Button>
              
              {onEdit && (
                <Button 
                  variant="default" 
                  onClick={handleEdit}
                  disabled={isLoading}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Contact
                </Button>
              )}
              
              {onDelete && (
                <Button 
                  variant="destructive" 
                  onClick={() => setIsDeleteDialogOpen(true)}
                  disabled={isLoading}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              )}
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog 
        open={isDeleteDialogOpen} 
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Contact</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this contact? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}