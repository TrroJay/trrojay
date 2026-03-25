---
{"dg-publish":true,"permalink":"/geek/tech/","created":"2026-02-25","updated":"2026-02-27"}
---

# 1 Server
## 1.1 科学上网方法
### 1.1.1 Vscode Plugin
- 使得安装在远程服务器 Vscode 可以科学上网
	- 在本地配置 config 文件
	- 在 vscode 中设置 http. proxy
- [飞书 - 服务器科学上网](https://icnfwbwiz5l6.feishu.cn/wiki/I85hwhFafirUGIk3efccWetxndd?from=from_copylink)
```yaml
# 本地 .ssh/config 
Host my_server
	HostName 1.2.3.4
	User root
	RemoteForward 7986 localhost:7890 # 本地电脑的clash流量端口是7890 远程流量发出端口设置为7986（这个值可以修改）
	
# 在vscode中打开服务器代理设置
vscode://settings/http.proxy

# 在http. proxy中输入下列内容，即可完成配置
http://127.0.0.1:7986
```
## 1.2 Agent 接入方法
### 1.2.1 Codex
- API
	- [GMN - AI API Gateway](https://gmn.chuangzuoli.com/keys)
- 使用教程
	- [▸CODEX配置大全 - 飞书云文档](https://ycn0fzzbzq3b.feishu.cn/wiki/T1hEweoPZiyMqkkhgwicsEo9nMe)
## 1.3 系统盘清理方法
### 1.3.1 检查空间占用情况
```bash
# search /root filefold and sort
du -h -x --max-depth=1 / | sort -rh
du -h -x --max-depth=1 /root | sort -rh
```
### 1.3.2 基本清理方法
```bash
apt-get autoremove
apt-get autoclean
conda clean --all
pip cache purge

# /var文件夹下
rm -rf /var/crash/*  #这一部分是系统崩溃文件
```
### 1.3.3 conda
### 1.3.4 wandb
```bash
# wandb 的缓存文件可能存放在 /root/.local/share/wandb/artifacts/staging 中

# 1. 创建 tmp 盘上的新目录
mkdir -p /root/bayes-tmp/wandb_share

# 2. 删除 root 下这个已经爆满的旧目录
rm -rf /root/.local/share/wandb

# 3. 建立软链接
ln -s /root/bayes-tmp/wandb_share /root/.local/share/wandb
```
# 2 Regular Expression
- 在 Linter 中使用下列方法来进行外部复制链接的自动格式化
```
# ()用来捕捉变量，*表示0或者n，?表示括号闭合后终止匹配
【(.*?)】\s*(https?://\S+)

# 替换为下列格式
[$1]($2)
```
# 3 Vs Code
## 3.1 Setting
### 3.1.1 Key Shortcut
- 常用快捷键
```
# 侧边栏
Ctrl + B
# 查找
Ctrl + F

# 将代码添加到Kimi
Alt + B

# 编辑器设置
# 返回上/下一个标签页
Alt + left / right

# 快速上下翻页
Fn + up / down
# 查看索引位置
F12

```

| **快捷键组合**                    | **功能说明**                      |
| ---------------------------- | ----------------------------- |
| **`Ctrl + K` -> `Ctrl + S`** | **打开快捷键设置列表**。                |
| **`Ctrl + K` -> `V`**        | 在侧边栏打开 **Markdown 预览**。       |
| **`Ctrl + K` -> `Enter`**    | 将当前的“预览”标签页（斜体标题）变为**固定**标签页。 |
| `Ctrl + K` -> `0`            | **折叠**代码编辑器中的所有代码块。           |
| **`Ctrl + K` -> `J`**        | **展开**代码编辑器中的所有代码块。           |
# 4 