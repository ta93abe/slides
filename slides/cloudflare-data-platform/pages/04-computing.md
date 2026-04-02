---
layout: section
---

# コンピューティング

---

# 3層のコンピュートモデル

| | Workers | Sandbox | Containers |
|---|---|---|---|
| **実行時間** | CPU 最大 30秒 | 制限なし | 制限なし |
| **メモリ** | 128 MB | Containers準拠 | 最大 12 GiB |
| **言語** | JS/TS/WASM | Python/Node/Shell | Docker なら何でも |
| **コールドスタート** | 0ms | 秒単位 | 秒単位 |
| **実行場所** | エッジ（330+都市） | リージョナル | リージョナル |

<v-click>

```
Workers（軽量・接着剤）→ 重い処理 → Sandbox（Docker不要）→ さらに低レベル → Containers（任意のDocker）
```

</v-click>

<v-click>

**設計原則**: 全部 Containers にするのではなく「Workers が重い処理を委譲する」

</v-click>

---

# Workers の Binding — ゼロレイテンシ接続

```ts
// Lambda: SDK + IAM + HTTP
const s3 = new S3Client({ region: "us-east-1" });
await s3.send(new PutObjectCommand({
  Bucket: "my-bucket", Key: "file.json", Body: data
}));

// Workers: Binding で直接アクセス
await env.BUCKET.put("file.json", data);
```

<v-click>

**AWS Lambda**: Policy-based（IAM ポリシーで誰が何をできるか定義）

**Workers**: Capability-based（Binding を持つ Worker だけがアクセス可能）

</v-click>

<v-click>

SDK 不要・認証不要・ネットワークホップなし

</v-click>
