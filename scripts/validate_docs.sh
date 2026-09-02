#!/bin/sh
#
# validate_docs.sh — Validador executável de completude da documentação do Grupo 1.
#
# Este script é um validador POSIX shell, independente (não usa npm/CI).
# A suíte de CI/testes do monorepo pertence ao Grupo 4; aqui NÃO se cria um
# pipeline de testes nem um script `npm run test`.
#
# Verifica:
#   1. Os 7 documentos obrigatórios do grupo existem (+ PILOT_RATIFICATIONS.md).
#   2. Seções/headings obrigatórias por documento (substring de heading).
#   3. Todo placeholder `<...>` tem dono+prazo via R-ID/D-ID na MESMA LINHA.
#   4. Todo R-ID referenciado nos docs existe em PILOT_RATIFICATIONS.md.
#   4b. Todo R-ID referenciado tem estrutura completa (dono, prazo, impacto, status).
#   5. Referências relativas a outros docs CrewOps (.md em link/markdown ou
#      backticked) resolvem para arquivo existente (com allowlist de docs futuros).
#   5b. Âncoras em links markdown (#fragment) resolvem para heading existente.
#   6. (Opcional) Caminhos de origem do legado citados (LEGACY_REFERENCE_MAP.md,
#      FIELDOPS_BASELINE.md) existem — leitura somente, modo aviso (não falha).
#
# Uso:
#   ./scripts/validate_docs.sh
#   ./scripts/validate_docs.sh --no-legacy
#   ./scripts/validate_docs.sh --legacy-root /caminho/do/legado
#
# Códigos de saída:
#   0 = todas as verificações obrigatórias passam (avisos opcionais podem ser impressos)
#   1 = ao menos uma verificação obrigatória falhou
#   2 = uso inválido / erro de instrumentação

set -u
set -f   # desliga glob expansion (linhas contêm <X*7>, etc.)

fails=0
warns=0

SCRIPT_DIR=$(CDPATH= cd "$(dirname "$0")" && pwd)
CREWOOPS_ROOT=$(dirname "$SCRIPT_DIR")
DOCS_DIR="$CREWOOPS_ROOT/docs"
LEGACY_ROOT=$(dirname "$CREWOOPS_ROOT")
LEGACY_MODE="auto"

usage() {
  sed -n '2,26p' "$0" | sed 's/^# \{0,1\}//'
}

# --- argumentos ---
while [ "$#" -gt 0 ]; do
  case "$1" in
    --no-legacy)
      LEGACY_MODE="off"; shift ;;
    --legacy-root)
      if [ "$#" -ge 2 ]; then
        LEGACY_ROOT=$2
        LEGACY_MODE="custom"
        shift 2
      else
        echo "erro: --legacy-root requer um caminho" >&2
        exit 2
      fi ;;
    --legacy-root=*)
      LEGACY_ROOT=${1#*=}
      LEGACY_MODE="custom"
      shift ;;
    -h|--help)
      usage
      exit 0 ;;
    *)
      echo "erro: argumento desconhecido: $1" >&2
      exit 2 ;;
  esac
done

# --- helpers de resultado ---
pass() { printf 'PASS  %s\n' "$1"; }
fail() { fails=$((fails + 1)); printf 'FAIL  %s\n' "$1"; }
warn() { warns=$((warns + 1)); printf 'WARN  %s\n' "$1"; }

# --- slugify GFM-style (lowercase, alnum/space/hyphen/underscore, collapse spaces -> hyphens) ---
slugify() {
  _out=$(printf '%s' "$1" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9 _-]//g; s/  */-/g; s/^-//; s/-$//')
  printf '%s\n' "$_out"
}

# --- extract anchors from markdown file ---
# Outputs one slug/id per line
extract_anchors() {
  _file=$1
  [ -f "$_file" ] || return

  # Markdown headings: ### Heading text {#custom-id}
  grep -nE '^#{1,6}[[:space:]]+' "$_file" 2>/dev/null | while IFS= read -r _line; do
    # strip leading hashes
    _heading=${_line#*# }
    _heading=${_heading#*#	}

    # explicit custom id: {#id}
    _custom=$(printf '%s' "$_heading" | grep -oE '\{#[^}]+\}$' | tr -d '{#}')
    if [ -n "$_custom" ]; then
      printf '%s\n' "$_custom"
    fi

    # slugified heading text (strip trailing custom-id syntax first)
    _txt=$(printf '%s' "$_heading" | sed -E 's/[[:space:]]*\{#[^}]*\}$//')
    slugify "$_txt"
  done

  # HTML id attributes (basic)
  grep -oE '<h[1-6][^>]+id="[^"]+"' "$_file" 2>/dev/null | sed 's/.*id="\([^"]*\)".*/\1/'
}

echo "== Validação de completude da documentação — Grupo 1 =="
echo "docs dir: $DOCS_DIR"
echo "legacy root: $LEGACY_ROOT (modo: $LEGACY_MODE)"
echo

if [ ! -d "$DOCS_DIR" ]; then
  fail "diretório docs não encontrado: $DOCS_DIR"
  echo
  echo "RESULTADO: $fails falha(s), $warns aviso(s)"
  [ "$fails" -eq 0 ] && exit 0 || exit 1
fi

# ---------------------------------------------------------------
# 1. Documentos obrigatórios existem
# ---------------------------------------------------------------
echo "[1] Documentos obrigatórios"
required_docs="PILOT_GOVERNANCE.md MVP_SCOPE.md ACCEPTANCE_PLAN.md GLOSSARY.md FIELDOPS_BASELINE.md GPS_POLICY.md DECISION_LOG.md PILOT_RATIFICATIONS.md"
for d in $required_docs; do
  if [ -f "$DOCS_DIR/$d" ]; then
    pass "documento existe: $d"
  else
    fail "documento obrigatório ausente: docs/$d"
  fi
done
echo

# ---------------------------------------------------------------
# 2. Headings/seções obrigatórias por documento (substring)
# ---------------------------------------------------------------
echo "[2] Headings/seções obrigatórias"
while IFS='|' read -r doc hd; do
  [ -z "$doc" ] && continue
  if grep -qiF -- "$hd" "$DOCS_DIR/$doc"; then
    pass "seção presente: $doc :: $hd"
  else
    fail "seção ausente: $doc :: $hd"
  fi
done <<'HEADINGS'
PILOT_GOVERNANCE.md|Objetivo
PILOT_GOVERNANCE.md|Papéis e Responsabilidades
PILOT_GOVERNANCE.md|Regra de decisão final por tema
PILOT_GOVERNANCE.md|Delegados por papel
PILOT_GOVERNANCE.md|Decisões já tomadas
PILOT_GOVERNANCE.md|Como escalar um bloqueio de gate
PILOT_GOVERNANCE.md|Critério de aprovação deste documento
PILOT_GOVERNANCE.md|Documentos vinculados
MVP_SCOPE.md|Objetivo do MVP
MVP_SCOPE.md|Piloto Operacional
MVP_SCOPE.md|Volume Representativo
MVP_SCOPE.md|Fora do Piloto
MVP_SCOPE.md|Criterios de Sucesso
MVP_SCOPE.md|Confirmações pendentes do escopo
MVP_SCOPE.md|Documentos vinculados
ACCEPTANCE_PLAN.md|Severidades de defeito
ACCEPTANCE_PLAN.md|Método de medição
ACCEPTANCE_PLAN.md|Fases do piloto
ACCEPTANCE_PLAN.md|Critérios transversais
ACCEPTANCE_PLAN.md|Documentos vinculados
GLOSSARY.md|Registro de aprovação
GLOSSARY.md|### ticket
GLOSSARY.md|### work_order
GLOSSARY.md|### dispatch
GLOSSARY.md|### event / work_order_event
GLOSSARY.md|### evidence
GLOSSARY.md|### technician_location
GLOSSARY.md|### customer
GLOSSARY.md|### service_address
GLOSSARY.md|Termos adicionais
GLOSSARY.md|Divergências explícitas
GLOSSARY.md|Termos proibidos
GLOSSARY.md|Documentos vinculados
FIELDOPS_BASELINE.md|1. Volumes
FIELDOPS_BASELINE.md|2. Tempos
FIELDOPS_BASELINE.md|3. Erros
FIELDOPS_BASELINE.md|4. Telas
FIELDOPS_BASELINE.md|5. Indicadores
FIELDOPS_BASELINE.md|6. Limitações
FIELDOPS_BASELINE.md|Regras de completude
FIELDOPS_BASELINE.md|Documentos vinculados
GPS_POLICY.md|Princípio
GPS_POLICY.md|O que o CrewOps entrega
GPS_POLICY.md|O que o CrewOps NÃO entrega
GPS_POLICY.md|Textos aprovados
GPS_POLICY.md|Critérios de recência
GPS_POLICY.md|Se rastreamento contínuo for exigido
GPS_POLICY.md|Validação
GPS_POLICY.md|Documentos vinculados
DECISION_LOG.md|Modelo de registro
DECISION_LOG.md|Decisões já registradas
DECISION_LOG.md|Pendências
DECISION_LOG.md|Regras do registro
DECISION_LOG.md|Documentos vinculados
HEADINGS
echo

# ---------------------------------------------------------------
# 3. Placeholders com dono+prazo (R-ID/D-ID na mesma linha)
# ---------------------------------------------------------------
echo "[3] Placeholders <...> com dono/prazo (R-ID/D-ID na mesma linha)"
placeholder_docs="MVP_SCOPE.md ACCEPTANCE_PLAN.md FIELDOPS_BASELINE.md PILOT_GOVERNANCE.md GLOSSARY.md GPS_POLICY.md DECISION_LOG.md PILOT_RATIFICATIONS.md"
for doc in $placeholder_docs; do
  file="$DOCS_DIR/$doc"
  [ -f "$file" ] || continue
  # linhas que contêm token placeholder, desconsiderando o literal <...>
  # grep -nE '<[^<>]{1,40}>' : token de até 40 chars sem <> interno
  matches=$(grep -nE '<[^<>]{1,40}>' "$file" | grep -vE '<\.\.\.>' || true)
  if [ -z "$matches" ]; then
    pass "sem placeholders de valor: $doc"
    continue
  fi
  OLD_IFS=$IFS
  IFS='
'
  for line in $matches; do
    lineno=${line%%:*}
    body=${line#*:}
    if printf '%s\n' "$body" | grep -qE 'R-[0-9]{3}|D-[0-9]{3}'; then
      ph=$(printf '%s\n' "$body" | grep -oE '<[^<>]{1,40}>' | head -n 1)
      pass "placeholder com R/D-ID: $doc:$lineno ($ph)"
    else
      fail "placeholder sem dono/prazo na linha: $doc:$lineno :: $body"
    fi
  done
  IFS=$OLD_IFS
done
echo

# ---------------------------------------------------------------
# 4. R-IDs referenciados existem em PILOT_RATIFICATIONS.md
# ---------------------------------------------------------------
echo "[4] R-IDs referenciados definidos em PILOT_RATIFICATIONS.md"
rid_refs=""
if [ -f "$DOCS_DIR/PILOT_RATIFICATIONS.md" ]; then
  rid_refs=$(grep -rhoE 'R-[0-9]{3}' "$DOCS_DIR" | sort -u)
  OLD_IFS=$IFS
  IFS='
'
  for rid in $rid_refs; do
    if grep -qF -- "$rid" "$DOCS_DIR/PILOT_RATIFICATIONS.md"; then
      pass "R-ID definido: $rid"
    else
      fail "R-ID referenciado mas não definido em PILOT_RATIFICATIONS: $rid"
    fi
  done
  IFS=$OLD_IFS
else
  fail "PILOT_RATIFICATIONS.md ausente — não é possível validar R-IDs"
fi
echo

# ---------------------------------------------------------------
# 4b. R-ID estruturação (dono, prazo, impacto, status)
# ---------------------------------------------------------------
echo "[4b] R-ID estruturação (dono, prazo, impacto, status)"
if [ -f "$DOCS_DIR/PILOT_RATIFICATIONS.md" ] && [ -n "$rid_refs" ]; then
  OLD_IFS=$IFS
  IFS='
'
  for rid in $rid_refs; do
    # Find the data row for this R-ID
    _row=$(grep -nF "| $rid |" "$DOCS_DIR/PILOT_RATIFICATIONS.md" | head -n 1)
    if [ -z "$_row" ]; then
      fail "R-ID sem linha estruturada em PILOT_RATIFICATIONS: $rid"
      continue
    fi
    _linebody=${_row#*:}
    # Strip leading/trailing pipes so awk splits cleanly on " | "
    _linebody=$(printf '%s' "$_linebody" | sed 's/^| //; s/ |$//')
    # Parse markdown table columns with awk (now $1=ID $2=Item $3=Dono $4=Ancoragem $5=Prazo $6=Impacto $7=Status)
    _owner=$(printf '%s' "$_linebody" | awk -F ' \\| ' '{print $3}')
    _deadline=$(printf '%s' "$_linebody" | awk -F ' \\| ' '{print $5}')
    _impact=$(printf '%s' "$_linebody" | awk -F ' \\| ' '{print $6}')
    _status=$(printf '%s' "$_linebody" | awk -F ' \\| ' '{print $7}')
    # trim whitespace
    _owner=$(printf '%s' "$_owner" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
    _deadline=$(printf '%s' "$_deadline" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
    _impact=$(printf '%s' "$_impact" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
    _status=$(printf '%s' "$_status" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
    _missing=""
    [ -z "$_owner" ] && _missing="$_missing dono"
    [ -z "$_deadline" ] && _missing="$_missing prazo"
    [ -z "$_impact" ] && _missing="$_missing impacto"
    [ -z "$_status" ] && _missing="$_missing status"
    if [ -n "$_missing" ]; then
      fail "R-ID $rid campos ausentes:$_missing"
    else
      pass "R-ID estruturado: $rid"
    fi
  done
  IFS=$OLD_IFS
fi
echo

# ---------------------------------------------------------------
# 5. Referências relativas a outros docs CrewOps (.md) resolvem
# ---------------------------------------------------------------
echo "[5] Referências relativas .md (links markdown + backticked) resolvem"

# (a) alvos de links markdown [texto](destino.md#ancora)
link_targets=$(grep -rhoE '\[[^]]*\]\([^)]*\)' "$DOCS_DIR" | sed -n 's/.*](\(.*\))/\1/p' | sort -u)

# (b) referências backticked `path.md`
backticked=$(grep -rhoE '`[A-Za-z0-9_./-]+\.md`' "$DOCS_DIR" | tr -d '`' | sed 's/#.*//' | sort -u)

OLD_IFS=$IFS
IFS='
'

# Process markdown link targets (with optional anchor)
for target in $link_targets; do
  [ -z "$target" ] && continue
  # split file and anchor
  _filepart=${target%%#*}
  _anchor=${target#*#}
  [ "$_filepart" = "$target" ] && _anchor=""

  # normalize filepart
  _stripped=$(printf '%s' "$_filepart" | sed 's/[()]/ /g; s/[[:space:]]*//')
  [ -z "$_stripped" ] && continue

  case "$_stripped" in
    */*) _abs="$CREWOOPS_ROOT/$_stripped" ;;
    *)   _abs="$DOCS_DIR/$_stripped" ;;
  esac

  if [ ! -f "$_abs" ]; then
    base=${_abs##*/}
    case "$base" in
      BUSINESS_RULES.md|WORK_ORDER_FLOW.md|API_CONTRACT.md|DATABASE_MAP.md)
        warn "referência futura (declarada, entrega de grupo posterior): $_stripped" ;;
      *)
        fail "referência .md não resolve: $_stripped ($_abs)" ;;
    esac
    continue
  fi

  if [ -n "$_anchor" ]; then
    _anchors=$(extract_anchors "$_abs")
    if printf '%s\n' "$_anchors" | grep -qxF "$_anchor"; then
      pass "âncora válida: $_stripped#$_anchor"
    else
      fail "âncora desconhecida: $_stripped#$_anchor"
    fi
  else
    pass "referência resolvida: $_stripped"
  fi
done

# Process backticked refs (no anchors)
for ref in $backticked; do
  [ -z "$ref" ] && continue
  case "$ref" in
    */*) abs="$CREWOOPS_ROOT/$ref" ;;
    *)   abs="$DOCS_DIR/$ref" ;;
  esac
  if [ -f "$abs" ]; then
    pass "referência resolvida: $ref"
  else
    base=${abs##*/}
    case "$base" in
      BUSINESS_RULES.md|WORK_ORDER_FLOW.md|API_CONTRACT.md|DATABASE_MAP.md)
        warn "referência futura (declarada, entrega de grupo posterior): $ref" ;;
      *)
        fail "referência .md não resolve: $ref ($abs)" ;;
    esac
  fi
done

IFS=$OLD_IFS
echo

# ---------------------------------------------------------------
# 6. (Opcional) Caminhos de origem do legado existem (leitura somente)
# ---------------------------------------------------------------
if [ "$LEGACY_MODE" = "off" ]; then
  warn "checagem de caminhos do legado desativada (--no-legacy)"
elif [ ! -d "$LEGACY_ROOT/app" ]; then
  warn "raiz do legado não detectada em $LEGACY_ROOT — pulando checagem de caminhos (use --legacy-root)"
else
  echo "[6] Caminhos de origem do legado citados (aviso, leitura somente)"
  legacy_paths=$( { grep -rhoE '`(app|database|resources|public|bootstrap|routes|config|storage|tools|vendor)/[A-Za-z0-9_./-]+`|`fieldops\.sql`' "$DOCS_DIR/LEGACY_REFERENCE_MAP.md" "$DOCS_DIR/FIELDOPS_BASELINE.md"; } | tr -d '`' | sort -u)
  OLD_IFS=$IFS
  IFS='
'
  for lp in $legacy_paths; do
    [ -z "$lp" ] && continue
    case "$lp" in *\**|\*{*|*\}*) continue ;; esac
    if [ -e "$LEGACY_ROOT/$lp" ]; then
      pass "origem legado existe: $lp"
    else
      warn "origem legado não encontrada (somente leitura): $lp"
    fi
  done
  IFS=$OLD_IFS
  echo
fi

# ---------------------------------------------------------------
# 7. Regressão: âncora explícita {#id} — integração link + resolver
# ---------------------------------------------------------------
echo "[7] Regressão: âncora explícita {#id}"
_tmpdir=$(mktemp -d "${TMPDIR:-/tmp}/validate_docs_anchor_test.XXXXXX")
_target="$_tmpdir/target.md"
_source="$_tmpdir/source.md"
printf '%s\n' '## Heading A' '## Heading B {#custom-anchor}' > "$_target"
printf '%s\n' '[link](target.md#custom-anchor)' > "$_source"

_anchors=$(extract_anchors "$_target")

if printf '%s\n' "$_anchors" | grep -qxF 'heading-a'; then
  pass "regressão âncora slug: heading-a"
else
  fail "regressão âncora slug faltando: heading-a"
fi
if printf '%s\n' "$_anchors" | grep -qxF 'custom-anchor'; then
  pass "regressão âncora explícita: custom-anchor"
else
  fail "regressão âncora explícita faltando: custom-anchor"
fi

# Integration: parse source link, resolve file + anchor using same logic as section [5]
_parsed=$(grep -oE '\[[^]]*\]\([^)]*\)' "$_source" | sed -n 's/.*](\(.*\))/\1/p')
_filepart=${_parsed%%#*}
_anchor=${_parsed#*#}
[ "$_filepart" = "$_parsed" ] && _anchor=""
_resolved="$_tmpdir/$_filepart"
if [ -f "$_resolved" ]; then
  _anchors=$(extract_anchors "$_resolved")
  if [ -n "$_anchor" ]; then
    if printf '%s\n' "$_anchors" | grep -qxF "$_anchor"; then
      pass "regressão link+âncora resolve: $_parsed"
    else
      fail "regressão link+âncora âncora desconhecida: $_parsed"
    fi
  else
    pass "regressão link resolve (sem âncora): $_parsed"
  fi
else
  fail "regressão link+âncora arquivo não encontrado: $_filepart"
fi

rm -rf "$_tmpdir"
echo

# ---------------------------------------------------------------
echo "RESULTADO: $fails falha(s), $warns aviso(s)"
[ "$fails" -eq 0 ] && exit 0 || exit 1
