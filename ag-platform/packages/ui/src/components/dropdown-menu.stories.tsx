import type { Meta, StoryObj } from '@storybook/react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel, DropdownMenuCheckboxItem, DropdownMenuRadioItem, DropdownMenuRadioGroup } from './dropdown-menu';
import { Button } from './button';
import { Check, Edit, Copy, Download, Delete, Share, ExternalLink, Flag, User, Settings, LogOut } from 'lucide-react';

const meta: Meta<typeof DropdownMenu> = {
  title: 'Components/DropdownMenu',
  component: DropdownMenu,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof DropdownMenu>;

const DropdownDemo = ({ children, ...props }: React.ComponentProps<typeof DropdownMenuContent>) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">Open Menu</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent {...props}>
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export const Default: Story = {
  render: () => (
    <DropdownDemo>
      <DropdownMenuItem>Profile</DropdownMenuItem>
      <DropdownMenuItem>Settings</DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem>Logout</DropdownMenuItem>
    </DropdownDemo>
  ),
};

export const WithIcons: Story = {
  render: () => (
    <DropdownDemo>
      <DropdownMenuItem>
        <User className="mr-2 h-4 w-4" /> Profile
      </DropdownMenuItem>
      <DropdownMenuItem>
        <Settings className="mr-2 h-4 w-4" /> Settings
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem>
        <LogOut className="mr-2 h-4 w-4" /> Logout
      </DropdownMenuItem>
    </DropdownDemo>
  ),
};

export const WithGroups: Story = {
  render: () => (
    <DropdownDemo>
      <DropdownMenuLabel>Account</DropdownMenuLabel>
      <DropdownMenuItem>Profile</DropdownMenuItem>
      <DropdownMenuItem>Settings</DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuLabel>Actions</DropdownMenuLabel>
      <DropdownMenuItem>Edit Profile</DropdownMenuItem>
      <DropdownMenuItem>Change Password</DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem className="text-red-600 focus:text-red-600">Logout</DropdownMenuItem>
    </DropdownDemo>
  ),
};

export const WithCheckboxes: Story = {
  render: () => (
    <DropdownDemo>
      <DropdownMenuCheckboxItem checked={false}>Enable notifications</DropdownMenuCheckboxItem>
      <DropdownMenuCheckboxItem checked={true}>Email updates</DropdownMenuCheckboxItem>
      <DropdownMenuCheckboxItem checked={false}>Weekly digest</DropdownMenuCheckboxItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem>Save Preferences</DropdownMenuItem>
    </DropdownDemo>
  ),
};

export const WithRadioGroup: Story = {
  render: () => (
    <DropdownDemo>
      <DropdownMenuRadioGroup value="option1">
        <DropdownMenuRadioItem value="option1">Option 1</DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="option2">Option 2</DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="option3">Option 3</DropdownMenuRadioItem>
      </DropdownMenuRadioGroup>
      <DropdownMenuSeparator />
      <DropdownMenuItem>Apply</DropdownMenuItem>
    </DropdownDemo>
  ),
};

export const UserMenu: Story = {
  render: () => (
    <DropdownDemo align="end" sideOffset={8}>
      <DropdownMenuLabel className="font-normal">John Doe</DropdownMenuLabel>
      <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">john@example.com</DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem>
        <User className="mr-2 h-4 w-4" /> Profile
      </DropdownMenuItem>
      <DropdownMenuItem>
        <Settings className="mr-2 h-4 w-4" /> Settings
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem className="text-red-600 focus:text-red-600">
        <LogOut className="mr-2 h-4 w-4" /> Logout
      </DropdownMenuItem>
    </DropdownDemo>
  ),
};

export const ActionsMenu: Story = {
  render: () => (
    <DropdownDemo align="end">
      <DropdownMenuItem>
        <Edit className="mr-2 h-4 w-4" /> Edit
      </DropdownMenuItem>
      <DropdownMenuItem>
        <Copy className="mr-2 h-4 w-4" /> Duplicate
      </DropdownMenuItem>
      <DropdownMenuItem>
        <Download className="mr-2 h-4 w-4" /> Download
      </DropdownMenuItem>
      <DropdownMenuItem>
        <Share className="mr-2 h-4 w-4" /> Share
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem>
        <ExternalLink className="mr-2 h-4 w-4" /> Open in New Tab
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem className="text-red-600 focus:text-red-600">
        <Delete className="mr-2 h-4 w-4" /> Delete
      </DropdownMenuItem>
    </DropdownDemo>
  ),
};

export const WithDisabled: Story = {
  render: () => (
    <DropdownDemo>
      <DropdownMenuItem>Enabled Item</DropdownMenuItem>
      <DropdownMenuItem disabled>Disabled Item</DropdownMenuItem>
      <DropdownMenuItem>Another Enabled Item</DropdownMenuItem>
    </DropdownDemo>
  ),
};

export const RightAligned: Story = {
  render: () => (
    <DropdownDemo align="end" sideOffset={8}>
      <DropdownMenuItem>Option 1</DropdownMenuItem>
      <DropdownMenuItem>Option 2</DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem>Option 3</DropdownMenuItem>
    </DropdownDemo>
  ),
};

export const LargeMenu: Story = {
  render: () => (
    <DropdownDemo>
      <DropdownMenuLabel>File</DropdownMenuLabel>
      <DropdownMenuItem>New</DropdownMenuItem>
      <DropdownMenuItem>Open</DropdownMenuItem>
      <DropdownMenuItem>Save</DropdownMenuItem>
      <DropdownMenuItem>Save As</DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuLabel>Edit</DropdownMenuLabel>
      <DropdownMenuItem>Undo</DropdownMenuItem>
      <DropdownMenuItem>Redo</DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem>Cut</DropdownMenuItem>
      <DropdownMenuItem>Copy</DropdownMenuItem>
      <DropdownMenuItem>Paste</DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuLabel>View</DropdownMenuLabel>
      <DropdownMenuItem>Zoom In</DropdownMenuItem>
      <DropdownMenuItem>Zoom Out</DropdownMenuItem>
      <DropdownMenuItem>Reset Zoom</DropdownMenuItem>
    </DropdownDemo>
  ),
};

export const WithCustomTrigger: Story = {
  render: () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <span className="h-5 w-5">\u22ef</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem>Edit</DropdownMenuItem>
        <DropdownMenuItem>Delete</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
};