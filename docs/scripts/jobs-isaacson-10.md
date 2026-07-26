# 史蒂夫·乔布斯传 · 纪实图像小说（阿兰的战争体）

## 参考

- 风格样本：`data/refs/alan-war/阿兰的战争.jpg`、`style-page-b.jpg`
- Openbook 书评：口述记忆 + 漫画转写；背景近素描晕染，人物线简；**图文在分镜格内共生**
- **禁止**：杂志式「大标题 + 居中插图 + 正文段落 + 脚注金句」

## 正确体感（Guibert / 阿兰）

1. 整页是**漫画分镜网格**，不是插图书  
2. **旁白框嵌在格子里**，与画面共享同一 panel  
3. 文字是口述/传记声音，画面是记忆补全；一起读完 ≈ 读完那一段书  
4. 灰调墨水晕染、留白、安静日常  
5. 文字量大，但不能脱离格子漂在版心外

## 生成管线

1. 无字插图（session images）  
2. `scripts/compose_jobs_guibert.py`：分镜 + 格内长文旁白（汉字准确）  
3. 输出 `public/graphic/jobs/02–10.jpg`

## 重跑

```bash
python3 scripts/compose_jobs_guibert.py
```
