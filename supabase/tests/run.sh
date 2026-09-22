#!/usr/bin/env bash
# Chạy toàn bộ migration + kiểm thử phân quyền + nạp seed trên một Postgres TRỐNG (chỉ dùng cho kiểm thử/CI).
#   DB_URL=postgresql://postgres:postgres@localhost:5432/sctest bash supabase/tests/run.sh
# Thoát với mã khác 0 nếu bất kỳ bước nào lỗi (kể cả một phép kiểm tra phân quyền không đạt).
set -euo pipefail
: "${DB_URL:?Cần đặt DB_URL, ví dụ postgresql://postgres:postgres@localhost:5432/sctest}"
DIR=$(cd "$(dirname "$0")/.." && pwd)
run() { psql "$DB_URL" -v ON_ERROR_STOP=1 -q -X "$@"; }

run -f "$DIR/tests/stub_supabase.sql"
for f in "$DIR"/migrations/*.sql; do
  echo "migration: $(basename "$f")"
  run -f "$f"
done

# Bộ kiểm thử tự tạo và tự dọn dữ liệu, nên phải chạy trước khi nạp seed.
run -f "$DIR/tests/rbac_smoke.sql" 2>&1 | sed 's/^psql:[^ ]* NOTICE:  //'

echo "seed.sql (dữ liệu mẫu phát triển)"
run -f "$DIR/seed.sql" >/dev/null
run -c "select count(*) as tai_khoan_mau from public.users" -c "select count(*) as ca_mau from (select id from public.counseling_requests union all select id from public.incidents) x"
