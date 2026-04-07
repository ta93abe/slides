---
layout: section
---

# Data Platform の全体像

---

# Cloudflare Data Platform とは

2025年9月発表。**Pipelines + R2 Data Catalog + R2 SQL** の3コンポーネント。

<div class="grid grid-cols-3 gap-4 mt-6">

<div v-click class="border border-orange-500/30 rounded-lg p-4">

### Pipelines
ストリーミングインジェスト

HTTP / Binding → Iceberg 自動書き込み

</div>

<div v-click class="border border-orange-500/30 rounded-lg p-4">

### R2 Data Catalog
Iceberg カタログ

REST Catalog API でどのエンジンからも接続

</div>

<div v-click class="border border-orange-500/30 rounded-lg p-4">

### R2 SQL
分散クエリエンジン

DataFusion ベース、エッジで分析完結

</div>

</div>

<div v-click class="mt-6 text-center font-bold text-lg" style="color: var(--enbu-gold)">

エグレス料金ゼロ + Apache Iceberg 標準 = ベンダーロックインなし

</div>

---

# アーキテクチャ概観

```mermaid {scale: 0.75}
flowchart LR
    subgraph Ingest["インジェスト"]
        W[Workers<br/>Webhook/Cron]
        P[Pipelines<br/>ストリーミング]
        Q[Queues<br/>バッファ]
        DLT[dlt on Sandbox<br/>SaaS EL]
    end

    subgraph Storage["ストレージ"]
        R2[R2<br/>エグレス無料]
        IC[Data Catalog<br/>Iceberg]
        D1[D1<br/>SQLite]
    end

    subgraph Compute["コンピュート & 変換"]
        RS[R2 SQL<br/>分散クエリ]
        SB[Sandbox<br/>Python/dbt]
        CT[Containers<br/>Docker]
    end

    subgraph Activate["アクティベーション"]
        EV[Evidence<br/>BI as Code]
        MR[marimo<br/>ノートブック]
        RE[Reverse ETL<br/>SaaS書き戻し]
    end

    W --> P
    W --> R2
    P --> IC
    DLT --> IC
    Q --> W
    IC --> R2
    R2 --> RS
    RS --> D1
    SB --> IC
    CT --> IC
    D1 --> EV
    RS --> MR
    D1 --> RE
```
