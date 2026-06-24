# ZHOLAUSHY — Веб-панель администратора (taxi-admin)

## Что это
Next.js / React веб-панель диспетчера для платформы ZHOLAUSHY (межгородские поездки, Актобе).

## Auth
- POST /api/v1/auth/admin/login?email=...&password=... → {access_token}
- Токен сохраняется в localStorage['token']
- Admin: admin@zholaushy.kz / Admin1234 (создать через create_admin.py в taxi-backend)

## Конфигурация
- URL бэкенда задаётся через `.env.local`: `NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1`
- Все страницы используют `process.env.NEXT_PUBLIC_API_URL`
- При смене машины/IP — меняй только `.env.local`, перезапускай `npm run dev`
- Открывать на той же машине где запущен бэкенд: `http://localhost:3000/login`

## Страницы (все готовы ✅)
- app/login/page.tsx — вход по email + пароль
- app/dashboard/page.tsx — статистика (GET /admin/stats)
- app/dashboard/drivers/page.tsx — все водители + верификация (verify/reject)
- app/dashboard/routes/page.tsx — маршруты (список, создать, удалить)
- app/dashboard/trips/page.tsx — все поездки (GET /admin/trips)
- app/dashboard/settings/page.tsx — настройки платформы (GET/PATCH /settings/)

## API эндпоинты (все используемые)
- GET /api/v1/admin/stats
- GET /api/v1/admin/trips
- GET /api/v1/drivers/all — все водители (не только unverified!)
- PATCH /api/v1/drivers/{id}/verify
- PATCH /api/v1/drivers/{id}/reject?reason=... — reason как query-param, НЕ в body
- GET /api/v1/routes/
- POST /api/v1/routes/
- DELETE /api/v1/routes/{id}
- GET /api/v1/settings/
- PATCH /api/v1/settings/{key}

## Маппинг данных водителя (важно!)
Бэкенд возвращает: `name`, `is_verified`, `car_brand`+`car_model`, `license_doc_url`, `car_doc_url`
UI ожидает: `full_name`, `verification_status`, `car_model` (совмещённый), `license_url`, `tech_passport_url`
Маппинг делается в `fetchDrivers()` в `drivers/page.tsx`.

## Структура файлов
```
taxi-admin/
├── .env.local                # NEXT_PUBLIC_API_URL (не коммитить!)
├── app/
│   ├── login/page.tsx
│   └── dashboard/
│       ├── page.tsx          # дашборд со статистикой + обработка ошибок
│       ├── drivers/page.tsx  # все водители, фильтры, верификация
│       ├── routes/page.tsx
│       ├── trips/page.tsx
│       └── settings/page.tsx
└── components/ui/            # shadcn/ui компоненты
```

## Что сделать дальше (план)
- [ ] Страница пользователей — список всех пассажиров и водителей
- [ ] Страница конкретного водителя — история поездок, рейтинг
- [ ] Страница деталей поездки — пассажиры, адреса, статус
- [ ] Фильтры и поиск в таблицах поездок
- [ ] Экспорт в CSV
- [ ] Real-time обновления (WebSocket или polling)
