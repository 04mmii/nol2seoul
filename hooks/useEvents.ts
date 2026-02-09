import { useReactQuery } from "./useReactQuery";
import { Event } from "../types";

async function fetchEvents(): Promise<Event[]> {
  const res = await fetch(`/api/seoulapi?type=event`);
  const data = await res.json();
  return data?.culturalEventInfo?.row ?? [];
}

export const useEvents = () => {
  const { data, isLoading, isError, error } = useReactQuery<Event[]>(
    ["events"],
    fetchEvents
  );

  return {
    events: data ?? [],
    loading: isLoading,
    isError,
    error,
  };
};
