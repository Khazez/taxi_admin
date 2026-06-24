"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

interface Setting {
  key: string;
  value: string;
  description?: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  const getToken = () => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return null; }
    return token;
  };

  const fetchSettings = async () => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(`${API}/settings/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) { router.push("/login"); return; }
      const data = await res.json();
      const list = Array.isArray(data) ? data : (data.data ?? []);
      setSettings(list);
      // Заполняем локальные значения для редактирования
      const vals: Record<string, string> = {};
      list.forEach((s: Setting) => { vals[s.key] = s.value; });
      setEditing(vals);
    } catch {
      console.error("Ошибка загрузки настроек");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSettings(); }, []);

  const handleSave = async (key: string) => {
    const token = getToken();
    if (!token) return;
    setSaving(key);
    try {
      await fetch(`${API}/settings/${key}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ value: editing[key] }),
      });
      setSaved(key);
      setTimeout(() => setSaved(null), 2000);
      await fetchSettings();
    } finally {
      setSaving(null);
    }
  };

  const LABELS: Record<string, string> = {
      cancellation_fee_percent: "Штраф за отмену (%)",
      cancellation_window_minutes: "Окно отмены (минуты)",  // ← добавь
    };

  const DESCRIPTIONS: Record<string, string> = {
    cancellation_fee_percent: "Процент от стоимости поездки, который списывается при отмене за < 1 часа до выезда",
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.push("/dashboard")}>
              ← Дашборд
            </Button>
            <h1 className="text-xl font-semibold">Настройки платформы</h1>
          </div>
          <Button variant="outline" onClick={() => { localStorage.removeItem("token"); router.push("/login"); }}>
            Выйти
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 max-w-2xl">
        {loading ? (
          <p className="text-muted-foreground">Загрузка...</p>
        ) : settings.length === 0 ? (
          <p className="text-muted-foreground">Настройки не найдены</p>
        ) : (
          <div className="space-y-4">
            {settings.map((setting) => (
              <Card key={setting.key}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    {LABELS[setting.key] ?? setting.key}
                  </CardTitle>
                  {DESCRIPTIONS[setting.key] && (
                    <p className="text-sm text-muted-foreground">
                      {DESCRIPTIONS[setting.key]}
                    </p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex gap-3">
                    <Input
                      value={editing[setting.key] ?? setting.value}
                      onChange={(e) =>
                        setEditing((prev) => ({ ...prev, [setting.key]: e.target.value }))
                      }
                      className="max-w-xs"
                    />
                    <Button
                      onClick={() => handleSave(setting.key)}
                      disabled={saving === setting.key}
                      variant={saved === setting.key ? "outline" : "default"}
                    >
                      {saving === setting.key ? "Сохранение..." : saved === setting.key ? "✓ Сохранено" : "Сохранить"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}