import { map } from 'nanostores';
import type { Channel } from '../lib/types';

// ─── Store Definition ───────────────────────────────────────────────

export interface ChannelStoreValue {
  channels: Channel[];
  channelGroups: string[];
  currentIndex: number;
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  selectedGroup: string | null;
  channelListOpen: boolean;
}

export const channelStore = map<ChannelStoreValue>({
  channels: [],
  channelGroups: [],
  currentIndex: 0,
  isLoading: false,
  error: null,
  searchQuery: '',
  selectedGroup: null,
  channelListOpen: false,
});

// ─── Actions ────────────────────────────────────────────────────────

export function setChannels(channels: Channel[], groups: string[]) {
  channelStore.setKey('channels', channels);
  channelStore.setKey('channelGroups', groups);
  channelStore.setKey('currentIndex', 0);
}

export function setLoading(loading: boolean) {
  channelStore.setKey('isLoading', loading);
}

export function setError(error: string | null) {
  channelStore.setKey('error', error);
}

export function setCurrentChannelIndex(index: number) {
  const { channels } = channelStore.get();
  if (index >= 0 && index < channels.length) {
    channelStore.setKey('currentIndex', index);
  }
}

export function nextChannel() {
  const { channels, currentIndex } = channelStore.get();
  if (channels.length === 0) return;
  const next = (currentIndex + 1) % channels.length;
  channelStore.setKey('currentIndex', next);
}

export function prevChannel() {
  const { channels, currentIndex } = channelStore.get();
  if (channels.length === 0) return;
  const prev = (currentIndex - 1 + channels.length) % channels.length;
  channelStore.setKey('currentIndex', prev);
}

export function setSearchQuery(query: string) {
  channelStore.setKey('searchQuery', query);
}

export function setSelectedGroup(group: string | null) {
  channelStore.setKey('selectedGroup', group);
}

export function toggleChannelList() {
  const { channelListOpen } = channelStore.get();
  channelStore.setKey('channelListOpen', !channelListOpen);
}

export function setChannelListOpen(open: boolean) {
  channelStore.setKey('channelListOpen', open);
}

// ─── Derived ────────────────────────────────────────────────────────

export function getCurrentChannel(): Channel | null {
  const { channels, currentIndex } = channelStore.get();
  return channels[currentIndex] ?? null;
}
