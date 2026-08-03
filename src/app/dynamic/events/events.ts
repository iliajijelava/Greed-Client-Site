import { Component, ElementRef, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { Subscription, interval } from 'rxjs';
import { Services, type EventInfo, type EventType, type ServerEvents } from '../../services';

const MAP_SIZE = 640;
const MAP_PADDING = 64;
const SERVERS_PER_REQUEST = 30;

const EVENT_NAMES_RU: Record<string, string> = {
  airdrop: 'Айрдроп',
  air_drop: 'Айрдроп',
  'air-drop': 'Айрдроп',
  myst_beacon: 'Мистический маяк',
  'myst-beacon': 'Мистический маяк',
  mystic: 'Мистический сунудук',
  myst: 'Мистический сунудук',
  altarundead: 'Алтарь нежити',
  'altar-undead': 'Алтарь нежити',
  altar_undead: 'Алтарь нежити',
  hellm: 'Адская резная',
  hell: 'Адская резня',
  creeper: 'Крипер',
  ender: 'Эндер-Дракон',
  geyser: "Гейзер",
  beacon: 'Маяк Убийца',
  deathchest: "Сундук Смерти",
  "meteor_rain":"Метеоритный дождь",
  vulkan:"Вулкан"
};

const PHASES_RU: Record<string, string> = {
  STARTING: 'Запуск',
  ACTIVATING: 'Активация',
  RUNNING: 'Активен',
  WAITING: 'Ожидание',
  LOOTING: 'Грабеж',
  CLOSED: 'Закрыт',
  ENDING: 'Завершение',
  PENDING: 'Ожидание',
};

interface MapDot {
  key: string;
  server: string;
  event: EventInfo;
  cx: number;
  cy: number;
}

interface ServerGroup {
  label: string;
  series: number;
  servers: ServerEvents[];
}

interface Featured {
  key: string;
  server: string;
  event: EventInfo;
}

@Component({
  selector: 'app-events',
  imports: [],
  templateUrl: './events.html',
  styleUrl: './events.scss',
})
export class Events implements OnInit, OnDestroy {
  private readonly services = inject(Services);
  private readonly elRef = inject(ElementRef);

  readonly servers = signal<ServerEvents[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly filterType = signal<EventType>('all');
  readonly seriesFilter = signal<number | null>(null);
  readonly serverFilter = signal<Set<string>>(new Set());
  readonly nameFilter = signal<Set<string>>(new Set());
  readonly nameFilterOpen = signal(false);
  readonly nameTab = signal<'name' | 'server'>('name');
  readonly selectedKey = signal<string | null>(null);
  readonly now = signal(Date.now());

  readonly filterOptions: { value: EventType; label: string }[] = [
    { value: 'all', label: 'Все' },
    { value: 'system', label: 'Системные' },
    { value: 'user', label: 'Пользовательские' },
  ];

  private startedAt = 0;
  private tickSub: Subscription | undefined;

  readonly filteredServers = computed<ServerEvents[]>(() => {
    const type = this.filterType();
    const series = this.seriesFilter();
    const servers = this.serverFilter();
    const names = this.nameFilter();
    let list = this.servers();

    if (type !== 'all') {
      list = list
        .map((s) => ({ ...s, events: s.events.filter((e) => e['event-type'] === type) }))
        .filter((s) => s.events.length > 0);
    }

    if (names.size > 0) {
      list = list
        .map((s) => ({ ...s, events: s.events.filter((e) => e.id && names.has(e.id)) }))
        .filter((s) => s.events.length > 0);
    }

    if (servers.size > 0) {
      list = list.filter((s) => servers.has(s.server));
    }

    if (series !== null) {
      list = list.filter((s) => this.serverSeries(s.server) === series);
    }

    return [...list].sort((a, b) => this.serverNumber(a.server) - this.serverNumber(b.server));
  });

  readonly serverGroups = computed<ServerGroup[]>(() => {
    const groups = new Map<number, ServerEvents[]>();
    for (const server of this.filteredServers()) {
      const series = this.serverSeries(server.server);
      if (!groups.has(series)) {
        groups.set(series, []);
      }
      groups.get(series)!.push(server);
    }
    return [...groups.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([series, servers]) => ({ label: this.seriesLabel(series), series, servers }));
  });

  readonly availableSeries = computed(() => {
    const set = new Set<number>();
    for (const server of this.servers()) {
      set.add(this.serverSeries(server.server));
    }
    return [...set].sort((a, b) => a - b);
  });

  readonly availableEventNames = computed(() => {
    const names = new Set<string>();
    for (const server of this.servers()) {
      for (const event of server.events) {
        if (event.id) names.add(event.id);
      }
    }
    return [...names]
      .sort((a, b) => this.eventNameRu(a).localeCompare(this.eventNameRu(b), 'ru'))
      .map((id) => ({ id, label: this.eventNameRu(id) }));
  });

  readonly availableServers = computed(() => {
    const groups = new Map<number, string[]>();
    for (const server of this.servers()) {
      const series = this.serverSeries(server.server);
      if (!groups.has(series)) {
        groups.set(series, []);
      }
      groups.get(series)!.push(server.server);
    }
    return [...groups.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([series, names]) => ({
        series,
        label: this.seriesLabel(series),
        names: names.sort((a, b) => this.serverNumber(a) - this.serverNumber(b)),
      }));
  });

  readonly totalEvents = computed(() =>
    this.filteredServers().reduce((acc, server) => acc + server.events.length, 0),
  );

  readonly activeServersCount = computed(() => this.filteredServers().length);

  readonly featured = computed<Featured | null>(() => {
    const key = this.selectedKey();
    if (!key) return null;
    const sep = key.indexOf(':');
    const serverName = key.slice(0, sep);
    const eventIndex = Number(key.slice(sep + 1));
    const server = this.filteredServers().find((s) => s.server === serverName);
    const event = server?.events[eventIndex];
    return event ? { key, server: serverName, event } : null;
  });

  readonly featuredArray = computed<Featured[]>(() => {
    const item = this.featured();
    return item ? [item] : [];
  });

  readonly mapBounds = computed(() => {
    let minX = Infinity;
    let maxX = -Infinity;
    let minZ = Infinity;
    let maxZ = -Infinity;
    for (const server of this.filteredServers()) {
      for (const event of server.events) {
        const loc = event['location-event'];
        if (!loc) continue;
        minX = Math.min(minX, loc.x);
        maxX = Math.max(maxX, loc.x);
        minZ = Math.min(minZ, loc.z);
        maxZ = Math.max(maxZ, loc.z);
      }
    }
    return minX === Infinity ? null : { minX, maxX, minZ, maxZ };
  });

  readonly mapDots = computed<MapDot[]>(() => {
    const bounds = this.mapBounds();
    if (!bounds) return [];
    const spanX = Math.max(bounds.maxX - bounds.minX, 1);
    const spanZ = Math.max(bounds.maxZ - bounds.minZ, 1);
    const inner = MAP_SIZE - MAP_PADDING * 2;
    const dots: MapDot[] = [];
    for (const server of this.filteredServers()) {
      server.events.forEach((event, index) => {
        const loc = event['location-event'];
        if (!loc) return;
        dots.push({
          key: `${server.server}:${index}`,
          server: server.server,
          event,
          cx: MAP_PADDING + ((loc.x - bounds.minX) / spanX) * inner,
          cy: MAP_PADDING + ((loc.z - bounds.minZ) / spanZ) * inner,
        });
      });
    }
    return dots;
  });

  readonly gridLines = computed(() => {
    const lines: { x1: number; y1: number; x2: number; y2: number }[] = [];
    for (let i = MAP_PADDING; i <= MAP_SIZE - MAP_PADDING; i += 64) {
      lines.push({ x1: MAP_PADDING, y1: i, x2: MAP_SIZE - MAP_PADDING, y2: i });
      lines.push({ x1: i, y1: MAP_PADDING, x2: i, y2: MAP_SIZE - MAP_PADDING });
    }
    return lines;
  });

  ngOnInit(): void {
    this.tickSub = interval(1000).subscribe(() => this.now.set(Date.now()));
    this.services.getServersInfo().subscribe({
      next: (data) => this.loadEvents(data.response),
      error: (err) => {
        this.loading.set(false);
        this.error.set('Не удалось получить список серверов');
        console.error(err);
      },
    });
  }

  ngOnDestroy(): void {
    this.tickSub?.unsubscribe();
  }

  private loadEvents(servers: string[]): void {
    const chunks: string[][] = [];
    for (let i = 0; i < servers.length; i += SERVERS_PER_REQUEST) {
      chunks.push(servers.slice(i, i + SERVERS_PER_REQUEST));
    }

    let all: ServerEvents[] = [];
    const nextChunk = (index: number) => {
      if (index >= chunks.length) {
        this.startedAt = Date.now();
        this.servers.set(all);
        this.loading.set(false);
        return;
      }
      this.services.getEventsInfo(chunks[index], 'all').subscribe({
        next: (res) => {
          all = all.concat(res.response);
          nextChunk(index + 1);
        },
        error: (err) => {
          this.loading.set(false);
          this.error.set('Не удалось получить события');
          console.error(err);
        },
      });
    };
    nextChunk(0);
  }

  setFilter(type: EventType): void {
    this.filterType.set(type);
  }

  setSeries(series: number | null): void {
    this.seriesFilter.set(this.seriesFilter() === series ? null : series);
  }

  toggleName(id: string): void {
    const next = new Set(this.nameFilter());
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    this.nameFilter.set(next);
  }

  toggleServer(name: string): void {
    const next = new Set(this.serverFilter());
    if (next.has(name)) {
      next.delete(name);
    } else {
      next.add(name);
    }
    this.serverFilter.set(next);
  }

  serverOnly(name: string): void {
    const current = this.serverFilter();
    if (current.size === 1 && current.has(name)) {
      this.serverFilter.set(new Set());
    } else {
      this.serverFilter.set(new Set([name]));
    }
  }

  clearNameFilter(): void {
    this.nameFilter.set(new Set());
    this.serverFilter.set(new Set());
  }

  filterCountLabel(): string {
    const names = this.nameFilter().size;
    const servers = this.serverFilter().size;
    if (names === 0 && servers === 0) {
      return 'Все ивенты';
    }
    const parts: string[] = [];
    if (names > 0) parts.push(`${names} по назв.`);
    if (servers > 0) parts.push(`${servers} по серв.`);
    return parts.join(' · ');
  }

  select(key: string): void {
    const newKey = key === this.selectedKey() ? null : key;
    this.selectedKey.set(newKey);
    if (newKey) {
      requestAnimationFrame(() => {
        this.elRef.nativeElement.querySelector('.featured-area')?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      });
    }
  }

  isSelected(key: string): boolean {
    return this.selectedKey() === key;
  }

  timeLeft(event: EventInfo): number {
    const elapsed = Math.floor((this.now() - this.startedAt) / 1000);
    return Math.max(0, event['time-seconds-left'] - elapsed);
  }

  formatTime(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    const pad = (n: number) => String(n).padStart(2, '0');
    return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
  }

  isAnnounced(event: EventInfo): boolean {
    const announced = event['location-announced'];
    return announced === true || announced === 'true';
  }

  lootLabel(event: EventInfo): string {
    const loot = event.loot;
    if (!loot || loot === 'null' || loot === '') {
      return '—';
    }
    return loot;
  }

  typeRu(event: EventInfo): string {
    return event['event-type'] === 'user' ? 'Пользовательский' : 'Системный';
  }

  eventNameRu(id?: string): string {
    return id ? (EVENT_NAMES_RU[id] ?? id) : 'Событие';
  }

  phaseRu(phase?: string): string {
    if (!phase) return '—';
    return PHASES_RU[phase.toUpperCase()] ?? phase;
  }

  private serverNumber(name: string): number {
    const match = name.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }

  private serverSeries(name: string): number {
    return Math.floor(this.serverNumber(name) / 100);
  }

  seriesLabel(series: number): string {
    return series === 0 ? '1-99' : `${series}xx`;
  }
}
