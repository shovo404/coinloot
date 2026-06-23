import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../lib/supabase";

interface UseCollectionOptions {
  /** Comma-separated column list for .select() */
  columns?: string;
  /** Column to filter on (e.g. "status") */
  filterColumn?: string;
  /** Filter value (e.g. "ACTIVE") */
  filterValue?: string;
  /** Order clause — { column: "created_at", ascending: false } */
  orderBy?: { column: string; ascending: boolean };
  /** Maximum rows to fetch */
  limit?: number;
  /** Initial data to show while loading (optional) */
  initialData?: any[];
}

interface UseCollectionResult<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  isLive: boolean;
  totalCount: number;
  refresh: () => void;
}

/**
 * Generic hook that fetches a Supabase table on mount.
 * No Realtime subscriptions — data is fetched on mount and via manual refresh().
 *
 * Falls back to `initialData` only if Supabase is unreachable AND
 * the error suggests the table doesn't exist (42P01).
 */
export function useRealtimeCollection<T extends Record<string, any>>(
  tableName: string,
  options: UseCollectionOptions = {}
): UseCollectionResult<T> {
  const {
    columns = "*",
    filterColumn,
    filterValue,
    orderBy,
    limit,
    initialData,
  } = options;

  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const mountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase.from(tableName).select(columns, { count: "exact" });

      if (filterColumn && filterValue !== undefined) {
        query = query.eq(filterColumn, filterValue);
      }

      if (orderBy) {
        query = query.order(orderBy.column, { ascending: orderBy.ascending });
      }

      if (limit) {
        query = query.limit(limit);
      }

      const { data: result, error: err, count } = await query;

      if (err) {
        // If the table doesn't exist, show a clear error
        if (err.code === "42P01") {
          setError(`Table "${tableName}" does not exist. Run the database schema first.`);
          if (initialData) setData(initialData as unknown as T[]);
        } else {
          setError(err.message);
        }
        setIsLive(false);
      } else {
        setData((result || []) as unknown as T[]);
        setTotalCount(count ?? result?.length ?? 0);
        setError(null);
        setIsLive(true);
      }
    } catch (e: any) {
      const msg = e?.message || "Unknown error";
      if (msg.includes("Failed to fetch") || msg.includes("NetworkError")) {
        setError("Cannot connect to Supabase. Check your network and project configuration.");
      } else {
        setError(msg);
      }
      setIsLive(false);
      if (initialData) setData(initialData as unknown as T[]);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [tableName, columns, filterColumn, filterValue, orderBy?.column, orderBy?.ascending, limit]);

  // Fetch on mount only — no Realtime subscriptions
  useEffect(() => {
    fetchData();

    return () => {
      mountedRef.current = false;
    };
  }, [fetchData]);

  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, isLive, totalCount, refresh };
}
