"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const API = "http://localhost:8000/api/v1";

interface Route {
  id: number;
  city_from: string;
  city_to: string;
  is_active: boolean;
  current_price?: number;
}

export default function RoutesPage() {
  const router = useRouter();
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);

  // Диалог добавления
  const [dialogOpen, setDialogOpen] = useState(false);
  const [cityFrom, setCityFrom] = useState("");
  const [cityTo, setCityTo] = useState("");
  const [price, setPrice] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const getToken = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return null;
    }
    return token;
  };

  const fetchRoutes = async () => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(`${API}/routes/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) { router.push("/login"); return; }
      const data = await res.json();
      const list = data.data ?? data;
      setRoutes(Array.isArray(list) ? list : []);
    } catch {
      console.error("Ошибка загрузки маршрутов");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRoutes(); }, []);

  const handleCreate = async () => {
    if (!cityFrom.trim() || !cityTo.trim() || !price) return;
    const token = getToken();
    if (!token) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`${API}/routes/?city_from=${encodeURIComponent(cityFrom)}&city_to=${encodeURIComponent(cityTo)}&price=${price}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || "Ошибка создания");
        return;
      }
      setDialogOpen(false);
      setCityFrom(""); setCityTo(""); setPrice("");
      await fetchRoutes();
    } catch {
      setError("Ошибка сети");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.push("/dashboard")}>
              ← Дашборд
            </Button>
            <h1 className="text-xl font-semibold">Маршруты</h1>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={() => setDialogOpen(true)}>+ Добавить маршрут</Button>
            <Button variant="outline" onClick={() => { localStorage.removeItem("token"); router.push("/login"); }}>
              Выйти
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6 max-w-sm">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Всего маршрутов</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{routes.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Активных</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{routes.filter(r => r.is_active).length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-16 text-muted-foreground">Загрузка...</div>
            ) : routes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
                <p>Маршрутов пока нет</p>
                <Button onClick={() => setDialogOpen(true)}>Добавить первый маршрут</Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Откуда</TableHead>
                    <TableHead>Куда</TableHead>
                    <TableHead>Цена (₸)</TableHead>
                    <TableHead>Статус</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {routes.map((route) => (
                    <TableRow key={route.id}>
                      <TableCell className="font-medium">{route.city_from}</TableCell>
                      <TableCell>{route.city_to}</TableCell>
                      <TableCell>
                        {route.current_price ? `${route.current_price.toLocaleString()} ₸` : "—"}
                      </TableCell>
                      <TableCell>
                        <span className={`text-sm font-medium ${route.is_active ? "text-green-600" : "text-red-500"}`}>
                          {route.is_active ? "Активен" : "Неактивен"}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Диалог создания маршрута */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Новый маршрут</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>Откуда</Label>
              <Input
                placeholder="Актобе"
                value={cityFrom}
                onChange={(e) => setCityFrom(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Куда</Label>
              <Input
                placeholder="Алматы"
                value={cityTo}
                onChange={(e) => setCityTo(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Цена за место (₸)</Label>
              <Input
                type="number"
                placeholder="5000"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Отмена</Button>
            <Button
              onClick={handleCreate}
              disabled={saving || !cityFrom.trim() || !cityTo.trim() || !price}
            >
              {saving ? "Создание..." : "Создать"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}