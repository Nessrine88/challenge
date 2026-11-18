
import Link from "next/link";
import { redirect } from "next/navigation";
import { getPublicChallengesAction } from "@/actions/challenge.action";

export default async function ChallengesPage() {
  const result = await getPublicChallengesAction();

  if (!result.success) {
    if (result.error === "You must be signed in.") {
      redirect("/sign-in");
    }

    throw new Error(result.error);
  }

  return (
    <main className="mx-auto max-w-6xl p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Discover challenges</h1>
          <p className="mt-2 text-gray-600">
            Find a goal and work toward it with others.
          </p>
        </div>

        <Link
          href="/challenges/new"
          className="rounded-md bg-black px-5 py-3 text-white"
        >
          Create challenge
        </Link>
      </div>

      {result.challenges.length === 0 ? (
        <div className="mt-12 rounded-lg border p-8 text-center">
          <h2 className="text-xl font-semibold">
            No challenges yet
          </h2>
          <p className="mt-2 text-gray-600">
            Be the first to create a challenge.
          </p>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {result.challenges.map((challenge) => (
            <article
              key={challenge.id}
              className="rounded-lg border p-6"
            >
              <p className="text-sm text-gray-500">
                {challenge.category ?? "Uncategorized"}
              </p>

              <h2 className="mt-2 text-xl font-bold">
                {challenge.title}
              </h2>

              <p className="mt-3 text-sm text-gray-600">
                {challenge.description.length > 140
                  ? `${challenge.description.slice(0, 140)}...`
                  : challenge.description}
              </p>

              <div className="mt-4 space-y-1 text-sm text-gray-500">
                <p>Starts: {challenge.startDate}</p>
                <p>
                  Ends: {challenge.endDate ?? "No end date"}
                </p>
                <p>
                  Capacity:{" "}
                  {challenge.maxParticipants ?? "Unlimited"}
                </p>
              </div>

              <Link
                href={`/challenges/${challenge.id}`}
                className="mt-5 inline-block font-medium underline"
              >
                View challenge →
              </Link>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
