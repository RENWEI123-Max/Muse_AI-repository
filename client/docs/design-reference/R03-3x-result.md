# R03 素材 3x 重导结果

分支：`codex/r03-3x`。基线：`cc31826190701be85e38680f43fd48ec284b7fb5`。

资源与 manifest 提交：`243c771dd36dcd5e3b4cdf2ac4c4b4c3a04e1a02`。本报告在后续文档提交中记录该已验证提交；报告提交 hash 可用 `git log -1 --format=%H -- client/docs/design-reference/R03-3x-result.md` 获取。

## 验收表

| 项目 | 真实结果 |
|---|---|
| 目标 | 229 张 |
| 成功 | 229 张 |
| 缺失 | 0 张 |
| 尺寸不符 | 0 张 |
| verify-assets | PASS |
| npm run build | PASS |
| Playwright | 按任务要求未运行 |

仅将实测 PNG 尺寸等于原 1x 尺寸 ×3 的图片原路径替换，并更新 manifest 的 w/h/sha256/scale。其余 114 条保持不变。未做 upscale。已检查 shell history，无含 token 的条目需清理。

## Figma images 调用

本轮共 5 次 images 调用（上限 5）；批间暂停 15 秒。未调用其他 Figma API。

| 批次 | 节点数 | images 调用数 | HTTP/状态 |
|---|---|---|---|
| 1 | 46 | 1 | 200 |
| 2 | 46 | 1 | 200 |
| 3 | 46 | 1 | 200 |
| 4 | 46 | 1 | 200 |
| 5 | 45 | 1 | 200 |

## 缺失 / 尺寸不符

无。

## 229 张逐项验收

| 文件 | Figma 节点 | 期望 3x | 实测 PNG | 结果 |
|---|---|---|---|---|
| `png-1x/01-brand-scenes/auth-background.png` | `66:1973` | 2556×5535 | 2556×5535 | 成功 |
| `png-1x/01-brand-scenes/diamond.png` | `66:1978` | 720×606 | 720×606 | 成功 |
| `png-1x/01-brand-scenes/envelope.png` | `66:1993` | 294×213 | 294×213 | 成功 |
| `png-1x/01-brand-scenes/envelope-avatar.png` | `66:1988` | 3762×3762 | 3762×3762 | 成功 |
| `png-1x/01-brand-scenes/envelope-avatar-pink.png` | `66:1983` | 3762×3762 | 3762×3762 | 成功 |
| `png-1x/01-brand-scenes/glow.png` | `66:1999` | 1920×1920 | 1920×1920 | 成功 |
| `png-1x/01-brand-scenes/hat.png` | `66:2004` | 1800×1440 | 1800×1440 | 成功 |
| `png-1x/01-brand-scenes/maugo-wordmark.png` | `66:2009` | 2160×564 | 2160×564 | 成功 |
| `png-1x/01-brand-scenes/mist.png` | `66:2014` | 1920×1920 | 1920×1920 | 成功 |
| `png-1x/02-bird-static/female-1.png` | `66:2022` | 720×720 | 720×720 | 成功 |
| `png-1x/02-bird-static/female-2.png` | `66:2027` | 720×720 | 720×720 | 成功 |
| `png-1x/02-bird-static/female-3.png` | `66:2032` | 720×720 | 720×720 | 成功 |
| `png-1x/02-bird-static/female-4.png` | `66:2037` | 720×720 | 720×720 | 成功 |
| `png-1x/02-bird-static/female-5.png` | `66:2042` | 720×720 | 720×720 | 成功 |
| `png-1x/02-bird-static/female-6.png` | `66:2047` | 720×720 | 720×720 | 成功 |
| `png-1x/02-bird-static/female-7.png` | `66:2052` | 720×720 | 720×720 | 成功 |
| `png-1x/02-bird-static/female-8.png` | `66:2057` | 720×720 | 720×720 | 成功 |
| `png-1x/02-bird-static/female-9.png` | `66:2062` | 720×720 | 720×720 | 成功 |
| `png-1x/02-bird-static/male-1.png` | `66:2067` | 720×720 | 720×720 | 成功 |
| `png-1x/02-bird-static/male-2.png` | `66:2072` | 720×720 | 720×720 | 成功 |
| `png-1x/02-bird-static/male-3.png` | `66:2077` | 720×720 | 720×720 | 成功 |
| `png-1x/02-bird-static/male-4.png` | `66:2082` | 720×720 | 720×720 | 成功 |
| `png-1x/02-bird-static/male-5.png` | `66:2087` | 720×720 | 720×720 | 成功 |
| `png-1x/02-bird-static/male-6.png` | `66:2092` | 720×720 | 720×720 | 成功 |
| `png-1x/02-bird-static/male-7.png` | `66:2097` | 720×720 | 720×720 | 成功 |
| `png-1x/02-bird-static/male-8.png` | `66:2102` | 720×720 | 720×720 | 成功 |
| `png-1x/02-bird-static/male-9.png` | `66:2107` | 720×720 | 720×720 | 成功 |
| `png-1x/03-bird-flight-sheets/female-1-fly.png` | `66:2115` | 4320×720 | 4320×720 | 成功 |
| `png-1x/03-bird-flight-sheets/female-2-fly.png` | `66:2120` | 4320×720 | 4320×720 | 成功 |
| `png-1x/03-bird-flight-sheets/female-3-fly.png` | `66:2125` | 4320×720 | 4320×720 | 成功 |
| `png-1x/03-bird-flight-sheets/female-4-fly.png` | `66:2130` | 4320×720 | 4320×720 | 成功 |
| `png-1x/03-bird-flight-sheets/female-5-fly.png` | `66:2135` | 4320×720 | 4320×720 | 成功 |
| `png-1x/03-bird-flight-sheets/female-6-fly.png` | `66:2141` | 4320×720 | 4320×720 | 成功 |
| `png-1x/03-bird-flight-sheets/female-7-fly.png` | `66:2146` | 4320×720 | 4320×720 | 成功 |
| `png-1x/03-bird-flight-sheets/female-8-fly.png` | `66:2151` | 4320×720 | 4320×720 | 成功 |
| `png-1x/03-bird-flight-sheets/female-9-fly.png` | `66:2156` | 4320×720 | 4320×720 | 成功 |
| `png-1x/03-bird-flight-sheets/male-1-fly.png` | `66:2161` | 4320×720 | 4320×720 | 成功 |
| `png-1x/03-bird-flight-sheets/male-2-fly.png` | `66:2167` | 4320×720 | 4320×720 | 成功 |
| `png-1x/03-bird-flight-sheets/male-3-fly.png` | `66:2172` | 4320×720 | 4320×720 | 成功 |
| `png-1x/03-bird-flight-sheets/male-4-fly.png` | `66:2177` | 4320×720 | 4320×720 | 成功 |
| `png-1x/03-bird-flight-sheets/male-5-fly.png` | `66:2182` | 4320×720 | 4320×720 | 成功 |
| `png-1x/03-bird-flight-sheets/male-6-fly.png` | `66:2187` | 4320×720 | 4320×720 | 成功 |
| `png-1x/03-bird-flight-sheets/male-7-fly.png` | `66:2193` | 4320×720 | 4320×720 | 成功 |
| `png-1x/03-bird-flight-sheets/male-8-fly.png` | `66:2198` | 4320×720 | 4320×720 | 成功 |
| `png-1x/03-bird-flight-sheets/male-9-fly.png` | `66:2203` | 4320×720 | 4320×720 | 成功 |
| `png-1x/04-chat-backgrounds/aurora-sky.png` | `66:2211` | 2250×4500 | 2250×4500 | 成功 |
| `png-1x/04-chat-backgrounds/blue-cosmos.png` | `66:2216` | 2838×6144 | 2838×6144 | 成功 |
| `png-1x/04-chat-backgrounds/glowing-deer.png` | `66:2221` | 2838×6144 | 2838×6144 | 成功 |
| `png-1x/04-chat-backgrounds/little-soot.png` | `66:2226` | 2835×6144 | 2835×6144 | 成功 |
| `png-1x/04-chat-backgrounds/moon-road.png` | `66:2231` | 2835×6144 | 2835×6144 | 成功 |
| `png-1x/04-chat-backgrounds/night-glass.png` | `66:2236` | 2838×6144 | 2838×6144 | 成功 |
| `png-1x/04-chat-backgrounds/silver-feather.png` | `66:2241` | 2838×6144 | 2838×6144 | 成功 |
| `png-1x/04-chat-backgrounds/sunset-peak.png` | `66:2247` | 3000×5346 | 3000×5346 | 成功 |
| `png-1x/05-avatars/avatar-placeholder.png` | `72:1956` | 288×288 | 288×288 | 成功 |
| `png-1x/05-avatars/mock-avatar-09.png` | `69:1957` | 960×960 | 960×960 | 成功 |
| `png-1x/05-avatars/mock-avatar-10.png` | `69:1962` | 960×960 | 960×960 | 成功 |
| `png-1x/05-avatars/mock-avatar-11.png` | `69:1967` | 960×960 | 960×960 | 成功 |
| `png-1x/05-avatars/mock-avatar-12.png` | `69:1972` | 960×960 | 960×960 | 成功 |
| `png-1x/05-avatars/mock-avatar-13.png` | `69:1977` | 960×960 | 960×960 | 成功 |
| `png-1x/05-avatars/mock-avatar-14.png` | `69:1982` | 960×960 | 960×960 | 成功 |
| `png-1x/05-avatars/mock-avatar-15.png` | `69:1987` | 960×960 | 960×960 | 成功 |
| `png-1x/05-avatars/mock-avatar-16.png` | `69:1992` | 960×960 | 960×960 | 成功 |
| `png-1x/05-avatars/portrait-1.png` | `66:2255` | 960×960 | 960×960 | 成功 |
| `png-1x/05-avatars/portrait-2.png` | `66:2260` | 960×960 | 960×960 | 成功 |
| `png-1x/05-avatars/portrait-3.png` | `66:2265` | 960×960 | 960×960 | 成功 |
| `png-1x/05-avatars/portrait-4.png` | `66:2270` | 960×960 | 960×960 | 成功 |
| `png-1x/05-avatars/portrait-5.png` | `66:2275` | 960×960 | 960×960 | 成功 |
| `png-1x/05-avatars/portrait-6.png` | `66:2280` | 960×960 | 960×960 | 成功 |
| `png-1x/05-avatars/portrait-7.png` | `66:2285` | 960×960 | 960×960 | 成功 |
| `png-1x/05-avatars/portrait-8.png` | `66:2290` | 960×960 | 960×960 | 成功 |
| `png-1x/06-stickers/sticker-5-158.png` | `66:2298` | 1536×1539 | 1536×1539 | 成功 |
| `png-1x/06-stickers/sticker-5-173.png` | `66:2303` | 1536×1539 | 1536×1539 | 成功 |
| `png-1x/06-stickers/sticker-5-200.png` | `66:2308` | 1536×1563 | 1536×1563 | 成功 |
| `png-1x/06-stickers/sticker-5-229.png` | `66:2313` | 1536×1536 | 1536×1536 | 成功 |
| `png-1x/06-stickers/sticker-5-252.png` | `66:2318` | 1536×1536 | 1536×1536 | 成功 |
| `png-1x/06-stickers/sticker-5-268.png` | `66:2323` | 1536×1536 | 1536×1536 | 成功 |
| `png-1x/06-stickers/sticker-5-292.png` | `66:2328` | 1539×1539 | 1539×1539 | 成功 |
| `png-1x/06-stickers/sticker-5-316.png` | `66:2333` | 1536×1539 | 1536×1539 | 成功 |
| `png-1x/06-stickers/sticker-5-329.png` | `66:2338` | 1536×1539 | 1536×1539 | 成功 |
| `png-1x/06-stickers/sticker-5-33.png` | `66:2343` | 1536×1536 | 1536×1536 | 成功 |
| `png-1x/06-stickers/sticker-5-373.png` | `66:2348` | 1536×1536 | 1536×1536 | 成功 |
| `png-1x/06-stickers/sticker-5-409.png` | `66:2353` | 1542×1539 | 1542×1539 | 成功 |
| `png-1x/06-stickers/sticker-5-429.png` | `66:2359` | 1536×1557 | 1536×1557 | 成功 |
| `png-1x/06-stickers/sticker-5-447.png` | `66:2364` | 1542×1539 | 1542×1539 | 成功 |
| `png-1x/06-stickers/sticker-5-474.png` | `66:2369` | 1551×1539 | 1551×1539 | 成功 |
| `png-1x/06-stickers/sticker-5-499.png` | `66:2374` | 1536×1539 | 1536×1539 | 成功 |
| `png-1x/06-stickers/sticker-5-514.png` | `66:2379` | 1536×1539 | 1536×1539 | 成功 |
| `png-1x/06-stickers/sticker-5-537.png` | `66:2384` | 1536×1539 | 1536×1539 | 成功 |
| `png-1x/06-stickers/sticker-5-555.png` | `66:2389` | 1536×1536 | 1536×1536 | 成功 |
| `png-1x/06-stickers/sticker-5-56.png` | `66:2394` | 1536×1536 | 1536×1536 | 成功 |
| `png-1x/06-stickers/sticker-5-562.png` | `66:2399` | 1536×1536 | 1536×1536 | 成功 |
| `png-1x/06-stickers/sticker-5-584.png` | `66:2404` | 1569×1536 | 1569×1536 | 成功 |
| `png-1x/06-stickers/sticker-5-592.png` | `66:2409` | 1536×1536 | 1536×1536 | 成功 |
| `png-1x/06-stickers/sticker-5-606.png` | `66:2414` | 1536×1536 | 1536×1536 | 成功 |
| `png-1x/06-stickers/sticker-5-615.png` | `66:2420` | 1536×1536 | 1536×1536 | 成功 |
| `png-1x/06-stickers/sticker-5-626.png` | `66:2425` | 1536×1536 | 1536×1536 | 成功 |
| `png-1x/06-stickers/sticker-5-634.png` | `66:2430` | 1536×1539 | 1536×1539 | 成功 |
| `png-1x/06-stickers/sticker-5-649.png` | `66:2435` | 1536×1536 | 1536×1536 | 成功 |
| `png-1x/06-stickers/sticker-5-670.png` | `66:2440` | 1536×1536 | 1536×1536 | 成功 |
| `png-1x/06-stickers/sticker-5-691.png` | `66:2445` | 1536×1536 | 1536×1536 | 成功 |
| `png-1x/06-stickers/sticker-5-711.png` | `66:2450` | 1536×1539 | 1536×1539 | 成功 |
| `png-1x/06-stickers/sticker-5-727.png` | `66:2455` | 1536×1539 | 1536×1539 | 成功 |
| `png-1x/06-stickers/sticker-5-742.png` | `66:2460` | 1536×1539 | 1536×1539 | 成功 |
| `png-1x/06-stickers/sticker-5-756.png` | `66:2465` | 1536×1539 | 1536×1539 | 成功 |
| `png-1x/06-stickers/sticker-5-771.png` | `66:2470` | 1536×1539 | 1536×1539 | 成功 |
| `png-1x/06-stickers/sticker-5-784.png` | `66:2475` | 1536×1539 | 1536×1539 | 成功 |
| `png-1x/06-stickers/sticker-5-797.png` | `66:2481` | 1536×1539 | 1536×1539 | 成功 |
| `png-1x/06-stickers/sticker-5-80.png` | `66:2486` | 1536×1539 | 1536×1539 | 成功 |
| `png-1x/06-stickers/sticker-5-815.png` | `66:2491` | 1542×1539 | 1542×1539 | 成功 |
| `png-1x/06-stickers/sticker-5-838.png` | `66:2496` | 1536×1539 | 1536×1539 | 成功 |
| `png-1x/06-stickers/sticker-5-856.png` | `66:2501` | 1536×1539 | 1536×1539 | 成功 |
| `png-1x/06-stickers/sticker-5-869.png` | `66:2506` | 1536×1539 | 1536×1539 | 成功 |
| `png-1x/06-stickers/sticker-5-884.png` | `66:2511` | 1536×1539 | 1536×1539 | 成功 |
| `png-1x/06-stickers/sticker-5-9.png` | `66:2516` | 1536×1539 | 1536×1539 | 成功 |
| `png-1x/06-stickers/sticker-5-903.png` | `66:2521` | 1536×1536 | 1536×1536 | 成功 |
| `png-1x/06-stickers/sticker-5-922.png` | `66:2526` | 1536×1539 | 1536×1539 | 成功 |
| `png-1x/06-stickers/sticker-5-939.png` | `66:2531` | 1536×1536 | 1536×1536 | 成功 |
| `png-1x/06-stickers/sticker-5-957.png` | `66:2536` | 1536×1539 | 1536×1539 | 成功 |
| `png-1x/06-stickers/sticker-5-969.png` | `66:2542` | 1536×1536 | 1536×1536 | 成功 |
| `png-1x/06-stickers/sticker-5-99.png` | `66:2547` | 1536×1536 | 1536×1536 | 成功 |
| `png-1x/07-bird-flight-frames/female-1-fly-01.png` | `66:2555` | 720×720 | 720×720 | 成功 |
| `png-1x/07-bird-flight-frames/female-1-fly-02.png` | `66:2560` | 720×720 | 720×720 | 成功 |
| `png-1x/07-bird-flight-frames/female-1-fly-03.png` | `66:2565` | 720×720 | 720×720 | 成功 |
| `png-1x/07-bird-flight-frames/female-1-fly-04.png` | `66:2570` | 720×720 | 720×720 | 成功 |
| `png-1x/07-bird-flight-frames/female-1-fly-05.png` | `66:2575` | 720×720 | 720×720 | 成功 |
| `png-1x/07-bird-flight-frames/female-1-fly-06.png` | `66:2580` | 720×720 | 720×720 | 成功 |
| `png-1x/07-bird-flight-frames/female-2-fly-01.png` | `66:2585` | 720×720 | 720×720 | 成功 |
| `png-1x/07-bird-flight-frames/female-2-fly-02.png` | `66:2590` | 720×720 | 720×720 | 成功 |
| `png-1x/07-bird-flight-frames/female-2-fly-03.png` | `66:2595` | 720×720 | 720×720 | 成功 |
| `png-1x/07-bird-flight-frames/female-2-fly-04.png` | `66:2600` | 720×720 | 720×720 | 成功 |
| `png-1x/07-bird-flight-frames/female-2-fly-05.png` | `66:2605` | 720×720 | 720×720 | 成功 |
| `png-1x/07-bird-flight-frames/female-2-fly-06.png` | `66:2610` | 720×720 | 720×720 | 成功 |
| `png-1x/07-bird-flight-frames/female-3-fly-01.png` | `66:2615` | 720×720 | 720×720 | 成功 |
| `png-1x/07-bird-flight-frames/female-3-fly-02.png` | `66:2620` | 720×720 | 720×720 | 成功 |
| `png-1x/07-bird-flight-frames/female-3-fly-03.png` | `66:2625` | 720×720 | 720×720 | 成功 |
| `png-1x/07-bird-flight-frames/female-3-fly-04.png` | `66:2630` | 720×720 | 720×720 | 成功 |
| `png-1x/07-bird-flight-frames/female-3-fly-05.png` | `66:2635` | 720×720 | 720×720 | 成功 |
| `png-1x/07-bird-flight-frames/female-3-fly-06.png` | `66:2640` | 720×720 | 720×720 | 成功 |
| `png-1x/07-bird-flight-frames/female-4-fly-01.png` | `66:2645` | 720×720 | 720×720 | 成功 |
| `png-1x/07-bird-flight-frames/female-4-fly-02.png` | `66:2650` | 720×720 | 720×720 | 成功 |
| `png-1x/07-bird-flight-frames/female-4-fly-03.png` | `66:2655` | 720×720 | 720×720 | 成功 |
| `png-1x/07-bird-flight-frames/female-4-fly-04.png` | `66:2660` | 720×720 | 720×720 | 成功 |
| `png-1x/07-bird-flight-frames/female-4-fly-05.png` | `66:2665` | 720×720 | 720×720 | 成功 |
| `png-1x/07-bird-flight-frames/female-4-fly-06.png` | `66:2670` | 720×720 | 720×720 | 成功 |
| `png-1x/07-bird-flight-frames/female-5-fly-01.png` | `66:2676` | 720×720 | 720×720 | 成功 |
| `png-1x/07-bird-flight-frames/female-5-fly-02.png` | `66:2681` | 720×720 | 720×720 | 成功 |
| `png-1x/07-bird-flight-frames/female-5-fly-03.png` | `66:2686` | 720×720 | 720×720 | 成功 |
| `png-1x/07-bird-flight-frames/female-5-fly-04.png` | `66:2691` | 720×720 | 720×720 | 成功 |
| `png-1x/07-bird-flight-frames/female-5-fly-05.png` | `66:2696` | 720×720 | 720×720 | 成功 |
| `png-1x/07-bird-flight-frames/female-5-fly-06.png` | `66:2701` | 720×720 | 720×720 | 成功 |
| `png-1x/07-bird-flight-frames/female-6-fly-01.png` | `66:2706` | 720×720 | 720×720 | 成功 |
| `png-1x/07-bird-flight-frames/female-6-fly-02.png` | `66:2711` | 720×720 | 720×720 | 成功 |
| `png-1x/07-bird-flight-frames/female-6-fly-03.png` | `66:2716` | 720×720 | 720×720 | 成功 |
| `png-1x/07-bird-flight-frames/female-6-fly-04.png` | `66:2721` | 720×720 | 720×720 | 成功 |
| `png-1x/07-bird-flight-frames/female-6-fly-05.png` | `66:2726` | 720×720 | 720×720 | 成功 |
| `png-1x/07-bird-flight-frames/female-6-fly-06.png` | `66:2731` | 720×720 | 720×720 | 成功 |
| `png-1x/07-bird-flight-frames/female-7-fly-01.png` | `66:2736` | 720×720 | 720×720 | 成功 |
| `png-1x/07-bird-flight-frames/female-7-fly-02.png` | `66:2741` | 720×720 | 720×720 | 成功 |
| `png-1x/07-bird-flight-frames/female-7-fly-03.png` | `66:2746` | 720×720 | 720×720 | 成功 |
| `png-1x/07-bird-flight-frames/female-7-fly-04.png` | `66:2751` | 720×720 | 720×720 | 成功 |
| `png-1x/07-bird-flight-frames/female-7-fly-05.png` | `66:2756` | 720×720 | 720×720 | 成功 |
| `png-1x/07-bird-flight-frames/female-7-fly-06.png` | `66:2761` | 720×720 | 720×720 | 成功 |
| `png-1x/07-bird-flight-frames/female-8-fly-01.png` | `66:2766` | 720×720 | 720×720 | 成功 |
| `png-1x/07-bird-flight-frames/female-8-fly-02.png` | `66:2771` | 720×720 | 720×720 | 成功 |
| `png-1x/07-bird-flight-frames/female-8-fly-03.png` | `66:2776` | 720×720 | 720×720 | 成功 |
| `png-1x/07-bird-flight-frames/female-8-fly-04.png` | `66:2781` | 720×720 | 720×720 | 成功 |
| `png-1x/07-bird-flight-frames/female-8-fly-05.png` | `66:2786` | 720×720 | 720×720 | 成功 |
| `png-1x/07-bird-flight-frames/female-8-fly-06.png` | `66:2791` | 720×720 | 720×720 | 成功 |
| `png-1x/07-bird-flight-frames/female-9-fly-01.png` | `66:2797` | 720×720 | 720×720 | 成功 |
| `png-1x/07-bird-flight-frames/female-9-fly-02.png` | `66:2802` | 720×720 | 720×720 | 成功 |
| `png-1x/07-bird-flight-frames/female-9-fly-03.png` | `66:2807` | 720×720 | 720×720 | 成功 |
| `png-1x/07-bird-flight-frames/female-9-fly-04.png` | `66:2812` | 720×720 | 720×720 | 成功 |
| `png-1x/07-bird-flight-frames/female-9-fly-05.png` | `66:2817` | 720×720 | 720×720 | 成功 |
| `png-1x/07-bird-flight-frames/female-9-fly-06.png` | `66:2822` | 720×720 | 720×720 | 成功 |
| `png-1x/07-bird-flight-frames/male-1-fly-01.png` | `66:2827` | 720×720 | 720×720 | 成功 |
| `png-1x/07-bird-flight-frames/male-1-fly-02.png` | `66:2832` | 720×720 | 720×720 | 成功 |
| `png-1x/07-bird-flight-frames/male-1-fly-03.png` | `66:2837` | 720×720 | 720×720 | 成功 |
| `png-1x/07-bird-flight-frames/male-1-fly-04.png` | `66:2842` | 720×720 | 720×720 | 成功 |
| `png-1x/07-bird-flight-frames/male-1-fly-05.png` | `66:2847` | 720×720 | 720×720 | 成功 |
| `png-1x/07-bird-flight-frames/male-1-fly-06.png` | `66:2852` | 720×720 | 720×720 | 成功 |
| `png-1x/07-bird-flight-frames/male-2-fly-01.png` | `66:2857` | 720×720 | 720×720 | 成功 |
| `png-1x/07-bird-flight-frames/male-2-fly-02.png` | `66:2862` | 720×720 | 720×720 | 成功 |
| `png-1x/07-bird-flight-frames/male-2-fly-03.png` | `66:2867` | 720×720 | 720×720 | 成功 |
| `png-1x/07-bird-flight-frames/male-2-fly-04.png` | `66:2872` | 720×720 | 720×720 | 成功 |
| `png-1x/07-bird-flight-frames/male-2-fly-05.png` | `66:2877` | 720×720 | 720×720 | 成功 |
| `png-1x/07-bird-flight-frames/male-2-fly-06.png` | `66:2882` | 720×720 | 720×720 | 成功 |
| `png-1x/07-bird-flight-frames/male-3-fly-01.png` | `66:2887` | 720×720 | 720×720 | 成功 |
| `png-1x/07-bird-flight-frames/male-3-fly-02.png` | `66:2892` | 720×720 | 720×720 | 成功 |
| `png-1x/07-bird-flight-frames/male-3-fly-03.png` | `66:2897` | 720×720 | 720×720 | 成功 |
| `png-1x/07-bird-flight-frames/male-3-fly-04.png` | `66:2902` | 720×720 | 720×720 | 成功 |
| `png-1x/07-bird-flight-frames/male-3-fly-05.png` | `66:2907` | 720×720 | 720×720 | 成功 |
| `png-1x/07-bird-flight-frames/male-3-fly-06.png` | `66:2912` | 720×720 | 720×720 | 成功 |
| `png-1x/07-bird-flight-frames/male-4-fly-01.png` | `66:2918` | 720×720 | 720×720 | 成功 |
| `png-1x/07-bird-flight-frames/male-4-fly-02.png` | `66:2923` | 720×720 | 720×720 | 成功 |
| `png-1x/07-bird-flight-frames/male-4-fly-03.png` | `66:2928` | 720×720 | 720×720 | 成功 |
| `png-1x/07-bird-flight-frames/male-4-fly-04.png` | `66:2933` | 720×720 | 720×720 | 成功 |
| `png-1x/07-bird-flight-frames/male-4-fly-05.png` | `66:2938` | 720×720 | 720×720 | 成功 |
| `png-1x/07-bird-flight-frames/male-4-fly-06.png` | `66:2943` | 720×720 | 720×720 | 成功 |
| `png-1x/07-bird-flight-frames/male-5-fly-01.png` | `66:2948` | 720×720 | 720×720 | 成功 |
| `png-1x/07-bird-flight-frames/male-5-fly-02.png` | `66:2953` | 720×720 | 720×720 | 成功 |
| `png-1x/07-bird-flight-frames/male-5-fly-03.png` | `66:2958` | 720×720 | 720×720 | 成功 |
| `png-1x/07-bird-flight-frames/male-5-fly-04.png` | `66:2963` | 720×720 | 720×720 | 成功 |
| `png-1x/07-bird-flight-frames/male-5-fly-05.png` | `66:2968` | 720×720 | 720×720 | 成功 |
| `png-1x/07-bird-flight-frames/male-5-fly-06.png` | `66:2973` | 720×720 | 720×720 | 成功 |
| `png-1x/07-bird-flight-frames/male-6-fly-01.png` | `66:2978` | 720×720 | 720×720 | 成功 |
| `png-1x/07-bird-flight-frames/male-6-fly-02.png` | `66:2983` | 720×720 | 720×720 | 成功 |
| `png-1x/07-bird-flight-frames/male-6-fly-03.png` | `66:2988` | 720×720 | 720×720 | 成功 |
| `png-1x/07-bird-flight-frames/male-6-fly-04.png` | `66:2993` | 720×720 | 720×720 | 成功 |
| `png-1x/07-bird-flight-frames/male-6-fly-05.png` | `66:2998` | 720×720 | 720×720 | 成功 |
| `png-1x/07-bird-flight-frames/male-6-fly-06.png` | `66:3003` | 720×720 | 720×720 | 成功 |
| `png-1x/07-bird-flight-frames/male-7-fly-01.png` | `66:3008` | 720×720 | 720×720 | 成功 |
| `png-1x/07-bird-flight-frames/male-7-fly-02.png` | `66:3013` | 720×720 | 720×720 | 成功 |
| `png-1x/07-bird-flight-frames/male-7-fly-03.png` | `66:3018` | 720×720 | 720×720 | 成功 |
| `png-1x/07-bird-flight-frames/male-7-fly-04.png` | `66:3023` | 720×720 | 720×720 | 成功 |
| `png-1x/07-bird-flight-frames/male-7-fly-05.png` | `66:3028` | 720×720 | 720×720 | 成功 |
| `png-1x/07-bird-flight-frames/male-7-fly-06.png` | `66:3033` | 720×720 | 720×720 | 成功 |
| `png-1x/07-bird-flight-frames/male-8-fly-01.png` | `66:3039` | 720×720 | 720×720 | 成功 |
| `png-1x/07-bird-flight-frames/male-8-fly-02.png` | `66:3044` | 720×720 | 720×720 | 成功 |
| `png-1x/07-bird-flight-frames/male-8-fly-03.png` | `66:3049` | 720×720 | 720×720 | 成功 |
| `png-1x/07-bird-flight-frames/male-8-fly-04.png` | `66:3054` | 720×720 | 720×720 | 成功 |
| `png-1x/07-bird-flight-frames/male-8-fly-05.png` | `66:3059` | 720×720 | 720×720 | 成功 |
| `png-1x/07-bird-flight-frames/male-8-fly-06.png` | `66:3064` | 720×720 | 720×720 | 成功 |
| `png-1x/07-bird-flight-frames/male-9-fly-01.png` | `66:3069` | 720×720 | 720×720 | 成功 |
| `png-1x/07-bird-flight-frames/male-9-fly-02.png` | `66:3074` | 720×720 | 720×720 | 成功 |
| `png-1x/07-bird-flight-frames/male-9-fly-03.png` | `66:3079` | 720×720 | 720×720 | 成功 |
| `png-1x/07-bird-flight-frames/male-9-fly-04.png` | `66:3084` | 720×720 | 720×720 | 成功 |
| `png-1x/07-bird-flight-frames/male-9-fly-05.png` | `66:3089` | 720×720 | 720×720 | 成功 |
| `png-1x/07-bird-flight-frames/male-9-fly-06.png` | `66:3094` | 720×720 | 720×720 | 成功 |
| `png-1x/10-effects/home-particles.png` | `70:1959` | 2250×4872 | 2250×4872 | 成功 |
