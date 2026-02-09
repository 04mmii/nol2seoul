import { useQuery, QueryKey } from "@tanstack/react-query";

export function useReactQuery<T>(key: QueryKey, fetcher: () => Promise<T>) {
  const { data, isLoading, isError, error, isFetching } = useQuery<T>({
    queryKey: key,
    queryFn: fetcher,
  });

  return {
    data,
    isLoading,
    isError,
    error,
    isFetching,
  };
}
