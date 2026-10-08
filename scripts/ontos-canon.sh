#!/bin/sh
# Canon de ONTOS para las comprobaciones de la web: el ÚLTIMO COMMIT, nunca el árbol de trabajo.
# Por qué (3-oct-2026): otra sesión con el manual de marca a medio editar hacía fallar el hook
# («Marca desactualizada») o, peor, colaba su trabajo sin guardar en brand/canon/. Pasó cuatro
# veces en un día; la regla de ONTOS pide automatizar el incidente repetido.
# Mantiene una copia fija (worktree desacoplado de ONTOS) y la mueve al HEAD de ONTOS en cada
# llamada; imprime su ruta. Falla cerrado: si no puede situarla en ese commit, sale con error.
# Consecuencia: el canon que la web consume tiene que estar commiteado en ONTOS antes.
set -e
# Dentro de un hook, git exporta GIT_INDEX_FILE/GIT_DIR del commit de la WEB: heredarlos haría que
# el checkout de ONTOS escribiera en el índice de la web. Se limpian y la web se sitúa por la
# ruta de este script, no por git.
unset GIT_DIR GIT_INDEX_FILE GIT_WORK_TREE GIT_PREFIX GIT_OBJECT_DIRECTORY GIT_ALTERNATE_OBJECT_DIRECTORIES GIT_COMMON_DIR
web=$(cd "$(dirname "$0")/.." && pwd)
ontos=${ONTOS_REPO:-$(cd "$web/../ONTOS" && pwd)}
dest=${ONTOS_CANON_WORKTREE:-$HOME/Dev/.ontos-canon-web}
head=$(git -C "$ontos" rev-parse HEAD)
if [ -e "$dest/.git" ]; then
  git -C "$dest" checkout --detach --force -q "$head" >&2
else
  git -C "$ontos" worktree add --detach -q "$dest" "$head" >&2
fi
[ -e "$dest/scripts/verify/node_modules" ] || ln -s "$ontos/scripts/verify/node_modules" "$dest/scripts/verify/node_modules"
if [ "$(git -C "$dest" rev-parse HEAD)" != "$head" ] || [ -n "$(git -C "$dest" status --porcelain --untracked-files=no)" ]; then
  echo "ontos-canon: la copia $dest no está limpia en $head" >&2
  exit 1
fi
echo "$dest"
