"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

type VerificationStatus = "pending" | "verified" | "rejected";

interface DriverProfile {
  id: number;
  user_id: number;
  full_name: string;
  phone: string;
  car_model: string;
  car_number: string;
  verification_status: VerificationStatus;
  rejection_reason: string | null;
  license_url: string | null;
  tech_passport_url: string | null;
  rating: number;
  created_at: string;
}

const STATUS_LABELS: Record<VerificationStatus, string> = {
  pending: "Ожидает",
  verified: "Верифицирован",
  rejected: "Отклонён",
};

const STATUS_VARIANTS: Record<
  VerificationStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  pending: "secondary",
  verified: "default",
  rejected: "destructive",
};

export default function DriversPage() {
  const router = useRouter();
  const [drivers, setDrivers] = useState<DriverProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<VerificationStatus | "all">("all");

  // Reject dialog
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<DriverProfile | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const getToken = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return null;
    }
    return token;
  };

  const fetchDrivers = async () => {
    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch(`${API}/drivers/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      const list: any[] = Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
      const mapped: DriverProfile[] = list.map((d: any) => ({
        id: d.id,
        user_id: d.user_id,
        full_name: d.name ?? "",
        phone: d.phone ?? "",
        car_model: `${d.car_brand ?? ""} ${d.car_model ?? ""}`.trim(),
        car_number: d.car_number ?? "",
        verification_status: d.is_verified
          ? "verified"
          : d.rejection_reason
          ? "rejected"
          : "pending",
        rejection_reason: d.rejection_reason ?? null,
        license_url: d.license_doc_url ?? null,
        tech_passport_url: d.car_doc_url ?? null,
        rating: d.rating ?? 0,
        created_at: d.created_at ?? "",
      }));
      setDrivers(mapped);
    } catch {
      console.error("Ошибка загрузки водителей");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  const handleVerify = async (driver: DriverProfile) => {
    const token = getToken();
    if (!token) return;
    setActionLoading(true);
    try {
      await fetch(`${API}/drivers/${driver.id}/verify`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchDrivers();
    } finally {
      setActionLoading(false);
    }
  };

  const openRejectDialog = (driver: DriverProfile) => {
    setRejectTarget(driver);
    setRejectReason("");
    setRejectDialogOpen(true);
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    const token = getToken();
    if (!token) return;
    setActionLoading(true);
    try {
      await fetch(`${API}/drivers/${rejectTarget.id}/reject?reason=${encodeURIComponent(rejectReason)}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      setRejectDialogOpen(false);
      await fetchDrivers();
    } finally {
      setActionLoading(false);
    }
  };

  const filtered =
    filter === "all" ? drivers : drivers.filter((d) => d.verification_status === filter);

  const counts = {
    all: drivers.length,
    pending: drivers.filter((d) => d.verification_status === "pending").length,
    verified: drivers.filter((d) => d.verification_status === "verified").length,
    rejected: drivers.filter((d) => d.verification_status === "rejected").length,
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
            <h1 className="text-xl font-semibold">Водители</h1>
          </div>
          <Button variant="outline" onClick={() => { localStorage.removeItem("token"); router.push("/login"); }}>
            Выйти
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          {(["all", "pending", "verified", "rejected"] as const).map((key) => (
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

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-16 text-muted-foreground">
                Загрузка...
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex items-center justify-center py-16 text-muted-foreground">
                Водители не найдены
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Имя</TableHead>
                    <TableHead>Телефон</TableHead>
                    <TableHead>Авто</TableHead>
                    <TableHead>Рейтинг</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Документы</TableHead>
                    <TableHead className="text-right">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((driver) => (
                    <TableRow key={driver.id}>
                      <TableCell className="font-medium">{driver.full_name}</TableCell>
                      <TableCell>{driver.phone}</TableCell>
                      <TableCell>
                        {driver.car_model} · {driver.car_number}
                      </TableCell>
                      <TableCell>
                        {driver.rating > 0 ? `★ ${driver.rating.toFixed(1)}` : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANTS[driver.verification_status]}>
                          {STATUS_LABELS[driver.verification_status]}
                        </Badge>
                        {driver.rejection_reason && (
                          <p className="mt-1 text-xs text-muted-foreground max-w-[160px] truncate" title={driver.rejection_reason}>
                            {driver.rejection_reason}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {driver.license_url && (
                            <a
                              href={driver.license_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary underline"
                            >
                              Права
                            </a>
                          )}
                          {driver.tech_passport_url && (
                            <a
                              href={driver.tech_passport_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary underline"
                            >
                              Тех.паспорт
                            </a>
                          )}
                          {!driver.license_url && !driver.tech_passport_url && (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {driver.verification_status === "pending" && (
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleVerify(driver)}
                              disabled={actionLoading}
                            >
                              Верифицировать
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => openRejectDialog(driver)}
                              disabled={actionLoading}
                            >
                              Отклонить
                            </Button>
                          </div>
                        )}
                        {driver.verification_status === "verified" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openRejectDialog(driver)}
                            disabled={actionLoading}
                          >
                            Отозвать
                          </Button>
                        )}
                        {driver.verification_status === "rejected" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleVerify(driver)}
                            disabled={actionLoading}
                          >
                            Верифицировать
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Отклонить водителя — {rejectTarget?.full_name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="reason">Причина отказа</Label>
            <Input
              id="reason"
              placeholder="Например: документы нечёткие, истёк срок..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Отмена
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={actionLoading || !rejectReason.trim()}
            >
              {actionLoading ? "Отправка..." : "Отклонить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
