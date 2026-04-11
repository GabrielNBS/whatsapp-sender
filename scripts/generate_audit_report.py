from __future__ import annotations

from datetime import datetime
from pathlib import Path
import html
import re
from typing import List, Optional, Tuple

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import (
    Flowable,
    PageBreak,
    Paragraph,
    Preformatted,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

PROJECT_ROOT = Path(r"C:\Projetos\whatsapp-sender")
OUTPUT_DIR = PROJECT_ROOT
SEVERITY_ORDER = {"CRITICA": 0, "ALTA": 1, "MEDIA": 2, "BAIXA": 3}
SEVERITY_COLORS = {
    "CRITICA": colors.HexColor("#C62828"),
    "ALTA": colors.HexColor("#EF6C00"),
    "MEDIA": colors.HexColor("#F9A825"),
    "BAIXA": colors.HexColor("#757575"),
}

AUDIT_DATA = {
    "resumo": {
        "score_geral": 20,
        "total_falhas": 7,
        "criticas": 2,
        "altas": 3,
        "medias": 2,
    },
    "falhas": [
        {
            "id": "F001",
            "categoria": "SEGURANÇA",
            "severidade": "CRITICA",
            "titulo": "APIs privilegiadas sem autenticação nem isolamento do Electron",
            "descricao": "As rotas internas expõem envio, logout, QR, status, analytics, templates, snippets e configurações sem autenticar quem chamou a API. O servidor local em 127.0.0.1 confia em qualquer processo local e algumas ações podem ser disparadas por páginas externas sem uma fronteira segura via IPC/token.",
            "localizacao": "src/app/api/messages/route.ts:4; src/app/api/schedule/route.ts:124; src/app/api/logout/route.ts:5; src/app/api/qr/route.ts:8; src/app/api/status/route.ts:7; src/app/api/settings/route.ts:15; src/app/api/templates/route.ts:23; src/app/api/snippets/route.ts:15; src/app/api/analytics/route.ts:6; src/app/api/campaigns/route.ts:11",
            "impacto": "Um processo local não confiável pode enviar mensagens, desconectar a sessão do WhatsApp, manipular templates/configurações e consultar dados operacionais sem passar pela UI oficial.",
            "correcao": "Substitua operações privilegiadas por IPC do Electron ou exija autenticação local forte por sessão com verificação de origem/CSRF e autorização por rota; não exponha ações sensíveis como endpoints HTTP abertos no localhost.",
            "recursos": [
                {"titulo": "OWASP Broken Access Control", "url": "https://owasp.org/Top10/A01_2021-Broken_Access_Control/"},
                {"titulo": "OWASP API5 Broken Function Level Authorization", "url": "https://owasp.org/API-Security/editions/2023/en/0xa5-broken-function-level-authorization/"},
                {"titulo": "Electron IPC Tutorial", "url": "https://www.electronjs.org/docs/latest/tutorial/ipc"},
                {"titulo": "Next.js Route Handlers", "url": "https://nextjs.org/docs/app/building-your-application/routing/route-handlers"},
            ],
        },
        {
            "id": "F002",
            "categoria": "SEGURANÇA",
            "severidade": "CRITICA",
            "titulo": "Dados pessoais reais versionados no projeto",
            "descricao": "O repositório contém CSVs com nomes e telefones reais de contatos, evidenciando exposição de PII em artefatos de desenvolvimento. Isso é incompatível com uso seguro de dados de teste e amplia o risco jurídico e operacional.",
            "localizacao": "docs/Clientes ativos.csv:1-20; docs/Clientes em potencial.csv:1-20",
            "impacto": "Vazamento de dados pessoais, descumprimento de LGPD, exposição indevida em backups, forks e histórico git.",
            "correcao": "Remova os arquivos e o histórico correspondente, substitua por dados sintéticos/anônimos, mova dados reais para armazenamento protegido fora do repositório e bloqueie reincidência com .gitignore e revisão de artefatos.",
            "recursos": [
                {"titulo": "LGPD Lei 13.709", "url": "https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2018/lei/L13709.htm"},
                {"titulo": "GitHub Remove Sensitive Data", "url": "https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository"},
                {"titulo": "NIST PII Definition", "url": "https://csrc.nist.gov/glossary/term/personally_identifiable_information"},
            ],
        },
        {
            "id": "F003",
            "categoria": "SEGURANÇA",
            "severidade": "ALTA",
            "titulo": "Dependência de runtime em conteúdo remoto mutável",
            "descricao": "O cliente do WhatsApp baixa em runtime uma versão HTML de cache a partir de raw.githubusercontent.com, fora do pacote e sem verificação de integridade. Isso transfere disponibilidade e integridade do app para um artefato remoto mutável.",
            "localizacao": "src/lib/whatsapp.ts:188-192",
            "impacto": "Quebra súbita de produção, comportamento imprevisível e aumento de superfície para comprometimento de cadeia de suprimentos.",
            "correcao": "Empacote a versão/cache localmente, fixe artefatos por hash/versão imutável e trate atualização dessa dependência no pipeline de build, não em runtime.",
            "recursos": [
                {"titulo": "OWASP Software and Data Integrity Failures", "url": "https://owasp.org/Top10/A08_2021-Software_and_Data_Integrity_Failures/"},
                {"titulo": "wwebjs Client Docs", "url": "https://docs.wwebjs.dev/Client.html"},
                {"titulo": "SLSA Requirements", "url": "https://slsa.dev/spec/v1.0/requirements"},
            ],
        },
        {
            "id": "F004",
            "categoria": "SEGURANÇA",
            "severidade": "ALTA",
            "titulo": "Dependência crítica puxada direto do GitHub sem versão imutável",
            "descricao": "A biblioteca principal de automação do WhatsApp é instalada por URL GitHub em vez de versão publicada e imutável. Isso reduz reprodutibilidade e dificulta auditoria e resposta a incidentes de supply chain.",
            "localizacao": "package.json:53",
            "impacto": "Builds diferentes podem produzir binários diferentes, aumentando risco de regressão, quebra de compatibilidade e introdução de código não revisado.",
            "correcao": "Troque para release versionada imutável ou pin por commit SHA explícito, mantenha revisão de dependências e use um único lockfile confiável no pipeline.",
            "recursos": [
                {"titulo": "npm GitHub URLs", "url": "https://docs.npmjs.com/cli/v10/configuring-npm/package-json#github-urls"},
                {"titulo": "GitHub Supply Chain Security", "url": "https://docs.github.com/en/code-security/supply-chain-security/understanding-your-software-supply-chain/about-supply-chain-security"},
                {"titulo": "OWASP Software and Data Integrity Failures", "url": "https://owasp.org/Top10/A08_2021-Software_and_Data_Integrity_Failures/"},
            ],
        },
        {
            "id": "F005",
            "categoria": "SEGURANÇA",
            "severidade": "ALTA",
            "titulo": "Entradas sem validação estrutural e sem limites de tamanho",
            "descricao": "As rotas aceitam JSON arbitrário para message, media, templates, snippets e settings sem schema robusto, sem limites de tamanho e sem normalização forte. Isso permite gravar blobs grandes/base64 e dados malformados diretamente no banco e no fluxo de envio.",
            "localizacao": "src/app/api/messages/route.ts:4-25; src/app/api/schedule/route.ts:124-191; src/app/api/templates/route.ts:23-95; src/app/api/settings/route.ts:15-29; src/app/api/snippets/route.ts:15-35",
            "impacto": "Pode causar estouro de memória, crescimento descontrolado do SQLite, erros operacionais e abuso de recursos por inputs inválidos ou excessivos.",
            "correcao": "Valide payloads no servidor com schema explícito, imponha limites para texto/base64/arquivo/quantidade de destinatários e rejeite telefones e objetos fora do formato esperado.",
            "recursos": [
                {"titulo": "OWASP API4 Unrestricted Resource Consumption", "url": "https://owasp.org/API-Security/editions/2023/en/0xa4-unrestricted-resource-consumption/"},
                {"titulo": "OWASP Input Validation Cheat Sheet", "url": "https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html"},
                {"titulo": "Next.js Route Handlers", "url": "https://nextjs.org/docs/app/building-your-application/routing/route-handlers"},
            ],
        },
        {
            "id": "F006",
            "categoria": "PERFORMANCE",
            "severidade": "MEDIA",
            "titulo": "Polling excessivo entre frontend, QR e fila",
            "descricao": "O app usa múltiplos ciclos de polling simultâneos para QR, status de campanha e agendamentos, enquanto o backend faz várias consultas por iteração da fila. O desenho funciona, mas gera churn evitável de CPU/SQLite e piora escalabilidade local.",
            "localizacao": "src/components/qr-display.tsx:16-40; src/hooks/use-send-polling.ts:42-178; src/hooks/use-scheduler.ts:125-131; src/lib/scheduler.ts:82-154; src/lib/QueueService.ts:17-109",
            "impacto": "Maior consumo de CPU/bateria, latência desnecessária e degradação progressiva conforme volume de campanhas e logs cresce.",
            "correcao": "Consolide estado em menos endpoints, adote SSE/WebSocket para eventos de fila/QR e reduza consultas repetidas com agregação e backoff adaptativo no cliente.",
            "recursos": [
                {"titulo": "MDN Server-Sent Events", "url": "https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events"},
                {"titulo": "Next.js Route Handlers", "url": "https://nextjs.org/docs/app/building-your-application/routing/route-handlers"},
                {"titulo": "MDN setInterval", "url": "https://developer.mozilla.org/en-US/docs/Web/API/Window/setInterval"},
            ],
        },
        {
            "id": "F007",
            "categoria": "MANUTENIBILIDADE",
            "severidade": "MEDIA",
            "titulo": "Documentação e toolchain estão divergentes do código real",
            "descricao": "O README cita scripts .bat que não existem no projeto atual, enquanto a raiz mantém lockfiles de npm e pnpm ao mesmo tempo. Isso aumenta atrito operacional e reduz reprodutibilidade do ambiente.",
            "localizacao": "README.md:34-38; package.json:9-17; package-lock.json; pnpm-lock.yaml",
            "impacto": "Onboarding quebrado, builds inconsistentes e mais tempo gasto depurando ambiente em vez de produto.",
            "correcao": "Escolha um único gerenciador de pacotes, remova o lockfile excedente e alinhe o README aos scripts reais suportados pelo projeto.",
            "recursos": [
                {"titulo": "npm package-lock", "url": "https://docs.npmjs.com/cli/v10/configuring-npm/package-lock-json"},
                {"titulo": "pnpm lockfile", "url": "https://pnpm.io/lockfile"},
                {"titulo": "Git Ignore Files", "url": "https://docs.github.com/en/get-started/getting-started-with-git/ignoring-files"},
            ],
        },
    ],
    "pontos_positivos": [
        "A janela Electron foi criada com contextIsolation=true, nodeIntegration=false e sandbox=true em electron/main.cjs:204-208, o que é uma base sólida de hardening.",
        "O runtime desktop separa banco e auth para app.getPath('userData') em electron/main.cjs:163-185 e src/lib/runtime-paths.ts:32-64, evitando gravar estado operacional dentro da pasta de instalação.",
        "O scheduler usa claim otimista com updateMany antes do processamento em src/lib/scheduler.ts:7-38, reduzindo risco de dupla execução da mesma mensagem.",
    ],
    "prioridade_imediata": ["F001", "F002", "F003"],
}


class ScoreBar(Flowable):
    def __init__(self, score: int, width: float = 14 * cm, height: float = 0.6 * cm):
        super().__init__()
        self.score = max(0, min(100, score))
        self.width = width
        self.height = height

    def wrap(self, availWidth, availHeight):
        return self.width, self.height + 4

    def draw(self):
        canvas = self.canv
        canvas.saveState()
        canvas.setFillColor(colors.HexColor("#E5E7EB"))
        canvas.roundRect(0, 0, self.width, self.height, 4, fill=1, stroke=0)

        if self.score >= 80:
            fill = colors.HexColor("#2E7D32")
        elif self.score >= 60:
            fill = colors.HexColor("#558B2F")
        elif self.score >= 40:
            fill = colors.HexColor("#F9A825")
        else:
            fill = colors.HexColor("#C62828")

        canvas.setFillColor(fill)
        canvas.roundRect(0, 0, self.width * (self.score / 100), self.height, 4, fill=1, stroke=0)
        canvas.restoreState()


class SeverityHeader(Flowable):
    def __init__(self, label: str, title: str, width: float = 17 * cm, height: float = 0.9 * cm):
        super().__init__()
        self.label = label
        self.title = title
        self.width = width
        self.height = height

    def wrap(self, availWidth, availHeight):
        self.width = min(self.width, availWidth)
        return self.width, self.height

    def draw(self):
        canvas = self.canv
        color = SEVERITY_COLORS.get(self.label, colors.grey)
        canvas.saveState()
        canvas.setFillColor(color)
        canvas.roundRect(0, 0, self.width, self.height, 4, fill=1, stroke=0)
        canvas.setFillColor(colors.white)
        canvas.setFont("Helvetica-Bold", 11)
        canvas.drawString(10, self.height / 2 - 4, f"{self.label} — {self.title}")
        canvas.restoreState()


def build_styles():
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(
        name="TitleCover",
        parent=styles["Title"],
        fontName="Helvetica-Bold",
        fontSize=24,
        leading=28,
        alignment=TA_CENTER,
        textColor=colors.HexColor("#111827"),
        spaceAfter=12,
    ))
    styles.add(ParagraphStyle(
        name="SubtitleCover",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=11,
        leading=15,
        alignment=TA_CENTER,
        textColor=colors.HexColor("#4B5563"),
        spaceAfter=8,
    ))
    styles.add(ParagraphStyle(
        name="SectionHeading",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=16,
        leading=20,
        textColor=colors.HexColor("#111827"),
        spaceBefore=6,
        spaceAfter=8,
    ))
    styles.add(ParagraphStyle(
        name="SubHeading",
        parent=styles["Heading3"],
        fontName="Helvetica-Bold",
        fontSize=12,
        leading=15,
        textColor=colors.HexColor("#1F2937"),
        spaceBefore=6,
        spaceAfter=4,
    ))
    styles.add(ParagraphStyle(
        name="Body",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#111827"),
        alignment=TA_LEFT,
        spaceAfter=6,
    ))
    styles.add(ParagraphStyle(
        name="Small",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=9,
        leading=12,
        textColor=colors.HexColor("#4B5563"),
        spaceAfter=4,
    ))
    styles.add(ParagraphStyle(
        name="BulletItem",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=10,
        leading=14,
        leftIndent=12,
        bulletIndent=0,
        spaceAfter=3,
    ))
    styles.add(ParagraphStyle(
        name="ResourceLink",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=9,
        leading=12,
        leftIndent=12,
        textColor=colors.HexColor("#1D4ED8"),
        spaceAfter=2,
    ))
    styles.add(ParagraphStyle(
        name="CodeBlock",
        fontName="Helvetica",
        fontSize=8.2,
        leading=10,
        textColor=colors.HexColor("#111827"),
        leftIndent=8,
        rightIndent=8,
        borderPadding=8,
        backColor=colors.HexColor("#F3F4F6"),
        borderColor=colors.HexColor("#D1D5DB"),
        borderWidth=0.5,
        borderRadius=3,
        spaceBefore=4,
        spaceAfter=8,
    ))
    return styles


def escape(text: str) -> str:
    return html.escape(text, quote=False)


def normalize_path(rel_path: str) -> Path:
    return PROJECT_ROOT / Path(rel_path.replace("/", "\\"))


def parse_first_location(location: str) -> Tuple[Optional[Path], Optional[int], Optional[int]]:
    first = location.split(";")[0].strip()
    match = re.match(r"(?P<path>[^:]+):(\d+)(?:-(\d+))?$", first)
    if not match:
        return None, None, None
    rel_path = match.group("path")
    start = int(match.group(2))
    end = int(match.group(3)) if match.group(3) else start
    return normalize_path(rel_path), start, end


def extract_code_snippet(location: str, context: int = 3, max_lines: int = 18) -> Optional[str]:
    file_path, start, end = parse_first_location(location)
    if not file_path or start is None or not file_path.exists() or not file_path.is_file():
        return None

    try:
        lines = file_path.read_text(encoding="utf-8").splitlines()
    except UnicodeDecodeError:
        lines = file_path.read_text(encoding="utf-8", errors="replace").splitlines()

    start_idx = max(0, start - 1 - context)
    end_idx = min(len(lines), (end or start) + context)
    chunk = []
    for idx in range(start_idx, min(end_idx, start_idx + max_lines)):
        chunk.append(f"{idx + 1:>4}  {lines[idx]}")
    return "\n".join(chunk).strip() or None


def sort_failures(failures: List[dict]) -> List[dict]:
    return sorted(failures, key=lambda item: (SEVERITY_ORDER.get(item["severidade"], 99), item["id"]))


def build_cover_summary_table(styles, summary: dict):
    data = [
        ["Métrica", "Valor"],
        ["Score geral", str(summary["score_geral"])],
        ["Total de falhas", str(summary["total_falhas"])],
        ["Críticas", str(summary["criticas"])],
        ["Altas", str(summary["altas"])],
        ["Médias", str(summary["medias"])],
    ]
    table = Table(data, colWidths=[6 * cm, 3 * cm], hAlign="CENTER")
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#111827")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#D1D5DB")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F9FAFB")]),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    return table


def build_index_table(styles, failures: List[dict]):
    rows = [["ID", "Severidade", "Categoria", "Localização", "Título"]]
    for failure in failures:
        rows.append([
            failure["id"],
            failure["severidade"],
            failure["categoria"],
            failure["localizacao"],
            failure["titulo"],
        ])

    table = Table(rows, colWidths=[1.5 * cm, 2.3 * cm, 2.8 * cm, 6.1 * cm, 5.3 * cm], repeatRows=1)
    style = [
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#111827")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 8.5),
        ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
        ("GRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#D1D5DB")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F9FAFB")]),
    ]
    for row_index, failure in enumerate(failures, start=1):
        style.append(("TEXTCOLOR", (1, row_index), (1, row_index), SEVERITY_COLORS[failure["severidade"]]))
        style.append(("FONTNAME", (1, row_index), (1, row_index), "Helvetica-Bold"))
    table.setStyle(TableStyle(style))
    return table


def add_page_number(canvas, doc):
    canvas.saveState()
    canvas.setFont("Helvetica", 9)
    canvas.setFillColor(colors.HexColor("#6B7280"))
    page_num = canvas.getPageNumber()
    canvas.drawRightString(A4[0] - 2 * cm, 1.2 * cm, f"Página {page_num}")
    canvas.restoreState()


def build_story() -> List:
    styles = build_styles()
    summary = AUDIT_DATA["resumo"]
    failures = sort_failures(AUDIT_DATA["falhas"])
    generated_at = datetime.now()

    story: List = []

    story.append(Spacer(1, 2.5 * cm))
    story.append(Paragraph("Relatório de Auditoria de Código", styles["TitleCover"]))
    story.append(Paragraph(generated_at.strftime("Data: %d/%m/%Y %H:%M"), styles["SubtitleCover"]))
    story.append(Spacer(1, 0.8 * cm))
    story.append(Paragraph(f"<b>Score geral:</b> {summary['score_geral']}/100", styles["SectionHeading"]))
    story.append(ScoreBar(summary["score_geral"]))
    story.append(Spacer(1, 0.5 * cm))
    story.append(build_cover_summary_table(styles, summary))
    story.append(Spacer(1, 0.8 * cm))
    story.append(Paragraph("<b>Sumário executivo</b>", styles["SubHeading"]))
    story.append(Paragraph(
        f"Foram identificadas <b>{summary['total_falhas']}</b> falhas no total, sendo "
        f"<b>{summary['criticas']}</b> críticas, <b>{summary['altas']}</b> altas e <b>{summary['medias']}</b> médias. "
        f"O score final reflete exposição relevante em segurança, além de problemas de performance e manutenibilidade.",
        styles["Body"],
    ))
    story.append(PageBreak())

    story.append(Paragraph("Índice de Falhas", styles["SectionHeading"]))
    story.append(Paragraph("Ordenação aplicada: CRITICA → ALTA → MEDIA → BAIXA.", styles["Small"]))
    story.append(build_index_table(styles, failures))
    story.append(PageBreak())

    story.append(Paragraph("Detalhamento das Falhas", styles["SectionHeading"]))
    story.append(Spacer(1, 0.15 * cm))

    for idx, failure in enumerate(failures):
        story.append(SeverityHeader(failure["severidade"], f"{failure['id']} — {failure['titulo']}"))
        story.append(Spacer(1, 0.15 * cm))
        story.append(Paragraph(f"<b>Categoria:</b> {escape(failure['categoria'])}", styles["Body"]))
        story.append(Paragraph(f"<b>Descrição:</b> {escape(failure['descricao'])}", styles["Body"]))
        story.append(Paragraph(f"<b>Localização:</b> {escape(failure['localizacao'])}", styles["Body"]))

        snippet = extract_code_snippet(failure["localizacao"])
        if snippet:
            story.append(Paragraph("<b>Trecho problemático</b>", styles["SubHeading"]))
            story.append(Preformatted(snippet, styles["CodeBlock"]))

        story.append(Paragraph(f"<b>Impacto:</b> {escape(failure['impacto'])}", styles["Body"]))
        story.append(Paragraph(f"<b>Como corrigir:</b> {escape(failure['correcao'])}", styles["Body"]))
        story.append(Paragraph("<b>Recursos de estudo</b>", styles["SubHeading"]))
        for resource in failure["recursos"]:
            title = escape(resource["titulo"])
            url = escape(resource["url"])
            story.append(Paragraph(f'• <link href="{url}">{title}</link>', styles["ResourceLink"]))

        if idx != len(failures) - 1:
            story.append(Spacer(1, 0.35 * cm))

    story.append(PageBreak())
    story.append(Paragraph("Pontos Positivos", styles["SectionHeading"]))
    for item in AUDIT_DATA["pontos_positivos"]:
        story.append(Paragraph(f"• {escape(item)}", styles["BulletItem"]))

    story.append(Spacer(1, 0.3 * cm))
    story.append(Paragraph("Roadmap de Correção", styles["SectionHeading"]))
    story.append(Paragraph("As falhas abaixo devem receber tratamento imediato, com foco em redução de risco e contenção de impacto:", styles["Body"]))
    for failure_id in AUDIT_DATA["prioridade_imediata"]:
        matching = next((item for item in failures if item["id"] == failure_id), None)
        if matching:
            color = SEVERITY_COLORS.get(matching["severidade"], colors.black)
            story.append(Paragraph(
                f'• <font color="{color.hexval()}"><b>{matching["id"]}</b></font> — {escape(matching["titulo"])}',
                styles["BulletItem"],
            ))

    return story


def generate_pdf() -> Path:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_path = OUTPUT_DIR / f"audit_report_{timestamp}.pdf"

    doc = SimpleDocTemplate(
        str(output_path),
        pagesize=A4,
        leftMargin=2 * cm,
        rightMargin=2 * cm,
        topMargin=2 * cm,
        bottomMargin=2 * cm,
        title="Relatório de Auditoria de Código",
        author="OpenClaude",
    )
    doc.build(build_story(), onFirstPage=add_page_number, onLaterPages=add_page_number)
    return output_path


if __name__ == "__main__":
    pdf_path = generate_pdf()
    print(pdf_path)
