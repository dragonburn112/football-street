# FIFA Card Creator & Team Manager

## Overview

This is a full-stack web application that allows users to create FIFA-style player cards with customizable stats, fuse multiple cards together to create special fusion cards, and generate balanced teams from their collection. The app features a modern dark theme interface with interactive card management, PNG export functionality, and team balancing algorithms.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Library**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom dark theme configuration and CSS variables
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for client-side routing
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **API Design**: RESTful API endpoints for CRUD operations on player data
- **Data Storage**: Currently using in-memory storage with MemStorage class, designed to be easily replaceable with database storage
- **Validation**: Zod schemas for request/response validation
- **Development**: Hot reloading with Vite integration in development mode

### Database Schema (PostgreSQL Ready)
- **ORM**: Drizzle ORM configured for PostgreSQL
- **Schema**: Single `players` table with fields for player attributes (name, position, stats like pace, shooting, passing, etc.)
- **Migrations**: Drizzle Kit for database migrations and schema management
- **Connection**: Configured for Neon Database serverless PostgreSQL

### Key Features Implementation
- **Card Creation**: Form-based player card creation with stat sliders and position selection
- **Fusion System**: Multi-select card fusion that averages stats and creates special fusion cards
- **Team Balancing**: Greedy algorithm for creating balanced teams based on overall ratings
- **Card Export**: Canvas-based PNG export functionality with different card styles (gold, silver, bronze, fusion)
- **Responsive Design**: Mobile-first design with collapsible layouts

### Component Architecture
- **Modular Components**: Reusable UI components following atomic design principles
- **Custom Hooks**: useToast for notifications, useMobile for responsive behavior
- **Shared Types**: TypeScript types shared between frontend and backend via shared schema

## External Dependencies

### Database & ORM
- **Neon Database**: Serverless PostgreSQL database provider
- **Drizzle ORM**: Type-safe SQL query builder and ORM
- **Drizzle Kit**: Database migration and introspection toolkit

### UI & Styling
- **Radix UI**: Headless UI component primitives for accessibility
- **Tailwind CSS**: Utility-first CSS framework
- **Shadcn/ui**: Pre-built component library built on Radix UI
- **Lucide React**: Icon library for consistent iconography
- **Font Awesome**: Additional icon set via CDN

### State Management & API
- **TanStack Query**: Server state management and caching
- **React Hook Form**: Form state management with validation
- **Zod**: Schema validation library for TypeScript

### Development & Build Tools
- **Vite**: Fast development server and build tool
- **TypeScript**: Static type checking
- **ESBuild**: Fast JavaScript bundler for production builds
- **Replit Integration**: Development environment integration with error overlays and cartographer

### Utilities
- **date-fns**: Date manipulation and formatting
- **clsx & tailwind-merge**: Conditional className utilities
- **nanoid**: Unique ID generation
- **class-variance-authority**: Component variant management