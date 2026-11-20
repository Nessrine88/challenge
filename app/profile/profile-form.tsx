
"use client";

import { useState, useTransition } from "react";
import {
  Camera,
  Globe,
  LoaderCircle,
  Mail,
  Save,
  UserRound,
} from "lucide-react";

import {
  updateProfileAction,
  type ProfileInput,
} from "@/actions/profile.action";

type ProfileFormProps = {
  profile: {
    name: string;
    email: string;
    username: string;
    country: string | null;
    image: string | null;
    role: string | null;
  };
};

export default function ProfileForm({ profile }: ProfileFormProps) {
  const [isPending, startTransition] = useTransition();

  const [form, setForm] = useState<ProfileInput>({
    name: profile.name,
    username: profile.username,
    country: profile.country ?? "",
    image: profile.image ?? "",
  });

  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  function handleChange(field: keyof ProfileInput, value: string) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    setMessage("");
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      const result = await updateProfileAction(form);

      setMessage(result.message);
      setIsSuccess(result.success);
    });
  }

  const initials =
    profile.name
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U";

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Profile Settings
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your personal information and account details.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Profile picture */}
        <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
          <div className="mb-5">
            <h2 className="font-semibold">Profile Picture</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Add an image URL to personalize your profile.
            </p>
          </div>

          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-muted text-xl font-semibold">
              {form.image ? (
                <img
                  src={form.image}
                  alt="Profile preview"
                  className="size-full object-cover"
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <span>{initials}</span>
              )}
            </div>

            <div className="min-w-0 flex-1 space-y-2">
              <label
                htmlFor="image"
                className="flex items-center gap-2 text-sm font-medium"
              >
                <Camera size={16} />
                Image URL
              </label>

              <input
                id="image"
                type="url"
                value={form.image}
                onChange={(event) =>
                  handleChange("image", event.target.value)
                }
                placeholder="https://example.com/profile.jpg"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-primary"
              />
              <p className="text-xs text-muted-foreground">
                Enter a publicly accessible image URL.
              </p>
            </div>
          </div>
        </section>

        {/* Personal information */}
        <section className="space-y-5 rounded-xl border border-border bg-card p-5 sm:p-6">
          <div>
            <h2 className="font-semibold">Personal Information</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Update the information associated with your account.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Full Name
              </label>
              <div className="relative">
                <UserRound
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  id="name"
                  required
                  minLength={2}
                  maxLength={80}
                  value={form.name}
                  onChange={(event) =>
                    handleChange("name", event.target.value)
                  }
                  placeholder="Your full name"
                  className="w-full rounded-lg border border-border bg-background py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-primary"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium">
                Username
              </label>
              <input
                id="username"
                required
                minLength={3}
                maxLength={30}
                value={form.username}
                onChange={(event) =>
                  handleChange("username", event.target.value)
                }
                placeholder="your_username"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-primary"
              />
              <p className="text-xs text-muted-foreground">
                Letters, numbers, and underscores only.
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email Address
              </label>
              <div className="relative">
                <Mail
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  id="email"
                  type="email"
                  value={profile.email}
                  disabled
                  className="w-full cursor-not-allowed rounded-lg border border-border bg-muted py-2.5 pl-10 pr-3 text-sm text-muted-foreground"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Email cannot be changed here.
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="country" className="text-sm font-medium">
                Country
              </label>
              <div className="relative">
                <Globe
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  id="country"
                  maxLength={80}
                  value={form.country}
                  onChange={(event) =>
                    handleChange("country", event.target.value)
                  }
                  placeholder="Your country"
                  className="w-full rounded-lg border border-border bg-background py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-primary"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Account information */}
        <section className="space-y-4 rounded-xl border border-border bg-card p-5 sm:p-6">
          <div>
            <h2 className="font-semibold">Account Information</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Your account details.
            </p>
          </div>

          <div className="flex items-center justify-between gap-4 border-b border-border pb-3">
            <span className="text-sm text-muted-foreground">
              Account role
            </span>
            <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium capitalize">
              {profile.role || "User"}
            </span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-muted-foreground">
              Email verification
            </span>
            <span className="text-sm font-medium">
              {profile.email ? "Account email registered" : "Not available"}
            </span>
          </div>
        </section>

        {/* Feedback */}
        {message && (
          <div
            role="status"
            className={`rounded-lg border p-3 text-sm ${
              isSuccess
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                : "border-destructive/30 bg-destructive/10 text-destructive"
            }`}
          >
            {message}
          </div>
        )}

        {/* Save button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? (
              <LoaderCircle size={17} className="animate-spin" />
            ) : (
              <Save size={17} />
            )}
            {isPending ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
