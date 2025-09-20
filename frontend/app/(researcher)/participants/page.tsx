'use client';

import React, { useState } from 'react';
import {
  UsersIcon,
  MagnifyingGlassIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  UserCircleIcon,
  EnvelopeIcon,
  CalendarIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Participant {
  id: string;
  name: string;
  email: string;
  joinedDate: string;
  studiesCompleted: number;
  studiesInProgress: number;
  lastActive: string;
  status: 'active' | 'inactive' | 'pending';
}

const mockParticipants: Participant[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    joinedDate: '2024-01-15',
    studiesCompleted: 3,
    studiesInProgress: 1,
    lastActive: '2024-09-18',
    status: 'active',
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    joinedDate: '2024-02-20',
    studiesCompleted: 5,
    studiesInProgress: 0,
    lastActive: '2024-09-17',
    status: 'active',
  },
  {
    id: '3',
    name: 'Bob Johnson',
    email: 'bob@example.com',
    joinedDate: '2024-03-10',
    studiesCompleted: 1,
    studiesInProgress: 2,
    lastActive: '2024-09-10',
    status: 'inactive',
  },
];

export default function ParticipantsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'studies'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [, setSelectedParticipant] = useState<Participant | null>(null);

  const filteredParticipants = mockParticipants.filter(
    p =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedParticipants = [...filteredParticipants].sort((a, b) => {
    const order = sortOrder === 'asc' ? 1 : -1;
    switch (sortBy) {
      case 'name':
        return order * a.name.localeCompare(b.name);
      case 'date':
        return (
          order *
          (new Date(a.joinedDate).getTime() - new Date(b.joinedDate).getTime())
        );
      case 'studies':
        return (
          order *
          (a.studiesCompleted +
            a.studiesInProgress -
            (b.studiesCompleted + b.studiesInProgress))
        );
      default:
        return 0;
    }
  });

  const toggleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Participants</h1>
        <p className="text-text-secondary">
          Manage and monitor your research participants
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary">Total Participants</p>
              <p className="text-2xl font-bold">{mockParticipants.length}</p>
            </div>
            <UsersIcon className="w-8 h-8 text-primary" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary">Active</p>
              <p className="text-2xl font-bold text-system-green">
                {mockParticipants.filter(p => p.status === 'active').length}
              </p>
            </div>
            <ChartBarIcon className="w-8 h-8 text-system-green" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary">Studies Completed</p>
              <p className="text-2xl font-bold">
                {mockParticipants.reduce(
                  (acc, p) => acc + p.studiesCompleted,
                  0
                )}
              </p>
            </div>
            <ChartBarIcon className="w-8 h-8 text-system-blue" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary">In Progress</p>
              <p className="text-2xl font-bold text-system-orange">
                {mockParticipants.reduce(
                  (acc, p) => acc + p.studiesInProgress,
                  0
                )}
              </p>
            </div>
            <ChartBarIcon className="w-8 h-8 text-system-orange" />
          </div>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-tertiary" />
            <input
              type="text"
              placeholder="Search participants by name or email..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-surface-secondary rounded-lg border border-border focus:outline-none focus:border-primary"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => toggleSort('name')}
              className="flex items-center gap-1"
            >
              Name
              {sortBy === 'name' &&
                (sortOrder === 'asc' ? (
                  <ArrowUpIcon className="w-3 h-3" />
                ) : (
                  <ArrowDownIcon className="w-3 h-3" />
                ))}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => toggleSort('date')}
              className="flex items-center gap-1"
            >
              Joined
              {sortBy === 'date' &&
                (sortOrder === 'asc' ? (
                  <ArrowUpIcon className="w-3 h-3" />
                ) : (
                  <ArrowDownIcon className="w-3 h-3" />
                ))}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => toggleSort('studies')}
              className="flex items-center gap-1"
            >
              Studies
              {sortBy === 'studies' &&
                (sortOrder === 'asc' ? (
                  <ArrowUpIcon className="w-3 h-3" />
                ) : (
                  <ArrowDownIcon className="w-3 h-3" />
                ))}
            </Button>
          </div>
        </div>
      </Card>

      {/* Participants List */}
      <div className="grid grid-cols-1 gap-4">
        {sortedParticipants.map(participant => (
          <Card
            key={participant.id}
            className="p-6 hover:shadow-lg transition-all cursor-pointer"
            onClick={() => setSelectedParticipant(participant)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <UserCircleIcon className="w-12 h-12 text-text-tertiary" />
                <div>
                  <h3 className="font-semibold text-lg">{participant.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-text-secondary">
                    <EnvelopeIcon className="w-4 h-4" />
                    {participant.email}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-text-secondary mt-1">
                    <CalendarIcon className="w-4 h-4" />
                    Joined{' '}
                    {new Date(participant.joinedDate).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-2xl font-bold">
                    {participant.studiesCompleted}
                  </p>
                  <p className="text-xs text-text-secondary">Completed</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-system-orange">
                    {participant.studiesInProgress}
                  </p>
                  <p className="text-xs text-text-secondary">In Progress</p>
                </div>
                <Badge
                  variant={
                    participant.status === 'active'
                      ? 'default'
                      : participant.status === 'inactive'
                        ? 'secondary'
                        : 'outline'
                  }
                >
                  {participant.status}
                </Badge>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {sortedParticipants.length === 0 && (
        <Card className="p-12 text-center">
          <UsersIcon className="w-16 h-16 text-text-tertiary mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No participants found</h3>
          <p className="text-text-secondary">
            {searchTerm
              ? 'Try adjusting your search criteria'
              : 'Participants will appear here once they join your studies'}
          </p>
        </Card>
      )}
    </div>
  );
}
