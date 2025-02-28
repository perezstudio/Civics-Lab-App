// app/components/contacts/ContactForm.tsx
import { Check, X, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "~/components/ui/dialog";
import { Label } from "~/components/ui/label";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Separator } from "~/components/ui/separator";
import { Badge } from "~/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "~/components/ui/command";
import { 
  STATUS_OPTIONS, 
  EMAIL_STATUS_OPTIONS,
  PHONE_STATUS_OPTIONS,
  ADDRESS_STATUS_OPTIONS,
  SOCIAL_MEDIA_SERVICES,
  SOCIAL_MEDIA_STATUS_OPTIONS,
  RaceOption,
  GenderOption,
  StateOption,
  ZipCodeOption,
  TagOption,
  EmailEntry,
  PhoneEntry,
  AddressEntry,
  SocialMediaEntry,
  ContactStatus,
  ContactEmailStatus,
  ContactPhoneStatus,
  ContactAddressStatus,
  SocialMediaService,
  SocialMediaStatus
} from '~/components/contacts/types';
import { cn } from "~/lib/utils";

interface ContactFormProps {
  userId: string;
  workspaceId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  
  // Form state
  isLoading?: boolean;
  isSubmitting?: boolean;
  
  // Reference data
  races: RaceOption[];
  genders: GenderOption[];
  states: StateOption[];
  zipCodes: ZipCodeOption[];
  tags: TagOption[];
  
  // Basic field values and handlers
  firstName: string;
  setFirstName: (value: string) => void;
  middleName: string;
  setMiddleName: (value: string) => void;
  lastName: string;
  setLastName: (value: string) => void;
  race: string;
  setRace: (value: string) => void;
  gender: string;
  setGender: (value: string) => void;
  pronouns: string;
  setPronouns: (value: string) => void;
  vanId: string;
  setVanId: (value: string) => void;
  status: ContactStatus;
  setStatus: (value: ContactStatus) => void;
  
  // Array field values
  emails: EmailEntry[];
  phones: PhoneEntry[];
  addresses: AddressEntry[];
  socialMedia: SocialMediaEntry[];
  selectedTags: TagOption[];
  
  // Array field helpers
  addEmail: () => void;
  updateEmail: (index: number, data: Partial<EmailEntry>) => void;
  removeEmail: (index: number) => void;
  addPhone: () => void;
  updatePhone: (index: number, data: Partial<PhoneEntry>) => void;
  removePhone: (index: number) => void;
  addAddress: () => void;
  updateAddress: (index: number, data: Partial<AddressEntry>) => void;
  removeAddress: (index: number) => void;
  addSocialMedia: () => void;
  updateSocialMedia: (index: number, data: Partial<SocialMediaEntry>) => void;
  removeSocialMedia: (index: number) => void;
  toggleTag: (tag: TagOption) => void;
  
  // Form actions
  resetForm: () => void;
  handleSubmit: () => void;
}

export function ContactForm({ 
  userId, 
  workspaceId, 
  open, 
  onOpenChange,
  onSuccess,
  
  // Form state
  isLoading = false,
  isSubmitting = false,
  
  // Reference data
  races,
  genders,
  states,
  zipCodes,
  tags,
  
  // Basic field values and setters
  firstName,
  setFirstName,
  middleName,
  setMiddleName,
  lastName,
  setLastName,
  race,
  setRace,
  gender,
  setGender,
  pronouns,
  setPronouns,
  vanId,
  setVanId,
  status,
  setStatus,
  
  // Array field values
  emails,
  phones,
  addresses,
  socialMedia,
  selectedTags,
  
  // Array field helpers
  addEmail,
  updateEmail,
  removeEmail,
  addPhone,
  updatePhone,
  removePhone,
  addAddress,
  updateAddress,
  removeAddress,
  addSocialMedia,
  updateSocialMedia,
  removeSocialMedia,
  toggleTag,
  
  // Form actions
  resetForm,
  handleSubmit
}: ContactFormProps) {
  
  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>Create New Contact</DialogTitle>
          <DialogDescription>
            Enter the contact details below. Required fields are marked with an asterisk (*).
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-1 px-6">
          <div className="pb-6">
            {/* Basic Information */}
            <div className="space-y-4 p-2">
              <h3 className="font-semibold">Basic Information</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="firstName" className="after:content-['*'] after:ml-0.5 after:text-red-500">
                    First Name
                  </Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="middleName">
                    Middle Name
                  </Label>
                  <Input
                    id="middleName"
                    value={middleName}
                    onChange={(e) => setMiddleName(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="lastName" className="after:content-['*'] after:ml-0.5 after:text-red-500">
                    Last Name
                  </Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="race">Race</Label>
                  <Select value={race} onValueChange={setRace}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select race" />
                    </SelectTrigger>
                    <SelectContent>
                      {races.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.race}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <Select value={gender} onValueChange={setGender}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      {genders.map((g) => (
                        <SelectItem key={g.id} value={g.id}>
                          {g.gender}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="pronouns">Pronouns</Label>
                  <Input
                    id="pronouns"
                    value={pronouns}
                    onChange={(e) => setPronouns(e.target.value)}
                  />
                </div>
              </div>
    
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="vanId">VanID</Label>
                  <Input
                    id="vanId"
                    value={vanId}
                    onChange={(e) => setVanId(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select 
                    value={status} 
                    onValueChange={(value) => setStatus(value as ContactStatus)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status">
                        {STATUS_OPTIONS.find(s => s.value === status)?.label}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
    
            <Separator />
    
            {/* Emails */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold">Emails</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addEmail}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Email
                </Button>
              </div>
              {emails.length > 0 ? (
                <div className="space-y-4">
                  {emails.map((email, index) => (
                    <div key={index} className="grid grid-cols-[1fr,auto,auto] gap-2 items-end">
                      <div>
                        <Label>Email Address</Label>
                        <Input
                          value={email.email}
                          onChange={(e) => updateEmail(index, { email: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Status</Label>
                        <Select
                          value={email.status}
                          onValueChange={(value) => updateEmail(index, { status: value as ContactEmailStatus })}
                        >
                          <SelectTrigger>
                            <SelectValue>
                              {EMAIL_STATUS_OPTIONS.find(s => s.value === email.status)?.label}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {EMAIL_STATUS_OPTIONS.map((s) => (
                              <SelectItem key={s.value} value={s.value}>
                                {s.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeEmail(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground text-center py-2">
                  No email addresses added
                </div>
              )}
            </div>
    
            <Separator />
    
            {/* Phone Numbers */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold">Phone Numbers</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addPhone}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Phone
                </Button>
              </div>
              {phones.length > 0 ? (
                <div className="space-y-4">
                  {phones.map((phone, index) => (
                    <div key={index} className="grid grid-cols-[1fr,auto,auto] gap-2 items-end">
                      <div>
                        <Label>Phone Number</Label>
                        <Input
                          value={phone.number}
                          onChange={(e) => updatePhone(index, { number: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Status</Label>
                        <Select
                          value={phone.status}
                          onValueChange={(value) => updatePhone(index, { status: value as ContactPhoneStatus })}
                        >
                          <SelectTrigger>
                            <SelectValue>
                              {PHONE_STATUS_OPTIONS.find(s => s.value === phone.status)?.label}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {PHONE_STATUS_OPTIONS.map((s) => (
                              <SelectItem key={s.value} value={s.value}>
                                {s.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removePhone(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground text-center py-2">
                  No phone numbers added
                </div>
              )}
            </div>
      
            <Separator />
      
            {/* Addresses */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold">Addresses</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addAddress}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Address
                </Button>
              </div>
              {addresses.length > 0 ? (
                <div className="space-y-4">
                  {addresses.map((address, index) => (
                    <div key={index} className="space-y-4 border rounded-lg p-4">
                      <div className="flex justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeAddress(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <Label>Street Address</Label>
                          <Input
                            value={address.street}
                            onChange={(e) => updateAddress(index, { street: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label>Secondary Street Address</Label>
                          <Input
                            value={address.street2}
                            onChange={(e) => updateAddress(index, { street2: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label>City</Label>
                          <Input
                            value={address.city}
                            onChange={(e) => updateAddress(index, { city: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label>State</Label>
                          <Select
                            value={address.state}
                            onValueChange={(value) => updateAddress(index, { state: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select state" />
                            </SelectTrigger>
                            <SelectContent>
                              {states.map((s) => (
                                <SelectItem key={s.id} value={s.id}>
                                  {s.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Zip Code</Label>
                          <Select
                            value={address.zipCode}
                            onValueChange={(value) => updateAddress(index, { zipCode: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select zip code" />
                            </SelectTrigger>
                            <SelectContent>
                              {zipCodes.map((z) => (
                                <SelectItem key={z.id} value={z.id}>
                                  {z.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <Label>Status</Label>
                        <Select
                          value={address.status}
                          onValueChange={(value) => updateAddress(index, { status: value as ContactAddressStatus })}
                        >
                          <SelectTrigger>
                            <SelectValue>
                              {ADDRESS_STATUS_OPTIONS.find(s => s.value === address.status)?.label}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {ADDRESS_STATUS_OPTIONS.map((s) => (
                              <SelectItem key={s.value} value={s.value}>
                                {s.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground text-center py-2">
                  No addresses added
                </div>
              )}
            </div>
      
            <Separator />
      
            {/* Social Media Accounts */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold">Social Media Accounts</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addSocialMedia}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Social Media
                </Button>
              </div>
              {socialMedia.length > 0 ? (
                <div className="space-y-4">
                  {socialMedia.map((account, index) => (
                    <div key={index} className="grid grid-cols-[1fr,1fr,auto,auto] gap-2 items-end">
                      <div>
                        <Label>Username</Label>
                        <Input
                          value={account.username}
                          onChange={(e) => updateSocialMedia(index, { username: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Service</Label>
                        <Select
                          value={account.service}
                          onValueChange={(value) => updateSocialMedia(index, { service: value as SocialMediaService })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {SOCIAL_MEDIA_SERVICES.map((service) => (
                              <SelectItem key={service} value={service}>
                                {service.charAt(0).toUpperCase() + service.slice(1)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Status</Label>
                        <Select
                          value={account.status}
                          onValueChange={(value) => updateSocialMedia(index, { status: value as SocialMediaStatus })}
                        >
                          <SelectTrigger>
                            <SelectValue>
                              {SOCIAL_MEDIA_STATUS_OPTIONS.find(s => s.value === account.status)?.label}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {SOCIAL_MEDIA_STATUS_OPTIONS.map((s) => (
                              <SelectItem key={s.value} value={s.value}>
                                {s.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeSocialMedia(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground text-center py-2">
                  No social media accounts added
                </div>
              )}
            </div>
      
            <Separator />
      
            {/* Tags */}
            <div className="space-y-4">
              <h3 className="font-semibold">Tags</h3>
              <div>
                <Label>Select or Create Tags</Label>
                <Command className="border rounded-lg">
                  <CommandInput placeholder="Search tags..." />
                  <CommandList>
                    <CommandEmpty>No tags found.</CommandEmpty>
                    <CommandGroup>
                      {tags.map((tag) => (
                        <CommandItem
                          key={tag.id}
                          value={tag.tag}
                          onSelect={() => toggleTag(tag)}
                        >
                          <div className={cn(
                            "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                            selectedTags.some(t => t.id === tag.id)
                              ? "bg-primary text-primary-foreground"
                              : "opacity-50 [&_svg]:invisible"
                          )}>
                            <Check className={cn("h-4 w-4")} />
                          </div>
                          {tag.tag}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedTags.map((tag) => (
                    <Badge
                      key={tag.id}
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() => toggleTag(tag)}
                    >
                      {tag.tag}
                      <X className="ml-1 h-3 w-3" />
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
        
        <DialogFooter className="p-6 pt-2">
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !firstName.trim() || !lastName.trim()}>
            {isSubmitting ? "Creating..." : "Create Contact"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}