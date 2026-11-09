import React, { useMemo } from 'react';
import { useCulturalSpaces, useEvents, useFavorites, useNightViewSpots } from '../hooks';
import HeroEditorial, { type HeroBanner } from '../components/home/HeroEditorial';
import CategoryStrip from '../components/home/CategoryStrip';
import HomeEvents from '../components/home/HomeEvents';
import MapPromo from '../components/home/MapPromo';
import AfterDark from '../components/home/AfterDark';
import { CurationIntro, Curators } from '../components/home/Curation';
import {
  countStartingThisWeek,
  filterEventsByTab,
  pickHeroEvents,
  pickNightSpots,
  topCounts,
} from '../components/home/selectors';
import '../components/home/home-v3.css';

/**
 * Home — Redesign v3 (design-ref/src/layout-editorial-v3.jsx).
 * Sections: Hero → CategoryStrip → Events → MapPromo → CurationIntro → After Dark → Curators.
 */
const Home: React.FC = () => {
  const { events, loading: eventsLoading, isError: eventsError } = useEvents();
  const { spaces, loading: spacesLoading } = useCulturalSpaces();
  const { spots, loading: spotsLoading } = useNightViewSpots();
  const { toggleFavorite, isFavorite } = useFavorites();

  // One clock per render pass so every section agrees on "today".
  const now = useMemo(() => new Date(), []);

  const heroBanners: HeroBanner[] = useMemo(
    () => pickHeroEvents(events, now).map((event) => ({ event, id: events.indexOf(event) })),
    [events, now],
  );
  const ongoingCount = useMemo(() => filterEventsByTab(events, 'today', now).length, [events, now]);
  const weekStarts = useMemo(() => countStartingThisWeek(events, now), [events, now]);
  const topGenres = useMemo(() => topCounts(events, (e) => e.CODENAME, 4).map(([k]) => k), [events]);
  const topSpaceTypes = useMemo(() => topCounts(spaces, (s) => s.SUBJCODE, 4).map(([k]) => k), [spaces]);
  const nightSpots = useMemo(() => pickNightSpots(spots), [spots]);

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
      <AfterDark spots={nightSpots} loading={spotsLoading} />
      <Curators />
    </div>
  );
};

export default Home;
