# LMSWebIO

A comprehensive Learning Management System (LMS) built with Next.js 16, React 19, TypeScript, and Prisma.

## Features

- **Role-Based Access Control** - Admin, Instructor, and Student roles
- **Course Management** - Create and manage courses with modules and lessons
- **Content Delivery** - Video, text, and PDF lesson support
- **Assessment Tools** - Quiz engine with auto-grading
- **Assignment System** - File upload, submission, and grading workflow
- **Progress Tracking** - Real-time course completion analytics
- **Communication** - Discussion forums and announcements
- **Certificates** - Automatic certificate generation
- **Badges & Achievements** - Gamification elements
- **Calendar Integration** - Events and scheduling

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **UI Components**: shadcn/ui (Radix UI + Tailwind CSS)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with HTTP-only cookies
- **Styling**: Tailwind CSS v4 with OKLCH color space
- **TypeScript**: Strict mode enabled

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# Seed database (optional)
npm run db:seed

# Start development server
npm run dev
```

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run typecheck    # Run TypeScript checks
npm run test         # Run tests
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema changes
npm run db:migrate   # Run database migrations
npm run db:seed      # Seed database
npm run db:studio    # Open Prisma Studio
```

## Project Structure

```
├── app/                # Next.js App Router
│   ├── (auth)/        # Authentication routes
│   ├── (dashboard)/   # Dashboard routes
│   └── api/          # API routes
├── components/        # React components
│   └── ui/           # shadcn/ui components
├── lib/              # Utility functions
├── prisma/          # Database schema
└── types/           # TypeScript types
```

## Environment Variables

See `.env.example` for required environment variables.

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

MIT License - see LICENSE file for details.

