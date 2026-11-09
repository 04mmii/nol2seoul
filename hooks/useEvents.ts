import { useMemo } from "react";
import { useReactQuery } from "./useReactQuery";
import { Event } from "../types";
import { dropEndedEvents, kstToday } from "../utils/event";

async function fetchEvents(): Promise<Event[]> {
  const res = await fetch(`/api/seoulapi?type=event`);
  const data = await res.json();
  return data?.culturalEventInfo?.row ?? [];
}

const EMPTY: Event[] = [];

export const useEvents = () => {
  const { data, isLoading, isError, error } = useReactQuery<Event[]>(
    ["events"],
    fetchEvents
  );

  // TECH-10: drop events that ended before today (KST) even if the cached API response still has them.
  // Recomputed when the data or the Korean date changes; same array otherwise (stable for memo deps).
  const today = kstToday();
  const events = useMemo(() => (data ? dropEndedEvents(data) : EMPTY), [data, today]);

  return {
    events,
    loading: isLoading,
    isError,
    error,
  };
};
