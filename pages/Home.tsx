import React, { useMemo } from 'react';
import { useCulturalSpaces, useEvents, useFavorites, useNightViewSpots } from '../hooks';
import HeroEditorial, { type HeroBanner } from '../components/home/HeroEditorial';
import CategoryStrip from '../components/home/CategoryStrip';
import HomeEvents from '../components/home/HomeEvents';
import MapPromo from '../components/home/MapPromo';
import AfterDark from '../components/home/AfterDark';
import { CurationIntro } from '../components/home/Curation';
import EditorPicks from '../components/home/EditorPicks';
import { buildNight } from '../components/night/selectors';
import {
  countStartingThisWeek,
  filterEventsByTab,
  pickHeroEvents,
  pickAfterDark,
  topCounts,
} from '../components/home/selectors';
import { eventId } from '../utils/eventId';
import featured from '../data/featured-events.json' with { type: 'json' };
import '../components/home/home-v3.css';

/** Hand-picked hero banners (data/featured-events.json, 2026-11-11). */
const FEATURED_IDS: string[] = (featured as { ids: string[] }).ids;

/**
 * Home — Redesign v3 (design-ref/src/layout-editorial-v3.jsx).
 * Sections: Hero → CategoryStrip → Events → MapPromo → CurationIntro → EditorPicks → After Dark.
 * (Curators removed 2026-11-11: fictional people/quotes; replaced by the editor picks.)
 */
const Home: React.FC = () => {
  const { events, loading: eventsLoading, isError: eventsError } = useEvents();
  const { spaces, loading: spacesLoading } = useCulturalSpaces();
  const { spots, loading: spotsLoading } = useNightViewSpots();
  const { toggleFavorite, isFavorite } = useFavorites();

  // One clock per render pass so every section agrees on "today".
  const now = useMemo(() => new Date(), []);

  const heroBanners: HeroBanner[] = useMemo(
    () => pickHeroEvents(events, now, FEATURED_IDS).map((event) => ({ event, id: eventId(event) })),
    [events, now],
  );
  const ongoingCount = useMemo(() => filterEventsByTab(events, 'today', now).length, [events, now]);
  const weekStarts = useMemo(() => countStartingThisWeek(events, now), [events, now]);
  const topGenres = useMemo(() => topCounts(events, (e) => e.CODENAME, 4).map(([k]) => k), [events]);
  const topSpaceTypes = useMemo(() => topCounts(spaces, (s) => s.SUBJCODE, 4).map(([k]) => k), [spaces]);
  const night = useMemo(() => buildNight(spots, now), [spots, now]);
  const afterDark = useMemo(() => pickAfterDark(night.views), [night]);

  const statsLoading = eventsLoading || spacesLoading;

  return (
    <div className="v3-home">
      <HeroEditorial
        banners={heroBanners}
        stats={statsLoading ? null : { ongoing: ongoingCount, spaces: spaces.length, weekStarts }}
        now={now}
      />
      <CategoryStrip topEventGenres={topGenres} topSpaceTypes={topSpaceTypes} />
      <HomeEvents
        events={events}
        loading={eventsLoading}
        isError={eventsError}
        now={now}
        isFavorite={isFavorite}
        toggleFavorite={toggleFavorite}
      />
      <MapPromo spaces={spaces} loading={spacesLoading} />
      <CurationIntro />
      <EditorPicks spaces={spaces} nightViews={night.views} />
      <AfterDark picks={afterDark} views={night.views} loading={spotsLoading} isFavorite={isFavorite} toggleFavorite={toggleFavorite} />
    </div>
  );
};

export default Home;
