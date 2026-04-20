---
layout: section
---

# もう一つ重要なサービス

---

# Cloudflare Workers

エッジコンピューティングプラットフォーム。Cloudflare の全世界 250+ ロケーションでコードを実行可能。

## Binding

日本語

---

## Static Assets

HTML, CSS, JavaScript 画像などの静的アセットを Cloudflare Workers を使って配信することができます。(dbt docs とか持っていませんか？)

```yml {scale: 0.5}
      - name: Generate dbt docs
        run: dbt docs generate
      - name: Deploy to Cloudflare Workers
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: deploy
```

さらに Cloudflare Access を使えば認証を挟むこともできます。(50人まで無料！)

<img v-click
    v-motion
    :initial="{ opacity: 0, y: 80 }"
    :click-1="{ opacity: 1, y: 0 }"
     src="/cloudflare-access.png" alt="Cloudflare Access" class="my-8 w-80 ml-auto" />