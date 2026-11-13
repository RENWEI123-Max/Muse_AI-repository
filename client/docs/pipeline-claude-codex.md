# MauGo 流水线：Claude 写代码 + Codex 审核

适用仓库：Muse_AI-repository。

## 1. 分工

| 角色 | 位置 | 职责 |
| --- | --- | --- |
| Muse | — | 总负责人：拆任务、协调、汇报 |
| Claude | Mac mini | 写代码 |
| Codex | 服务器 sg-claude | 审核代码 |

规则：代码必须经 Codex 审核通过后才能合入 main。

## 2. 流程

1. Muse 创建 `codex-task` Issue（写代码任务）。
2. Mac 上的 Claude runner 领取任务，开 worktree（分支 `claude/task-<号>`）写代码。
3. 只推送该分支，不合入 main。
4. 创建 `codex-review` Issue（审核任务）。
5. 服务器上的 Codex 拉取该分支审核：跑构建/测试，逐条核对验收标准。
6. 审核结果：
   - 通过：合入 main，并关闭原 Issue。
   - 不通过：创建 follow-up 任务，由 Claude 继续修改，再走一遍审核。

## 3. 标签

| 标签 | 含义 | 由谁处理 |
| --- | --- | --- |
| `codex-task` | 写代码任务 | Mac 上的 Claude runner 领取 |
| `codex-review` | 审核任务 | 服务器上的 Codex 审核 |

## 4. 分支命名

- 写代码分支：`claude/task-<号>`
- 审核用 worktree：服务器上 `/root/worktrees/review-<任务号>`

## 5. 服务位置

| 机器 | tmux 会话 | 运行程序 |
| --- | --- | --- |
| Mac | `claude-runner` | `claude_runner.py` |
| 服务器 | `reviewer` | `review_runner.py` |
| 服务器 | `watcher` | `issue_watcher.py` |
| 服务器 | `hub` | `hub.py` |
