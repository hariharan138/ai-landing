import { useEffect, useState } from "react";

const PLACE_IDS = ["ChIJGYC22DMTXz4R3SvDLEgu8Z4"];

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

interface Review {
  authorName: string;
  authorPhoto: string;
  rating: number;
  text: string;
  relativeTime: string;
}

interface Restaurant {
  name: string;
  overallRating: number;
  totalRatings: number;
  positiveReviews: Review[];
  negativeReviews: Review[];
  error: boolean;
  errorMessage?: string;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`h-4 w-4 ${star <= rating ? "text-warning" : "text-muted-foreground/30"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

function ReviewCard({ review, accent }: { review: Review; accent: "green" | "red" }) {
  const borderColor = accent === "green" ? "border-l-success" : "border-l-destructive";

  return (
    <div
      className={`rounded-lg border border-border bg-card p-4 shadow-sm border-l-4 ${borderColor}`}
    >
      <div className="flex items-start gap-3">
        {review.authorPhoto ? (
          <img
            src={review.authorPhoto}
            alt={review.authorName}
            className="h-10 w-10 rounded-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground">
            {review.authorName.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-sm font-medium text-foreground">
              {review.authorName}
            </span>
            <span className="shrink-0 text-xs text-muted-foreground">{review.relativeTime}</span>
          </div>
          <StarRating rating={review.rating} />
          {review.text && (
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{review.text}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function ReviewColumn({
  title,
  reviews,
  accent,
  emptyMessage,
}: {
  title: string;
  reviews: Review[];
  accent: "green" | "red";
  emptyMessage: string;
}) {
  const badgeColor =
    accent === "green"
      ? "bg-success/15 text-success"
      : "bg-destructive/15 text-destructive";

  return (
    <div className="flex-1">
      <div className="mb-3 flex items-center gap-2">
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${badgeColor}`}>
          {title}
        </span>
        <span className="text-xs text-muted-foreground">({reviews.length})</span>
      </div>
      {reviews.length > 0 ? (
        <div className="space-y-3">
          {reviews.map((review, i) => (
            <ReviewCard key={i} review={review} accent={accent} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border p-6 text-center">
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        </div>
      )}
    </div>
  );
}

function RestaurantSection({ restaurant }: { restaurant: Restaurant }) {
  if (restaurant.error) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-foreground">{restaurant.name}</h2>
        <p className="mt-2 text-sm text-destructive">
          Failed to load reviews: {restaurant.errorMessage || "Unknown error"}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
        <h2 className="text-xl font-semibold text-foreground">{restaurant.name}</h2>
        <div className="flex items-center gap-2">
          <StarRating rating={Math.round(restaurant.overallRating)} />
          <span className="text-sm font-medium text-foreground">
            {restaurant.overallRating.toFixed(1)}
          </span>
          <span className="text-sm text-muted-foreground">
            ({restaurant.totalRatings.toLocaleString()} reviews)
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        <ReviewColumn
          title="Positive Reviews"
          reviews={restaurant.positiveReviews}
          accent="green"
          emptyMessage="No positive reviews available"
        />
        <ReviewColumn
          title="Negative Reviews"
          reviews={restaurant.negativeReviews}
          accent="red"
          emptyMessage="No negative reviews available"
        />
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-4">
        <div className="h-6 w-48 animate-pulse rounded bg-muted" />
        <div className="h-4 w-24 animate-pulse rounded bg-muted" />
      </div>
      <div className="flex flex-col gap-6 lg:flex-row">
        {[0, 1].map((col) => (
          <div key={col} className="flex-1 space-y-3">
            <div className="h-5 w-32 animate-pulse rounded bg-muted" />
            {[0, 1].map((row) => (
              <div key={row} className="rounded-lg border border-border p-4">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 animate-pulse rounded-full bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-28 animate-pulse rounded bg-muted" />
                    <div className="h-3 w-20 animate-pulse rounded bg-muted" />
                    <div className="h-3 w-full animate-pulse rounded bg-muted" />
                    <div className="h-3 w-3/4 animate-pulse rounded bg-muted" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function RestaurantReviewsPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchReviews() {
      try {
        const res = await fetch(`${API_BASE}/reviews?placeIds=${PLACE_IDS.join(",")}`);
        if (!res.ok) {
          throw new Error(`API returned ${res.status}`);
        }
        const data = await res.json();
        setRestaurants(data.restaurants);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch reviews");
      } finally {
        setLoading(false);
      }
    }
    fetchReviews();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Restaurant Reviews</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Customer feedback from Google Reviews, sorted by sentiment.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 p-4">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <div className="space-y-8">
          {loading
            ? [0, 1, 2].map((i) => <SkeletonCard key={i} />)
            : restaurants.map((restaurant, i) => (
                <RestaurantSection key={i} restaurant={restaurant} />
              ))}
        </div>
      </div>
    </div>
  );
}
