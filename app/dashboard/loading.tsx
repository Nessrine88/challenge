export default function DashboardLoading() {
  return (
    <main className="min-h-screen animate-pulse bg-[#0D1310] px-4 py-6 text-[#F1F5F2] sm:px-6 lg:px-8 lg:py-10">
      <div className="mx-auto max-w-7xl space-y-6 sm:space-y-8">
        {/* Header skeleton */}
        <header className="flex flex-col gap-4 rounded-2xl border border-[#303B34] bg-[#151D18] p-4 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#26332B]" />

            <div className="space-y-2">
              <div className="h-3 w-20 rounded bg-[#26332B]" />
              <div className="h-5 w-36 rounded bg-[#26332B]" />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="h-10 w-36 rounded-lg bg-[#26332B]" />
            <div className="h-10 w-28 rounded-lg bg-[#26332B]" />
            <div className="h-10 w-32 rounded-lg bg-[#26332B]" />
          </div>
        </header>

        {/* Stats skeleton */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="rounded-2xl border border-[#303B34] bg-[#151D18] p-5"
            >
              <div className="h-3 w-36 rounded bg-[#26332B]" />
              <div className="mt-4 h-8 w-16 rounded bg-[#26332B]" />
            </div>
          ))}
        </section>

        {/* Challenges skeleton */}
        <section className="space-y-4">
          <div className="space-y-2">
            <div className="h-6 w-36 rounded bg-[#26332B]" />
            <div className="h-3 w-64 rounded bg-[#26332B]" />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="space-y-4 rounded-2xl border border-[#303B34] bg-[#151D18] p-5"
              >
                <div className="h-5 w-3/4 rounded bg-[#26332B]" />
                <div className="h-3 w-full rounded bg-[#26332B]" />
                <div className="h-3 w-2/3 rounded bg-[#26332B]" />
                <div className="border-t border-[#303B34] pt-3">
                  <div className="h-3 w-1/2 rounded bg-[#26332B]" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}