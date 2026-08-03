import { Injectable, signal } from '@angular/core';

export type Language = 'en' | 'ru';
export type Theme = 'light' | 'dark';

const LANG_KEY = 'greed.lang';
const THEME_KEY = 'greed.theme';

const TRANSLATIONS: Record<Language, Record<string, string>> = {
  en: {
    tagline: 'Premium gaming experience',
    aboutTitle: 'About us',
    aboutDesc:
      'We provide you with the best client for a comfortable gaming that will give you the best gaming experience.',
    readMore: 'Read More',
    download: 'Download',
    authorization: 'Authorization',
    events: 'Events',
    eventsSubtitle: 'Track events on FunTime servers in real time',
    statEvents: 'Events',
    statServers: 'Servers',
    close: 'Close',
    loot: 'Loot',
    remaining: 'Remaining',
    coordsHidden: 'Coordinates hidden',
    announced: 'Announced',
    hidden: 'Hidden',
    filterType: 'Type',
    filterSeries: 'Series',
    filterEvents: 'Events',
    eventFilter: 'Event filter',
    reset: 'Reset',
    byName: 'By name',
    byServer: 'By server',
    allEvents: 'All events',
    byNameShort: 'by name',
    byServerShort: 'by server',
    loadingMap: 'Loading map...',
    noCoordsEvents: 'No events with coordinates right now',
    systemEvents: 'System',
    userEvents: 'User',
    clickDotForDetails: 'Click a dot for event details',
    serverShort: 'srv.',
    showOnlySeries: 'Show only series',
    showOnlyServer: 'Show only',
    noActiveEvents: 'No active events right now',
    systemEvent: 'System',
    userEvent: 'User',
    eventFallback: 'Event',
    serverListError: 'Failed to load server list',
    eventsLoadError: 'Failed to load events',
  },
  ru: {
    tagline: 'Премиальный игровой опыт',
    aboutTitle: 'О нас',
    aboutDesc:
      'Мы даём вам лучший клиент для комфортной игры, который подарит вам незабываемый игровой опыт.',
    readMore: 'Подробнее',
    download: 'Скачать',
    authorization: 'Авторизация',
    events: 'События',
    eventsSubtitle: 'Отслеживайте ивенты на серверах FunTime в реальном времени',
    statEvents: 'Событий',
    statServers: 'Серверов',
    close: 'Закрыть',
    loot: 'Лут',
    remaining: 'Осталось',
    coordsHidden: 'Координаты скрыты',
    announced: 'Объявлено',
    hidden: 'Скрыто',
    filterType: 'Тип',
    filterSeries: 'Серия',
    filterEvents: 'Ивенты',
    eventFilter: 'Фильтр ивентов',
    reset: 'Сбросить',
    byName: 'По названию',
    byServer: 'По серверу',
    allEvents: 'Все ивенты',
    byNameShort: 'по назв.',
    byServerShort: 'по серв.',
    loadingMap: 'Загрузка карты...',
    noCoordsEvents: 'Сейчас нет ивентов с координатами',
    systemEvents: 'Системные',
    userEvents: 'Пользовательские',
    clickDotForDetails: 'Клик по метке — детали ивента',
    serverShort: 'серв.',
    showOnlySeries: 'Показать только серию',
    showOnlyServer: 'Показать только',
    noActiveEvents: 'Сейчас нет активных ивентов',
    systemEvent: 'Системный',
    userEvent: 'Пользовательский',
    eventFallback: 'Событие',
    serverListError: 'Не удалось получить список серверов',
    eventsLoadError: 'Не удалось получить события',
  },
};

function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

@Injectable({ providedIn: 'root' })
export class Settings {
  readonly language = signal<Language>((readStorage(LANG_KEY) as Language) || 'ru');
  readonly theme = signal<Theme>((readStorage(THEME_KEY) as Theme) || 'dark');

  constructor() {
    this.apply();
  }

  toggleLanguage(): void {
    const next: Language = this.language() === 'ru' ? 'en' : 'ru';
    this.language.set(next);
    try {
      localStorage.setItem(LANG_KEY, next);
    } catch {
      /* ignore */
    }
    this.apply();
  }

  toggleTheme(): void {
    const next: Theme = this.theme() === 'dark' ? 'light' : 'dark';
    this.theme.set(next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      /* ignore */
    }
    this.apply();
  }

  t(key: string): string {
    return TRANSLATIONS[this.language()][key] ?? key;
  }

  private apply(): void {
    document.documentElement.dataset['theme'] = this.theme();
    document.documentElement.lang = this.language();
  }
}
