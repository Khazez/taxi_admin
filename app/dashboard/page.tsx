"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Stats {
  total_users: number;
  total_trips: number;
  total_bookings: number;
  pending_drivers: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem("token");
          router.push("/login");
          return;
        }
        if (!res.ok) {
          setError(`Ошибка сервера: ${res.status}`);
          return;
        }
        const data = await res.json();
        setStats(data.data);
      } catch {
        setError("Нет связи с сервером. Проверьте что бэкенд запущен на порту 8000.");
      }
    };
    load();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Шапка */}
      <header className="border-b px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">ZHOLAUSHY — Диспетчер</h1>
        <Button variant="outline" onClick={handleLogout}>
          Выйти
        </Button>
      </header>

      {/* Боковое меню + контент */}
      <div className="flex">
        <aside className="w-56 min-h-screen border-r p-4 space-y-2">
          <NavItem label="Главная" href="/dashboard" active />
          <NavItem label="Водители" href="/dashboard/drivers" />
          <NavItem label="Маршруты" href="/dashboard/routes" />
          <NavItem label="Поездки" href="/dashboard/trips" />
          <NavItem label="Настройки" href="/dashboard/settings" />
        </aside>

        <main className="flex-1 p-6">
          <h2 className="text-2xl font-semibold mb-6">Обзор</h2>
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatCard title="Пользователи" value={stats?.total_users ?? "—"} />
            <StatCard title="Поездки" value={stats?.total_trips ?? "—"} />
            <StatCard title="Брони" value={stats?.total_bookings ?? "—"} />
            <StatCard
              title="Ждут верификации"
              value={stats?.pending_drivers ?? "—"}
              highlight
            />
          </div>
        </main>
      </div>
    </div>
  );
}

function NavItem({
  label,
  href,
  active,
}: {
  label: string;
  href: string;
  active?: boolean;
}) {
  const router = useRouter();
  return (
    <button
      onClick={() => router.push(href)}
      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
        active
          ? "bg-primary text-primary-foreground"
          : "hover:bg-muted text-muted-foreground hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}

function StatCard({
  title,
  value,
  highlight,
}: {
  title: string;
  value: number | string;
  highlight?: boolean;
}) {
  return (
    <Card className={highlight ? "border-orange-400" : ""}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className={`text-3xl font-bold ${highlight ? "text-orange-500" : ""}`}>
          {value}
        </p>
      </CardContent>
    </Card>
  );
}