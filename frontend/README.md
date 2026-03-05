This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
1. 🔄 Subscriptions & Bills Tracker
New Menu: /subscriptions
What it does: We can build an AI algorithm on the backend that scans your transactions and automatically detects recurring payments (Netflix, Gym, Rent, Internet).
UI Look: A sleek calendar view showing exactly which days your bills are due, plus a "Monthly Runway" showing how much of your income is instantly eaten by fixed costs.
2. 🎯 Savings Goals & Vaults
New Menu: /goals
What it does: Allow you to create dedicated "Vaults" for specific targets (e.g., "Emergency Fund", "New Car", "Vacation in Tokyo").
UI Look: Beautiful circular progress rings (like the Apple Watch rings) showing how close you are to your goal, calculating exactly what month you will hit your target based on your current Savings Rate.
3. 📸 Physical Receipt Scanner (OCR)
New Feature: Inside Daily Tracking
What it does: Instead of typing in your cash or physical receipts manually, we could add an "Upload Receipt" button. We would hook up an OCR (Optical Character Recognition) engine on the Python backend to read the photo, extract the Merchant Name, Date, and Total Amount, and log it instantly.
4. 🤖 Smart Categorization Rules Engine
New Menu: /settings/rules
What it does: Instead of relying just on the AI to categorize things, you could build your own "If-This-Then-That" rules.
Example: "If Payee contains UBER or OLA, always set category to Transportation." As soon as you upload a new Bank Statement, the backend runs it through your custom rules first.
5. 🔮 Cash Flow Forecasting
New Menu: /forecast
What it does: Uses your historical spending data (Burn Variance, Lifestyle Creep, Daily Averages) to predict the future.
UI Look: A massive, interactive line chart forecasting your bank balance 3, 6, and 12 months into the future. You could have interactive sliders (e.g., "What if I reduce my dining out by 20%?") to see how it dynamically changes your end-of-year wealth.
6. 🌍 Multi-Currency / Net Worth Tracker
New Feature: Dashboard Expansion
What it does: Right now, we track cash flow via your banks. We could add a system to track Assets (Mutual Funds, Stocks, Real Estate) and Liabilities (Loans, Credit Card Debt) to give you a true Net Worth calculation over time.
Do any of these catch your eye? The Subscriptions Tracker or the Target Savings Goals are usually huge technical upgrades that look incredible on a dashboard!

//start for backend
cd backend
 venv/scripts/activate  
  uvicorn app.main:app --reload --port 8000 

//start for frontend
cd frontend
npm run dev
