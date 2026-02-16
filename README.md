# KHK Registration Form

A multi-step registration form built with React and Vite for collecting company information.

## Features

- Multi-step form with progress tracking
- Automatic company data fetching from Czech ARES API
- Form submission with CSV export and email delivery
- Responsive design with modern UI

## Form Submission

When a user completes the form, the submitted data is:
1. Converted to a PDF document with proper formatting and Czech character support
2. Sent via email to `vitekform@gmail.com` with the subject "Přihláška do KHK Pardubice"
3. Attached as a PDF file (`prihlaska-KHK.pdf`)

The form uses Cloudflare Pages Functions and MailGun API for email delivery.

## Environment Variables

The following environment variables must be configured in Cloudflare Pages settings:
- `MAILGUN_API_KEY` (required): Your MailGun API key
- `MAILGUN_DOMAIN` (required): Your MailGun domain (e.g., `mg.example.com`)

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run linter
npm run lint
```

## Tech Stack

- React 19
- Vite (Rolldown)
- Cloudflare Pages Functions
- MailGun API for email delivery
