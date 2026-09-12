import { Suspense } from "react";
import Orders from "./Orders";
export default function OrdersPage() { return <Suspense fallback={<main className="mx-auto max-w-6xl p-8">Loading records…</main>}><Orders /></Suspense>; }
