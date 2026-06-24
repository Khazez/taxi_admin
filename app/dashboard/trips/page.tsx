"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const API = "http://localhost:8000/api/v1";

interface Trip {
  id: number;
  route_name: string;
  driver_id: number;
  departure_time: string;
  seats_total: number;
  seats_available: number;
  price_per_seat: number;
  status: string;
}

const STATUS_LABELS: Record<string, string> = {
  active: "Активна",
  completed: "Завершена",
  cancelled: "Отменена",
};

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  active: "default",
  completed: "secondary",
  cancelled: "destructive",
};

export default function TripsPage() {
  const router = useRouter();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  const getToken = () => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return null; }
    return token;
  };

  const fetchTrips = async () => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(`${API}/admin/trips`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) { router.push("/login"); return; }
      const data = await res.json();
      const list = data.data ?? data;
      setTrips(Array.isArray(list) ? list : []);
    } catch {
      console.error("Ошибка загрузки поездок");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTrips(); }, []);

  const filtered = filter === "all" ? trips : trips.filter(t => t.status === filter);

  const counts = {
    all: trips.length,
    active: trips.filter(t => t.status === "active").length,
    completed: trips.filter(t => t.status === "completed").length,
    cancelled: trips.filter(t => t.status === "cancelled").length,
  };

  const formatDate = (dt: string) => {
    return new Date(dt).toLocaleString("ru-RU", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.push("/dashboard")}>
              ← Дашборд
            </Button>
            <h1 className="text-xl font-semibold">Поездки</h1>
          </div>
          <Button variant="outline" onClick={() => { localStorage.removeItem("token"); router.push("/login"); }}>
            Выйти
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 space-y-6">
        {/* Фильтры */}
        <div className="grid grid-cols-4 gap-4">
          {(["all", "active", "completed", "cancelled"] as const).map((key) => (
            <Card
              key={key}
              className={`cursor-pointer transition-colors ${filter === key ? "ring-2 ring-primary" : ""}`}
              onClick={() => setFilter(key)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {key === "all" ? "Все" : STATUS_LABELS[key]}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{counts[key]}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Таблица */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-16 text-muted-foreground">Загрузка...</div>
            ) : filtered.length === 0 ? (
              <div className="flex items-center justify-center py-16 text-muted-foreground">Поездки не найдены</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Маршрут</TableHead>
                    <TableHead>Дата выезда</TableHead>
                    <TableHead>Мест</TableHead>
                    <TableHead>Цена (₸)</TableHead>
                    <TableHead>Статус</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((trip) => (
                    <TableRow key={trip.id}>
                      <TableCell className="font-medium">#{trip.id}</TableCell>
                      <TableCell>{trip.route_name ?? "—"}</TableCell>
                      <TableCell>{formatDate(trip.departure_time)}</TableCell>
                      <TableCell>{trip.seats_available} / {trip.seats_total}</TableCell>
                      <TableCell>{trip.price_per_seat.toLocaleString()} ₸</TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANTS[trip.status] ?? "outline"}>
                          {STATUS_LABELS[trip.status] ?? trip.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}