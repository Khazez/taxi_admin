# ZHOLAUSHY — Веб-панель администратора (taxi-admin)

## Что это
Next.js / React веб-панель диспетчера для платформы ZHOLAUSHY (межгородские поездки, Актобе).
Бэкенд: FastAPI на http://localhost:8000/api/v1

## Auth
- POST /api/v1/auth/admin/login?email=...&password=... → {access_token}
- Токен сохраняется в localStorage['admin_token']

## Страницы (все готовы ✅)
- app/login/page.tsx — вход по email + пароль
- app/dashboard/page.tsx — статистика (GET /admin/stats)
- app/dashboard/drivers/page.tsx — верификация водителей (unverified, verify, reject)
- app/dashboard/routes/page.tsx — маршруты (список, создать, удалить)
- app/dashboard/trips/page.tsx — все поездки (GET /admin/trips)
- app/dashboard/settings/page.tsx — настройки платформы (GET/PATCH /settings/)

## API эндпоинты (все используемые)
- GET /api/v1/admin/stats
- GET /api/v1/admin/trips
- GET /api/v1/drivers/unverified
- PATCH /api/v1/drivers/{id}/verify
- PATCH /api/v1/drivers/{id}/reject
- GET /api/v1/routes/
- POST /api/v1/routes/
- DELETE /api/v1/routes/{id}
- GET /api/v1/settings/
- PATCH /api/v1/settings/{key}

## Что сделать дальше (план)
- [ ] Страница пользователей — список всех пассажиров и водителей
- [ ] Страница конкретного водителя — документы, история поездок, рейтинг
- [ ] Страница деталей поездки — пассажиры, адреса, статус
- [ ] Фильтры и поиск в таблицах поездок
- [ ] Экспорт в CSV
- [ ] Real-time обновления (WebSocket или polling)

## Структура файлов
```
taxi-admin/
├── app/
│   ├── login/page.tsx
│   └── dashboard/
│       ├── page.tsx          # дашборд со статистикой
│       ├── drivers/page.tsx  # верификация водителей
│       ├── routes/page.tsx   # управление маршрутами
│       ├── trips/page.tsx    # список поездок
│       └── settings/page.tsx # настройки платформы
├── components/               # переиспользуемые компоненты (если есть)
└── CLAUDE.md
```
