#!/bin/sh
#
# validate_openspec.sh — OpenSpec validation for the active CrewOps change.
#
# Checks (Grupo 4 / task 4.7 "validacao OpenSpec"):
#   1. The active change directory and its required files (proposal/design/tasks)
#      and per-spec `spec.md` files exist.
#   2. The documentation validator (Group 1) passes.
#   3. When the `openspec` CLI is available, the active change validates.
#
# This is self-contained (POSIX shell, no npm) so it runs in CI without a
# pre-installed global tool. It intentionally validates ONLY the active change,
# not `--all`, because unrelated global specs may still be pending (group 5+).

set -u

fails=0
warns=0
ROOT=$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)
CHANGE="migrar-fieldops-para-crewops-mvp"
CHANGE_DIR="$ROOT/openspec/changes/$CHANGE"

pass() { printf 'PASS  %s\n' "$1"; }
fail() { fails=$((fails + 1)); printf 'FAIL  %s\n' "$1"; }
warn() { warns=$((warns + 1)); printf 'WARN  %s\n' "$1"; }

echo "== Validacao OpenSpec — mudanca ativa =="
echo "change: $CHANGE"
echo

# --- 1. Estrutura da mudanca ---
echo "[1] Estrutura da mudanca"
for f in proposal.md design.md tasks.md; do
  if [ -f "$CHANGE_DIR/$f" ]; then
    pass "arquivo existe: $f"
  else
    fail "arquivo obrigatorio ausente: $f"
  fi
done

if [ -d "$CHANGE_DIR/specs" ]; then
  pass "diretorio specs existe"
  for specdir in "$CHANGE_DIR/specs/"*/; do
    name=$(basename "$specdir")
    if [ -f "$specdir/spec.md" ]; then
      pass "spec.md presente: $name"
    else
      fail "spec.md ausente: $name"
    fi
  done
else
  fail "diretorio specs ausente"
fi
echo

# --- 2. Validador de documentacao (Grupo 1) ---
echo "[2] Documentacao (validate_docs.sh)"
DOCS_OUT=$("$ROOT/scripts/validate_docs.sh" --no-legacy 2>&1)
DOCS_CODE=$?
if [ "$DOCS_CODE" -eq 0 ]; then
  pass "validate_docs.sh"
else
  fail "validate_docs.sh (exit $DOCS_CODE)"
  printf '%s\n' "$DOCS_OUT"
fi
echo

# --- 3. CLI openspec (se disponivel) ---
echo "[3] CLI openspec"
if command -v openspec >/dev/null 2>&1; then
  if (cd "$ROOT" && openspec validate "$CHANGE" --type change >/dev/null 2>&1); then
    pass "openspec validate change"
  else
    fail "openspec validate change"
    (cd "$ROOT" && openspec validate "$CHANGE" --type change || true)
  fi
else
  warn "openspec CLI nao encontrada — estrutura coberta por [1]/[2]"
fi
echo

echo "RESULTADO: $fails falha(s), $warns aviso(s)"
[ "$fails" -eq 0 ] && exit 0 || exit 1
