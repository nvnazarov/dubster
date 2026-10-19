import { useEffect } from "react";

import { useLibraryContext } from "@/components/library/context";

export default function FilterFromQueryParams() {
  const { filter } = useLibraryContext();

  useEffect(() => {
    const sub = filter.subscribe((v) => {
      const params: string[] = [];
      if (v.title) {
        params.push(`title=${encodeURIComponent(v.title)}`);
      }
      if (v.authorID) {
        params.push(`author=${encodeURIComponent(v.authorID)}`);
      }
      if (v.numberOfRoles) {
        params.push(`roles=${encodeURIComponent(v.numberOfRoles)}`);
      }
      if (v.sortByRating) {
        params.push(`rating=desc`);
      }
      const url = "/library?" + params.join("&");
      window.history.replaceState({}, "", url);
    });
    return () => {
      sub.cancel();
    };
  }, [filter]);

  useEffect(() => {
    const url = URL.parse(window.location.href);
    if (!url) return;
    url.searchParams.forEach((v, k) => {
      switch (k) {
        case "title":
          filter.title = v;
          break;
        case "roles":
          filter.numberOfRoles = parseInt(v);
          break;
        case "author":
          filter.authorID = v;
          break;
        case "rating":
          filter.sortByRating = v === "desc";
          break;
      }
    });
  }, [filter]);

  return <></>;
}
