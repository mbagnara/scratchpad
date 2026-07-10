import { useMemo, useState } from 'react';
import { searchService } from '../domain/search/SearchService';
import type { SearchResult } from '../domain/search/SearchService';

export function useSearch() {
  const [term, setTerm] = useState('');
  const results: SearchResult[] = useMemo(() => searchService.query(term), [term]);
  return { term, setTerm, results };
}
