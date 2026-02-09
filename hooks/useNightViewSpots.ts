import { useReactQuery } from "./useReactQuery";
import { NightViewSpot } from "../types";

async function fetchNightViewSpots(): Promise<NightViewSpot[]> {
  const res = await fetch(`/api/seoulapi?type=night`);
  const data = await res.json();
  return Array.isArray(data?.viewNightSpot?.row) ? data.viewNightSpot.row : [];
}

export const useNightViewSpots = () => {
  const { data, isLoading, isError, error } = useReactQuery<NightViewSpot[]>(
    ["nightViewSpots"],
    fetchNightViewSpots
  );

  return {
    spots: data ?? [],
    loading: isLoading,
    isError,
    error,
  };
};
