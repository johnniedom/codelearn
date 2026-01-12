import { BookOpen, Code, Trophy } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

/**
 * Stats Card Component
 *
 * Displays a single stat with icon, value, and label.
 */
interface StatCardProps {
  icon: React.ElementType;
  iconColorClass: string;
  value: number;
  label: string;
}

function StatCard({ icon: Icon, iconColorClass, value, label }: StatCardProps) {
  return (
    <Card className="p-4">
      <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-surface">
        <Icon className={`h-5 w-5 ${iconColorClass}`} aria-hidden="true" />
      </div>
      <p className="text-2xl font-bold text-text">{value}</p>
      <p className="text-sm text-text-muted">{label}</p>
    </Card>
  );
}

/**
 * Empty State Component
 *
 * Shown when no courses are downloaded.
 * Per audit: Positive framing about offline capability
 */
function EmptyCoursesState() {
  return (
    <div className="rounded-lg border border-dashed border-border bg-surface/50 p-8 text-center">
      <BookOpen
        className="mx-auto mb-3 h-12 w-12 text-text-muted/50"
        aria-hidden="true"
      />
      <p className="mb-2 font-medium text-text">No courses downloaded yet</p>
      <p className="text-sm text-text-muted">
        Connect to your hub to download courses. Once downloaded, you can learn offline anytime.
      </p>
    </div>
  );
}

/**
 * Call to Action Section
 *
 * Prompts user to create account or sign in.
 */
function CTASection() {
  return (
    <section className="rounded-lg bg-primary p-6 text-center text-white">
      <h2 className="mb-2 text-xl font-semibold">Ready to Start Learning?</h2>
      <p className="mb-4 text-primary-light/90">
        Create an account or sign in to access your courses.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button
          variant="secondary"
          className="bg-white text-primary hover:bg-gray-100"
        >
          Create Account
        </Button>
        <Button
          variant="outline"
          className="border-white/50 text-white hover:bg-white/10 hover:border-white/70"
        >
          Sign In
        </Button>
      </div>
    </section>
  );
}

/**
 * HomePage Component
 *
 * Main landing page for the CodeLearn PWA.
 *
 * Features:
 * - Welcome section with app description
 * - Quick stats grid (lessons, quizzes, exercises)
 * - CTA for account creation/sign in
 * - Empty state for courses with positive offline messaging
 *
 * Note: TopBar and BottomNav are now in App.tsx layout
 */
export default function HomePage() {
  // TODO: Replace with actual data from stores
  const stats = {
    lessonsCompleted: 0,
    quizzesPassed: 0,
    exercisesSolved: 0,
  };

  return (
    <div className="flex flex-col gap-6 py-6 sm:gap-8">
      {/* Welcome Section */}
      <section>
        <h1 className="mb-2 text-2xl font-bold text-text">
          Welcome to CodeLearn
        </h1>
        <p className="text-text-muted">
          Learn to code offline with interactive lessons, quizzes, and hands-on exercises.
        </p>
      </section>

      {/* Quick Stats */}
      <section
        className="grid grid-cols-2 gap-4 sm:grid-cols-3"
        aria-label="Learning statistics"
      >
        <StatCard
          icon={BookOpen}
          iconColorClass="text-primary"
          value={stats.lessonsCompleted}
          label="Lessons Completed"
        />
        <StatCard
          icon={Trophy}
          iconColorClass="text-success"
          value={stats.quizzesPassed}
          label="Quizzes Passed"
        />
        <div className="col-span-2 sm:col-span-1">
          <StatCard
            icon={Code}
            iconColorClass="text-warning"
            value={stats.exercisesSolved}
            label="Exercises Solved"
          />
        </div>
      </section>

      {/* CTA Section */}
      <CTASection />

      {/* Available Courses */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-text">
          Available Courses
        </h2>
        <EmptyCoursesState />
      </section>
    </div>
  );
}
