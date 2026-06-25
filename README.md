# 16code

公开分发仓库：安装包、Docker 镜像与文档。源码在私有仓库，这里只存放可直接下载的产物。

## 下载（Linux，免登录）

每个版本的包同时存在两处稳定地址，二选一：

**GitHub Release**

```bash
# 服务端 (Debian/Ubuntu)，最新版
curl -LO https://github.com/yinyue123/16code/releases/latest/download/code-server_v0.1.0_linux_amd64.deb
sudo dpkg -i code-server_*_linux_amd64.deb
```

完整文件名见对应 Release 的 Assets 列表。

**R2 直链（CDN，无 GitHub 限速）**

```bash
# 用 manifest.txt 查看某版本的全部文件
curl -s https://<R2_PUBLIC_BASE>/code/latest/manifest.txt
curl -LO https://<R2_PUBLIC_BASE>/code/latest/code-server_v0.1.0_linux_amd64.deb
```

> `latest/` 始终指向最新正式版；具体版本用 `code/v0.1.0/` 前缀。

## Docker

```bash
podman pull ghcr.io/yinyue123/16code:latest      # 或 :v0.1.0
```

## 文档

见本仓库 [`docs/`](docs/) 目录（随每次发布自动同步）。

## 发布流程（维护者）

1. 私有 `code` 仓库打 tag 构建并上传到 R2：`git tag code-v0.1.0 && git push origin code-v0.1.0`
2. 本仓库打同名 tag，把产物镜像到公开 Release 并同步文档：`git tag v0.1.0 && git push origin v0.1.0`
