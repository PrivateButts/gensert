default:
    @just --list

# Install dependencies
install:
    npm install

# Run the local HMR dev server
dev:
    npm run dev

# Production build to dist/
build:
    npm run build

# Serve the production build
preview:
    npm run preview
