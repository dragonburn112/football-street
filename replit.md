# FootballStreet - Group-Based Mobile App

## Overview

This is a mobile-first React application that allows users to create FIFA-style player cards, join groups with friends, and generate balanced teams. The app features Firebase authentication, real-time group management, fusion card creation, and PNG export functionality. Designed specifically for mobile phone usage with touch-friendly interfaces.

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
- **Runtime**: Node.js with Express.js framework (minimal API for health checks)
- **Data Storage**: Firebase Firestore for real-time group and player card storage
- **Authentication**: Firebase Authentication with Google sign-in and anonymous auth
- **Real-time**: Firebase listeners for instant group updates and member notifications

### Firebase Integration
- **Firestore Collections**: 
  - `groups` - Group information, codes, and member lists
  - `playerCards` - Player cards associated with groups
- **Authentication**: Google OAuth and anonymous sign-in options
- **Real-time Listeners**: Automatic updates when group members join or create cards
- **Security**: Firebase rules enforce group-based access control

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