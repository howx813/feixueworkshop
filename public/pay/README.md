# 微信支付（仅微信）

## 收款码

把个人微信收款码保存为：

```
public/pay/wechat.png
```

## 为何不能「点一下就解锁」

个人微信收款码**没有**官方支付成功回调。  
要保证「收到 ¥1 才给 10 页」，必须：

1. 读者下单 → 扫码付款（备注订单号）
2. **你**手机收到微信「已收款」
3. **你**确认到账（命令或管理页）
4. 读者页面轮询到 `paid` → 才解锁

## 启动订单服务

```bash
# .env.local
PAY_ADMIN_SECRET=你的长随机串
PAY_PORT=8787
NEXT_PUBLIC_PAY_API=http://127.0.0.1:8787

npm run pay:server
```

## 你确认到账

手机弹出微信收款后：

```bash
npm run pay:confirm -- GN订单号
```

或打开：`http://本地站点/pay-admin/` 填密钥 → 点「确认已收款」。

## 线上

静态站本身不能收单；`pay-server` 需单独挂在可访问的地址，并把 `NEXT_PUBLIC_PAY_API` 指过去。  
若以后申请**微信商户号**，可改为官方 Native 支付 + 异步通知，实现全自动到账解锁。
