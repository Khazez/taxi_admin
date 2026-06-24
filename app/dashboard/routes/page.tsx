"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
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

  // Создание
  const [createOpen, setCreateOpen] = useState(false);
  const [cityFrom, setCityFrom] = useState("");
  const [cityTo, setCityTo] = useState("");
  const [price, setPrice] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Редактирование
  const [editRoute, setEditRoute] = useState<Route | null>(null);
  const [editCityFrom, setEditCityFrom] = useState("");
  const [editCityTo, setEditCityTo] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");

  // Удаление
  const [deleteRoute, setDeleteRoute] = useState<Route | null>(null);
  const [deleting, setDeleting] = useState(false);

  const getToken = () => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return null; }
    return token;
  };

  const fetchRoutes = async () => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(`${API}/routes/all`, {
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
    setSaving(true); setError("");
    try {
      const res = await fetch(
        `${API}/routes/?city_from=${encodeURIComponent(cityFrom)}&city_to=${encodeURIComponent(cityTo)}&price=${price}`,
        { method: "POST", headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (!res.ok) { setError(data.detail || "Ошибка создания"); return; }
      setCreateOpen(false);
      setCityFrom(""); setCityTo(""); setPrice("");
      await fetchRoutes();
    } catch { setError("Ошибка сети"); }
    finally { setSaving(false); }
  };

  const openEdit = (route: Route) => {
    setEditRoute(route);
    setEditCityFrom(route.city_from);
    setEditCityTo(route.city_to);
    setEditPrice(route.current_price?.toString() ?? "");
    setEditError("");
  };

  const handleEdit = async () => {
    if (!editRoute) return;
    const token = getToken();
    if (!token) return;
    setEditSaving(true); setEditError("");
    try {
      const params = new URLSearchParams();
      params.set("city_from", editCityFrom);
      params.set("city_to", editCityTo);
      if (editPrice) params.set("price", editPrice);
      const res = await fetch(`${API}/routes/${editRoute.id}?${params}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) { setEditError(data.detail || "Ошибка сохранения"); return; }
      setEditRoute(null);
      await fetchRoutes();
    } catch { setEditError("Ошибка сети"); }
    finally { setEditSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteRoute) return;
    const token = getToken();
    if (!token) return;
    setDeleting(true);
    try {
      await fetch(`${API}/routes/${deleteRoute.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setDeleteRoute(null);
      await fetchRoutes();
    } catch { }
    finally { setDeleting(false); }
  };

  const toggleActive = async (route: Route) => {
    const token = getToken();
    if (!token) return;
    await fetch(`${API}/routes/${route.id}?is_active=${!route.is_active}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });
    await fetchRoutes();
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.push("/dashboard")}>← Дашборд</Button>
            <h1 className="text-xl font-semibold">Маршруты</h1>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={() => setCreateOpen(true)}>+ Добавить маршрут</Button>
            <Button variant="outline" onClick={() => { localStorage.removeItem("token"); router.push("/login"); }}>Выйти</Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-2 gap-4 mb-6 max-w-sm">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Всего маршрутов</CardTitle>
            </CardHeader>
            <CardContent><p className="text-2xl font-bold">{routes.length}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Активных</CardTitle>
            </CardHeader>
            <CardContent><p className="text-2xl font-bold">{routes.filter(r => r.is_active).length}</p></CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-16 text-muted-foreground">Загрузка...</div>
            ) : routes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
                <p>Маршрутов пока нет</p>
                <Button onClick={() => setCreateOpen(true)}>Добавить первый маршрут</Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Откуда</TableHead>
                    <TableHead>Куда</TableHead>
                    <TableHead>Цена (₸)</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead className="text-right">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {routes.map((route) => (
                    <TableRow key={route.id}>
                      <TableCell className="font-medium">{route.city_from}</TableCell>
                      <TableCell>{route.city_to}</TableCell>
                      <TableCell>{route.current_price ? `${route.current_price.toLocaleString()} ₸` : "—"}</TableCell>
                      <TableCell>
                        <button
                          onClick={() => toggleActive(route)}
                          className={`text-sm font-medium cursor-pointer hover:underline ${route.is_active ? "text-green-600" : "text-red-500"}`}
                        >
                          {route.is_active ? "Активен" : "Неактивен"}
                        </button>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => openEdit(route)}>
                            Изменить
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => setDeleteRoute(route)}>
                            Удалить
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Диалог создания */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Новый маршрут</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Маршрут создаётся автоматически в обе стороны.</p>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>Откуда</Label>
              <Input placeholder="Актобе" value={cityFrom} onChange={(e) => setCityFrom(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Куда</Label>
              <Input placeholder="Алматы" value={cityTo} onChange={(e) => setCityTo(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Цена за место (₸)</Label>
              <Input type="number" placeholder="5000" value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Отмена</Button>
            <Button onClick={handleCreate} disabled={saving || !cityFrom.trim() || !cityTo.trim() || !price}>
              {saving ? "Создание..." : "Создать"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Диалог редактирования */}
      <Dialog open={!!editRoute} onOpenChange={(o) => { if (!o) setEditRoute(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редактировать маршрут</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>Откуда</Label>
              <Input value={editCityFrom} onChange={(e) => setEditCityFrom(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Куда</Label>
              <Input value={editCityTo} onChange={(e) => setEditCityTo(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Новая цена за место (₸)</Label>
              <Input type="number" placeholder="Оставьте пустым чтобы не менять" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} />
            </div>
            {editError && <p className="text-sm text-destructive">{editError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditRoute(null)}>Отмена</Button>
            <Button onClick={handleEdit} disabled={editSaving || !editCityFrom.trim() || !editCityTo.trim()}>
              {editSaving ? "Сохранение..." : "Сохранить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Диалог удаления */}
      <Dialog open={!!deleteRoute} onOpenChange={(o) => { if (!o) setDeleteRoute(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Деактивировать маршрут?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Маршрут <strong>{deleteRoute?.city_from} → {deleteRoute?.city_to}</strong> будет скрыт из списка.
            Данные сохранятся.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteRoute(null)}>Отмена</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Деактивация..." : "Деактивировать"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
