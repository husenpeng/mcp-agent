# TomatoRunner

[English](README.md) | 中文

设备侧控制端点：常驻的 XCUITest runner，负责读屏、合成输入，同时服务这台手机上的应用与 Mac 会话。

这是 [phone-use 方案](../docs/phone-use-plan.md) 的 M0 里程碑。Host 插件、Mac 设备管家与设备侧任务循环是各自独立的包。

## 为什么是一个测试包

iOS 不允许普通应用观察或操作别的应用。唯一能触达整个系统的受支持机制是 UI 测试，所以 runner 是一个 `bundle.ui-testing` 目标：XCTest 安装它，它的 `testServe` 测试永不返回，进程在其他应用前台时继续服务。

有两个容易丢掉的属性：没有宿主应用（带宿主的 runner 会随宿主一起被挂起），以及不产生失败的测试（测试记录失败时 XCTest 会把进程拆掉）。

## 任务循环

Runner 执行手机自己的任务：`task.start` 接收目标与服务商，循环负责观察、让模型选一个动作、执行、再读屏，直到步数上限。它跑在本进程里，因为 App 一旦让任务驱动别的应用就会被挂起。

每个回合都带回它自己的结果：动作失败时回的是失败原因，所以一个过期的 ref 只花掉一步而不是整个任务；页面没有变化的动作会明说，模型不会照着重复。只有最新的一次屏幕保持完整——旧屏幕会让模型按记忆里的画面决策——任务结束时循环交还 lease，页面能立刻把设备拿回来。

被风险门拒绝的动作不会在这里重试：循环发一条确认通知并阻塞该步，等人回答后用一次性令牌继续，或直接结束任务。

## 线协议

runner 与应用编译同一个文件 [`PhoneProtocol.swift`](../TomatoRemote/Shared/PhoneProtocol.swift)。Host 在 `packages/experimental/phone-use/src/protocol.ts` 里镜像它；版本号变化时三处与共享样例一起改。

- `GET /health` —— 无鉴权的就绪检查。
- `POST /pair` —— 设备所有者允许通知后签发凭据。
- `POST /rpc` —— JSON-RPC 2.0，带 `Authorization: Bearer <credential>`。方法：`health`、`observe`、`screenshot`、`act`、`apps.resolve`、`lease.*`、`link.*`、`task.start|status|stop`、`log.recent`、`server.stop`。

## 塑造了这份设计的真机结论

在 iPhone 15 Pro（iOS 26.5.2）与 Xcode 27.0 上测得。

| 结论 | 后果 |
|---|---|
| `XCUIApplication.debugDescription` 一次返回整棵子树 | 读取器解析这段文本；逐节点走 `children` 在 SpringBoard 上卡数十秒。 |
| XCTest 要求 `launch` 与 `terminate` 在主线程 | 引擎在主线程上工作，就地执行或跳过去。 |
| 应用状态查询远超超时地阻塞 | 引擎从不查询状态；空树回退 SpringBoard。 |
| `UIScreen.main.bounds` 在 runner 进程里返回 320x480 | 屏幕几何取自 dump 里第一个 window 的 frame。 |
| 底部边缘的点击被 Home 指示条吞掉 | 自检先滚动再点底部行。 |
| 图标型控件没有 label | 用它们的 `identifier` 顶替。 |

## 运行它

```bash
# engine and wire checks, one device
TOMATO_IPHONE_UDID=<udid> apps/ios/tests/phone-runner-smoke.sh

# serve (blocks until the test is stopped)
xcodebuild test -project TomatoRemote.xcodeproj -scheme TomatoRunner \
  -destination id=<udid> -derivedDataPath .derived -allowProvisioningUpdates \
  -only-testing:TomatoRunner/RunnerEntry/testServe TEST_RUNNER_TOMATO_RUNNER_SERVE=1
```

## 已知限制

- 锁屏、密码输入、Face ID、Apple Pay 与钱包应用按设计够不着。
- `openUrl` 走 LaunchServices 的私有入口；将来的 iOS 移除它时，动作会回答 `INTERNAL`。
- 前台应用是引擎最后绑定的那个；手工切换要等下一次读取回退到 SpringBoard 才能被观察到。
- 七天证书到期会让 runner 无法启动；续签归 Mac 设备管家。
