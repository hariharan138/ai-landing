import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Search, Star, MapPin, ThumbsUp, ThumbsDown, Loader2, ArrowLeft } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/dashboard/reviews")({
  component: ReviewsPage,
});

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

const DEFAULT_PLACE_IDS = ["ChIJGYC22DMTXz4R3SvDLEgu8Z4"];

interface SearchResult {
  placeId: string;
  name: string;
  address: string;
  rating: number;
  totalRatings: number;
  photoUrl: string;
}

interface Review {
  authorName: string;
  authorPhoto: string;
  rating: number;
  text: string;
  relativeTime: string;
}

interface PlaceReviews {
  name: string;
  overallRating: number;
  totalRatings: number;
  positiveReviews: Review[];
  negativeReviews: Review[];
  error: boolean;
  errorMessage?: string;
}

function StarRating({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={s <= rating ? "text-warning fill-warning" : "text-muted-foreground/30"}
          style={{ width: size, height: size }}
        />
      ))}
    </div>
  );
}

function ReviewCard({ review, type }: { review: Review; type: "positive" | "negative" }) {
  return (
    <div
      className={`rounded-xl border bg-card p-4 transition-shadow hover:shadow-card-hover backdrop-blur-xl ${
        type === "positive"
          ? "border-l-4 border-l-primary border-t-border border-r-border border-b-border"
          : "border-l-4 border-l-destructive border-t-border border-r-border border-b-border"
      }`}
    >
      <div className="flex items-start gap-3">
        {review.authorPhoto ? (
          <img
            src={review.authorPhoto}
            alt={review.authorName}
            className="h-10 w-10 rounded-full object-cover ring-2 ring-border"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-bold text-muted-foreground ring-2 ring-border">
            {review.authorName.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-sm font-semibold text-foreground">
              {review.authorName}
            </span>
            <span className="shrink-0 text-xs text-muted-foreground">{review.relativeTime}</span>
          </div>
          <div className="mt-1">
            <StarRating rating={review.rating} size={13} />
          </div>
          {review.text && (
            <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">{review.text}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function ReviewsPage() {
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const [selectedPlace, setSelectedPlace] = useState<SearchResult | null>(null);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [placeReviews, setPlaceReviews] = useState<PlaceReviews | null>(null);

  // Default place reviews loaded on mount
  const [defaultReviews, setDefaultReviews] = useState<PlaceReviews[]>([]);
  const [loadingDefault, setLoadingDefault] = useState(true);

  useEffect(() => {
    async function loadDefault() {
      try {
        const res = await fetch(
          `${API_BASE}/reviews?placeIds=${DEFAULT_PLACE_IDS.map(encodeURIComponent).join(",")}`,
        );
        if (!res.ok) throw new Error(`${res.status}`);
        const data = await res.json();
        setDefaultReviews(data.restaurants || []);
      } catch {
        setDefaultReviews([]);
      } finally {
        setLoadingDefault(false);
      }
    }
    loadDefault();
  }, []);

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const q = query.trim();
    if (!q) return;

    setSearching(true);
    setSearchError(null);
    setHasSearched(true);
    setSelectedPlace(null);
    setPlaceReviews(null);

    try {
      const res = await fetch(`${API_BASE}/reviews/search?q=${encodeURIComponent(q)}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Search failed (${res.status})`);
      }
      const data = await res.json();
      setSearchResults(data.results || []);
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : "Search failed");
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectPlace = async (place: SearchResult) => {
    setSelectedPlace(place);
    setLoadingReviews(true);
    setPlaceReviews(null);

    try {
      const res = await fetch(`${API_BASE}/reviews?placeIds=${encodeURIComponent(place.placeId)}`);
      if (!res.ok) throw new Error(`Failed to load reviews (${res.status})`);
      const data = await res.json();
      if (data.restaurants?.length > 0) {
        setPlaceReviews(data.restaurants[0]);
      }
    } catch (err) {
      setPlaceReviews({
        name: place.name,
        overallRating: 0,
        totalRatings: 0,
        positiveReviews: [],
        negativeReviews: [],
        error: true,
        errorMessage: err instanceof Error ? err.message : "Failed to load reviews",
      });
    } finally {
      setLoadingReviews(false);
    }
  };

  const handleBack = () => {
    setSelectedPlace(null);
    setPlaceReviews(null);
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Reviews</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Search for any restaurant and see their Google reviews.
        </p>
      </div>

      {/* Search bar */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search restaurants... e.g. Pizza Hut Dubai"
                className="pl-10"
              />
            </div>
            <Button type="submit" disabled={searching || !query.trim()}>
              {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Error */}
      {searchError && (
        <Card className="border-destructive/50 bg-destructive-soft">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">{searchError}</p>
          </CardContent>
        </Card>
      )}

      {/* Detail view — selected place reviews */}
      {selectedPlace && (
        <div className="space-y-5">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="gap-2 text-muted-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to results
          </Button>

          {/* Place header */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-5">
                {selectedPlace.photoUrl && (
                  <img
                    src={selectedPlace.photoUrl}
                    alt={selectedPlace.name}
                    className="h-24 w-24 shrink-0 rounded-xl object-cover ring-1 ring-border"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <h2 className="text-xl font-bold text-foreground">{selectedPlace.name}</h2>
                  <div className="mt-1.5 flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{selectedPlace.address}</span>
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <StarRating rating={Math.round(selectedPlace.rating)} />
                    <span className="text-sm font-semibold text-foreground">
                      {selectedPlace.rating.toFixed(1)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      ({selectedPlace.totalRatings.toLocaleString()} reviews)
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reviews */}
          {loadingReviews ? (
            <div className="flex items-center justify-center py-16">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Loading reviews...</p>
              </div>
            </div>
          ) : placeReviews?.error ? (
            <Card className="border-destructive/50">
              <CardContent className="pt-6">
                <p className="text-sm text-destructive">
                  Failed to load reviews: {placeReviews.errorMessage}
                </p>
              </CardContent>
            </Card>
          ) : placeReviews ? (
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Positive */}
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="gap-1.5 border-primary/30 bg-primary-soft text-primary-dark"
                  >
                    <ThumbsUp className="h-3 w-3" />
                    Positive
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    ({placeReviews.positiveReviews.length})
                  </span>
                </div>
                {placeReviews.positiveReviews.length > 0 ? (
                  <div className="space-y-3">
                    {placeReviews.positiveReviews.map((r, i) => (
                      <ReviewCard key={i} review={r} type="positive" />
                    ))}
                  </div>
                ) : (
                  <Card className="border-dashed">
                    <CardContent className="flex items-center justify-center py-10">
                      <p className="text-sm text-muted-foreground">No positive reviews available</p>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Negative */}
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="gap-1.5 border-destructive/30 bg-destructive-soft text-destructive"
                  >
                    <ThumbsDown className="h-3 w-3" />
                    Negative
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    ({placeReviews.negativeReviews.length})
                  </span>
                </div>
                {placeReviews.negativeReviews.length > 0 ? (
                  <div className="space-y-3">
                    {placeReviews.negativeReviews.map((r, i) => (
                      <ReviewCard key={i} review={r} type="negative" />
                    ))}
                  </div>
                ) : (
                  <Card className="border-dashed">
                    <CardContent className="flex items-center justify-center py-10">
                      <p className="text-sm text-muted-foreground">No negative reviews available</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Search results grid */}
      {!selectedPlace && hasSearched && !searching && (
        <>
          {searchResults.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {searchResults.map((place) => (
                <Card
                  key={place.placeId}
                  className="cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-card-hover"
                  onClick={() => handleSelectPlace(place)}
                >
                  <CardContent className="p-0">
                    {place.photoUrl ? (
                      <img
                        src={place.photoUrl}
                        alt={place.name}
                        className="h-40 w-full rounded-t-xl object-cover"
                      />
                    ) : (
                      <div className="flex h-40 w-full items-center justify-center rounded-t-xl bg-muted">
                        <Star className="h-10 w-10 text-muted-foreground/30" />
                      </div>
                    )}
                    <div className="p-4">
                      <h3 className="truncate text-sm font-semibold text-foreground">
                        {place.name}
                      </h3>
                      <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="truncate">{place.address}</span>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <StarRating rating={Math.round(place.rating)} size={13} />
                          <span className="text-xs font-semibold text-foreground">
                            {place.rating.toFixed(1)}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {place.totalRatings.toLocaleString()} reviews
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Search className="h-10 w-10 text-muted-foreground/30" />
                <p className="mt-3 text-sm font-medium text-foreground">No restaurants found</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Try a different search term or add a location
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Default place reviews (shown on page load, hidden when searching or viewing a searched place) */}
      {!selectedPlace && !hasSearched && (
        <>
          {loadingDefault ? (
            <div className="flex items-center justify-center py-16">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Loading your restaurant reviews...</p>
              </div>
            </div>
          ) : defaultReviews.length > 0 ? (
            <div className="space-y-8">
              {defaultReviews.map((restaurant, idx) => (
                <Card key={idx}>
                  <CardHeader>
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
                      <CardTitle className="text-xl">{restaurant.name}</CardTitle>
                      <div className="flex items-center gap-2">
                        <StarRating rating={Math.round(restaurant.overallRating)} />
                        <span className="text-sm font-semibold text-foreground">
                          {restaurant.overallRating.toFixed(1)}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          ({restaurant.totalRatings.toLocaleString()} reviews)
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {restaurant.error ? (
                      <p className="text-sm text-destructive">
                        Failed to load reviews: {restaurant.errorMessage}
                      </p>
                    ) : (
                      <div className="grid gap-6 lg:grid-cols-2">
                        {/* Positive */}
                        <div>
                          <div className="mb-3 flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className="gap-1.5 border-primary/30 bg-primary-soft text-primary-dark"
                            >
                              <ThumbsUp className="h-3 w-3" />
                              Positive
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              ({restaurant.positiveReviews.length})
                            </span>
                          </div>
                          {restaurant.positiveReviews.length > 0 ? (
                            <div className="space-y-3">
                              {restaurant.positiveReviews.map((r, i) => (
                                <ReviewCard key={i} review={r} type="positive" />
                              ))}
                            </div>
                          ) : (
                            <div className="rounded-lg border border-dashed border-border p-6 text-center">
                              <p className="text-sm text-muted-foreground">
                                No positive reviews available
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Negative */}
                        <div>
                          <div className="mb-3 flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className="gap-1.5 border-destructive/30 bg-destructive-soft text-destructive"
                            >
                              <ThumbsDown className="h-3 w-3" />
                              Negative
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              ({restaurant.negativeReviews.length})
                            </span>
                          </div>
                          {restaurant.negativeReviews.length > 0 ? (
                            <div className="space-y-3">
                              {restaurant.negativeReviews.map((r, i) => (
                                <ReviewCard key={i} review={r} type="negative" />
                              ))}
                            </div>
                          ) : (
                            <div className="rounded-lg border border-dashed border-border p-6 text-center">
                              <p className="text-sm text-muted-foreground">
                                No negative reviews available
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-20">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-soft">
                  <Star className="h-8 w-8 text-primary" />
                </div>
                <h3 className="mt-5 text-base font-semibold text-foreground">
                  Search for a restaurant
                </h3>
                <p className="mt-1.5 max-w-sm text-center text-sm text-muted-foreground">
                  Enter a restaurant name above to find and view their Google reviews, sorted by
                  positive and negative sentiment.
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
