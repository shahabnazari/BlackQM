import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { UserProfileMenu } from '../UserProfileMenu';
import { GlobalSearch } from '../GlobalSearch';
import { Breadcrumbs } from '../Breadcrumbs';
import { MobileNav } from '../MobileNav';
import { CommandPalette } from '../CommandPalette';

// Mock Next.js router
const mockPush = vi.fn();
const mockPathname = '/studies';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  usePathname: () => mockPathname,
}));

// Mock AuthProvider
const mockUser = {
  id: '1',
  email: 'test@example.com',
  name: 'Test User',
  role: 'researcher' as const,
  emailVerified: true,
  twoFactorEnabled: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockLogout = vi.fn();

vi.mock('@/components/providers/AuthProvider', () => ({
  useAuth: () => ({
    user: mockUser,
    isAuthenticated: true,
    logout: mockLogout,
  }),
}));

describe('Navigation Components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('UserProfileMenu', () => {
    it('renders user avatar with initials', () => {
      render(<UserProfileMenu />);
      expect(screen.getByText('TU')).toBeInTheDocument();
    });

    it('shows user information in dropdown', async () => {
      render(<UserProfileMenu />);

      const avatar = screen.getByLabelText('User menu');
      fireEvent.click(avatar);

      await waitFor(() => {
        expect(screen.getByText('Test User')).toBeInTheDocument();
        expect(screen.getByText('test@example.com')).toBeInTheDocument();
        expect(screen.getByText('researcher')).toBeInTheDocument();
      });
    });

    it('handles logout with confirmation', async () => {
      render(<UserProfileMenu />);

      const avatar = screen.getByLabelText('User menu');
      fireEvent.click(avatar);

      const logoutButton = screen.getByText('Logout');
      fireEvent.click(logoutButton);

      await waitFor(() => {
        expect(
          screen.getByText('Are you sure you want to logout?')
        ).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: 'Logout' });
      fireEvent.click(confirmButton);

      expect(mockLogout).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith('/');
    });

    it('navigates to profile settings', async () => {
      render(<UserProfileMenu />);

      const avatar = screen.getByLabelText('User menu');
      fireEvent.click(avatar);

      const profileButton = screen.getByText('Profile Settings');
      fireEvent.click(profileButton);

      expect(mockPush).toHaveBeenCalledWith('/settings/profile');
    });

    it('closes menu when clicking outside', async () => {
      render(<UserProfileMenu />);

      const avatar = screen.getByLabelText('User menu');
      fireEvent.click(avatar);

      expect(screen.getByText('Profile Settings')).toBeInTheDocument();

      fireEvent.mouseDown(document.body);

      await waitFor(() => {
        expect(screen.queryByText('Profile Settings')).not.toBeInTheDocument();
      });
    });

    it('shows presence indicator', () => {
      render(<UserProfileMenu />);
      expect(screen.getByLabelText('Online')).toBeInTheDocument();
    });
  });

  describe('GlobalSearch', () => {
    it('renders search input with placeholder', () => {
      render(<GlobalSearch />);
      expect(
        screen.getByPlaceholderText('Search studies, participants, or help...')
      ).toBeInTheDocument();
    });

    it('shows keyboard shortcut', () => {
      render(<GlobalSearch />);
      expect(screen.getByText('⌘K')).toBeInTheDocument();
    });

    it('performs search on input change', async () => {
      const user = userEvent.setup();
      render(<GlobalSearch />);

      const input = screen.getByPlaceholderText(
        'Search studies, participants, or help...'
      );
      await user.type(input, 'study');

      await waitFor(() => {
        expect(
          screen.getByText('Climate Change Perceptions Study')
        ).toBeInTheDocument();
      });
    });

    it('shows recent searches when focused with empty query', async () => {
      localStorage.setItem('recentSearches', JSON.stringify(['test search']));
      render(<GlobalSearch />);

      const input = screen.getByPlaceholderText(
        'Search studies, participants, or help...'
      );
      fireEvent.focus(input);

      await waitFor(() => {
        expect(screen.getByText('Recent Searches')).toBeInTheDocument();
        expect(screen.getByText('test search')).toBeInTheDocument();
      });
    });

    it('navigates with keyboard arrows', async () => {
      const user = userEvent.setup();
      render(<GlobalSearch />);

      const input = screen.getByPlaceholderText(
        'Search studies, participants, or help...'
      );
      await user.type(input, 'study');

      await waitFor(() => {
        expect(
          screen.getByText('Climate Change Perceptions Study')
        ).toBeInTheDocument();
      });

      fireEvent.keyDown(input, { key: 'ArrowDown' });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(mockPush).toHaveBeenCalled();
    });

    it('saves search to recent searches', async () => {
      const user = userEvent.setup();
      render(<GlobalSearch />);

      const input = screen.getByPlaceholderText(
        'Search studies, participants, or help...'
      );
      await user.type(input, 'test query');

      await waitFor(() => {
        expect(screen.getByText(/Create New Study/)).toBeInTheDocument();
      });

      const firstResult = screen.getByText(/Create New Study/);
      fireEvent.click(firstResult);

      const saved = JSON.parse(localStorage.getItem('recentSearches') || '[]');
      expect(saved).toContain('test query');
    });
  });

  describe('Breadcrumbs', () => {
    it('generates breadcrumbs from pathname', () => {
      render(<Breadcrumbs />);

      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Researcher')).toBeInTheDocument();
      expect(screen.getByText('Studies')).toBeInTheDocument();
    });

    it('renders custom breadcrumb items', () => {
      const items = [
        { label: 'Custom Home', href: '/' },
        { label: 'Custom Page' },
      ];

      render(<Breadcrumbs items={items} />);

      expect(screen.getByText('Custom Home')).toBeInTheDocument();
      expect(screen.getByText('Custom Page')).toBeInTheDocument();
    });

    it('shows preview on hover', async () => {
      render(<Breadcrumbs />);

      const studiesLink = screen.getByText('Studies');
      fireEvent.mouseEnter(studiesLink);

      await waitFor(() => {
        expect(screen.getByText('Studies Dashboard')).toBeInTheDocument();
        expect(
          screen.getByText('Manage all your Q-methodology studies')
        ).toBeInTheDocument();
      });
    });

    it('handles overflow with ellipsis', () => {
      const items = Array.from({ length: 10 }, (_, i) => ({
        label: `Item ${i + 1}`,
        href: i < 9 ? `/path${i + 1}` : undefined,
      }));

      render(<Breadcrumbs items={items} maxItems={4} />);

      expect(screen.getByText(/more/)).toBeInTheDocument();
    });

    it('navigates when clicking breadcrumb links', () => {
      render(<Breadcrumbs />);

      const homeLink = screen.getByRole('link', { name: /Home/i });
      fireEvent.click(homeLink);

      // Link component should handle navigation, not push
      expect(homeLink).toHaveAttribute('href', '/');
    });
  });

  describe('MobileNav', () => {
    it('renders hamburger button', () => {
      render(<MobileNav />);
      expect(screen.getByLabelText('Toggle mobile menu')).toBeInTheDocument();
    });

    it('opens and closes mobile menu', async () => {
      render(<MobileNav />);

      const hamburger = screen.getByLabelText('Toggle mobile menu');
      fireEvent.click(hamburger);

      await waitFor(() => {
        expect(screen.getByText('Menu')).toBeInTheDocument();
      });

      const closeButton = screen.getByLabelText('Close menu');
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByText('Menu')).not.toBeInTheDocument();
      });
    });

    it('shows user-specific menu items', async () => {
      render(<MobileNav />);

      const hamburger = screen.getByLabelText('Toggle mobile menu');
      fireEvent.click(hamburger);

      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
        expect(screen.getByText('Studies')).toBeInTheDocument();
        expect(screen.getByText('Analytics')).toBeInTheDocument();
      });
    });

    it('closes menu on navigation', async () => {
      render(<MobileNav />);

      const hamburger = screen.getByLabelText('Toggle mobile menu');
      fireEvent.click(hamburger);

      const dashboardButton = await screen.findByText('Dashboard');
      fireEvent.click(dashboardButton);

      expect(mockPush).toHaveBeenCalledWith('/dashboard');
      await waitFor(() => {
        expect(screen.queryByText('Menu')).not.toBeInTheDocument();
      });
    });

    it('prevents body scroll when open', async () => {
      render(<MobileNav />);

      const hamburger = screen.getByLabelText('Toggle mobile menu');
      fireEvent.click(hamburger);

      expect(document.body.style.overflow).toBe('hidden');

      const closeButton = screen.getByLabelText('Close menu');
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(document.body.style.overflow).toBe('');
      });
    });
  });

  describe('CommandPalette', () => {
    it('opens with keyboard shortcut', () => {
      render(<CommandPalette />);

      fireEvent.keyDown(document, { key: 'p', metaKey: true, shiftKey: true });

      expect(
        screen.getByPlaceholderText('Type a command or search...')
      ).toBeInTheDocument();
    });

    it('filters commands based on query', async () => {
      const user = userEvent.setup();
      render(<CommandPalette />);

      fireEvent.keyDown(document, { key: 'p', metaKey: true, shiftKey: true });

      const input = screen.getByPlaceholderText('Type a command or search...');
      await user.type(input, 'theme');

      expect(screen.getByText('Toggle Theme')).toBeInTheDocument();
      expect(screen.queryByText('Go to Home')).not.toBeInTheDocument();
    });

    it('executes commands', () => {
      render(<CommandPalette />);

      fireEvent.keyDown(document, { key: 'p', metaKey: true, shiftKey: true });

      const createStudyCommand = screen.getByText('Create New Study');
      fireEvent.click(createStudyCommand);

      expect(mockPush).toHaveBeenCalledWith('/studies/create');
    });

    it('navigates commands with keyboard', () => {
      render(<CommandPalette />);

      fireEvent.keyDown(document, { key: 'p', metaKey: true, shiftKey: true });

      const input = screen.getByPlaceholderText('Type a command or search...');
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(mockPush).toHaveBeenCalled();
    });

    it('saves recent commands', () => {
      render(<CommandPalette />);

      fireEvent.keyDown(document, { key: 'p', metaKey: true, shiftKey: true });

      const command = screen.getByText('Go to Home');
      fireEvent.click(command);

      const saved = JSON.parse(localStorage.getItem('recentCommands') || '[]');
      expect(saved).toContain('nav-home');
    });

    it('closes on Escape key', () => {
      render(<CommandPalette />);

      fireEvent.keyDown(document, { key: 'p', metaKey: true, shiftKey: true });
      expect(
        screen.getByPlaceholderText('Type a command or search...')
      ).toBeInTheDocument();

      fireEvent.keyDown(document, { key: 'Escape' });
      expect(
        screen.queryByPlaceholderText('Type a command or search...')
      ).not.toBeInTheDocument();
    });
  });
});
