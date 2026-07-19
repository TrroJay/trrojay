---
{"dg-publish":true,"permalink":"/geek/tech/"}
---

# 1 Server

## 1.1 科学上网方法
### 1.1.1 Remote Forward
使安装在远程服务器上的 VS Code 可以科学上网：
* 在本地配置 SSH `config` 文件。
* 在 VS Code 中设置 `http.proxy`。
```ssh-config
# 本地 ~/.ssh/config
Host my_server
    HostName 1.2.3.4
    User root
    RemoteForward 7986 localhost:7890
```
说明：
* 本地电脑的 Clash 代理端口为 `7890`。
* 远程服务器上的代理端口设置为 `7986`，该端口可以自行修改。
在 VS Code 中打开代理设置：
```text
vscode://settings/http.proxy
```
在 `http.proxy` 中输入：
```text
http://127.0.0.1:7986
```
### 1.1.2 Proxy in Linux
直接在 Linux 中新建一个 `tmux` 会话，使用 Mihomo（类似 Clash）作为代理服务器转发流量。
1. 启动 Mihomo，并设置端口转发。
2. 在终端中加载代理环境变量。
3. 使用 Codex CLI 时，需要重启 Codex。
4. 使用 VS Code Proxy 时，需要重新设置或重载代理。
```bash
# 启动 Mihomo
tmux new-session -d -s clashctl_mihomo \
"bash -lc 'exec ~/clashctl/bin/mihomo \
-d ~/clashctl/resources \
-f ~/clashctl/resources/runtime.yaml \
>> ~/clashctl/resources/mihomo.log 2>&1'"

# 查看端口和进程
netstat -ltnp 2>/dev/null | grep -E ':(51238|9090|1053)'
pgrep -fa 'mihomo'

# 停止 Mihomo
tmux kill-session -t clashctl_mihomo

# 让当前 Shell 使用代理
source ~/.proxy_env

# 重启 Codex
pkill -u "$USER" -f 'codex app-server --listen unix://'
pkill -u "$USER" -f 'codex app-server proxy'

# 查看当前订阅
clashctl sub ls

# 手动修改订阅
PROFILE_URL='<订阅地址>' \
~/clashctl/bin/yq -i \
'(.profiles[] | select(.id == 1).url) = env(PROFILE_URL)' \
~/clashctl/resources/profiles.yaml

# 刷新订阅
clashctl sub update 1
```
## 1.2 Agent 接入方法
#### Codex 网络配置
1. 创建 `~/.proxy_env`，写入代理环境变量：
```bash
export HTTP_PROXY=http://127.0.0.1:51238
export HTTPS_PROXY=http://127.0.0.1:51238
export ALL_PROXY=http://127.0.0.1:51238

export http_proxy=http://127.0.0.1:51238
export https_proxy=http://127.0.0.1:51238
export all_proxy=http://127.0.0.1:51238
```
2. 在 `~/.bashrc` 中启用：
```bash
if [ -f "$HOME/.proxy_env" ]; then
    . "$HOME/.proxy_env"
fi
```
3. 如果 `~/.profile` 中也包含加载 `~/.proxy_env` 的逻辑，则登录 Shell 同样会自动生效。
## 1.3 下载并安装软件
```bash
# 下载到指定目录
wget -P /root/downloads/ https://example.com/file.zip

# 下载并重命名
wget -O /home/user/my_app.zip https://example.com/file.zip

# 安装 deb 软件包
sudo apt install ./file.deb
```
# 2 Regular Expression
在 Linter 中使用以下正则表达式，将从外部复制的链接自动转换为 Markdown 链接格式。
```regex
【(.*?)】\s*(https?://\S+)
```
说明：
* `(.*?)` 用于捕获链接标题。
* `*?` 使用非贪婪匹配，在满足条件后尽快终止。
* `\s*` 匹配标题与链接之间可能存在的空格。
替换为：
```text
[$1]($2)
```
# 3 VPN 设置
- 在线订阅转换网站
	- [ACL4SSR 在线订阅转换](https://acl4ssr-sub.github.io/)
	- 将服务商订阅连接转化为 ACL 4 SSR 格式，实现更科学的流量分组
# 4 VS Code
## 4.1 Setting
### 4.1.1 Key Shortcut
常用快捷键：
```text
# 显示或隐藏侧边栏
Ctrl + B

# 查找
Ctrl + F

# 将代码添加到 Kimi
Alt + B

# 返回上一个或下一个标签页
Alt + Left / Right

# 快速向上或向下翻页
Fn + Up / Down

# 跳转到定义
F12
```

| 快捷键组合                       | 功能说明                   |
| --------------------------- | ---------------------- |
| **`Ctrl + K` → `Ctrl + S`** | 打开快捷键设置列表。             |
| **`Ctrl + K` → `V`**        | 在侧边栏打开 Markdown 预览。    |
| **`Ctrl + K` → `Enter`**    | 将当前预览标签页由临时标签页变为固定标签页。 |
| **`Ctrl + K` → `0`**        | 折叠代码编辑器中的所有代码块。        |
| **`Ctrl + K` → `J`**        | 展开代码编辑器中的所有代码块。        |
