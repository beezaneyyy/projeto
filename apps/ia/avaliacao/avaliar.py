"""Mede a qualidade da IA num conjunto fixo de fotos rotuladas (avaliacao/rotulos.json).

Roda o MESMO `analisar()` do servico, com o modelo real, sem subir a API.

Uso (na raiz do repositorio):
    npm run avaliar:ia
    npm run avaliar:ia -- --salvar avaliacao/resultado.json   (guarda o resultado)
    npm run avaliar:ia -- --comparar avaliacao/resultado.json (mostra o antes x depois)

Metricas:
  - acerto (recall): itens do prato encontrados / itens do prato
  - precisao: itens detectados que estao no prato / itens detectados
  - falsos positivos: itens que a IA inventou
  - pratos perfeitos: todos os itens encontrados e nenhum inventado
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
from pathlib import Path

AQUI = Path(__file__).resolve().parent
sys.path.insert(0, str(AQUI.parent))

from PIL import Image  # noqa: E402

from app.alimentos import carregar_alimentos  # noqa: E402
from app.analise import analisar, rotulos  # noqa: E402
from app.classificador import ClipClassificador  # noqa: E402
from app.config import DADOS_DIR  # noqa: E402


def avaliar_foto(gabarito: dict, resultado: dict) -> dict:
    detectados = [f["canonicalName"] for f in resultado["foods"]]
    if gabarito.get("comida", True) is False:
        ok = not resultado["isFood"]
        return {"detectados": detectados, "grupos": 0, "achados": 0, "fp": [] if ok else detectados,
                "perdidos": [], "perfeito": ok, "rejeicao_ok": ok}

    grupos = gabarito["esperados"]
    validos = {n for g in grupos for n in g} | set(gabarito.get("aceitaveis", []))
    achados = [g for g in grupos if any(n in detectados for n in g)]
    perdidos = [g[0] for g in grupos if g not in achados]
    fp = [d for d in detectados if d not in validos]
    return {
        "detectados": detectados,
        "grupos": len(grupos),
        "achados": len(achados),
        "fp": fp,
        "perdidos": perdidos,
        "perfeito": not perdidos and not fp and resultado["isFood"],
        "rejeicao_ok": resultado["isFood"],
    }


def resumo(por_foto: dict[str, dict]) -> dict:
    grupos = sum(r["grupos"] for r in por_foto.values())
    achados = sum(r["achados"] for r in por_foto.values())
    detectados = sum(len(r["detectados"]) for r in por_foto.values())
    fp = sum(len(r["fp"]) for r in por_foto.values())
    return {
        "fotos": len(por_foto),
        "acerto": achados / grupos if grupos else 0.0,
        "precisao": (detectados - fp) / detectados if detectados else 0.0,
        "falsos_positivos": fp,
        "pratos_perfeitos": sum(r["perfeito"] for r in por_foto.values()),
        "rejeicoes_corretas": sum(r["rejeicao_ok"] for r in por_foto.values()),
    }


def imprimir_resumo(titulo: str, s: dict) -> None:
    print(f"\n{titulo}")
    print(f"  acerto (itens do prato encontrados): {s['acerto']:.0%}")
    print(f"  precisao (detectados que existem):   {s['precisao']:.0%}")
    print(f"  falsos positivos (itens inventados): {s['falsos_positivos']}")
    print(f"  pratos perfeitos:                    {s['pratos_perfeitos']}/{s['fotos']}")
    print(f"  comida x nao-comida correto:         {s['rejeicoes_corretas']}/{s['fotos']}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--salvar", type=Path)
    parser.add_argument("--comparar", type=Path)
    args = parser.parse_args()

    gabarito = json.loads((AQUI / "rotulos.json").read_text(encoding="utf-8"))["fotos"]
    alimentos = carregar_alimentos(DADOS_DIR / "alimentos.json")
    modelo = os.environ.get("IA_MODEL_NAME", "openai/clip-vit-base-patch32")
    print(f"Carregando {modelo}...")
    classificador = ClipClassificador(modelo, rotulos(alimentos))

    por_foto: dict[str, dict] = {}
    inicio = time.perf_counter()
    for nome, g in sorted(gabarito.items()):
        resultado = analisar(Image.open(AQUI / "fotos" / nome), alimentos, classificador)
        r = avaliar_foto(g, resultado)
        r["confiancas"] = {f["canonicalName"]: f["confidence"] for f in resultado["foods"]}
        por_foto[nome] = r
        marca = "OK " if r["perfeito"] else "   "
        extra = []
        if r["perdidos"]:
            extra.append("faltou " + ", ".join(r["perdidos"]))
        if r["fp"]:
            extra.append("inventou " + ", ".join(r["fp"]))
        if not g.get("comida", True):
            extra.append("rejeitada" if not resultado["isFood"] else "NAO rejeitada")
        print(f"{marca}{nome[:44]:44} {r['achados']}/{r['grupos']}  {' | '.join(extra)}")
    ms = (time.perf_counter() - inicio) * 1000 / len(gabarito)

    s = resumo(por_foto)
    imprimir_resumo(f"Resumo ({len(gabarito)} fotos, {ms:.0f} ms/foto)", s)

    if args.comparar and args.comparar.exists():
        antes = json.loads(args.comparar.read_text(encoding="utf-8"))["resumo"]
        imprimir_resumo(f"Antes ({args.comparar.name})", antes)
    if args.salvar:
        args.salvar.write_text(json.dumps({"resumo": s, "fotos": por_foto}, indent=1, ensure_ascii=False), encoding="utf-8")
        print(f"\nResultado salvo em {args.salvar}")


if __name__ == "__main__":
    main()
