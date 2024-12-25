# Chiply

A modern web application built with React, TypeScript, and Firebase, featuring data visualization, PDF generation, and material design components.

## 🚀 Features

- Modern React-based web application
- TypeScript for type safety
- Material-UI (MUI) components for a polished UI
- Data visualization using Nivo charts
- PDF generation capabilities
- Firebase integration for backend services
- Responsive design
- Routing with React Router
- Styled components for custom styling

## 🛠️ Tech Stack

- **Frontend Framework**: React 18
- **Language**: TypeScript
- **UI Framework**: Material-UI (MUI) v6
- **Styling**:
  - Styled Components
  - SASS
  - Emotion
- **Data Visualization**: Nivo (Bar, Line, Pie charts)
- **PDF Generation**:
  - React-PDF
  - html2canvas
  - jsPDF
- **Backend/Services**: Firebase
- **Build Tool**: Vite
- **Routing**: React Router DOM

## 📦 Project Structure

```
src/
├── assets/        # Static assets
├── components/    # Reusable UI components
├── config/        # Configuration files
├── features/      # Feature-specific components
├── pages/         # Page components
├── services/      # API and service integrations
├── styles/        # Global styles
├── theme/         # Theme configuration
├── types/         # TypeScript type definitions
└── utils/         # Utility functions
```

## 🚀 Getting Started

### Prerequisites

- Node.js (Latest LTS version recommended)
- npm or yarn
- Firebase account (for backend services)

### Installation

1. Clone the repository:

```bash
git clone [repository-url]
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:
   Create a `.env.local` file in the root directory with your Firebase configuration.

4. Start the development server:

```bash
npm run dev
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run deploy` - Build and deploy to Firebase

## 🔧 Configuration

The project uses several configuration files:

- `vite.config.ts` - Vite configuration
- `tsconfig.json` - TypeScript configuration
- `firebase.json` - Firebase configuration
- `.env.local` - Environment variables

## 📱 PWA Support

The application includes Progressive Web App (PWA) support with various app icons:

- 120x120 px
- 152x152 px
- 180x180 px

## 🚀 Deployment

The project is configured for deployment to Firebase Hosting. To deploy:

1. Ensure you have Firebase CLI installed
2. Run `npm run deploy`

## 📄 License

[Add your license information here]

## 👥 Contributing

[Add contribution guidelines here]
